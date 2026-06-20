import { assertSafeDeploymentTarget } from "./deployment-probe";

export async function validateWebhookTarget(
  input: unknown,
  { allowLocalhost = process.env.NODE_ENV !== "production" } = {},
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Enter an HTTPS webhook URL." };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.trim());
  } catch {
    return { ok: false, error: "Enter a complete webhook URL beginning with https://." };
  }

  const local = ["localhost", "127.0.0.1", "::1"].includes(
    parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase(),
  );
  if (parsed.username || parsed.password) {
    return { ok: false, error: "Webhook URLs cannot contain credentials." };
  }
  if (parsed.protocol !== "https:" && !(allowLocalhost && local && parsed.protocol === "http:")) {
    return { ok: false, error: "Webhook URLs must use HTTPS." };
  }

  try {
    await assertSafeDeploymentTarget(parsed, allowLocalhost);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Webhook destination is not allowed.",
    };
  }

  return { ok: true, url: parsed.toString() };
}
