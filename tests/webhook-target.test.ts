import { describe, expect, it } from "vitest";
import { validateWebhookTarget } from "@/lib/webhook-target";

describe("validateWebhookTarget", () => {
  it("rejects private network destinations", async () => {
    await expect(
      validateWebhookTarget("https://10.0.0.1/hooks", { allowLocalhost: false }),
    ).resolves.toEqual({
      ok: false,
      error: "Private-network and reserved deployment addresses cannot be tested.",
    });
  });

  it("rejects credentials embedded in a URL", async () => {
    await expect(
      validateWebhookTarget("https://user:pass@example.com/hooks"),
    ).resolves.toEqual({
      ok: false,
      error: "Webhook URLs cannot contain credentials.",
    });
  });

  it("allows localhost only in development mode", async () => {
    await expect(
      validateWebhookTarget("http://localhost:4000/hooks", { allowLocalhost: true }),
    ).resolves.toEqual({
      ok: true,
      url: "http://localhost:4000/hooks",
    });
    await expect(
      validateWebhookTarget("http://localhost:4000/hooks", { allowLocalhost: false }),
    ).resolves.toEqual({
      ok: false,
      error: "Webhook URLs must use HTTPS.",
    });
  });
});
