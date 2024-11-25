import { serve } from "@hono/node-server";
import type { PromoterData } from "@prisma/client";
import cron from "cron-validate";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { streamSSE } from "hono/streaming";
import { validator } from "hono/validator";
import { Webhook } from "svix";
import { z } from "zod";
import { prisma } from "./prisma.js";

import { addManualJob, addScheduledJob, removeScheduledJob } from "./queue.js";

type Variables = {
  userId: string;
};
const app = new Hono<{ Variables: Variables }>();
app.use(cors());

export const promoterMap = new Map<string, PromoterData>();

const promoterSchema = z
  .object({
    source: z.string().url("Please provide a valid URL"),
    email: z.string().email("Please provide a valid email"),
    password: z.string({ message: "Please provide a password" }),
    schedule: z.string().optional(),
    isEnabled: z.boolean().optional(),
    manualRun: z.boolean().optional(),
  })
  .refine((data) => data.schedule || data.manualRun, {
    message: "Either schedule or manualRun must be provided",
    path: ["schedule", "manualRun"],
  })
  .refine((data) => !data.schedule || validateCronSchedule(data.schedule), {
    message: "Invalid cron schedule",
    path: ["schedule"],
  });

const validateCronSchedule = (schedule: string) => {
  const cronResult = cron(schedule);
  return cronResult.isValid();
};

const updatePromoterSchema = z
  .object({
    source: z.string().url().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    schedule: z.string().optional(),
    isEnabled: z.boolean().optional(),
    manualRun: z.boolean().optional(),
  })
  .refine((data) => !data.schedule || validateCronSchedule(data.schedule), {
    message: "Invalid cron schedule",
    path: ["schedule"],
  })
  .refine((data) => !(data.schedule && data.manualRun), {
    message: "Both schedule and manualRun cannot be provided",
    path: ["schedule", "manualRun"],
  });

const checkAuthMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const userId = authHeader.split(" ")[1];
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
  const userId = c.get("userId");
  await addManualJob(id);
  return c.json({ message: "Manual run added" });
});

app.get("/sse/:id", async (c) => {
  const id = c.req.param("id");
  const userId = c.req.query("userId");

  return streamSSE(c, async (stream) => {
    while (true) {
      // get the promoter data by promoter id
      const promoterData = promoterMap.get(`${id}-${userId}`);
      if (promoterData) {
        await stream.writeSSE({
          data: JSON.stringify(promoterData),
          event: "p-update",
          id: promoterData.id,
        });

        // delete the promoter data from the map
        promoterMap.delete(`${id}-${userId}`);
      }
      await stream.sleep(1000);
    }
  });
});

app.post("/webhook", async (c) => {
  const SIGNING_SECRET = process.env.SIGNING_SECRET;
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

  let evt;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If verification fails, error out and return error code
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
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
  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`Received webhook with ID ${id} and event type of ${eventType}`);
  const createData = async () => {
    const { first_name, last_name, email_addresses } = evt.data;
    const fullName = `${first_name}${last_name ? ` ${last_name}` : ""}`;
    return {
      clerkId: id,
      name: fullName,
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

const port = Number(process.env.PORT) || 4000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
