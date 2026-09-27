// A quiet band of what the platform measures, mixed with real counts from
// getPlatformStats(). Deliberately not per-hive telemetry: exact hive
// conditions are the producer's data, and the product only ever publishes
// region-level information about a hive.
//
// Kept low-contrast and slow on purpose — it should register as a detail
// you notice, not as a banner competing with the hero above it.

const signals = ["Temperature", "Humidity", "Hive weight", "Colony sound", "Vibration", "Entrance camera"];

export function SignalTicker({
  hives,
  batches,
  beekeepers,
}: {
  hives: number;
  batches: number;
  beekeepers: number;
}) {
  const items = [
    `${hives} ${hives === 1 ? "hive" : "hives"} monitored`,
    ...signals.slice(0, 3),
    `${batches} ${batches === 1 ? "batch" : "batches"} registered`,
    ...signals.slice(3),
    `${beekeepers} ${beekeepers === 1 ? "producer" : "producers"}`,
  ];

  const track = (
    <ul className="flex shrink-0 items-center" aria-hidden>
      {items.map((item, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-7 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {item}
          </span>
          <span className="size-1 rounded-full bg-honey/50" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative overflow-hidden border-y border-border bg-card py-4">
      {/* Screen readers get the content once as plain prose, rather than the
          duplicated visual track. */}
      <p className="sr-only">HoneyChain monitors {signals.join(", ").toLowerCase()}.</p>
      <div className="marquee-mask flex">
        <div className="marquee-track flex min-w-max">
          {track}
          {track}
        </div>
      </div>
    </div>
  );
}
