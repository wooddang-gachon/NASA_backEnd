import { Service } from "typedi";
import fs from "fs";
import path from "path";
import Logger from "@/loaders/logger";

@Service()
export default class StorageAdapter {
  private readonly defaultUploadsDir = path.join(process.cwd(), "uploads");

  /**
   * 지정된 디렉토리가 존재하는지 확인하고, 없다면 생성합니다.
   */
  public ensureDirectoryExists(dirPath: string = this.defaultUploadsDir): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * 파일을 로컬 스토리지에 저장하고, 저장된 절대 경로와 URL 경로를 반환합니다.
   * @param buffer 저장할 파일 버퍼
   * @param originalname 원본 파일명 (확장자 추출용)
   * @returns 저장된 파일의 시스템 경로와 웹 접근 URL
   */
  public saveFile(
    buffer: Buffer,
    originalname: string,
  ): { absolutePath: string; urlPath: string } {
    this.ensureDirectoryExists();

    const ext = path.extname(originalname) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(this.defaultUploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    Logger.info(`[StorageAdapter] Saved uploaded file to ${filePath}`);

    return {
      absolutePath: filePath,
      urlPath: `/uploads/${filename}`,
    };
  }

  /**
   * 파일 시스템에서 이미지를 읽어 Buffer로 반환합니다.
   * @param urlPath 파일의 상대 경로 또는 url (ex. /uploads/123.jpg)
   * @returns 파일의 Buffer 또는 null
   */
  public readFile(urlPath: string): Buffer | null {
    const cleanPath = urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
    const imagePath = path.join(process.cwd(), cleanPath);

    if (fs.existsSync(imagePath)) {
      return fs.readFileSync(imagePath);
    }
    return null;
  }
}
