import { Job, Queue, Worker } from "bullmq";
import { promoterMap } from "./index.js";
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
      const { email, password, companyHost, source, userId } = promoter;
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
      const savedPromoterData = await prisma.promoterData.create({
        data: { ...promoterData, promoterId: id },
      });

      promoterMap.set(`${id}-${userId}`, savedPromoterData);
    } catch (error) {
      console.error(error);
      const failedMessage =
        error instanceof ScraperError
          ? error.message
          : error instanceof TypeError && error.message.includes("fetch")
          ? "Failed to fetch data"
          : String(error);
      const promoterData = await prisma.promoterData.create({
        data: {
          failedMessage: failedMessage || "Unknown error",
          promoterId: id,
          status: "FAILED",
        },
        include: {
          promoter: true,
        },
      });

      const { userId } = promoterData.promoter;

      promoterMap.set(`${id}-${userId}`, promoterData);
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
        utc: true,
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
