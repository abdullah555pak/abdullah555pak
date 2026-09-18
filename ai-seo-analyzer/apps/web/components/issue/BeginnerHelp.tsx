import type { ReactNode } from "react";
import { Disclosure } from "@/components/ui/Disclosure";

interface BeginnerHelpProps {
  summary: string;
  children: ReactNode;
}

/** Thin, consistently-styled wrapper around Disclosure for contextual beginner help. */
export function BeginnerHelp({ summary, children }: BeginnerHelpProps) {
  return <Disclosure summary={summary}>{children}</Disclosure>;
}
