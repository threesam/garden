import { test, expect } from "@playwright/test";

test.describe("sounds player", () => {
  test("renders the grid, badges, scores, transport, and per-song play controls", async ({ page }) => {
    await page.goto("/sounds");
    await expect(page.getByRole("heading", { name: "sounds", level: 1 })).toBeVisible();
    // demo/score badges replace the old section headers
    await expect(page.getByText("demo", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("score", { exact: true }).first()).toBeVisible();
    // HMBM film-score block, titled by its film
    await expect(page.getByRole("heading", { name: "how many blind mice?" })).toBeVisible();
    // fixed transport with a scrubber
    await expect(page.getByLabel("seek")).toBeVisible();
    // a play disc per song (demos + sk+w ≈ 27)
    expect(await page.getByRole("button", { name: /^play / }).count()).toBeGreaterThan(15);
    // cover-less songs render a "?" placeholder
    await expect(page.getByText("?", { exact: true }).first()).toBeVisible();
  });
});
