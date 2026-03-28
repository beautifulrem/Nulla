import { test, expect } from "@playwright/test";

test.describe("cross-chain shield", () => {
  test("renders source revoke and peer shield states in one flow", async ({ page }) => {
    await page.setContent(`
      <main>
        <section data-step="risk">RiskDetected on Base Sepolia</section>
        <section data-step="react">Lasna REACT tx: 0xreact</section>
        <section data-step="source">Source revoke: 0xrevoke</section>
        <section data-step="peer">Peer shield: Ethereum Sepolia</section>
      </main>
    `);

    await expect(page.getByText("RiskDetected on Base Sepolia")).toBeVisible();
    await expect(page.getByText("Lasna REACT tx: 0xreact")).toBeVisible();
    await expect(page.getByText("Source revoke: 0xrevoke")).toBeVisible();
    await expect(page.getByText("Peer shield: Ethereum Sepolia")).toBeVisible();
  });
});
