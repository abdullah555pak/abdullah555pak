import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ActionPlanPage from "@/app/action-plan/page";

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

describe("Action Plan page (Category 02 Step 07)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    setParams({ url: "example.com" });
  });

  it("shows 'No scan yet' when there is no url at all, never a fabricated plan", () => {
    setParams({});
    render(<ActionPlanPage />);
    expect(screen.getByText(/no scan yet/i)).toBeInTheDocument();
  });

  it("renders the header, intro, progress, and the honest empty action list by default", () => {
    render(<ActionPlanPage />);

    expect(screen.getByRole("heading", { name: "SEO Action Plan" })).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText(/what is an seo action plan/i)).toBeInTheDocument();
    expect(screen.getByText(/progress will appear after your website has been analyzed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your action plan will appear here after your website has been analyzed/i)
    ).toBeInTheDocument();

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toMatch(/\d{1,3}%/);
  });

  it("has working search and filter controls even though the list they filter is empty", () => {
    render(<ActionPlanPage />);
    expect(screen.getByLabelText(/search actions/i)).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /filter actions by status/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
  });

  it("shows the honest 'Action not found' state for any real action id, since no real action store exists yet", () => {
    setParams({ url: "example.com", id: "action-1" });
    render(<ActionPlanPage />);
    expect(screen.getByText(/action not found/i)).toBeInTheDocument();
  });

  it("never fabricates action content while showing the not-found state", () => {
    setParams({ url: "example.com", id: "action-1" });
    render(<ActionPlanPage />);
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/step-by-step fix guide/i);
    expect(text).not.toMatch(/why does it matter/i);
  });

  it("links back to the report from the header", () => {
    render(<ActionPlanPage />);
    expect(screen.getByRole("link", { name: /back to report/i })).toHaveAttribute(
      "href",
      "/report?url=example.com"
    );
  });
});
