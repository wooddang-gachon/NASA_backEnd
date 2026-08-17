import type express from "express";
import { reportQueue, Job } from "./asyncQueue";

/**
 * SSE(Server-Sent Events) 응답 헤더 초기화
 */
export function initSSE(res: express.Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

/**
 * SSE 이벤트 전송 헬퍼
 */
export function sendSSEEvent(
  res: express.Response,
  event: string,
  data: unknown,
) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Job Queue 기반의 SSE(Server-Sent Events) 스트리밍을 처리하는 헬퍼 함수
 */
export function handleJobSSE(
  jobId: string,
  req: express.Request,
  res: express.Response,
) {
  initSSE(res);
  res.write(
    `data: ${JSON.stringify({ status: "CONNECTED", message: "SSE 연결 성공" })}\n\n`,
  );

  const onUpdate = (job: Job) => {
    if (job.id === jobId) {
      res.write(`data: ${JSON.stringify(job)}\n\n`);
      if (job.status === "COMPLETED" || job.status === "FAILED") {
        res.end();
        reportQueue.off("job_updated", onUpdate);
      }
    }
  };

  reportQueue.on("job_updated", onUpdate);

  // 즉시 현재 상태 전송
  const currentJob = reportQueue.getJob(jobId);
  if (currentJob) {
    res.write(`data: ${JSON.stringify(currentJob)}\n\n`);
    if (currentJob.status === "COMPLETED" || currentJob.status === "FAILED") {
      res.end();
      reportQueue.off("job_updated", onUpdate);
      return;
    }
  }

  // 클라이언트 연결 종료 시 리스너 해제
  req.on("close", () => {
    reportQueue.off("job_updated", onUpdate);
  });
}
