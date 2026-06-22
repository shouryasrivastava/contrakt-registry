import { expect, test } from "@playwright/test";
import { readE2EState } from "./support/state";

const routes = [
  "/dashboard",
  "/dashboard/settings",
  "overview",
  "consumers",
  "monetization",
  "integrations",
] as const;

test("all visible controls expose an accessible name", async ({ page }) => {
  const state = readE2EState();
  for (const route of routes) {
    const url =
      route.startsWith("/")
        ? route
        : `/u/${state.slug}/dashboard${route === "overview" ? "" : `/${route}`}`;
    await page.goto(url);
    const unnamed = await page
      .locator(
        'button:not([aria-label]):not([title]), a:not([aria-label]):not([title]), input:not([aria-label]):not([title])',
      )
      .evaluateAll((elements) =>
        elements
          .filter((element) => {
            const html = element as HTMLElement;
            const input = element as HTMLInputElement;
            return (
              html.offsetParent !== null &&
              !html.innerText.trim() &&
              !input.labels?.length &&
              !input.placeholder
            );
          })
          .map((element) => element.outerHTML.slice(0, 180)),
      );
    expect(unnamed, `Unnamed controls on ${url}`).toEqual([]);
  }
});
