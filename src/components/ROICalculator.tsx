"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calculator, Check, Mail, Zap } from "lucide-react";
import { submitROI } from "@/lib/actions";
import { initialFormState } from "@/lib/form-types";

export function ROICalculator() {
  const [hours, setHours] = useState(20);
  const [employees, setEmployees] = useState(5);
  const [costPerHour, setCostPerHour] = useState(50);
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    submitROI,
    initialFormState,
  );

  const monthlyManualCost = hours * employees * costPerHour * 4;
  const automationSavings = monthlyManualCost * 0.8;

  const buttonLabel =
    state.status === "success"
      ? "Report Sent!"
      : state.status === "error"
        ? "Try Again"
        : pending
          ? "Sending..."
          : "Get This ROI Report";

  return (
    <section id="roi-calculator" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto glass-morphism rounded-[40px] p-8 md:p-16 border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 -m-20 w-80 h-80 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 -m-20 w-80 h-80 bg-accent/10 blur-[80px] rounded-full group-hover:bg-accent/20 transition-colors duration-700" />

        <div className="grid md:grid-cols-2 gap-16 relative z-10">
          <div>
            <div className="flex items-center gap-3 text-primary font-bold mb-6">
              <Calculator className="w-5 h-5" />
              ROI CALCULATOR
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              How much is manual work costing you?
            </h2>
            <p className="text-white/60 mb-10">
              Calculate the potential savings of moving your legacy workflows
              to AI-powered operating systems.
            </p>

            <div className="space-y-8">
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium text-white/80">
                    Manual hours per week / employee
                  </span>
                  <span className="text-primary font-bold">{hours}h</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value))}
                  className="w-full accent-primary bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium text-white/80">
                    Number of employees
                  </span>
                  <span className="text-primary font-bold">{employees}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={employees}
                  onChange={(e) => setEmployees(parseInt(e.target.value))}
                  className="w-full accent-primary bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-medium text-white/80">
                    Average cost per hour
                  </span>
                  <span className="text-primary font-bold">${costPerHour}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={150}
                  value={costPerHour}
                  onChange={(e) => setCostPerHour(parseInt(e.target.value))}
                  className="w-full accent-primary bg-white/5 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <form
            action={formAction}
            className="flex flex-col justify-center bg-white/5 rounded-[32px] p-8 md:p-12 border border-white/5 backdrop-blur-sm"
          >
            <div className="mb-8">
              <div className="text-white/40 text-sm mb-2 uppercase tracking-widest">
                Potential Monthly Savings
              </div>
              <motion.div
                key={automationSavings}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl md:text-6xl font-display font-bold text-gradient"
              >
                ${automationSavings.toLocaleString()}
              </motion.div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Zap className="w-4 h-4 text-primary fill-primary/20" />
                83% average reduction in processing time
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <Zap className="w-4 h-4 text-primary fill-primary/20" />
                Eliminates 99% of manual data entry errors
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-12 text-sm focus:outline-none focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 transition-all text-white placeholder:text-white/20"
                />
              </div>
              {state.errors?.email && (
                <p className="text-xs text-red-400 ml-4 mt-2">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            {/* numeric fields submitted alongside email */}
            <input type="hidden" name="hoursPerWeek" value={hours} />
            <input type="hidden" name="employees" value={employees} />
            <input type="hidden" name="costPerHour" value={costPerHour} />
            <input
              type="hidden"
              name="monthlyManualCost"
              value={monthlyManualCost}
            />
            <input
              type="hidden"
              name="automationSavings"
              value={automationSavings}
            />

            {state.status === "error" && state.message && (
              <p
                aria-live="polite"
                className="text-sm text-red-400 text-center mb-4"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || state.status === "success"}
              className={`w-full font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 ${
                state.status === "success"
                  ? "bg-emerald-500 text-white"
                  : state.status === "error"
                    ? "bg-red-500 text-white"
                    : "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              } ${pending || state.status === "success" ? "opacity-80 cursor-not-allowed" : ""}`}
            >
              {buttonLabel}
              {state.status === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
