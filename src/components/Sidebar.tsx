"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/leads", label: "Lead Generation" },
  { href: "/sales", label: "Sales Pipeline" },
  { href: "/clients", label: "Clients & Onboarding" },
  { href: "/campaigns", label: "Ad Campaigns" },
  { href: "/seo", label: "SEO" },
  { href: "/social", label: "Social Media" },
  { href: "/email", label: "Email Marketing" },
  { href: "/automation", label: "Automation" },
  { href: "/reports", label: "Reports" },
  { href: "/customer-success", label: "Customer Success" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-[var(--border-hairline)] bg-surface shrink-0">
      <div className="px-5 py-5 border-b border-[var(--border-hairline)]">
        <div className="text-sm font-semibold tracking-tight">BrandSkull</div>
        <div className="text-xs text-secondary">Agency Operating System</div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-2.5 text-sm border-l-2 transition-colors ${
                active
                  ? "border-series-1 text-primary font-medium bg-[var(--gridline)]/40"
                  : "border-transparent text-secondary hover:text-primary hover:bg-[var(--gridline)]/20"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[var(--border-hairline)] text-xs text-muted">
        Operating as CEO · COO · Sales · Marketing · CS
      </div>
    </aside>
  );
}
