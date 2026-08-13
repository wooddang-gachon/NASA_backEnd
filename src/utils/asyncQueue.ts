import Logger from "../loaders/logger";
import { EventEmitter } from "events";

export type JobStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface Job<T = unknown> {
  id: string;
  status: JobStatus;
  progressPercent: number;
  result?: T;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AsyncQueue<T = unknown> extends EventEmitter {
  private jobs: Map<string, Job<T>> = new Map();
  private queue: Array<{ id: string; taskFn: () => Promise<T> }> = [];
  private activeCount = 0;
  private concurrency: number;

  constructor(concurrency = 2) {
    super();
    this.concurrency = concurrency;
  }

  public enqueue(jobId: string, taskFn: () => Promise<T>): string {
    const job: Job<T> = {
      id: jobId,
      status: "PENDING",
      progressPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.queue.push({ id: jobId, taskFn });
    this.emit("job_updated", job);
    this.processNext();

    return jobId;
  }

  public getJob(jobId: string): Job<T> | undefined {
    return this.jobs.get(jobId);
  }

  private async processNext() {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;
    const job = this.jobs.get(item.id);
    if (job) {
      job.status = "IN_PROGRESS";
      job.progressPercent = 30;
      job.updatedAt = new Date();
      this.emit("job_updated", job);
    }

    try {
      Logger.info(`[AsyncQueue] Processing job ${item.id}`);
      const result = await item.taskFn();
      if (job) {
        job.status = "COMPLETED";
        job.progressPercent = 100;
        job.result = result;
        job.updatedAt = new Date();
        this.emit("job_updated", job);
      }
      Logger.info(`[AsyncQueue] Successfully completed job ${item.id}`);
    } catch (err: unknown) {
      if (job) {
        job.status = "FAILED";
        job.error = err instanceof Error ? err.message : String(err);
        job.updatedAt = new Date();
        this.emit("job_updated", job);
      }
      Logger.error(`[AsyncQueue] Job ${item.id} failed: ${err}`);
    } finally {
      this.activeCount--;
      this.processNext().catch((e) =>
        Logger.error(`[AsyncQueue] processNext error: ${e}`),
      );
    }
  }
}

export const reportQueue = new AsyncQueue();
