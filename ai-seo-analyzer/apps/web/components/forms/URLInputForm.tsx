"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { looksLikeWebsiteAddress } from "@/lib/url-format";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/LoadingState";

export interface URLInputFormProps {
  initialValue?: string;
}

/**
 * The one input+button pair that drives the whole "Analyze Website"
 * flow. Only does a light format check here - once the address looks
 * plausible, it navigates to /scan, which owns the real API call and
 * the scan state machine (see hooks/useScan.ts).
 */
export function URLInputForm({ initialValue = "" }: URLInputFormProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const helpId = useId();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a website address, such as example.com or https://example.com.");
      return;
    }
    if (!looksLikeWebsiteAddress(trimmed)) {
      setError("Please enter a complete website address, such as https://example.com");
      return;
    }

    setError(null);
    setNavigating(true);
    router.push(`/scan?url=${encodeURIComponent(trimmed)}`);
  }

  function handleClear() {
    setValue("");
    setError(null);
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-ink-soft">
          Website address
        </label>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <input
              id={inputId}
              name="website-url"
              type="text"
              inputMode="url"
              autoComplete="off"
              placeholder="e.g. example.com"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-describedby={helpId}
              aria-invalid={error ? true : undefined}
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
          <Button type="submit" disabled={navigating} aria-busy={navigating}>
            {navigating ? (
              <>
                <Spinner />
                Starting analysis...
              </>
            ) : (
              "Analyze Website"
            )}
          </Button>
        </form>
      </div>

      <p id={helpId} className="mt-2 px-1 text-xs text-muted">
        You don&apos;t need to type &quot;https://&quot; — we&apos;ll use a secure connection
        automatically. We&apos;ll check things like your page titles, site speed, and
        mobile-friendliness.
      </p>

      {error && (
        <div className="mt-3">
          <ErrorState message={error} />
        </div>
      )}
    </div>
  );
}
