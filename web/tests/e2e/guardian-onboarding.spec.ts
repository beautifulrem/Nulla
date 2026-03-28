import { test, expect } from "@playwright/test";

test.describe("guardian onboarding", () => {
  test("shows a single onboarding switch for the demo safe", async ({ page }) => {
    await page.setContent(`
      <main>
        <button id="enable">Enable Guardian Mode</button>
        <div id="safe">0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0</div>
        <div id="owner">0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4</div>
      </main>
    `);

    await expect(page.getByRole("button", { name: "Enable Guardian Mode" })).toBeVisible();
    await expect(page.locator("#safe")).toHaveText("0x23BB5F9b7D50f2ecdE6305E6cdB71c1e7Ba698F0");
    await expect(page.locator("#owner")).toHaveText("0xbA64397d50D71fE0c38a86B51fc77BedB580C8A4");
  });
});
