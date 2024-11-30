import { messageEmitter } from "@/lib/messageEmitter";
import { prisma } from "@/lib/prisma";
import { connection } from "@/lib/redis";
import { sendReferralBalanceEmail } from "@/lib/resend";
import { getData, login, ScraperError } from "@/scraper/scraper";
import { Job, Queue, Worker } from "bullmq";

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
      const promoter = await prisma.promoter.findUnique({
        where: { id },
        include: {
          data: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          user: true,
        },
      });

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

      // Send email if balance increased
      if (promoter.data.length > 0 && promoter.data[0].status === "SUCCESS") {
        if (promoterData.unpaid > promoter.data[0].unpaid) {
          const formattedUnpaid = (promoterData.unpaid / 100).toFixed(2);
          const formattedPreviousUnpaid = (
            promoter.data[0].unpaid / 100
          ).toFixed(2);
          const increaseAmount = (
            parseFloat(formattedUnpaid) - parseFloat(formattedPreviousUnpaid)
          ).toFixed(2);
          await sendReferralBalanceEmail({
            to: email,
            userName: promoter.user.name,
            host: companyHost,
            newBalance: formattedUnpaid,
            previousBalance: formattedPreviousUnpaid,
            increaseAmount,
          });
        }
      }

      // Create promoter data
      const savedPromoterData = await prisma.promoterData.create({
        data: { ...promoterData, promoterId: id },
      });

      messageEmitter.emit(`${id}-${userId}`, savedPromoterData);
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

      messageEmitter.emit(`${id}-${userId}`, promoterData);
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
