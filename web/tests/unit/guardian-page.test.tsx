import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function GuardianPageShell({
  armed,
  primaryActionLabel,
}: {
  armed: boolean;
  primaryActionLabel: string;
}) {
  return (
    <main>
      <h1>Nulla</h1>
      <button type="button">{primaryActionLabel}</button>
      <div aria-label="guardian-state">{armed ? "Armed" : "Idle"}</div>
      <section aria-label="timeline">Ethereum Sepolia / Lasna / Base Sepolia</section>
    </main>
  );
}

describe("guardian page shell", () => {
  it("renders a single Guardian Mode action and cross-chain timeline", () => {
    render(<GuardianPageShell armed primaryActionLabel="Enable Guardian Mode" />);

    expect(screen.getByRole("button", { name: "Enable Guardian Mode" })).toBeTruthy();
    expect(screen.getByLabelText("guardian-state").textContent).toBe("Armed");
    expect(screen.getByLabelText("timeline").textContent).toBe("Ethereum Sepolia / Lasna / Base Sepolia");
  });
});
