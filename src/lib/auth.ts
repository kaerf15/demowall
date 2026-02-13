import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export async function verifyAuth(request: NextRequest): Promise<TokenPayload | null> {
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    
    // 验证 payload 结构
    if (
      !payload || 
      !payload.userId || 
      typeof payload.userId !== 'string'
    ) {
      return null;
    }

    return payload as unknown as TokenPayload;
  } catch (e) {
    console.error("JWT Verify Error:", e);
    return null;
  }
}

// 注意：signToken 依然可以用 jsonwebtoken (在非 Edge 环境)，或者也统一换成 jose
import jwt from "jsonwebtoken";
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
