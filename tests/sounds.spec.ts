import { test, expect } from "@playwright/test";

test.describe("sounds listing", () => {
  test("renders EPs, singles, and audio elements", async ({ page }) => {
    await page.goto("/sounds");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "fa11faster" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "HMBM" })).toBeVisible();
    // every version has a player
    const players = page.locator("audio");
    expect(await players.count()).toBeGreaterThan(20);
    // placeholder covers render a "?"
    await expect(page.getByText("?", { exact: true }).first()).toBeVisible();
  });
});
