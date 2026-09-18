import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FixGuide } from "@/components/issue/FixGuide";

describe("FixGuide (Category 02 Step 06, Task 5)", () => {
  it("always shows the generic 7-step process explanation, the same regardless of the issue", () => {
    // The explanation lives in a <details> disclosure - collapsed by default, but still
    // present in the DOM (see components/ui/Disclosure.tsx), so it's queryable either way.
    render(<FixGuide fixSteps={null} />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/understand the issue/i);
    expect(text).toMatch(/open the right page or settings/i);
    expect(text).toMatch(/make the change/i);
    expect(text).toMatch(/save and publish/i);
    expect(text).toMatch(/return to sitewell/i);
    expect(text).toMatch(/run a new scan/i);
    expect(text).toMatch(/check the result/i);
  });

  it("shows the honest empty checklist state when there are no issue-specific steps", () => {
    render(<FixGuide fixSteps={null} />);
    expect(screen.getByText(/fix guide unavailable/i)).toBeInTheDocument();
  });
});
