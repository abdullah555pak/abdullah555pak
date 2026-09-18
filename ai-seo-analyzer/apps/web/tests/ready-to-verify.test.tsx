import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReadyToVerify } from "@/components/issue/ReadyToVerify";
import { VerificationState } from "@/components/issue/VerificationState";

describe("ReadyToVerify (Category 02 Step 06, Task 8/9)", () => {
  it("starts by offering 'I Fixed This' without claiming anything is fixed", () => {
    render(<ReadyToVerify url="example.com" />);
    expect(screen.getByRole("button", { name: /i fixed this/i })).toBeInTheDocument();
    expect(screen.queryByText(/^fixed$/i)).not.toBeInTheDocument();
  });

  it("shows 'Ready to verify', a re-scan action, and the honest not-verified state after clicking", () => {
    render(<ReadyToVerify url="example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /i fixed this/i }));

    expect(screen.getByText(/ready to verify/i)).toBeInTheDocument();
    expect(screen.getByText(/doesn't confirm the fix actually worked yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /re-scan/i })).toHaveAttribute(
      "href",
      "/scan?url=example.com"
    );
    expect(screen.getByText(/not verified yet/i)).toBeInTheDocument();
  });
});

describe("VerificationState (Category 02 Step 06, Task 9)", () => {
  it("never shows anything but 'not verified yet' as the default, honest state", () => {
    render(<VerificationState status="not_verified" />);
    expect(screen.getByText(/not verified yet/i)).toBeInTheDocument();
    expect(screen.getByText(/re-scan after making your fix/i)).toBeInTheDocument();
  });

  it("labels every other verification outcome with text, not color alone", () => {
    render(<VerificationState status="still_needs_attention" lastCheckedAt="2026-02-01" />);
    expect(screen.getByText(/still needs attention/i)).toBeInTheDocument();
    expect(screen.getByText(/last checked 2026-02-01/i)).toBeInTheDocument();
  });
});
