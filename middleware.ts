import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isLoginPage = nextUrl.pathname === "/admin/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/admin/login", nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${nextUrl.pathname}${nextUrl.search}`
    );
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return Response.redirect(new URL("/admin", nextUrl.origin));
  }

  return undefined;
});

export const config = {
  matcher: ["/admin/:path*"],
};
