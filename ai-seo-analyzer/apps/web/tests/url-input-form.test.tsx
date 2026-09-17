import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { URLInputForm } from "@/components/forms/URLInputForm";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function getInput() {
  return screen.getByPlaceholderText(/e\.g\. example\.com/i);
}
function getSubmitButton() {
  return screen.getByRole("button", { name: /analyze website/i });
}

describe("URLInputForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("has a labeled field, helper text, and no clear button when empty", () => {
    render(<URLInputForm />);
    expect(screen.getByLabelText(/website address/i)).toBeInTheDocument();
    expect(screen.getByText(/you don't need to type "https:\/\/"/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear website address/i })).not.toBeInTheDocument();
  });

  it("rejects an empty submission with a beginner-friendly message and never navigates", () => {
    render(<URLInputForm />);
    fireEvent.click(getSubmitButton());

    expect(
      screen.getByText(/please enter a website address, such as example\.com or https:\/\/example\.com/i)
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rejects malformed input with the exact beginner-friendly pattern, not a technical message", () => {
    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "not a url" } });
    fireEvent.click(getSubmitButton());

    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Please enter a complete website address, such as https://example.com");
    expect(error.textContent).not.toMatch(/invalid url format/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows and uses a clear button once text is entered", () => {
    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com" } });

    const clearButton = screen.getByRole("button", { name: /clear website address/i });
    fireEvent.click(clearButton);

    expect(getInput()).toHaveValue("");
    expect(screen.queryByRole("button", { name: /clear website address/i })).not.toBeInTheDocument();
  });

  it("navigates to the scan screen with the encoded URL on a valid submission, and shows a loading state", () => {
    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com/some page" } });
    fireEvent.click(getSubmitButton());

    expect(pushMock).toHaveBeenCalledWith("/scan?url=" + encodeURIComponent("example.com/some page"));
    expect(screen.getByRole("button", { name: /starting analysis/i })).toBeDisabled();
  });

  it("clears a previous validation error once a valid URL is submitted", () => {
    render(<URLInputForm />);
    fireEvent.click(getSubmitButton());
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(getInput(), { target: { value: "example.com" } });
    fireEvent.click(getSubmitButton());

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
