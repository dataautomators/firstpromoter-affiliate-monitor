import { Job, Queue, Worker } from "bullmq";
import { prisma } from "./prisma.js";
import { connection } from "./redis.js";
import { getData, login, ScraperError } from "./scraper.js";

export const jobQueue = new Queue<{ id: string }>("promoter", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

const worker = new Worker(
  "promoter",
  async (job: Job<{ id: string }>) => {
    const { id } = job.data;
    try {
      const promoter = await prisma.promoter.findUnique({ where: { id } });
      if (!promoter) {
        throw new Error("Promoter not found");
      }
      const { email, password, companyHost, source } = promoter;
      let { accessToken } = promoter;

      console.log("Processing promoter", source);

      // Login to get access token and refresh token
      if (!accessToken) {
        const { accessToken: newAccessToken, refreshToken } = await login(
          email,
          password,
          companyHost
        );
        await prisma.promoter.update({
          where: { id },
          data: {
            accessToken: newAccessToken,
            refreshToken,
          },
        });
        accessToken = newAccessToken;
      }

      // Get data
      const promoterData = await getData(accessToken!, companyHost);

      // Create promoter data
      await prisma.promoterData.create({
        data: { ...promoterData, promoterId: id },
      });

      // ping to the client webhook with the promoterr id
      if (process.env.PROMOTER_WEBHOOK_URL) {
        await fetch(process.env.PROMOTER_WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify({ id }),
        });
      }
    } catch (error) {
      console.error(error);
      const failedMessage =
        error instanceof ScraperError ? error.message : String(error);
      await prisma.promoterData.create({
        data: {
          failedMessage: failedMessage || "Unknown error",
          promoterId: id,
          status: "FAILED",
        },
      });
      if (process.env.PROMOTER_WEBHOOK_URL) {
        await fetch(process.env.PROMOTER_WEBHOOK_URL, {
          method: "POST",
          body: JSON.stringify({ id }),
        });
      }
    }
  },
  { connection }
);

export const addScheduledJob = async (id: string, schedule: string) => {
  if (schedule) {
    await jobQueue.upsertJobScheduler(
      `scheduled-${id}`,
      {
        pattern: schedule,
      },
      {
        data: { id },
      }
    );
  }
};

export const addManualJob = async (id: string) => {
  await jobQueue.add(id, { id });
};

export const removeScheduledJob = async (id: string) => {
  await jobQueue.removeJobScheduler(`scheduled-${id}`);
};
