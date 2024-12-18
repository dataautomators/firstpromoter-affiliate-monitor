import { messageEmitter } from "@/lib/messageEmitter";
import { prisma } from "@/lib/prisma";
import { promoterSchema, updatePromoterSchema } from "@/lib/schema";
import {
  addManualJob,
  addScheduledJob,
  removeScheduledJob,
} from "@/scraper/queue";
import { auth } from "@clerk/nextjs/server";
import { PromoterData } from "@prisma/client";
import chalk from "chalk";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { validator } from "hono/validator";
import { handle } from "hono/vercel";
import { Webhook } from "svix";

const sseClients = new Map<string, (promoterData: PromoterData) => void>();

type Variables = {
  userId: string;
};
const app = new Hono<{ Variables: Variables }>().basePath("/api");

const checkAuthMiddleware = createMiddleware(async (c, next) => {
  const { userId } = await auth();

  if (!userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("userId", userId);
  await next();
});

app.use("/promoters/*", checkAuthMiddleware);

app.get("/promoters", async (c) => {
  const userId = c.get("userId");

  const promoters = await prisma.promoter.findMany({
    where: {
      userId,
    },
    include: {
      data: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });
  return c.json(promoters);
});

app.post(
  "/promoters",
  validator("json", (value, c) => {
    const result = promoterSchema.safeParse(value);
    if (!result.success) {
      const message = result.error.errors[0].message;
      return c.json({ message }, 400);
    }

    return result.data;
  }),
  async (c) => {
    const userId = c.get("userId");

    const { source, email, password, schedule, isEnabled, manualRun } =
      c.req.valid("json");
    const sourceUrl = new URL(source);
    const companyHost = sourceUrl.host;

    const newPromoter = await prisma.promoter.create({
      data: {
        userId,
        source,
        email,
        password,
        companyHost,
        schedule,
        isEnabled,
        manualRun,
      },
    });

    // if schedule is provided, add the job to the queue
    if (newPromoter.isEnabled && newPromoter.schedule) {
      console.log(
        `Adding scheduled job for ${newPromoter.id} with schedule ${newPromoter.schedule}`
      );
      await addScheduledJob(newPromoter.id, newPromoter.schedule);
    } else if (newPromoter.isEnabled && newPromoter.manualRun) {
      console.log(`Adding manual job for ${newPromoter.id}`);
      await addManualJob(newPromoter.id);
    }

    return c.json(newPromoter);
  }
);

// Update promoter
app.patch(
  "/promoters/:id",
  validator("json", (value, c) => {
    const result = updatePromoterSchema.safeParse(value);
    if (!result.success) {
      const message = result.error.errors[0].message;
      return c.json({ message }, 400);
    }

    return result.data;
  }),
  async (c) => {
    const { id } = c.req.param();
    const { source, email, password, schedule, isEnabled, manualRun } =
      c.req.valid("json");
    const userId = c.get("userId");

    const previousPromoter = await prisma.promoter.findFirst({
      where: { id, userId },
    });

    if (!previousPromoter) {
      return c.json({ message: "Promoter not found" }, 404);
    }

    let companyHost = previousPromoter.companyHost;
    if (source) {
      const sourceUrl = new URL(source);
      companyHost = sourceUrl.host;
    }

    const updatedPromoter = await prisma.promoter.update({
      where: { id, userId },
      data: {
        source,
        email,
        companyHost,
        password,
        schedule: manualRun ? undefined : schedule,
        isEnabled,
        manualRun,
      },
    });

    // if something changed, remove the old job and add the new one
    if (
      previousPromoter?.schedule !== schedule ||
      previousPromoter?.isEnabled !== isEnabled ||
      previousPromoter?.manualRun !== manualRun
    ) {
      await removeScheduledJob(id);
    }

    // if schedule is provided, add the job to the queue
    if (updatedPromoter.isEnabled && updatedPromoter.schedule) {
      await addScheduledJob(id, updatedPromoter.schedule);
    } else if (updatedPromoter.isEnabled && updatedPromoter.manualRun) {
      await addManualJob(id);
    }

    return c.json(updatedPromoter);
  }
);

app.delete("/promoters/:id", async (c) => {
  const { id } = c.req.param();
  const userId = c.get("userId");
  await prisma.promoter.delete({ where: { id, userId } });
  await removeScheduledJob(id);
  return c.json({ message: "Promoter deleted" });
});

app.get("/promoters/:id", async (c) => {
  const { id } = c.req.param();
  const userId = c.get("userId");
  const promoter = await prisma.promoter.findFirst({
    where: { id, userId },
    include: {
      data: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!promoter) {
    return c.json({ message: "Promoter not found" }, 404);
  }

  return c.json(promoter);
});

app.get("/manual-run/:id", checkAuthMiddleware, async (c) => {
  const { id } = c.req.param();
  await addManualJob(id);
  return c.json({ message: "Manual run added" });
});

app.get("/sse/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.query("userId");

  let controller: ReadableStreamDefaultController<string> | null = null;

  const stream = new ReadableStream<string>({
    start(ctrl) {
      controller = ctrl;
      const clientId = Math.random().toString(36).substring(7);
      console.log("Debug: Setting up client:", clientId);

      const sendSSE = (promoterData: PromoterData) => {
        if (controller) {
          console.log("Debug: Sending to client:", clientId, promoterData.id);
          controller.enqueue(
            `event: p-update\ndata: ${JSON.stringify(promoterData)}\n\n`
          );
        }
      };

      sseClients.set(clientId, sendSSE);
      console.log("Debug: Current client count:", sseClients.size);

      messageEmitter.on(`${id}-${userId}`, (promoterData) => {
        console.log(chalk.green("Debug: Received message:", promoterData.id));
        sendSSE(promoterData);
      });

      c.req.raw.signal.addEventListener("abort", () => {
        console.log("Debug: Cleaning up client:", clientId);
        messageEmitter.removeListener(`${id}-${userId}`, sendSSE);
        sseClients.delete(clientId);
        controller?.close();
        controller = null;
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-open",
    },
  });
});

app.post("/webhook", async (c) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    return c.json(
      {
        message:
          "Error: Please add SIGNING_SECRET from Clerk Dashboard to .env",
      },
      500
    );
  }
  const wh = new Webhook(SIGNING_SECRET);

  const payload = await c.req.text();

  const svix_id = c.req.header("svix-id");
  const svix_timestamp = c.req.header("svix-timestamp");
  const svix_signature = c.req.header("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json(
      {
        success: false,
        message: "Error: Missing svix headers",
      },
      400
    );
  }

  type Event = {
    data: {
      id: string;
      first_name: string;
      last_name: string;
      email_addresses: {
        email_address: string;
      }[];
    };
    type: string;
  };

  let evt: Event | null = null;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If verification fails, error out and return error code
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as Event;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("Error: Could not verify webhook:", err.message);
      return c.json(
        {
          success: false,
          message: err.message,
        },
        400
      );
    }
  }

  // Do something with payload
  // For this guide, log payload to console
  if (!evt) {
    return c.json(
      {
        success: false,
        message: "Error: Webhook verification failed",
      },
      400
    );
  }

  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`);
  const createData = async () => {
    const { first_name, last_name, email_addresses } = evt.data;
    return {
      clerkId: id,
      firstName: first_name,
      lastName: last_name,
      email: email_addresses[0].email_address,
    };
  };
  switch (eventType) {
    case "user.created":
      {
        const data = await createData();
        await prisma.user.create({ data }).catch((err) => {
          console.log("Error creating user:", err.message);
        });
      }
      break;
    case "user.updated":
      {
        const data = await createData();
        await prisma.user
          .update({ where: { clerkId: id }, data })
          .catch((err) => {
            console.log("Error updating user:", err.message);
          });
      }
      break;
    case "user.deleted":
      {
        await prisma.user.delete({ where: { clerkId: id } }).catch((err) => {
          console.log("Error deleting user:", err.message);
        });
      }
      break;
  }

  return c.json(
    {
      success: true,
      message: "Webhook received",
    },
    200
  );
});

app.notFound((c) => {
  return c.json({ message: "Not found" }, 404);
});

const handler = handle(app);

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
