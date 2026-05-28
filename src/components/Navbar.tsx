"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Results", href: "/#results" },
  { label: "Blogs", href: "/blog" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile menu when the visitor taps a destination. (We do this in
  // the link handlers rather than reacting to a pathname change in an effect.)
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-surface",
        isScrolled
          ? "border-b border-border shadow-[0_1px_3px_rgba(26,26,26,0.04)]"
          : "border-b border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group inline-flex"
            aria-label="4Pie Labs home"
          >
            <Image
              src="/logo.png"
              alt="4Pie Labs"
              width={128}
              height={32}
              priority
              className="h-7 md:h-8 w-auto group-hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium px-4 py-2 transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/book"
            className="group hidden md:inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:shadow-[0_2px_4px_rgba(124,92,255,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Schedule Call
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button
            type="button"
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-foreground hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-1 mx-4 p-6 bg-surface border border-border rounded-2xl flex flex-col gap-2 shadow-[0_4px_8px_rgba(26,26,26,0.08),0_12px_24px_rgba(26,26,26,0.06)] animate-fade-in">
          {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            onClick={closeMobileMenu}
            className="mt-2 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg text-base font-medium transition-colors"
          >
            Schedule Call
          </Link>
        </div>
      )}
    </nav>
  );
}
