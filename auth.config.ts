import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
} satisfies NextAuthConfig;
