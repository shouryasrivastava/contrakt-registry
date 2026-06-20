import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "./db";
import { users } from "./schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as {
          id?: number;
          login?: string;
          avatar_url?: string;
        };

        const githubId = String(githubProfile.id ?? user.id);
        const username = githubProfile.login ?? user.name ?? user.email ?? githubId;
        const avatarUrl = githubProfile.avatar_url ?? user.image ?? null;

        await db
          .insert(users)
          .values({
            id: githubId,
            username,
            avatarUrl,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              username,
              avatarUrl,
            },
          });

        // Store github id in the user object for session
        user.id = githubId;
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (typeof token.username === "string") {
        session.user.username = token.username;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as { id?: number; login?: string };
        token.sub = String(githubProfile.id ?? token.sub);
        token.username = githubProfile.login;
      }
      return token;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
