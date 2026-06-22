import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

test("consumer dependency declaration is authenticated and idempotent", async ({
  request,
}) => {
  const state = readE2EState();
  const url = `/api/registry/contracts/${state.slug}/dependencies`;
  const payload = {
    consumerName: `consumer-${state.runId}`,
    consumerUrl: "https://github.com/example/consumer",
  };
  const first = await request.post(url, {
    headers: { authorization: `Bearer ${state.consumerToken}` },
    data: payload,
  });
  expect(first.status()).toBe(201);
  const second = await request.post(url, {
    headers: { authorization: `Bearer ${state.consumerToken}` },
    data: payload,
  });
  expect(second.status()).toBe(200);
  const list = await request.get(url);
  expect(await list.json()).toMatchObject({
    dependencies: [
      {
        consumerName: payload.consumerName,
        consumerUrl: payload.consumerUrl,
      },
    ],
  });
});

test("anonymous and malformed dependency declarations are rejected", async ({
  request,
}) => {
  const state = readE2EState();
  const url = `/api/registry/contracts/${state.slug}/dependencies`;
  expect((await request.post(url, { data: {} })).status()).toBe(401);
  expect(
    (
      await request.post(url, {
        headers: { authorization: `Bearer ${state.consumerToken}` },
        data: { consumerName: "x", consumerUrl: "not-a-url" },
      })
    ).status(),
  ).toBe(400);
});
