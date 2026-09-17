import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScanPage from "@/app/scan/page";

const { pushMock, searchParamsRef } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchParamsRef: { current: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParamsRef.current,
}));

function setUrlParam(url: string | null) {
  searchParamsRef.current = new URLSearchParams(url ? { url } : {});
}

describe("Scan page", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.restoreAllMocks();
    setUrlParam("example.com");
  });

  it("shows the website being analyzed, a status, and the stage list while the request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    vi.spyOn(global, "fetch").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<ScanPage />);

    expect(await screen.findByRole("heading", { name: /analyzing your website/i })).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText(/checking website accessibility/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel scan/i })).toBeInTheDocument();

    resolveFetch(
      new Response(JSON.stringify({ error: { code: "not_implemented", message: "not built yet" } }), {
        status: 501,
      })
    );
    await waitFor(() => expect(screen.queryByRole("heading", { name: /analyzing/i })).not.toBeInTheDocument());
  });

  it("honestly shows 'not available yet' rather than a fake completed scan when the backend responds 501", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: "not_implemented", message: "Website analysis isn't built yet." },
        }),
        { status: 501 }
      )
    );

    render(<ScanPage />);

    expect(await screen.findByRole("heading", { name: /isn't available yet/i })).toBeInTheDocument();
    expect(screen.getByText(/website analysis isn't built yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/analysis complete/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view report/i })).not.toBeInTheDocument();
  });

  it("shows a failed state with Try Again on a network error, and retrying calls the API again", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    render(<ScanPage />);

    expect(await screen.findByRole("heading", { name: /analysis failed/i })).toBeInTheDocument();
    expect(screen.getByText(/couldn't reach the sitewell server/i)).toBeInTheDocument();

    fetchSpy.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it("shows a failed state with a friendly message when no URL was given, and offers a way home", async () => {
    setUrlParam(null);
    render(<ScanPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/no website address was given/i);
    expect(screen.getByRole("link", { name: /back to home/i })).toBeInTheDocument();
  });

  it("cancelling a real in-flight request aborts it and returns home without a broken loading state", async () => {
    let capturedSignal: AbortSignal | undefined;
    vi.spyOn(global, "fetch").mockImplementation((_url, init) => {
      capturedSignal = (init as RequestInit)?.signal ?? undefined;
      return new Promise(() => {}); // never resolves - simulates a slow real scan
    });

    render(<ScanPage />);

    fireEvent.click(await screen.findByRole("button", { name: /cancel scan/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/cancel this scan/i);

    fireEvent.click(screen.getByRole("button", { name: /^cancel scan$/i }));

    expect(capturedSignal?.aborted).toBe(true);
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /analyzing/i })).not.toBeInTheDocument();
  });

  it("dismissing the cancel dialog resumes the scan without losing progress state", async () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    render(<ScanPage />);
    fireEvent.click(await screen.findByRole("button", { name: /cancel scan/i }));
    fireEvent.click(screen.getByRole("button", { name: /keep waiting/i }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /analyzing your website/i })).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
