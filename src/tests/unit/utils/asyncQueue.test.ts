import { reportQueue } from "../../../utils/asyncQueue";

describe("asyncQueue", () => {
  it("should enqueue job and process it successfully", async () => {
    const mockFn = jest.fn();
    reportQueue.on("job_updated", mockFn);

    const taskFn = jest.fn().mockResolvedValue({ success: true });

    const jobId = reportQueue.enqueue("job-1", taskFn);

    expect(jobId).toBe("job-1");

    // Wait for internal async processNext to finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    const job = reportQueue.getJob("job-1");
    expect(job?.status).toBe("COMPLETED");
    expect(job?.result).toEqual({ success: true });
    expect(mockFn).toHaveBeenCalled();
  });

  it("should handle failing job", async () => {
    const taskFn = jest.fn().mockRejectedValue(new Error("Test error"));

    reportQueue.enqueue("job-fail", taskFn);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const job = reportQueue.getJob("job-fail");
    expect(job?.status).toBe("FAILED");
    expect(job?.error).toBe("Test error");
  });
});
