import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextActionPanel } from "@/components/issue/NextActionPanel";

describe("NextActionPanel (Category 02 Step 06, Task 11)", () => {
  it("offers a working way back to the problems list and to re-scan", () => {
    render(<NextActionPanel reportHref="/report?url=example.com&section=problems" scanHref="/scan?url=example.com" />);

    expect(screen.getByText(/what should i do next/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to all problems/i })).toHaveAttribute(
      "href",
      "/report?url=example.com&section=problems"
    );
    expect(screen.getByRole("link", { name: /re-scan this website/i })).toHaveAttribute(
      "href",
      "/scan?url=example.com"
    );
  });
});
