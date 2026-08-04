import { Controller, Route, Post, Body } from "tsoa";
import { Service, Container } from "typedi";
import LogService, { type UserActionLogRequest } from "../../services/logService";

@Service()
@Route("logs")
export class LogController extends Controller {
  private logService = Container.get(LogService);

  constructor() {
    super();
  }

  /**
   * 클라이언트 사용자 행동(버튼 클릭, 화면 스크롤 등) 분석 로그를 수집합니다.
   */
  @Post("action")
  public async logAction(@Body() request: UserActionLogRequest) {
    return await this.logService.logUserAction(request);
  }
}
