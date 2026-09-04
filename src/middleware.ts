import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/crm/:path*", "/login"],
};

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isCrmRoute = req.nextUrl.pathname.startsWith("/crm");
  const isLoginRoute = req.nextUrl.pathname === "/login";

  if (isCrmRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoginRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/crm", req.url));
  }

  return NextResponse.next();
});
