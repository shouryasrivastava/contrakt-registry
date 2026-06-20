import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      code,
      message,
      error: message,
      ...(details && process.env.NODE_ENV !== "production" ? { details } : {}),
    },
    { status },
  );
}

export async function readJsonBody<T>(
  request: Request,
  maxBytes = 256_000,
): Promise<{ ok: true; value: T } | { ok: false; response: NextResponse }> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: apiError(413, "BAD_REQUEST", "Request body is too large."),
    };
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return {
      ok: false,
      response: apiError(413, "BAD_REQUEST", "Request body is too large."),
    };
  }

  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: apiError(400, "BAD_REQUEST", "Request body must be valid JSON."),
    };
  }
}
