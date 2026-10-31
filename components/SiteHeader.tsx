"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/etf", label: "ETF 学习" },
  { href: "/stocks", label: "个股研究" },
  { href: "/market", label: "大盘研究" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Link href="/" className="brand">
          <span className="mark" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>TradingWeb</strong>
            <small>学习台</small>
          </span>
        </Link>
        <nav className="nav" aria-label="学习分区">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
