import { Queue } from "bullmq";
import { redis as RedisConnection } from "@config/redis.connection.config";
import { IEmailContentData } from "@config/email.client";

export const EMAIL_QUEUE_NAME = "email-queue-name";

export class EmailQueue<T extends IEmailContentData> extends Queue<IEmailContentData> {
  constructor() {
    super(EMAIL_QUEUE_NAME, {
      connection: RedisConnection,
      defaultJobOptions: {
        attempts: 6,
        delay: 2 * 1000,
        backoff: { type: "exponential", delay: 20 * 1000, jitter: 0.3 },
      },
    });
  }

  async enqueueEmail(email: T): Promise<void> {
    await this.add("email-queue-job-name", email);
  }
}
