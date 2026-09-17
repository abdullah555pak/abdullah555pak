import { ButtonLink } from "@/components/ui/Button";

interface ReScanButtonProps {
  url: string;
  size?: "md" | "sm";
}

/** Re-runs a scan for this site by sending the user through the real scan flow again. */
export function ReScanButton({ url, size = "md" }: ReScanButtonProps) {
  return (
    <ButtonLink href={`/scan?url=${encodeURIComponent(url)}`} variant="secondary" size={size}>
      Re-scan
    </ButtonLink>
  );
}
