"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4",
        isScrolled ? "py-4" : "py-6",
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto flex md:grid md:grid-cols-3 items-center justify-between px-6 py-3 rounded-full transition-all duration-300 relative",
          "glass-morphism border-white/5",
          isScrolled
            ? "bg-background/40 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "bg-white/5 backdrop-blur-md",
        )}
      >
        <div className="flex items-center justify-start md:ml-5">
          <Link href="/" className="group inline-flex" aria-label="4Pie Labs home">
            <Image
              src="/logo.png"
              alt="4Pie Labs"
              width={128}
              height={32}
              priority
              className="h-7 md:h-8 w-auto brightness-0 invert group-hover:scale-110 transition-transform"
            />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1 justify-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 relative group text-white/50 hover:text-white"
            >
              {item.label}
              <span className="absolute bottom-0 left-4 right-4 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/book"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="hidden md:flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Schedule Call
            <span className="relative w-4 h-4 overflow-hidden">
              <AnimatePresence mode="wait">
                {isHovered ? (
                  <motion.span
                    key="phone"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="arrow"
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </Link>
          <button
            type="button"
            className="md:hidden p-2 text-white"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 p-6 glass-morphism rounded-2xl flex flex-col gap-4 animate-fade-in">
          {NAV_ITEMS.filter((i) => i.href !== "/").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-medium text-white/70 hover:text-white transition-colors text-left"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/book"
            className="flex items-center justify-center gap-2 bg-white text-black px-5 py-3 rounded-full text-base font-bold"
          >
            Schedule Call
          </Link>
        </div>
      )}
    </nav>
  );
}
