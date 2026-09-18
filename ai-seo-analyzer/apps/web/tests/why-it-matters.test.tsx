import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhyItMatters } from "@/components/issue/WhyItMatters";
import type { ReportIssue } from "@/lib/report-types";

const BASE_ISSUE: ReportIssue = {
  id: "issue-1",
  title: "Example issue",
  shortExplanation: "Example explanation.",
  whyItMatters: "This matters because of X.",
  whyItMattersDetail: null,
  severity: "medium",
  category: "content",
  affectedPages: 1,
  source: null,
  evidence: null,
  confidence: "detected",
  fixAvailable: true,
  fixSteps: null,
  difficulty: null,
  expectedImpact: null,
  detectedAt: null,
  verification: { status: "not_verified", lastCheckedAt: null },
  relatedIssueIds: [],
};

describe("WhyItMatters (Category 02 Step 06, Task 3)", () => {
  it("always shows the plain-language explanation", () => {
    render(<WhyItMatters issue={BASE_ISSUE} />);
    expect(screen.getByText("This matters because of X.")).toBeInTheDocument();
  });

  it("shows no facet breakdown when none is available", () => {
    render(<WhyItMatters issue={BASE_ISSUE} />);
    expect(screen.queryByText(/seo impact/i)).not.toBeInTheDocument();
  });

  it("shows only the facets that have real content", () => {
    render(
      <WhyItMatters
        issue={{
          ...BASE_ISSUE,
          whyItMattersDetail: {
            seoImpact: "Lower rankings.",
            userExperienceImpact: null,
            searchEngineImpact: null,
            businessImpact: "Fewer conversions.",
          },
        }}
      />
    );
    expect(screen.getByText(/seo impact/i)).toBeInTheDocument();
    expect(screen.getByText("Lower rankings.")).toBeInTheDocument();
    expect(screen.getByText(/business impact/i)).toBeInTheDocument();
    expect(screen.queryByText(/user experience impact/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/search engine impact/i)).not.toBeInTheDocument();
  });
});
