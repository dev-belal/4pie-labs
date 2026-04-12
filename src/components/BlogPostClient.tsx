"use client";

import { useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link as LinkIcon } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export { FacebookIcon, TwitterIcon, LinkedinIcon };

export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-[70]"
      style={{ scaleX }}
    />
  );
}

export function ShareActions() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 ml-auto">
      <button
        type="button"
        aria-label="Copy link"
        onClick={handleCopyLink}
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-primary transition-all group"
      >
        <LinkIcon
          className={`w-4 h-4 ${copied ? "text-emerald-400" : "text-white/40 group-hover:text-white"}`}
        />
      </button>
      <button
        type="button"
        aria-label="Share on Facebook"
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#1877F2] transition-all group"
      >
        <FacebookIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
      </button>
      <button
        type="button"
        aria-label="Share on Twitter"
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#1DA1F2] transition-all group"
      >
        <TwitterIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
      </button>
      <button
        type="button"
        aria-label="Share on LinkedIn"
        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-[#0077B5] transition-all group"
      >
        <LinkedinIcon className="w-4 h-4 text-white/40 group-hover:text-white" />
      </button>
    </div>
  );
}

export function MarqueeFooter() {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-white/5 py-4 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] overflow-hidden whitespace-nowrap">
      <motion.div
        animate={{ x: [-1000, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        AI RESEARCH 2026 • 4PIE LABS INSIGHTS • AUTONOMOUS AGENCY PROTOCOLS •
        DESIGN PSYCHOLOGY • MARKET AUTOMATION •
      </motion.div>
    </div>
  );
}
