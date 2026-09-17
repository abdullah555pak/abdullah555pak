import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  secondary: "bg-surface text-ink border border-border hover:border-accent hover:text-accent-strong",
};

export const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-[44px] px-5 py-3 text-base",
  sm: "min-h-[36px] px-3.5 py-2 text-sm",
};

function buttonClassName(variant: ButtonVariant, size: ButtonSize, className: string) {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`;
}

/** Shared button primitive. Every clickable action in the app renders through this. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className = "", ...props },
  ref
) {
  return <button ref={ref} className={buttonClassName(variant, size, className)} {...props} />;
});

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Same visual style as Button, for actions that navigate rather than act in place. */
export function ButtonLink({ href, variant = "primary", size = "md", className = "", ...props }: ButtonLinkProps) {
  return <Link href={href} className={buttonClassName(variant, size, className)} {...props} />;
}
