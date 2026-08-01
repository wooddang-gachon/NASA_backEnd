import type express from "express";
import jwt from "jsonwebtoken";
import config from "../../config";

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "jwt") {
    const authHeader = request.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    return new Promise((resolve, reject) => {
      if (!token) {
        return reject(new Error("No token provided"));
      }

      jwt.verify(token, config.ai.apiKey || "super-secret-jwt-key", (err: any, decoded: any) => {
        if (err) {
          return reject(err);
        }
        
        // request 객체에 사용자 정보 바인딩
        (request as any).currentUser = decoded;
        return resolve(decoded);
      });
    });
  }
  
  return Promise.reject(new Error("Unsupported security schema"));
}
