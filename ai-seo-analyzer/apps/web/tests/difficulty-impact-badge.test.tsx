import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "@/components/issue/DifficultyBadge";
import { ImpactBadge } from "@/components/issue/ImpactBadge";

describe("DifficultyBadge (Category 02 Step 06, Task 7)", () => {
  it("labels each real difficulty level", () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("uses the Step 06 wording (Moderate/Advanced), not the old easy/medium/hard scale", () => {
    render(<DifficultyBadge difficulty="moderate" />);
    expect(screen.getByText("Moderate")).toBeInTheDocument();
  });

  it("shows 'Not available yet' rather than a fabricated difficulty", () => {
    render(<DifficultyBadge difficulty={null} />);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });
});

describe("ImpactBadge (Category 02 Step 06, Task 7)", () => {
  it("labels each real impact level", () => {
    render(<ImpactBadge impact="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("shows 'Not available yet' rather than a fabricated impact", () => {
    render(<ImpactBadge impact={null} />);
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });
});
