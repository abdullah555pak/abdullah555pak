import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { URLInputForm } from "@/components/forms/URLInputForm";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-14 sm:py-20">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
            Know what&apos;s holding your website back.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">
            Enter your website address and we&apos;ll check it for problems, explain them in
            plain language, and tell you exactly what to do next.
          </p>
        </div>

        <div className="mt-8 w-full max-w-2xl">
          <URLInputForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
