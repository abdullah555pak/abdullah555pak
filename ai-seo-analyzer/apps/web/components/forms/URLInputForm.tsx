"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { analyzeWebsite, type AnalyzeResult } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/LoadingState";

// A light client-side format check only, for fast feedback on obviously
// broken input (empty, no dot, stray characters). It is NOT a security
// boundary - the backend's validate_public_url is the real authority and
// re-checks everything, including cases this regex would let through
// (e.g. "127.0.0.1" has dots and passes here, then is correctly rejected
// server-side as a private address).
const LOOKS_LIKE_A_DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

function looksLikeWebsiteAddress(value: string): boolean {
  const host = value.replace(/^https?:\/\//i, "").split(/[/?#\s]/)[0];
  return LOOKS_LIKE_A_DOMAIN.test(host);
}

export interface URLInputFormProps {
  initialValue?: string;
}

/**
 * The one input+button pair that drives the whole "Analyze Website"
 * flow. Calls the real API - if the URL is safe but analysis isn't
 * built yet, it shows that honestly instead of any invented result.
 */
export function URLInputForm({ initialValue = "" }: URLInputFormProps) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const inputId = useId();
  const helpId = useId();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setResult({
        kind: "invalid",
        message: "Please enter a website address, such as example.com or https://example.com.",
      });
      return;
    }
    if (!looksLikeWebsiteAddress(trimmed)) {
      setResult({
        kind: "invalid",
        message: "Please enter a complete website address, such as https://example.com",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    const outcome = await analyzeWebsite(trimmed);
    setResult(outcome);
    setLoading(false);
  }

  function handleClear() {
    setValue("");
    setResult(null);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row"
      >
        <div className="relative min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            Website address
          </label>
          <input
            id={inputId}
            name="website-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="yourwebsite.com"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-describedby={helpId}
            aria-invalid={result?.kind === "invalid" ? true : undefined}
            className="min-h-[44px] w-full rounded-lg border border-border bg-surface px-4 py-3 pr-10 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear website address"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? (
            <>
              <Spinner />
              Starting analysis...
            </>
          ) : (
            "Analyze Website"
          )}
        </Button>
      </form>

      <p id={helpId} className="mt-2 px-1 text-xs text-muted">
        Enter your website address, e.g. <code className="font-mono">example.com</code>. You don't
        need to type &quot;https://&quot; — we&apos;ll use a secure connection automatically.
      </p>

      {result &&
        (result.kind === "not_implemented" ? (
          <div
            role="status"
            className="mt-3 rounded-xl border border-warn/25 bg-warn-soft px-4 py-3 text-sm text-warn"
          >
            <p className="font-semibold">This part of Sitewell hasn&apos;t been built yet</p>
            <p className="mt-1">{result.message}</p>
          </div>
        ) : (
          <div className="mt-3">
            <ErrorState message={result.message} />
          </div>
        ))}
    </div>
  );
}
