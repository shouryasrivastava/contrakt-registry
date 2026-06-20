import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contracts } from "@/lib/schema";
import { eq } from "drizzle-orm";

type Params = Promise<{ username: string; app: string }>;

function escapeSvg(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badge(label: string, value: string, color = "#16a34a") {
  const labelWidth = Math.max(68, label.length * 7 + 18);
  const valueWidth = Math.max(82, value.length * 7 + 18);
  const width = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${escapeSvg(label)}: ${escapeSvg(value)}">
  <title>${escapeSvg(label)}: ${escapeSvg(value)}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1" stop-opacity=".08"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#18181b"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeSvg(label)}</text>
    <text x="${labelWidth / 2}" y="14">${escapeSvg(label)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${escapeSvg(value)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${escapeSvg(value)}</text>
  </g>
</svg>`;
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { username, app } = await params;
  const slug = `${username}/${app}`;

  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.slug, slug),
  });

  const body = contract
    ? badge("contrakt", `${contract.endpointCount} endpoint${contract.endpointCount === 1 ? "" : "s"}`)
    : badge("contrakt", "not found", "#71717a");

  return new Response(body, {
    status: contract ? 200 : 404,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
