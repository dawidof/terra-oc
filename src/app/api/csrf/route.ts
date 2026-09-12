import { NextRequest, NextResponse } from "next/server";
import { issueCsrfToken } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`csrf:${ip}`, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { token, cookie } = await issueCsrfToken();
    const response = NextResponse.json({ token });
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("CSRF token issuance error:", error);
    return NextResponse.json(
      { error: "Failed to issue CSRF token" },
      { status: 500 }
    );
  }
}
