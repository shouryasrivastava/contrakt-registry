import { describe, expect, it } from "vitest";
import { isUnsafeIpAddress, normalizeDeploymentUrl } from "../lib/deployment-url";

describe("deployment URL validation", () => {
  it("normalizes a valid HTTPS deployment", () => {
    expect(normalizeDeploymentUrl(" https://api.example.com/ ", { allowLocalhost: false })).toEqual({
      ok: true,
      url: "https://api.example.com",
    });
  });

  it("rejects insecure public deployments", () => {
    const result = normalizeDeploymentUrl("http://api.example.com", { allowLocalhost: true });
    expect(result.ok).toBe(false);
  });

  it("allows local development explicitly", () => {
    expect(normalizeDeploymentUrl("http://localhost:3000/", { allowLocalhost: true })).toEqual({
      ok: true,
      url: "http://localhost:3000",
    });
  });

  it("rejects credentials and query strings", () => {
    expect(normalizeDeploymentUrl("https://user:pass@example.com", { allowLocalhost: false }).ok).toBe(false);
    expect(normalizeDeploymentUrl("https://example.com?token=secret", { allowLocalhost: false }).ok).toBe(false);
  });
});

describe("private network protection", () => {
  it.each(["127.0.0.1", "10.0.0.2", "172.16.4.2", "192.168.1.1", "169.254.2.1", "::1", "fd12::1"])(
    "blocks %s",
    (address) => expect(isUnsafeIpAddress(address)).toBe(true),
  );

  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
    "allows public address %s",
    (address) => expect(isUnsafeIpAddress(address)).toBe(false),
  );
});
