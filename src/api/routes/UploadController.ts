import { Controller, Route, Post, UploadedFile, Security } from "tsoa";
import { Service } from "typedi";
import path from "path";
import fs from "fs";

export interface ImageUploadResponse {
  success: boolean;
  data: {
    imageUrl: string;
    filename: string;
  };
}

@Service()
@Route("upload")
export class UploadController extends Controller {
  /**
   * [파일 업로드] 로컬 이미지 단일 파일 업로드 API (multipart/form-data)
   */
  @Post("image")
  @Security("jwt")
  public async uploadImage(
    @UploadedFile("file") file: Express.Multer.File
  ): Promise<ImageUploadResponse> {
    if (!file) {
      throw new Error("업로드할 이미지 파일(file)이 누락되었습니다.");
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || ".jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const imageUrl = `/uploads/${filename}`;

    return {
      success: true,
      data: {
        imageUrl,
        filename,
      },
    };
  }
}
