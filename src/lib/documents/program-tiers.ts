/**
 * Per-program-tier auto-fill mapping. When the operator picks a
 * PROGRAM in either form, the relevant fields seed from this
 * mapping. All values are SUGGESTIONS - the form does not lock them,
 * so the operator can override anything that doesn't fit the
 * specific engagement.
 *
 * Why this lives in its own file rather than the types file: the
 * mapping is the place edits land when pricing or deliverable lists
 * change. Keeping it isolated from the type definitions means a
 * tier-data tweak doesn't ripple through type imports in unrelated
 * modules.
 *
 * The deliverable defaults are pulled from the Welcome Pack +
 * Agreement Schedule A inclusions: Core is the foundation tier
 * (local + technical SEO, GBP, tracking), Pipeline layers content
 * and ads on top, Operating System adds the AI systems work and
 * dashboards, Pulse leads with Meta/social.
 */

import type { ProgramTier } from "./types";

/**
 * What the form auto-fills when a program is picked. All optional -
 * a missing field means "don't touch this input." MONTHLY_FEE is
 * intentionally absent from Core (the agreement quotes a range
 * "$799-999" that the operator should reconcile against the actual
 * engagement).
 *
 * DELIVERABLE_1..5 always have 5 entries. The form copies them in
 * order; if the operator overrides one, the rest stay seeded.
 */
export interface ProgramTierDefaults {
  /** Welcome Pack + Agreement: MINIMUM_TERM (welcome pack uses
   *  this implicitly through the program field's surrounding copy,
   *  agreement uses MINIMUM_TERM directly). */
  minimumTerm: string;
  /** Agreement: MONTHLY_FEE. Welcome Pack does NOT carry a monthly
   *  fee field. */
  monthlyFee: string;
  /** Welcome Pack: DELIVERABLE_1..5, in order. Agreement does NOT
   *  carry deliverable fields. */
  deliverables: [string, string, string, string, string];
}

export const PROGRAM_TIER_DEFAULTS: Record<ProgramTier, ProgramTierDefaults> = {
  // Foundation tier. Builds the local-search base every program
  // depends on. Month-to-month so the client can scale up to
  // Pipeline / Operating System without an exit penalty.
  Core: {
    minimumTerm: "Month-to-month, no minimum term",
    monthlyFee: "$799-999",
    deliverables: [
      "Local SEO foundation: technical audit, on-page, NAP consistency",
      "Google Business Profile setup + review-velocity system",
      "Schema-first site engineering for AI retrieval (AEO baseline)",
      "Conversion tracking + call tracking wired end-to-end",
      "Monthly reporting tied to Maps pack position + lead volume",
    ],
  },

  // Pipeline = Core + content engine + performance ads. 6-month
  // minimum because content and paid campaigns need ~2 cycles to
  // optimise; sub-six-month engagements never see the compounded
  // return.
  Pipeline: {
    minimumTerm: "6 months",
    monthlyFee: "$1,500",
    deliverables: [
      "Everything in Core: local SEO foundation + GBP + AEO baseline",
      "AEO content engine: monthly long-form pages tuned for citation",
      "Google Search + Maps ads with per-campaign landing pages",
      "Meta + Instagram performance ads with creative iteration",
      "Weekly performance tuning + monthly revenue-attributed review",
    ],
  },

  // Operating System = full stack including custom AI systems +
  // dashboards. 12-month minimum because the systems work has a
  // longer build-out cycle and the dashboards compound over months.
  "Operating System": {
    minimumTerm: "12 months",
    monthlyFee: "$2,000",
    deliverables: [
      "Everything in Pipeline: SEO + AEO + Google + Meta ads",
      "Custom AI agents for inquiry handling + 24/7 booking",
      "Workflow automation across CRM, tracking, and reporting",
      "Real-time revenue + attribution dashboards (the ones we use)",
      "Quarterly strategy reviews + roadmap for the next 90 days",
    ],
  },

  // Pulse is the social-first tier. Different mix: Meta + Instagram
  // creative as the leading channel, with SEO + GBP underneath as
  // the foundation. 6-month minimum like Pipeline.
  Pulse: {
    minimumTerm: "6 months",
    monthlyFee: "$1,600",
    deliverables: [
      "Meta + Instagram organic content engine (weekly posts + stories)",
      "Paid social ads on Meta + Instagram with iterative creative",
      "Local SEO foundation + GBP for the always-on search layer",
      "Schema + AEO baseline so social traffic converts on a fast site",
      "Monthly content review + performance dashboard",
    ],
  },
};

/**
 * Welcome Pack form's auto-fill entry point. Given the picked tier,
 * returns the partial set of token-keyed values to seed into the
 * form. Returns null for "" (no program picked yet) so the form's
 * onChange handler can short-circuit.
 */
export function welcomePackDefaultsForTier(
  tier: ProgramTier | "",
): Partial<{
  DELIVERABLE_1: string;
  DELIVERABLE_2: string;
  DELIVERABLE_3: string;
  DELIVERABLE_4: string;
  DELIVERABLE_5: string;
}> | null {
  if (tier === "") return null;
  const defaults = PROGRAM_TIER_DEFAULTS[tier];
  return {
    DELIVERABLE_1: defaults.deliverables[0],
    DELIVERABLE_2: defaults.deliverables[1],
    DELIVERABLE_3: defaults.deliverables[2],
    DELIVERABLE_4: defaults.deliverables[3],
    DELIVERABLE_5: defaults.deliverables[4],
  };
}

/**
 * Agreement form's auto-fill entry point. Same contract as the
 * welcome pack version; covers MINIMUM_TERM + MONTHLY_FEE. The
 * editor decides whether to overwrite existing user-entered values
 * (typically yes if they're empty, no if they've been edited - the
 * editor tracks "this was auto-filled, not hand-typed").
 */
export function agreementDefaultsForTier(
  tier: ProgramTier | "",
): Partial<{
  MINIMUM_TERM: string;
  MONTHLY_FEE: string;
}> | null {
  if (tier === "") return null;
  const defaults = PROGRAM_TIER_DEFAULTS[tier];
  return {
    MINIMUM_TERM: defaults.minimumTerm,
    MONTHLY_FEE: defaults.monthlyFee,
  };
}
