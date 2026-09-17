import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { URLInputForm } from "@/components/forms/URLInputForm";

function getInput() {
  return screen.getByPlaceholderText(/yourwebsite\.com/i);
}
function getSubmitButton() {
  return screen.getByRole("button", { name: /analyze website/i });
}

describe("URLInputForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("has a labeled field, helper text, and no clear button when empty", () => {
    render(<URLInputForm />);
    expect(screen.getByLabelText(/website address/i)).toBeInTheDocument();
    expect(screen.getByText(/you don't need to type "https:\/\/"/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear website address/i })).not.toBeInTheDocument();
  });

  it("rejects an empty submission with a beginner-friendly message and never calls the API", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    render(<URLInputForm />);

    fireEvent.click(getSubmitButton());

    expect(
      await screen.findByText(/please enter a website address, such as example\.com or https:\/\/example\.com/i)
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects malformed input with the exact beginner-friendly pattern, not a technical message", async () => {
    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "not a url" } });
    fireEvent.click(getSubmitButton());

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent("Please enter a complete website address, such as https://example.com");
    expect(error.textContent).not.toMatch(/invalid url format/i);
  });

  it("shows and uses a clear button once text is entered", () => {
    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com" } });

    const clearButton = screen.getByRole("button", { name: /clear website address/i });
    fireEvent.click(clearButton);

    expect(getInput()).toHaveValue("");
    expect(screen.queryByRole("button", { name: /clear website address/i })).not.toBeInTheDocument();
  });

  it("shows the 'Starting analysis...' loading label and disables the button while the request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com" } });
    fireEvent.click(getSubmitButton());

    const loadingButton = await screen.findByRole("button", { name: /starting analysis/i });
    expect(loadingButton).toBeDisabled();

    resolveFetch(
      new Response(JSON.stringify({ error: { code: "not_implemented", message: "not built yet" } }), {
        status: 501,
      })
    );

    // Let the resolved fetch settle so React state updates happen inside act().
    await screen.findByRole("button", { name: /^analyze website$/i });
  });

  it("shows a clear development state for a safe URL, never a fake result", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "not_implemented", message: "Website analysis isn't built yet." },
        }),
        { status: 501 }
      )
    );

    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com" } });
    fireEvent.click(getSubmitButton());

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent(/hasn't been built yet/i);
    expect(screen.queryByText(/\d+\s*\/\s*100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument();
  });

  it("shows the backend's specific rejection message for an unsafe URL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "invalid_url",
            message: "That address points to a private or internal network and can't be analyzed.",
          },
        }),
        { status: 400 }
      )
    );

    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "127.0.0.1" } });
    fireEvent.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/private or internal network/i);
  });

  it("shows a plain network error, never a silent failure, when the API is unreachable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    render(<URLInputForm />);
    fireEvent.change(getInput(), { target: { value: "example.com" } });
    fireEvent.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't reach the sitewell server/i);
  });
});
