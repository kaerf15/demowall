import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Only check paths starting with /admin or /api/admin
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/api/admin")) {
    const payload = await verifyAuth(request);

    if (!payload) {
      // If API, return 401 JSON
      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // If Page, redirect to login (and maybe add return url)
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (payload.role !== "ADMIN") {
      // If API, return 403 JSON
      if (request.nextUrl.pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // If Page, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
