"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RescanAction } from "./RescanAction";
import { VerificationState } from "./VerificationState";

interface ReadyToVerifyProps {
  url: string;
}

/**
 * Task 8 + 9: the "I Fixed This" action. Clicking it never claims the
 * issue is actually fixed - it only marks the user as ready to verify,
 * and points them at the real re-scan flow. Verification itself always
 * shows "not_verified" here, since no real re-scan check exists yet.
 */
export function ReadyToVerify({ url }: ReadyToVerifyProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink">Made this change?</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Once you&apos;ve made the fix on your website, let us know so you can check it.
        </p>
        <div className="mt-3">
          <Button onClick={() => setConfirmed(true)}>I Fixed This</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Ready to verify</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This marks the issue as ready to check - it doesn&apos;t confirm the fix actually worked yet.
        </p>
      </div>
      <RescanAction url={url} />
      <VerificationState status="not_verified" />
    </Card>
  );
}
