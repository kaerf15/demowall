import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface TokenPayload {
  userId: string;
  username: string;
}

export function verifyAuth(request: NextRequest): TokenPayload | null {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    
    // 验证 payload 结构和 userId 格式 (必须是 UUID)
    if (
      !payload || 
      !payload.userId || 
      typeof payload.userId !== 'string' || 
      !payload.userId.includes('-') // 简单检查 UUID 格式
    ) {
      return null;
    }

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
