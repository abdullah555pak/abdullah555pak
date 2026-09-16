import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "@/app/page";

describe("Homepage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the product name, one-line description, URL input, and Analyze button", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /sitewell/i })).toBeInTheDocument();
    expect(screen.getByText(/know what's holding your website back/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/yourwebsite\.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analyze website/i })).toBeInTheDocument();
  });

  it("shows a validation message instead of calling the API when the field is empty", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /analyze website/i }));

    expect(await screen.findByText(/please enter a website address/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("clearly states analysis isn't built yet, and never renders a fake score or results", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "not_implemented",
            message: "Website analysis isn't built yet.",
          },
        }),
        { status: 501 }
      )
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText(/yourwebsite\.com/i), {
      target: { value: "example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze website/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/analysis isn't built yet/i);
    // No fake SEO score, e.g. "62/100", should ever be rendered.
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
  });
});
