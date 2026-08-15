import { handleJobSSE } from "../../../utils/sseHelper";
import { reportQueue } from "../../../utils/asyncQueue";
import { Request, Response } from "express";

jest.mock("../../../utils/asyncQueue", () => ({
  reportQueue: {
    on: jest.fn(),
    off: jest.fn(),
    getJob: jest.fn(),
  },
}));

describe("sseHelper", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { on: jest.fn() };
    res = {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("should initialize SSE connection and write CONNECTED status", () => {
    handleJobSSE("job1", req as Request, res as Response);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining("CONNECTED"),
    );
    expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
  });

  it("should send current job status if it exists and is not finished", () => {
    (reportQueue.getJob as jest.Mock).mockReturnValue({
      id: "job1",
      status: "PROCESSING",
    });
    handleJobSSE("job1", req as Request, res as Response);
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining("PROCESSING"),
    );
    expect(res.end).not.toHaveBeenCalled();
  });

  it("should send job status and end response if job is COMPLETED", () => {
    (reportQueue.getJob as jest.Mock).mockReturnValue({
      id: "job1",
      status: "COMPLETED",
    });
    handleJobSSE("job1", req as Request, res as Response);
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining("COMPLETED"),
    );
    expect(res.end).toHaveBeenCalled();
  });
});
