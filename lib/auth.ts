import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { db } from "./db";
import { users } from "./schema";
import { e2eEnabled, isE2EUsername } from "./e2e";

const providers: Provider[] = [
  GitHub({
    clientId: process.env.AUTH_GITHUB_ID!,
    clientSecret: process.env.AUTH_GITHUB_SECRET!,
  }),
];

if (e2eEnabled()) {
  providers.push(
    Credentials({
      id: "e2e",
      name: "E2E test account",
      credentials: {
        username: { label: "Username", type: "text" },
        secret: { label: "Secret", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "");
        const secret = String(credentials?.secret ?? "");
        if (
          secret !== process.env.E2E_AUTH_SECRET ||
          !isE2EUsername(username)
        ) {
          return null;
        }

        const id = `e2e:${username}`;
        await db
          .insert(users)
          .values({ id, username, avatarUrl: null })
          .onConflictDoUpdate({
            target: users.id,
            set: { username, avatarUrl: null },
          });

        return {
          id,
          name: username,
          email: `${username}@example.invalid`,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers,
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
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as { id?: number; login?: string };
        token.sub = String(githubProfile.id ?? token.sub);
        token.username = githubProfile.login;
      }
      if (account?.provider === "e2e" && user?.id) {
        token.sub = user.id;
        token.username = user.name;
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
