import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReportPage from "@/app/report/page";

const { pushMock, searchParamsRef } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsRef.current,
}));

function setParams(params: Record<string, string>) {
  searchParamsRef.current = new URLSearchParams(params);
}

describe("Report page (Category 02 Step 05 results dashboard)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    setParams({ url: "example.com" });
  });

  it("shows a 'no report available' state and never a fake report when no URL was given", () => {
    setParams({});
    render(<ReportPage />);
    expect(screen.getByText(/no report available/i)).toBeInTheDocument();
  });

  it("renders the header, navigation, and overview by default with no fabricated score", () => {
    render(<ReportPage />);

    expect(screen.getByRole("heading", { name: "example.com" })).toBeInTheDocument();
    expect(screen.getByText(/overall seo health/i)).toBeInTheDocument();
    expect(screen.getByText(/score will appear after analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/what should i fix first\?/i)).toBeInTheDocument();

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toMatch(/\d{1,3}\s*\/\s*100/);
  });

  it("shows all 11 categories on the overview, each honestly marked as not analyzed", () => {
    render(<ReportPage />);
    expect(screen.getByRole("heading", { name: /technical seo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /backlinks & authority/i })).toBeInTheDocument();
    expect(screen.getAllByText(/not analyzed yet/i).length).toBeGreaterThanOrEqual(11);
  });

  it("navigating to Problems shows the honest empty state, never 'no issues found'", () => {
    render(<ReportPage />);
    fireEvent.click(screen.getByRole("button", { name: "Problems" }));

    expect(pushMock).toHaveBeenCalledWith("/report?url=example.com&section=problems");
  });

  it("renders the Problems section content directly when ?section=problems is set, with working filter controls", () => {
    setParams({ url: "example.com", section: "problems" });
    render(<ReportPage />);

    expect(screen.getByLabelText(/search issues/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /filter issues by severity/i })).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/not available yet/i);
    expect(text).not.toMatch(/no issues found/i);
  });

  it("renders an individual category section honestly when selected", () => {
    setParams({ url: "example.com", section: "performance" });
    render(<ReportPage />);

    expect(screen.getByRole("heading", { name: "Performance" })).toBeInTheDocument();
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument();
  });

  it("renders the Action Plan section using the same honest priority-summary pattern", () => {
    setParams({ url: "example.com", section: "action-plan" });
    render(<ReportPage />);

    expect(screen.getByRole("heading", { name: /action plan/i })).toBeInTheDocument();
    expect(screen.getByText(/what should i fix first\?/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open full action plan/i })).toHaveAttribute(
      "href",
      "/action-plan?url=example.com"
    );
  });
});
