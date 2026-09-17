import { Disclosure } from "@/components/ui/Disclosure";

/**
 * A short, plain-language answer for someone who has never heard the
 * term - collapsed by default so it doesn't compete with the primary
 * action, but always one click away.
 */
export function WhatIsSeo() {
  return (
    <Disclosure summary="New to this? What is SEO?">
      <p>
        SEO stands for <strong>Search Engine Optimization</strong> — the practice of making small
        improvements to your website so that search engines like Google can understand it better
        and show it to more of the people searching for things related to your business.
      </p>
      <p className="mt-2">
        You don&apos;t need to be technical to improve it. That&apos;s what this tool is for —
        finding the problems and explaining, in plain language, exactly what to do about them.
      </p>
    </Disclosure>
  );
}
