import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [Credentials({})],
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;

export default authConfig;
