// Phase 3 logos row — text mocks of placeholder client names from the v2
// design. Replace with real logos before public launch.

const LOGOS = [
  "Coastline Tours",
  "Northpeak Painters",
  "Ridgeline & Co.",
  "Harborwalk Tours",
  "Cedar & Brush",
  "Saltwater Expeditions",
];

export function LogosRow() {
  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-[1240px] mx-auto">
        <p className="text-center text-xs font-medium text-subtle-foreground uppercase tracking-widest mb-6">
          Trusted by local operators across North America
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 opacity-80">
          {LOGOS.map((label) => (
            <span
              key={label}
              className="text-sm md:text-base font-semibold text-muted-foreground tracking-tight"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
