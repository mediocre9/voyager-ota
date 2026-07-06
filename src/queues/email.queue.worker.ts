import { Job, Worker as EmailWorker } from "bullmq";
import * as EmailQueue from "./email.queue";
import { Logger } from "@utils/logger";
import { redis as RedisConnection } from "@config/redis.connection.config";
import { isDevEnvironment } from "@config/config";
import * as ProjectDAL from "@dal/project.dal";
import { sendEmail } from "@config/email.client";

// * Configured to process 150 jobs (emails) under 24 hours to avoid rate limiting.....
const worker = new EmailWorker(
  EmailQueue.EMAIL_QUEUE_NAME,
  async (job: Job<EmailQueue.EmailContentData>): Promise<void> => {
    try {
      if (!isDevEnvironment()) {
        await sendEmail(job.data);
      }

      await ProjectDAL.updateProjectSuspendStatus(job.data.projectId, true);
      Logger.info(`Email Message : ${job.data.recipientEmail} - ${job.data.subject}`);
    } catch (error) {
      Logger.error((error as Error).message);
      throw error;
    }
  },
  {
    limiter: {
      max: 150,
      duration: 24 * 3600 * 1000, // 24h in ms.....
    },
    connection: RedisConnection,
    autorun: true,
    concurrency: 5,
    removeOnComplete: {
      age: 3600,
      count: 2000,
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 5000,
    },
  },
);

worker.on("ready", () => {
  Logger.info("email notice worker started!");
});

worker.on("active", (job: Job<EmailQueue.EmailContentData>, _) => {
  Logger.info(`job: ${job.id} is being processed!`);
});

worker.on("error", (error) => {
  Logger.error(error.message);
});

worker.on("failed", (_, error) => {
  Logger.error(error.message);
});

worker.on("completed", (job: Job<EmailQueue.EmailContentData>, _) => {
  Logger.info(`Sent deletion email: ${job.data.recipientEmail}`);
});
