import { test, expect } from "@playwright/test";

test.describe("sounds player", () => {
  test("renders EPs, scores, transport, and per-song play controls", async ({ page }) => {
    await page.goto("/sounds");
    // delineated groups
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "fa11faster" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "singles" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "HMBM" })).toBeVisible();
    // fixed transport with a scrubber
    await expect(page.getByLabel("seek")).toBeVisible();
    // a play disc per song (demos + sk+w ≈ 28)
    expect(await page.getByRole("button", { name: /^play / }).count()).toBeGreaterThan(15);
    // cover-less songs render a "?" placeholder
    await expect(page.getByText("?", { exact: true }).first()).toBeVisible();
  });
});
