import { Queue } from "bullmq";
import { redis as RedisConnection } from "@config/redis.connection.config";
import { IEmailContentData } from "@config/email.client";

export const EMAIL_QUEUE_NAME = "email-queue-name";

export interface EmailContentData extends IEmailContentData {
  projectId: number;
}

export class EmailQueue extends Queue<EmailContentData> {
  constructor() {
    super(EMAIL_QUEUE_NAME, {
      connection: RedisConnection,
      defaultJobOptions: {
        attempts: 5,
        delay: 2 * 1000,
        backoff: { type: "exponential", delay: 2 * 1000, jitter: 0.3 },
      },
    });
  }

  async enqueueEmail(email: EmailContentData): Promise<void> {
    await this.add("email-queue-job-name", email);
  }
}
