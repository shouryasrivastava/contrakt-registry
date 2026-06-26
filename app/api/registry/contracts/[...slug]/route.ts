import { NextRequest, NextResponse } from "next/server";

const REGISTRY_ORIGINS = [
  process.env.NEXT_PUBLIC_REGISTRY_URL,
  process.env.REGISTRY_URL,
  "http://127.0.0.1:3000",
  "https://registry.contrakt.dev",
].filter(Boolean) as string[];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.map(encodeURIComponent).join("/");

  for (const origin of REGISTRY_ORIGINS) {
    try {
      const response = await fetch(`${origin.replace(/\/$/, "")}/api/registry/contracts/${path}`, {
        headers: { accept: "application/json" },
        next: { revalidate: 30 },
      });

      if (!response.ok) continue;

      const data = await response.json();
      return NextResponse.json(data, {
        headers: {
          "cache-control": "s-maxage=30, stale-while-revalidate=120",
        },
      });
    } catch {
      // Try the next registry origin.
    }
  }

  return NextResponse.json({ error: "Live contract data unavailable" }, { status: 503 });
}
