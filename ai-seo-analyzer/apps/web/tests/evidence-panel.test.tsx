import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidencePanel } from "@/components/issue/EvidencePanel";
import type { IssueEvidence } from "@/lib/report-types";

const EVIDENCE: IssueEvidence[] = [
  {
    confidence: "detected",
    url: "https://example.com/page",
    htmlElement: "<title>",
    detectedValue: "Home",
    expectedValue: "A unique, descriptive title",
    technicalDetails: "title length: 4 characters",
    screenshotUrl: null,
  },
];

describe("EvidencePanel (Category 02 Step 06, Task 4)", () => {
  it("shows the honest 'Evidence unavailable' state when there is nothing recorded", () => {
    render(<EvidencePanel evidence={null} />);
    expect(screen.getByText(/evidence unavailable/i)).toBeInTheDocument();
  });

  it("shows the same unavailable state for an empty list", () => {
    render(<EvidencePanel evidence={[]} />);
    expect(screen.getByText(/evidence unavailable/i)).toBeInTheDocument();
  });

  it("shows every structured field and its own confidence for real evidence", () => {
    render(<EvidencePanel evidence={EVIDENCE} />);

    expect(screen.getByText(/https:\/\/example\.com\/page/)).toBeInTheDocument();
    expect(screen.getByText(/<title>/)).toBeInTheDocument();
    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/a unique, descriptive title/i)).toBeInTheDocument();
    expect(screen.getByText(/title length: 4 characters/i)).toBeInTheDocument();
    expect(screen.getByText("Detected")).toBeInTheDocument();
    expect(screen.getByText(/screenshot not available yet/i)).toBeInTheDocument();
  });
});
