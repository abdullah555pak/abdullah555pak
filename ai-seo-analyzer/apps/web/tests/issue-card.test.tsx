import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IssueCard } from "@/components/results/IssueCard";

const baseProps = {
  title: "Example issue title",
  priority: "critical" as const,
  confidence: "verified" as const,
  whyItMatters: "Example reason this matters.",
  fixSteps: ["Do this first.", "Then do this."],
  verifyMethod: "Re-scan and check the finding is gone.",
};

describe("IssueCard", () => {
  it("renders problem, priority, confidence, why-it-matters, fix steps, and verify method", () => {
    render(<IssueCard {...baseProps} />);

    expect(screen.getByText("Example issue title")).toBeInTheDocument();
    expect(screen.getByText(/needs immediate attention/i)).toBeInTheDocument();
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    expect(screen.getByText(/example reason this matters/i)).toBeInTheDocument();
    expect(screen.getByText("Do this first.")).toBeInTheDocument();
    expect(screen.getByText("Then do this.")).toBeInTheDocument();
    expect(screen.getByText(/re-scan and check the finding is gone/i)).toBeInTheDocument();
  });

  it("keeps technical evidence collapsed by default and toggles it open", () => {
    render(<IssueCard {...baseProps} evidence="Raw technical evidence line." />);

    expect(screen.queryByText("Raw technical evidence line.")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /show technical details/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Raw technical evidence line.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hide technical details/i })).toBeInTheDocument();
  });

  it("does not render an evidence toggle when no evidence is given", () => {
    render(<IssueCard {...baseProps} />);
    expect(screen.queryByRole("button", { name: /technical details/i })).not.toBeInTheDocument();
  });
});
