import { ArtifactInspectionQueue, TaskInputData, TaskOutputData } from "@queues/artifact.queue";
import { NullableOrUndefined } from "@interfaces/common/common";
import { Job, JobState } from "bullmq";
import { StatusCodes } from "http-status-codes";
import { inject, injectable } from "tsyringe";

export enum ArtifactJobStates {
  ACTIVE = "ACTIVE",
  DELAYED = "DELAYED",
  WAITING = "WAITING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  UNKNOWN = "UNKNOWN",
  PRIORITIZED = "PRIORITIZED",
  WAITING_CHILDREN = "WAITING_CHILDREN",
}

export interface TaskStatusMessage {
  message: string;
  statusCode: StatusCodes;
}

export interface TaskResultData {
  id: string;
  timestamps: number;
}

export interface TaskStatus {
  status: TaskStatusMessage;
  state: ArtifactJobStates;
  data: TaskOutputData;
}

@injectable()
export class ArtifactInspectionQueueService {
  constructor(
    @inject(ArtifactInspectionQueue)
    private readonly _queue: ArtifactInspectionQueue,
  ) {}

  public async putJob(jobData: TaskInputData): Promise<TaskResultData> {
    const job = await this._queue.enQueueArtifact(jobData);
    return { id: job.id!, timestamps: job.timestamp };
  }

  public async getJob(jobId: string): Promise<NullableOrUndefined<Job<unknown, TaskOutputData>>> {
    return await this._queue.getJob(jobId);
  }

  public async isJobCompleted(jobId: string): Promise<NullableOrUndefined<boolean>> {
    const job = await this._queue.getJob(jobId);
    return job?.isCompleted();
  }

  public async getData(jobId: string): Promise<TaskOutputData> {
    const job = await this._queue.getJob(jobId);
    return job!.returnvalue;
  }

  public async getCurrentJobState(jobId: string): Promise<ArtifactJobStates> {
    if (!(await this._isJobPresent(jobId))) {
      throw new Error("Job not Found!");
    }

    const state = await this._getJobState(jobId);
    switch (state) {
      case "active":
        return ArtifactJobStates.ACTIVE;

      case "completed":
        return ArtifactJobStates.COMPLETED;

      case "delayed":
        return ArtifactJobStates.DELAYED;

      case "waiting":
        return ArtifactJobStates.WAITING;

      case "failed":
        return ArtifactJobStates.FAILED;

      case "prioritized":
        return ArtifactJobStates.PRIORITIZED;

      case "waiting-children":
        return ArtifactJobStates.WAITING_CHILDREN;

      default:
        return ArtifactJobStates.UNKNOWN;
    }
  }

  private async _getJobState(jobId: string): Promise<JobState | "unknown"> {
    return await this._queue.getJobState(jobId);
  }

  private async _isJobPresent(jobId: string): Promise<boolean> {
    const job = await this._queue.getJob(jobId);
    return job !== undefined;
  }

  public getJobStatus(status: ArtifactJobStates): TaskStatusMessage {
    const states = new Map<ArtifactJobStates, TaskStatusMessage>([
      [
        ArtifactJobStates.ACTIVE,
        {
          message: "Artifact build detection is being processed. Please wait....",
          statusCode: StatusCodes.ACCEPTED,
        },
      ],
      [
        ArtifactJobStates.COMPLETED,
        {
          message: "Artifact build detection completed with results!",
          statusCode: StatusCodes.OK,
        },
      ],
      [
        ArtifactJobStates.DELAYED,
        {
          message: "Artifact processing has been delayed!",
          statusCode: StatusCodes.ACCEPTED,
        },
      ],
      [
        ArtifactJobStates.FAILED,
        {
          message: "Artifact processing failed!",
          statusCode: StatusCodes.OK,
        },
      ],
      [
        ArtifactJobStates.WAITING,
        {
          message: "Artifact processing is in waiting mode.",
          statusCode: StatusCodes.ACCEPTED,
        },
      ],
      [
        ArtifactJobStates.PRIORITIZED,
        {
          message: "PRIORITIZED........",
          statusCode: StatusCodes.ACCEPTED,
        },
      ],
      [
        ArtifactJobStates.WAITING_CHILDREN,
        {
          message: "WAITING_CHILDREN........",
          statusCode: StatusCodes.ACCEPTED,
        },
      ],
      [ArtifactJobStates.UNKNOWN, { message: "UNKNOWN.....", statusCode: StatusCodes.ACCEPTED }],
    ]);

    return states.get(status)!;
  }
}
