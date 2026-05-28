"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Box,
  ChevronDown,
  Cpu,
  Layers,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/use-theme";

/**
 * Phase 3 floating-pill nav (v2 design from Claude Design bundle).
 * Replaces the Phase 2 white-bar nav with a translucent backdrop-blurred pill
 * holding the brand, Services + Programs dropdowns, a theme toggle, and the
 * primary "Schedule call" CTA. Mobile collapses to a drawer.
 */

type DropdownItem = {
  title: string;
  sub: string;
  href: string;
  Icon: LucideIcon;
  tag?: string;
  tagColor?: "primary";
};

const SERVICE_ITEMS: DropdownItem[] = [
  {
    title: "AI-First SEO + AEO",
    sub: "Get cited by ChatGPT, Perplexity, Gemini.",
    href: "/services#aeo",
    Icon: MessageCircle,
  },
  {
    title: "Performance Ads",
    sub: "Paid that pays. Google, Meta, YouTube.",
    href: "/services#ads",
    Icon: Search,
  },
  {
    title: "Custom AI Systems",
    sub: "Agents, dashboards, CRM automation.",
    href: "/services#ai",
    Icon: Cpu,
  },
];

const PROGRAM_ITEMS: DropdownItem[] = [
  {
    title: "Core",
    sub: "Where most clients start.",
    href: "/programs#core",
    Icon: Layers,
    tag: "Foundation",
  },
  {
    title: "Pipeline",
    sub: "Lead-gen machine — ads + landing pages + AI scoring.",
    href: "/programs#pipeline",
    Icon: Plus,
    tag: "Most popular",
    tagColor: "primary",
  },
  {
    title: "Operating System",
    sub: "Full-stack: AI agent + CRM + dashboards.",
    href: "/programs#os",
    Icon: Box,
  },
  {
    title: "Pulse",
    sub: "Social-first — Meta, YouTube, TikTok.",
    href: "/programs#pulse",
    Icon: Activity,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState<null | "services" | "programs">(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 20);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Close dropdowns / mobile menu on route change.
  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element) || !target.closest("[data-nav-dd]")) {
        setOpen(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const close = () => {
    setOpen(null);
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 px-4",
        isScrolled ? "py-2.5" : "py-3.5",
      )}
    >
      <div className="max-w-[1240px] mx-auto">
        <div
          className="flex items-center justify-between gap-4 h-[60px] pl-5 pr-2 rounded-full border backdrop-blur-xl"
          style={{
            background:
              "color-mix(in oklab, var(--color-background) 78%, transparent)",
            borderColor:
              "color-mix(in oklab, var(--color-foreground) 8%, transparent)",
            boxShadow:
              "0 8px 32px rgba(26, 26, 26, 0.06), 0 2px 8px rgba(26, 26, 26, 0.04)",
          }}
        >
          {/* Brand */}
          <Link
            href="/"
            onClick={close}
            className="inline-flex items-center shrink-0"
            aria-label="4Pie Labs home"
          >
            <Image
              src="/logo.png"
              alt="4Pie Labs"
              width={128}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>

          {/* Center links (desktop) */}
          <nav
            className="hidden md:flex items-center gap-0.5"
            aria-label="Primary"
          >
            <NavLink href="/" active={isActive("/")} label="Home" />
            <NavDropdown
              label="Services"
              isOpen={open === "services"}
              onToggle={() =>
                setOpen(open === "services" ? null : "services")
              }
              items={SERVICE_ITEMS}
            />
            <NavDropdown
              label="Programs"
              isOpen={open === "programs"}
              onToggle={() =>
                setOpen(open === "programs" ? null : "programs")
              }
              items={PROGRAM_ITEMS}
            />
            <NavLink href="/about" active={isActive("/about")} label="About" />
            <NavLink
              href="/audit"
              active={isActive("/audit")}
              label="Free audit"
            />
          </nav>

          {/* End controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="grid place-items-center w-[38px] h-[38px] rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </button>
            <Link
              href="/book"
              className="hidden md:inline-flex items-center gap-1.5 h-[38px] px-4 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium transition-colors"
            >
              Schedule call
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              className="md:hidden grid place-items-center w-[38px] h-[38px] rounded-full text-foreground hover:bg-foreground/5"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-1 p-4 bg-surface border border-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] max-h-[calc(100vh-100px)] overflow-y-auto">
          <MobileLink href="/" onClose={close}>
            Home
          </MobileLink>
          <MobileSection label="Services" />
          {SERVICE_ITEMS.map((i) => (
            <MobileLink key={i.href} href={i.href} onClose={close}>
              {i.title}
            </MobileLink>
          ))}
          <MobileSection label="Programs" />
          {PROGRAM_ITEMS.map((i) => (
            <MobileLink key={i.href} href={i.href} onClose={close}>
              {i.title}
              {i.tag && (
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  · {i.tag}
                </span>
              )}
            </MobileLink>
          ))}
          <MobileSection label="Company" />
          <MobileLink href="/about" onClose={close}>
            About
          </MobileLink>
          <MobileLink href="/audit" onClose={close}>
            Free audit
          </MobileLink>
          <Link
            href="/book"
            onClick={close}
            className="block mt-3 text-center px-4 py-3.5 rounded-xl bg-primary text-white font-medium"
          >
            Schedule call →
          </Link>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex items-center px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
      )}
    >
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 bottom-1 w-1 h-1 rounded-full bg-primary"
        />
      )}
    </Link>
  );
}

function NavDropdown({
  label,
  items,
  isOpen,
  onToggle,
}: {
  label: string;
  items: DropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative" data-nav-dd>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "inline-flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-colors",
          isOpen
            ? "text-foreground bg-foreground/5"
            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
        )}
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown
          className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 min-w-[320px] bg-surface border border-card-border rounded-2xl p-2.5 shadow-[0_16px_40px_rgba(26,26,26,0.12),0_4px_12px_rgba(26,26,26,0.06)] z-10">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="grid grid-cols-[36px_1fr] gap-3 p-2.5 rounded-xl items-start text-left hover:bg-surface-2 transition-colors"
            >
              <span className="w-9 h-9 rounded-lg bg-primary-muted text-primary grid place-items-center">
                <item.Icon className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground tracking-tight">
                  {item.title}
                  {item.tag && (
                    <span
                      className={cn(
                        "ml-2 text-xs font-normal",
                        item.tagColor === "primary"
                          ? "text-primary font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      · {item.tag}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                  {item.sub}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  );
}

function MobileLink({
  href,
  children,
  onClose,
}: {
  href: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="block px-4 py-3.5 text-base font-medium text-foreground hover:bg-surface-2 rounded-xl"
    >
      {children}
    </Link>
  );
}
