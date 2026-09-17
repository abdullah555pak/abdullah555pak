import { describe, expect, it } from "vitest";
import { REPORT_CATEGORIES, type ReportCategoryId } from "@/lib/report-types";

describe("Report data model (Category 02 Step 05, Task 12)", () => {
  it("defines exactly the 11 required categories, each with a unique id and beginner-friendly description", () => {
    expect(REPORT_CATEGORIES).toHaveLength(11);

    const ids = REPORT_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(11); // all unique

    const expectedIds: ReportCategoryId[] = [
      "technical-seo",
      "performance",
      "content",
      "structured-data",
      "mobile-seo",
      "accessibility",
      "ads",
      "traffic",
      "keywords",
      "backlinks",
      "competitors",
    ];
    expect(ids.sort()).toEqual([...expectedIds].sort());

    for (const category of REPORT_CATEGORIES) {
      expect(category.title.length).toBeGreaterThan(0);
      expect(category.description.length).toBeGreaterThan(0);
      // Beginner-friendly: no raw jargon dumped without context.
      expect(category.description).not.toMatch(/\bAPI\b|\bCSS selector\b/);
    }
  });
});
