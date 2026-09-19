import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionUnavailableState } from "@/components/action-plan/ActionUnavailableState";
import { ActionEmptyState } from "@/components/action-plan/ActionEmptyState";

describe("ActionEmptyState (Category 02 Step 07, Task 2)", () => {
  it("uses the exact required copy and offers a way to analyze the site", () => {
    render(<ActionEmptyState scanHref="/scan?url=example.com" />);
    expect(
      screen.getByText("Your action plan will appear here after your website has been analyzed.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analyze this website/i })).toHaveAttribute(
      "href",
      "/scan?url=example.com"
    );
  });
});

describe("ActionUnavailableState (Category 02 Step 07, Task 12)", () => {
  it("covers every named state with distinct, honest copy", () => {
    const { rerender } = render(<ActionUnavailableState kind="no_scan" scanHref="/" />);
    expect(screen.getByText(/no scan yet/i)).toBeInTheDocument();

    rerender(<ActionUnavailableState kind="processing" />);
    expect(screen.getByText(/action plan is still being put together/i)).toBeInTheDocument();

    rerender(<ActionUnavailableState kind="partial" />);
    expect(screen.getByText(/partial action plan/i)).toBeInTheDocument();

    rerender(<ActionUnavailableState kind="failed" />);
    expect(screen.getByText(/scan failed/i)).toBeInTheDocument();

    rerender(<ActionUnavailableState kind="unavailable" />);
    expect(screen.getByText(/data unavailable/i)).toBeInTheDocument();

    rerender(<ActionUnavailableState kind="no_matches" />);
    expect(screen.getByText(/no actions match your filters/i)).toBeInTheDocument();
  });
});
