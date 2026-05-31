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
  const midpointPct = (goal.lo + goal.hi) / 2;
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
    <section
      id="budget-calculator"
      className="relative py-24 md:py-28 px-4 overflow-hidden"
    >
      <span
        aria-hidden
        className="absolute pointer-events-none top-10 -right-32 w-[480px] h-[480px] rounded-full opacity-50 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(251,191,36,0.32), transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-[1100px] mx-auto">
        <div className="bg-surface border border-card-border rounded-2xl p-7 md:p-12 shadow-[var(--shadow-card)]">
          <div className="grid md:grid-cols-2 gap-10 md:gap-14">
            {/* ---- Left column: inputs ---- */}
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-primary tracking-widest uppercase mb-5">
                <Calculator className="w-3.5 h-3.5" />
                Marketing Budget Calculator
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4 [text-wrap:balance]">
                How much should you{" "}
                <span className="font-semibold text-primary">spend</span> on
                marketing?
              </h2>
              <p className="text-muted-foreground mb-10">
                Get a recommended monthly budget based on your industry and
                growth goals. Instant, no email required.
              </p>

              <div className="space-y-7">
                {/* Monthly revenue */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-medium text-foreground">
                      Monthly revenue
                    </span>
                    <span className="text-primary font-semibold tabular-nums">
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
                    className="w-full accent-primary bg-surface-2 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Industry */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-3">
                    Industry
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {INDUSTRIES.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setIndustry(opt)}
                        aria-pressed={industry === opt}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          industry === opt
                            ? "bg-primary text-on-primary shadow-[var(--shadow-cta)]"
                            : "bg-surface-2 border border-card-border text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Growth goal */}
                <div>
                  <span className="block text-sm font-medium text-foreground mb-3">
                    Growth goal
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {GROWTH_GOALS.map((g) => (
                      <button
                        type="button"
                        key={g.label}
                        onClick={() => setGoalLabel(g.label)}
                        aria-pressed={goalLabel === g.label}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          goalLabel === g.label
                            ? "bg-primary text-on-primary shadow-[var(--shadow-cta)]"
                            : "bg-surface-2 border border-card-border text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-subtle-foreground mt-3">
                    {goalLabel} · {goal.lo}–{goal.hi}% of revenue
                  </p>
                </div>

                {/* Current marketing spend */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-medium text-foreground">
                      Current marketing spend
                    </span>
                    <span className="text-primary font-semibold tabular-nums">
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
                    className="w-full accent-primary bg-surface-2 h-2 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* ---- Right column: output card ---- */}
            <div className="flex flex-col justify-center">
              <div className="bg-surface-2 rounded-2xl p-7 md:p-9 border border-primary-muted shadow-[var(--shadow-card-elevated)]">
                <div className="text-xs text-subtle-foreground mb-2 uppercase tracking-widest font-medium">
                  Recommended monthly budget
                </div>
                <motion.div
                  key={recommendedBudget}
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl md:text-6xl font-semibold tracking-tight text-primary mb-8 tabular-nums"
                >
                  {usd(recommendedBudget)}
                </motion.div>

                <ul className="space-y-5 mb-8">
                  <li>
                    <div className="text-[10px] font-medium text-subtle-foreground uppercase tracking-widest mb-1">
                      Gap from your current spend
                    </div>
                    <div className="text-sm text-foreground font-medium">
                      {gapLine}
                    </div>
                  </li>
                  <li>
                    <div className="text-[10px] font-medium text-subtle-foreground uppercase tracking-widest mb-2">
                      Recommended channel mix
                    </div>
                    <div className="space-y-1.5">
                      {mix.map((c) => (
                        <div
                          key={c.label}
                          className="flex items-center justify-between text-sm text-muted-foreground"
                        >
                          <span>{c.label}</span>
                          <span className="text-subtle-foreground font-mono tabular-nums">
                            {c.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="group w-full font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-on-primary shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Get the full breakdown
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <Link
                href="/book"
                className="group mt-5 inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Or skip the form, book a call and we&apos;ll build your plan
                live
                <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-card-border rounded-2xl overflow-hidden shadow-[var(--shadow-card-elevated)]"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-surface-2 hover:bg-surface text-muted-foreground hover:text-foreground transition-all z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-7 md:p-8 relative">
              {state.status === "success" ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-success/15 grid place-items-center mx-auto mb-5">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <h2
                    id="budget-lead-title"
                    className="text-xl font-semibold tracking-tight mb-2 text-foreground"
                  >
                    You&apos;re all set
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {state.message}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2
                      id="budget-lead-title"
                      className="text-2xl font-semibold tracking-tight mb-1 text-foreground"
                    >
                      Get the full breakdown
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      We&apos;ll email you a tailored plan for your{" "}
                      <span className="text-foreground font-medium">
                        {usd(recommendedBudget)}/mo
                      </span>{" "}
                      budget.
                    </p>
                  </div>

                  <form action={formAction} className="space-y-4">
                    <BudgetField
                      id="budget-name"
                      name="name"
                      label="Full Name"
                      icon={<User className="w-3.5 h-3.5 text-primary" />}
                      placeholder="John Doe"
                      required
                      error={state.errors?.name?.[0]}
                    />
                    <BudgetField
                      id="budget-email"
                      name="email"
                      type="email"
                      label="Email"
                      icon={<Mail className="w-3.5 h-3.5 text-primary" />}
                      placeholder="john@example.com"
                      required
                      error={state.errors?.email?.[0]}
                    />
                    <BudgetField
                      id="budget-business"
                      name="businessName"
                      label="Business Name"
                      icon={<Building2 className="w-3.5 h-3.5 text-primary" />}
                      placeholder="Acme Painting Co."
                      required
                      error={state.errors?.businessName?.[0]}
                    />
                    <BudgetField
                      id="budget-revenue"
                      name="monthlyRevenue"
                      type="number"
                      label="Monthly revenue (USD)"
                      defaultValue={monthlyRevenue}
                      required
                      error={state.errors?.monthlyRevenue?.[0]}
                    />

                    <input type="hidden" name="industry" value={industry} />
                    <input
                      type="hidden"
                      name="growthGoal"
                      value={growthGoal}
                    />
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
                        className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-2.5"
                      >
                        {state.message}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pending}
                      className="group w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-base font-semibold transition-all bg-primary hover:bg-primary-hover text-on-primary shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)] disabled:opacity-70 disabled:cursor-not-allowed"
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

function BudgetField({
  id,
  name,
  label,
  icon,
  placeholder,
  type = "text",
  required,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground flex items-center gap-2"
      >
        {icon}
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
