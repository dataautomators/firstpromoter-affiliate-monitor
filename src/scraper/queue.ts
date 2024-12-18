import { messageEmitter } from "@/lib/messageEmitter";
import { prisma } from "@/lib/prisma";
import { connection } from "@/lib/redis";
import { getData, login, ScraperError } from "@/scraper/scraper";
import { Job, Queue, Worker } from "bullmq";
import chalk from "chalk";

export const updateAccessToken = async (id: string) => {
  const promoter = await prisma.promoter.findUnique({
    where: { id },
  });

  if (!promoter) {
    throw new Error("Promoter not found");
  }

  const { email, password, companyHost } = promoter;
  const { accessToken, refreshToken } = await login(
    email,
    password,
    companyHost
  );
  await prisma.promoter.update({
    where: { id },
    data: { accessToken, refreshToken },
  });

  return { accessToken, refreshToken };
};

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      const { companyHost, source, userId } = promoter;
      let { accessToken } = promoter;

      console.log("Processing promoter", source);

      // Login to get access token and refresh token
      if (!accessToken) {
        const { accessToken: newAccessToken } = await updateAccessToken(id);
        accessToken = newAccessToken;
      }

      // Get data
      let promoterData;
      try {
        promoterData = await getData(accessToken!, companyHost);
      } catch (error) {
        if (error instanceof ScraperError && error.message === "Unauthorized") {
          const { accessToken: newAccessToken } = await updateAccessToken(id);
          accessToken = newAccessToken;
          promoterData = await getData(accessToken!, companyHost);
        }
      }

      // Send email if balance increased
      if (
        promoter.data.length > 0 &&
        promoter.data[0].status === "SUCCESS" &&
        promoterData
      ) {
        if (promoterData.unpaid > promoter.data[0].unpaid) {
          const formattedUnpaid = (promoterData.unpaid / 100).toFixed(2);
          const formattedPreviousUnpaid = (
            promoter.data[0].unpaid / 100
          ).toFixed(2);
          const increaseAmount = (
            parseFloat(formattedUnpaid) - parseFloat(formattedPreviousUnpaid)
          ).toFixed(2);

          // Send email if resend is configured
          if (process.env.RESEND_API_KEY) {
            const { sendReferralBalanceEmail } = await import("@/lib/resend"); // Lazy load resend

            await sendReferralBalanceEmail({
              to: promoter.user.email,
              userName: promoter.user.firstName,
              host: companyHost,
              newBalance: formattedUnpaid,
              previousBalance: formattedPreviousUnpaid,
              increaseAmount,
            });
          }
        }
      }

      // Create promoter data
      const savedPromoterData = await prisma.promoterData.create({
        data: { ...promoterData, promoterId: id },
      });

      messageEmitter.emit(`${id}-${userId}`, savedPromoterData);
      console.log(chalk.green("Debug: Emitted message:", `${id}-${userId}`));
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
      console.log(chalk.red("Debug: Emitted message:", `${id}-${userId}`));
    }
  },
  { connection }
);

export const addScheduledJob = async (id: string, schedule: number) => {
  if (schedule) {
    await jobQueue.upsertJobScheduler(
      `scheduled-${id}`,
      {
        every: schedule * 1000,
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
