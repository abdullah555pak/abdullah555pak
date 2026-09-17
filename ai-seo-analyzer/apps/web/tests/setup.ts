import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Default next/navigation mock so any component using useRouter/
// useSearchParams renders without a real Next.js app-router context.
// Test files that need to assert on navigation (e.g. tests/url-input-
// form.test.tsx, tests/scan-page.test.tsx) override this locally with
// their own vi.mock, which takes precedence for that file.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));
