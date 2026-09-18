import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IssueDetailPage from "@/app/report/issue/page";

const { searchParamsRef } = vi.hoisted(() => ({
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => searchParamsRef.current,
}));

function setParams(params: Record<string, string>) {
  searchParamsRef.current = new URLSearchParams(params);
}

describe("Issue Detail page (Category 02 Step 06)", () => {
  beforeEach(() => {
    setParams({ url: "example.com", id: "issue-1" });
  });

  it("shows 'Scan required' when there is no url at all", () => {
    setParams({});
    render(<IssueDetailPage />);
    expect(screen.getByText(/scan required/i)).toBeInTheDocument();
  });

  it("shows 'Report unavailable' when a url is given but no issue id", () => {
    setParams({ url: "example.com" });
    render(<IssueDetailPage />);
    expect(screen.getByText(/report unavailable/i)).toBeInTheDocument();
  });

  it("shows the honest 'Issue not found' state for any real issue id, since no real issue store exists yet", () => {
    render(<IssueDetailPage />);
    expect(screen.getByText(/issue not found/i)).toBeInTheDocument();
  });

  it("never fabricates issue content while showing the not-found state", () => {
    render(<IssueDetailPage />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/step-by-step fix guide/i);
    expect(text).not.toMatch(/why does it matter/i);
  });

  it("includes a breadcrumb back to the report's problems list", () => {
    render(<IssueDetailPage />);
    expect(screen.getByRole("link", { name: "Problems" })).toHaveAttribute(
      "href",
      "/report?url=example.com&section=problems"
    );
  });
});
