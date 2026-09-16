"use client";

import { useState } from "react";
import { analyzeWebsite, type AnalyzeResult } from "@/lib/api-client";

export default function Home() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "checking">("idle");
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!url.trim()) {
      setResult({ kind: "invalid", message: "Please enter a website address." });
      return;
    }

    setStatus("checking");
    setResult(null);
    const outcome = await analyzeWebsite(url.trim());
    setResult(outcome);
    setStatus("idle");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16">
      <div className="w-full text-center">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Sitewell</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-600">
          Know what&apos;s holding your website back — in plain language.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex w-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row"
      >
        <label className="sr-only" htmlFor="website-url">
          Website address
        </label>
        <input
          id="website-url"
          name="website-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          placeholder="yourwebsite.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={status === "checking"}
          className="rounded-lg bg-accent px-5 py-3 text-base font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "checking" ? "Checking…" : "Analyze Website"}
        </button>
      </form>

      {result && (
        <div
          role="status"
          className={`mt-5 w-full rounded-xl border px-4 py-3 text-sm ${
            result.kind === "not_implemented"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.kind === "not_implemented" ? (
            <>
              <p className="font-semibold">Analysis isn&apos;t built yet</p>
              <p className="mt-1">{result.message}</p>
            </>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        This is an early foundation build. No real analysis, scores, or data are produced yet.
      </p>
    </main>
  );
}
