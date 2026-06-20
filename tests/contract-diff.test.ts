import { describe, expect, it } from "vitest";
import { diffContracts } from "../lib/contract-diff";

describe("diffContracts", () => {
  it("classifies a removed response field as breaking", () => {
    const oldContract = {
      endpoints: [{
        method: "GET",
        path: "/api/users",
        responseSchema: {
          type: "object",
          properties: { id: { type: "string" }, name: { type: "string" } },
        },
      }],
    };
    const nextContract = {
      endpoints: [{
        method: "GET",
        path: "/api/users",
        responseSchema: {
          type: "object",
          properties: { id: { type: "string" } },
        },
      }],
    };

    const diff = diffContracts(oldContract, nextContract);
    expect(diff.breaking).toHaveLength(1);
    expect(diff.breaking[0]?.field).toBe("response.name");
  });

  it("classifies an optional request field as non-breaking", () => {
    const oldContract = {
      endpoints: [{
        method: "POST",
        path: "/api/users",
        requestSchema: { type: "object", properties: {}, required: [] },
      }],
    };
    const nextContract = {
      endpoints: [{
        method: "POST",
        path: "/api/users",
        requestSchema: {
          type: "object",
          properties: { nickname: { type: "string" } },
          required: [],
        },
      }],
    };

    expect(diffContracts(oldContract, nextContract).nonBreaking).toHaveLength(1);
  });

  it("classifies an added required request field as breaking", () => {
    const oldContract = {
      endpoints: [{
        method: "POST",
        path: "/api/users",
        requestSchema: { type: "object", properties: {}, required: [] },
      }],
    };
    const nextContract = {
      endpoints: [{
        method: "POST",
        path: "/api/users",
        requestSchema: {
          type: "object",
          properties: { email: { type: "string" } },
          required: ["email"],
        },
      }],
    };

    expect(diffContracts(oldContract, nextContract).breaking).toHaveLength(1);
  });
});
