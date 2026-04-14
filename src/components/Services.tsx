"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { categories, services, type Service } from "@/data/services";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { useModals } from "./modal-provider";

export function Services() {
  const { openContact } = useModals();
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("AI Systems");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filteredServices = services
    .filter((s) => s.category === activeCategory)
    .slice(0, 3);

  return (
    <section
      id="services"
      className="py-24 px-4 bg-[#030303] overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            The services that <br />
            <span className="text-white/50">eliminate manual work.</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto text-lg mb-12">
            We don&apos;t just &quot;implement AI.&quot; We build the foundation
            for an autonomous agency.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    : "glass-morphism text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredServices.map((service) => {
              const Icon = service.icon;
              return (
                <motion.button
                  type="button"
                  key={`${activeCategory}-${service.title}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    layout: { duration: 0.3 },
                    y: { duration: 0.3 },
                  }}
                  onClick={() => setSelectedService(service)}
                  className="group relative p-8 glass-morphism rounded-[32px] border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer overflow-hidden shadow-2xl text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${service.color} p-0.5 mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-display font-bold mb-4">
                    {service.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-6">
                    {service.desc}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-bold text-white/30 group-hover:text-white transition-colors">
                    LEARN MORE
                    <Zap className="w-3 h-3" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 text-center">
          <Link
            href="/services"
            className="group inline-flex items-center gap-3 mx-auto bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-full text-lg font-bold transition-all border border-white/10 hover:border-white/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            See all Services
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <ServiceDetailModal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        onContactClick={openContact}
      />
    </section>
  );
}
