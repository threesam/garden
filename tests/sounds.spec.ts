import { test, expect } from "@playwright/test";

test.describe("sounds player", () => {
  test("renders the grid, scores, transport, and per-song play controls", async ({ page }) => {
    await page.goto("/sounds");
    await expect(page.getByRole("heading", { name: "sounds", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "scores" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "HMBM" })).toBeVisible();
    // fixed transport with a scrubber
    await expect(page.getByLabel("seek")).toBeVisible();
    // a play disc per song (demos + sk+w ≈ 27)
    expect(await page.getByRole("button", { name: /^play / }).count()).toBeGreaterThan(15);
    // cover-less songs render a "?" placeholder
    await expect(page.getByText("?", { exact: true }).first()).toBeVisible();
  });
});
