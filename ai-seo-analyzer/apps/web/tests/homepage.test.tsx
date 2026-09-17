import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Homepage", () => {
  it("shows exactly one primary action above the fold: product name, description, URL input, Analyze button", () => {
    render(<Home />);

    // Brand appears in the header (a link, not a competing heading).
    expect(screen.getByRole("link", { name: /sitewell/i })).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /know what's holding your website back/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we'll check it for problems, explain them in plain language/i)
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/e\.g\. example\.com/i)).toBeInTheDocument();

    // Exactly one primary ("Analyze Website") action button on the page.
    const analyzeButtons = screen.getAllByRole("button", { name: /analyze website/i });
    expect(analyzeButtons).toHaveLength(1);
  });

  it("shows the honesty footer note and no fake statistics anywhere on the page", () => {
    render(<Home />);
    expect(screen.getByText(/no real website analysis, scores, or data are produced yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
  });
});
