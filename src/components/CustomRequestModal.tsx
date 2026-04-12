"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Layers,
  Mail,
  MessageSquare,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initialFormState, submitCustomRequest } from "@/lib/actions";
import { CustomDropdown } from "./CustomDropdown";

interface CustomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomRequestModal({ isOpen, onClose }: CustomRequestModalProps) {
  const [state, formAction, pending] = useActionState(
    submitCustomRequest,
    initialFormState,
  );
  const [isHovered, setIsHovered] = useState(false);
  const [requestType, setRequestType] = useState("Custom AI Operating System");

  useEffect(() => {
    if (state.status === "success") {
      const t = setTimeout(() => onClose(), 2000);
      return () => clearTimeout(t);
    }
  }, [state.status, onClose]);

  const buttonLabel =
    state.status === "success"
      ? "Request Sent!"
      : state.status === "error"
        ? "Try Again"
        : pending
          ? "Sending..."
          : "Submit Request";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 relative">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-1">
                  Custom Request
                </h2>
                <p className="text-white/40 text-sm">
                  Describe your unique vision. Our architects will build
                  precisely what you need.
                </p>
              </div>

              <form action={formAction} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="cr-name"
                    className="text-xs font-semibold text-white/40 ml-1 uppercase tracking-wider flex items-center gap-2"
                  >
                    <User className="w-3 h-3 text-primary" />
                    Full Name
                  </label>
                  <input
                    id="cr-name"
                    name="name"
                    required
                    type="text"
                    placeholder="Your Name"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                  />
                  {state.errors?.name && (
                    <p className="text-xs text-red-400 ml-1">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cr-email"
                      className="text-xs font-semibold text-white/40 ml-1 uppercase tracking-wider flex items-center gap-2"
                    >
                      <Mail className="w-3 h-3 text-primary" />
                      Email
                    </label>
                    <input
                      id="cr-email"
                      name="email"
                      required
                      type="email"
                      placeholder="Work Email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                    />
                    {state.errors?.email && (
                      <p className="text-xs text-red-400 ml-1">
                        {state.errors.email[0]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="cr-phone"
                      className="text-xs font-semibold text-white/40 ml-1 uppercase tracking-wider flex items-center gap-2"
                    >
                      <span className="bg-emerald-500/20 p-0.5 rounded-sm inline-flex">
                        <svg
                          className="w-2.5 h-2.5 text-emerald-500 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </span>
                      WhatsApp
                    </label>
                    <input
                      id="cr-phone"
                      name="phone"
                      required
                      type="tel"
                      placeholder="Phone"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                    />
                    {state.errors?.phone && (
                      <p className="text-xs text-red-400 ml-1">
                        {state.errors.phone[0]}
                      </p>
                    )}
                  </div>
                </div>

                <CustomDropdown
                  label="Request Category"
                  icon={<Layers className="w-3 h-3 text-primary" />}
                  options={[
                    {
                      value: "Custom AI Operating System",
                      label: "Custom AI Operating System",
                    },
                    {
                      value: "Specialized Automation",
                      label: "Specialized Automation",
                    },
                    {
                      value: "Unique Design System",
                      label: "Unique Design System",
                    },
                    { value: "Other / Full Custom", label: "Other / Full Custom" },
                  ]}
                  value={requestType}
                  onChange={setRequestType}
                />
                <input type="hidden" name="requestType" value={requestType} />

                <div className="space-y-1.5">
                  <label
                    htmlFor="cr-details"
                    className="text-xs font-semibold text-white/40 ml-1 uppercase tracking-wider flex items-center gap-2"
                  >
                    <MessageSquare className="w-3 h-3 text-primary" />
                    Request Details
                  </label>
                  <textarea
                    id="cr-details"
                    name="details"
                    rows={3}
                    required
                    placeholder="Explain your specific requirements in detail..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all resize-none"
                  />
                  {state.errors?.details && (
                    <p className="text-xs text-red-400 ml-1">
                      {state.errors.details[0]}
                    </p>
                  )}
                </div>

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
                  disabled={pending || state.status === "success"}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300",
                    state.status === "success"
                      ? "bg-emerald-500 text-white"
                      : state.status === "error"
                        ? "bg-red-500 text-white"
                        : isHovered
                          ? "bg-accent text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                          : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                    (pending || state.status === "success") &&
                      "opacity-80 cursor-not-allowed",
                  )}
                >
                  {buttonLabel}
                  <span className="relative w-5 h-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {state.status === "success" || isHovered ? (
                        <motion.span
                          key="check"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0"
                        >
                          <Check className="w-5 h-5" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="arrow"
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -20, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
