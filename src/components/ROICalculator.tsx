"use client";

// Marketing Budget Calculator (Phase 1B pivot). The file keeps its legacy
// name `ROICalculator` so the homepage import stays stable.

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Calculator,
  Check,
  Mail,
  User,
  X,
} from "lucide-react";
import { submitBudgetLead } from "@/lib/actions";
import { initialFormState } from "@/lib/form-types";
import { useDialogA11y } from "@/lib/use-dialog-a11y";

const INDUSTRIES = [
  "Painting Contractor",
  "Tour Operator",
  "Other Local Service",
] as const;
type Industry = (typeof INDUSTRIES)[number];

const GROWTH_GOALS = [
  { label: "Maintain", lo: 5, hi: 7 },
  { label: "Grow steadily", lo: 7, hi: 10 },
  { label: "Aggressive growth", lo: 10, hi: 15 },
  { label: "Dominate market", lo: 15, hi: 20 },
] as const;
type GrowthGoal = (typeof GROWTH_GOALS)[number]["label"];

const CHANNEL_MIX: Record<Industry, { pct: number; label: string }[]> = {
  "Painting Contractor": [
    { pct: 40, label: "Google Ads + Maps" },
    { pct: 25, label: "SEO + AEO" },
    { pct: 20, label: "Website + Landing Pages" },
    { pct: 15, label: "Retargeting" },
  ],
  "Tour Operator": [
    { pct: 30, label: "Google + Maps" },
    { pct: 25, label: "Meta + Instagram" },
    { pct: 25, label: "SEO + AEO" },
    { pct: 20, label: "Content + Email" },
  ],
  "Other Local Service": [
    { pct: 35, label: "Google + Maps" },
    { pct: 25, label: "SEO + AEO" },
    { pct: 25, label: "Website + Conversion" },
    { pct: 15, label: "Paid Social" },
  ],
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function ROICalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(50_000);
  const [industry, setIndustry] = useState<Industry>("Painting Contractor");
  const [goalLabel, setGoalLabel] = useState<GrowthGoal>("Grow steadily");
  const [currentSpend, setCurrentSpend] = useState(5_000);
  const [modalOpen, setModalOpen] = useState(false);

  const goal = GROWTH_GOALS.find((g) => g.label === goalLabel)!;
  const midpointPct = (goal.lo + goal.hi) / 2; // e.g. "Grow steadily" -> 8.5
  const recommendedBudget = Math.round((monthlyRevenue * midpointPct) / 100);
  const gap = recommendedBudget - currentSpend;
  const mix = CHANNEL_MIX[industry];

  const gapLine =
    Math.abs(gap) < 1
      ? "You're right on target for your goal"
      : gap > 0
        ? `+${usd(gap)} to reach your growth goal`
        : `You're overspending by ${usd(Math.abs(gap))} at your current goal`;

  return (
    <section id="budget-calculator" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto glass-morphism rounded-[40px] p-8 md:p-16 border-foreground/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -m-20 w-80 h-80 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 -m-20 w-80 h-80 bg-accent/10 blur-[80px] rounded-full group-hover:bg-accent/20 transition-colors duration-700" />

        <div className="grid md:grid-cols-2 gap-16 relative z-10">
          {/* ---- Left column: inputs ---- */}
          <div>
            <div className="flex items-center gap-3 text-primary font-bold mb-6 text-xs tracking-widest uppercase">
              <Calculator className="w-5 h-5" />
              Marketing Budget Calculator
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
              How much should you spend on marketing?
            </h2>
            <p className="text-foreground/60 mb-10">
              Get a recommended monthly budget based on your industry and growth
              goals — instant, no email required.
            </p>

            <div className="space-y-8">
              {/* Monthly revenue */}
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium text-foreground/80">
                    Monthly revenue
                  </span>
                  <span className="text-primary font-bold">
                    {usd(monthlyRevenue)}
                  </span>
                </div>
                <input
                  type="range"
                  min={10_000}
                  max={500_000}
                  step={5_000}
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  aria-label="Monthly revenue"
                  className="w-full accent-primary bg-foreground/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Industry */}
              <div>
                <span className="block text-sm font-medium text-foreground/80 mb-4">
                  Industry
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {INDUSTRIES.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setIndustry(opt)}
                      aria-pressed={industry === opt}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        industry === opt
                          ? "bg-primary text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                          : "glass-morphism text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Growth goal */}
              <div>
                <span className="block text-sm font-medium text-foreground/80 mb-4">
                  Growth goal
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {GROWTH_GOALS.map((g) => (
                    <button
                      type="button"
                      key={g.label}
                      onClick={() => setGoalLabel(g.label)}
                      aria-pressed={goalLabel === g.label}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        goalLabel === g.label
                          ? "bg-primary text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                          : "glass-morphism text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-foreground/30 mt-3">
                  {goalLabel} · {goal.lo}–{goal.hi}% of revenue
                </p>
              </div>

              {/* Current marketing spend */}
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium text-foreground/80">
                    Current marketing spend
                  </span>
                  <span className="text-primary font-bold">
                    {usd(currentSpend)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50_000}
                  step={500}
                  value={currentSpend}
                  onChange={(e) => setCurrentSpend(Number(e.target.value))}
                  aria-label="Current marketing spend"
                  className="w-full accent-primary bg-foreground/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ---- Right column: output card ---- */}
          <div className="flex flex-col justify-center">
            <div className="bg-foreground/5 rounded-[32px] p-8 md:p-12 border border-foreground/5 backdrop-blur-sm">
              <div className="text-foreground/40 text-sm mb-2 uppercase tracking-widest">
                Recommended monthly budget
              </div>
              <motion.div
                key={recommendedBudget}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl md:text-6xl font-display font-bold text-gradient mb-8"
              >
                {usd(recommendedBudget)}
              </motion.div>

              <ul className="space-y-5 mb-8">
                <li>
                  <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-1">
                    Gap from your current spend
                  </div>
                  <div className="text-sm text-foreground/80 font-medium">
                    {gapLine}
                  </div>
                </li>
                <li>
                  <div className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-2">
                    Recommended channel mix
                  </div>
                  <div className="space-y-1.5">
                    {mix.map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center justify-between text-sm text-foreground/70"
                      >
                        <span>{c.label}</span>
                        <span className="text-foreground/40 font-mono">{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="group w-full font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-foreground shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Get the full breakdown
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <Link
              href="/book"
              className="group mt-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-foreground/50 hover:text-foreground transition-colors text-center"
            >
              Or skip the form — book a call and we&apos;ll build your plan live
              <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <BudgetLeadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        monthlyRevenue={monthlyRevenue}
        industry={industry}
        growthGoal={goalLabel}
        recommendedBudget={recommendedBudget}
        currentSpend={currentSpend}
      />
    </section>
  );
}

interface BudgetLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyRevenue: number;
  industry: string;
  growthGoal: string;
  recommendedBudget: number;
  currentSpend: number;
}

function BudgetLeadModal({
  isOpen,
  onClose,
  monthlyRevenue,
  industry,
  growthGoal,
  recommendedBudget,
  currentSpend,
}: BudgetLeadModalProps) {
  const [state, formAction, pending] = useActionState(
    submitBudgetLead,
    initialFormState,
  );
  useDialogA11y(isOpen, onClose);

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => onClose(), 2500);
      return () => clearTimeout(t);
    }
  }, [state.status, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-lead-title"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-foreground/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 relative">
              {state.status === "success" ? (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h2
                    id="budget-lead-title"
                    className="text-xl font-display font-bold mb-2"
                  >
                    You&apos;re all set
                  </h2>
                  <p className="text-foreground/50 text-sm">{state.message}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2
                      id="budget-lead-title"
                      className="text-2xl font-display font-bold mb-1"
                    >
                      Get the full breakdown
                    </h2>
                    <p className="text-foreground/40 text-sm">
                      We&apos;ll email you a tailored plan for your{" "}
                      {usd(recommendedBudget)}/mo budget.
                    </p>
                  </div>

                  <form action={formAction} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="budget-name"
                        className="text-sm font-medium text-foreground/60 ml-1 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-primary" />
                        Full Name
                      </label>
                      <input
                        id="budget-name"
                        name="name"
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 focus:bg-foreground/[0.08] transition-all"
                      />
                      {state.errors?.name && (
                        <p className="text-xs text-red-400 ml-1">
                          {state.errors.name[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="budget-email"
                        className="text-sm font-medium text-foreground/60 ml-1 flex items-center gap-2"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        Email
                      </label>
                      <input
                        id="budget-email"
                        name="email"
                        required
                        type="email"
                        placeholder="john@example.com"
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 focus:bg-foreground/[0.08] transition-all"
                      />
                      {state.errors?.email && (
                        <p className="text-xs text-red-400 ml-1">
                          {state.errors.email[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="budget-business"
                        className="text-sm font-medium text-foreground/60 ml-1 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        Business Name
                      </label>
                      <input
                        id="budget-business"
                        name="businessName"
                        required
                        type="text"
                        placeholder="Acme Painting Co."
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 focus:bg-foreground/[0.08] transition-all"
                      />
                      {state.errors?.businessName && (
                        <p className="text-xs text-red-400 ml-1">
                          {state.errors.businessName[0]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="budget-revenue"
                        className="text-sm font-medium text-foreground/60 ml-1"
                      >
                        Monthly revenue (USD)
                      </label>
                      <input
                        id="budget-revenue"
                        name="monthlyRevenue"
                        required
                        type="number"
                        min={0}
                        defaultValue={monthlyRevenue}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-2xl px-5 py-3 text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-primary/50 focus:bg-foreground/[0.08] transition-all"
                      />
                      {state.errors?.monthlyRevenue && (
                        <p className="text-xs text-red-400 ml-1">
                          {state.errors.monthlyRevenue[0]}
                        </p>
                      )}
                    </div>

                    {/* calculator context travels with the lead */}
                    <input type="hidden" name="industry" value={industry} />
                    <input type="hidden" name="growthGoal" value={growthGoal} />
                    <input
                      type="hidden"
                      name="recommendedBudget"
                      value={recommendedBudget}
                    />
                    <input
                      type="hidden"
                      name="currentSpend"
                      value={currentSpend}
                    />

                    {state.status === "error" && state.message && (
                      <p
                        aria-live="polite"
                        className="text-sm text-red-400 text-center"
                      >
                        {state.message}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pending}
                      className="group w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-bold transition-all bg-primary text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {pending ? "Sending..." : "Email me the breakdown"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
