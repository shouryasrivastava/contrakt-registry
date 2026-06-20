import { NextRequest } from "next/server";
import { resolveApiToken } from "./token-security";

export async function userIdFromBearer(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const row = await resolveApiToken(token);

  return row?.userId ?? null;
}
