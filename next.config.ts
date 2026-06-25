import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV !== "production";
const isLocalHttp =
  process.env.NODE_ENV !== "production" || process.env.E2E_TEST_MODE === "true";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://*.coinbase.com https://*.onramper.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://avatars.githubusercontent.com https://*.coinbase.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sentry.io https://*.coinbase.com https://*.onramper.com https://*.base.org https://*.basescan.org",
  "frame-src 'self' https://*.coinbase.com https://*.onramper.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://github.com",
  "frame-ancestors 'none'",
  ...(!isLocalHttp ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ["127.0.0.1", "127.0.0.1:3001", "localhost", "localhost:3001"],
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "contrakt-registry.vercel.app" }],
        destination: "https://registry.contrakt.dev/:path*",
        permanent: true,
      },
      {
        source: "/c/:username/:app",
        destination: "/u/:username/:app",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
