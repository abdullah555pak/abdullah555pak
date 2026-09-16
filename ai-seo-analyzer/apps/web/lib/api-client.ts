/**
 * Minimal typed wrapper around the Sitewell API. Kept intentionally small:
 * one function for the one endpoint that exists so far.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiErrorBody = {
  error: { code: string; message: string };
};

export type AnalyzeResult =
  | { kind: "invalid"; message: string }
  | { kind: "not_implemented"; message: string }
  | { kind: "unexpected_error"; message: string }
  | { kind: "network_error"; message: string };

export async function analyzeWebsite(url: string): Promise<AnalyzeResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    return {
      kind: "network_error",
      message: "We couldn't reach the Sitewell server. Is the API running?",
    };
  }

  let body: ApiErrorBody | null = null;
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // fall through to generic handling below
  }

  const message = body?.error?.message ?? "Something went wrong. Please try again.";

  if (response.status === 400 || response.status === 422) {
    return { kind: "invalid", message };
  }
  if (response.status === 501) {
    return { kind: "not_implemented", message };
  }
  return { kind: "unexpected_error", message };
}
