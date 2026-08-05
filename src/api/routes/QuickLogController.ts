import { Controller, Route, Post, Body, Security, Request } from "tsoa";
import { Service } from "typedi";
import { LogCategory } from "../../interfaces/enums";

export interface QuickLogApiRequest {
  category: LogCategory;
  amount?: number;
  emotionType?: string;
  journalContent?: string;
  exerciseName?: string;
  durationMinutes?: number;
}

export interface QuickLogApiResponse {
  success: boolean;
  data: {
    logId: string;
    earnedFuel: number;
    totalFuel: number;
  };
}

@Service()
@Route("quick-log")
export class QuickLogController extends Controller {
  /**
   * [3.1] 1-Tap 퀵버튼 데일리 기록 API
   */
  @Post("")
  @Security("jwt")
  public async createQuickLog(
    @Request() request: any,
    @Body() requestBody: QuickLogApiRequest
  ): Promise<QuickLogApiResponse> {
    const userId = request.currentUser?.userId || 1;
    this.setStatus(201);
    return {
      success: true,
      data: {
        logId: `log_${Date.now()}`,
        earnedFuel: 10,
        totalFuel: 100,
      },
    };
  }
}
