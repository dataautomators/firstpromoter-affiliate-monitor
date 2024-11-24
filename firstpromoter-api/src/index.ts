import { serve } from "@hono/node-server";
import type { PromoterData } from "@prisma/client";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { validator } from "hono/validator";
import { z } from "zod";
import { prisma } from "./prisma.js";
import { addManualJob, addScheduledJob, removeScheduledJob } from "./queue.js";

const app = new Hono();
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
  // Basic pattern validation
  const cronRegex =
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

  return cronRegex.test(schedule);
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

app.get("/promoters", async (c) => {
  const promoters = await prisma.promoter.findMany({
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
    const { source, email, password, schedule, isEnabled, manualRun } =
      c.req.valid("json");
    const sourceUrl = new URL(source);
    const companyHost = sourceUrl.host;

    const newPromoter = await prisma.promoter.create({
      data: {
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
    const previousPromoter = await prisma.promoter.findUnique({
      where: { id },
    });

    let companyHost = previousPromoter?.companyHost;
    if (source) {
      const sourceUrl = new URL(source);
      companyHost = sourceUrl.host;
    }

    const updatedPromoter = await prisma.promoter.update({
      where: { id },
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
  await prisma.promoter.delete({ where: { id } });
  await removeScheduledJob(id);
  return c.json({ message: "Promoter deleted" });
});

app.get("/promoters/:id", async (c) => {
  const { id } = c.req.param();
  const promoter = await prisma.promoter.findUnique({
    where: { id },
    include: {
      data: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!promoter) {
    return c.json({ message: "Promoter not found" }, 404);
  }

  return c.json(promoter);
});

app.get("/manual-run/:id", async (c) => {
  const { id } = c.req.param();
  await addManualJob(id);
  return c.json({ message: "Manual run added" });
});

app.get("/sse/:id", async (c) => {
  const id = c.req.param("id");

  return streamSSE(c, async (stream) => {
    while (true) {
      // get the promoter data by promoter id
      const promoterData = promoterMap.get(id);
      if (promoterData) {
        await stream.writeSSE({
          data: JSON.stringify(promoterData),
          event: "p-update",
          id: promoterData.id,
        });

        // delete the promoter data from the map
        promoterMap.delete(id);
      }
      await stream.sleep(1000);
    }
  });
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
