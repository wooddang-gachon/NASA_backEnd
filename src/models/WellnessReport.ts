export interface WellnessReport {
  id: number;
  userId: number;
  reportYearMonth: string;
  summaryContent?: string;
  aggregatedData?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReportJob {
  jobId: string;
  userId: number;
  period: "WEEKLY" | "MONTHLY";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  reportId?: number;
  progressPercent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WellnessReportModel {
  /**
   * 유저의 건강 리포트 조회 (스텁)
   */
  public static async findByUserIdAndYearMonth(
    userId: number,
    yearMonth: string
  ): Promise<WellnessReport | null> {
    throw new Error("Method not implemented.");
  }
}
