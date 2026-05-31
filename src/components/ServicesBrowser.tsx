"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  categories,
  categoryFromSlug,
  SERVICE_CATEGORY_SLUGS,
  services,
  type Service,
  type ServiceCategory,
} from "@/data/services";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { useModals } from "./modal-provider";

export function ServicesBrowser() {
  const { openContact, openCustomRequest } = useModals();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /** Resolve the initial category from `?category=<slug>` in the URL on
   *  first render - lets the footer / other pages deep-link into a
   *  pre-filtered catalog. Falls back to the first category. */
  const categoryFromUrl = (): ServiceCategory => {
    const raw = searchParams.get("category");
    const match = raw ? categoryFromSlug(raw) : null;
    return match ?? "AI-First SEO + AEO";
  };

  const [activeCategory, setActiveCategory] =
    useState<ServiceCategory>(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Keep state in sync with URL changes (e.g. visitor clicks the footer
  // while already on /services, or hits back/forward).
  useEffect(() => {
    const next = categoryFromUrl();
    setActiveCategory((prev) => (prev === next ? prev : next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // When the visitor picks a tab, mirror it into the URL so the choice
  // is shareable / bookmarkable / survives a refresh. Use `replace` so
  // we don't flood the back-button stack with every tab click.
  const selectCategory = useCallback(
    (cat: ServiceCategory) => {
      setActiveCategory(cat);
      const params = new URLSearchParams(searchParams.toString());
      params.set("category", SERVICE_CATEGORY_SLUGS[cat]);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredServices = services.filter(
    (s) =>
      s.category === activeCategory &&
      (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-40 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2 text-foreground">
                Browse by category
              </h2>
              <p className="text-muted-foreground text-sm">
                Three buckets - the same three you see in the nav. Pick one
                or search across all.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle-foreground" />
              <input
                type="text"
                placeholder="Find a service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all border",
                    activeCategory === cat
                      ? "bg-primary-muted border-primary text-foreground"
                      : "bg-surface border-card-border text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  {cat}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform",
                      activeCategory === cat
                        ? "translate-x-0 opacity-100 text-primary"
                        : "-translate-x-2 opacity-0",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <button
                    type="button"
                    key={service.title}
                    onClick={() => setSelectedService(service)}
                    className="group bg-surface border border-card-border rounded-2xl p-7 md:p-8 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all flex flex-col gap-5 relative overflow-hidden cursor-pointer text-left"
                  >
                    <div className="flex items-start justify-between">
                      <span className="w-12 h-12 rounded-xl grid place-items-center bg-primary-muted text-primary">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[11px] font-medium text-subtle-foreground tracking-wider tabular-nums">
                        0{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {service.desc}
                      </p>
                      {service.details && (
                        <div className="pt-4 border-t border-border text-xs text-subtle-foreground italic leading-relaxed">
                          {service.details}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2 transition-all mt-auto uppercase tracking-wider">
                      View details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}

              {filteredServices.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="col-span-full bg-surface border border-card-border rounded-2xl shadow-[var(--shadow-card)] p-10 md:p-12 text-center flex flex-col items-center gap-5"
                >
                  <span className="w-14 h-14 rounded-2xl bg-primary-muted grid place-items-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
                      Didn&apos;t find what you need?
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      We build custom AI operating systems for unique
                      workflows. Tell us what you&apos;re looking for and
                      we&apos;ll scope it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCustomRequest}
                    className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-7 py-3 rounded-lg text-sm font-semibold transition-all shadow-[var(--shadow-cta)] hover:shadow-[var(--shadow-cta-strong)]"
                  >
                    Submit a custom request
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ServiceDetailModal
        isOpen={!!selectedService}
        onClose={() => setSelectedService(null)}
        service={selectedService}
        onContactClick={openContact}
      />
    </>
  );
}
