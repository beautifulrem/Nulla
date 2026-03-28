import { test, expect } from "@playwright/test";

test.describe("demo hash collection", () => {
  test("collects the full evidence chain for a single alert", async ({ page }) => {
    await page.setContent(`
      <main>
        <ul>
          <li>origin approval tx</li>
          <li>Lasna react tx</li>
          <li>source revoke tx</li>
          <li>peer shield tx</li>
          <li>shield exit tx</li>
        </ul>
      </main>
    `);

    await expect(page.getByText("origin approval tx")).toBeVisible();
    await expect(page.getByText("Lasna react tx")).toBeVisible();
    await expect(page.getByText("source revoke tx")).toBeVisible();
    await expect(page.getByText("peer shield tx")).toBeVisible();
    await expect(page.getByText("shield exit tx")).toBeVisible();
  });
});
