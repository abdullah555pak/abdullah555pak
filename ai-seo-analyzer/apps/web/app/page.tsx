import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { URLInputForm } from "@/components/forms/URLInputForm";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhatIsSeo } from "@/components/home/WhatIsSeo";
import { TrustNotice } from "@/components/home/TrustNotice";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-14 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">
            For website owners with zero SEO experience
          </p>
          <h1 className="mt-2 text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
            Know what&apos;s holding your website back.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">
            Enter your website address and we&apos;ll check it for problems, explain them in
            plain language, and tell you exactly what to do next.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-2xl">
          <URLInputForm />
          <p className="mt-3 text-center text-xs text-muted">
            Click <strong className="text-ink-soft">Analyze Website</strong> and we&apos;ll scan
            your site, then walk you through the results — no signup required.
          </p>
        </div>

        <div className="mx-auto mt-16 flex w-full max-w-2xl flex-col gap-8">
          <HowItWorks />
          <WhatIsSeo />
          <TrustNotice />
        </div>
      </main>

      <Footer />
    </div>
  );
}
