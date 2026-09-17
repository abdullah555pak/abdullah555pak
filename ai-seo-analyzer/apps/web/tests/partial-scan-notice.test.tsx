import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PartialScanNotice } from "@/components/scan/PartialScanNotice";

describe("PartialScanNotice", () => {
  it("never discards a partial scan - shows the completed-with-limitations message and each limitation", () => {
    render(
      <PartialScanNotice
        url="example.com"
        limitations={["3 pages couldn't be reached.", "Performance data timed out."]}
        reportHref="/report?url=example.com"
      />
    );

    expect(
      screen.getByRole("heading", { name: /analysis completed with limitations/i })
    ).toBeInTheDocument();
    expect(screen.getByText("3 pages couldn't be reached.")).toBeInTheDocument();
    expect(screen.getByText("Performance data timed out.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view report/i })).toHaveAttribute(
      "href",
      "/report?url=example.com"
    );
  });

  it("moves focus to the heading on mount", () => {
    render(<PartialScanNotice url="example.com" limitations={["Example limitation."]} reportHref="/report" />);
    expect(screen.getByRole("heading")).toHaveFocus();
  });
});
