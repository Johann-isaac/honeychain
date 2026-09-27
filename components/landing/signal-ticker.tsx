// A full-bleed marquee of what the platform actually measures, mixed with
// real counts from getPlatformStats(). Deliberately not per-hive telemetry:
// exact hive conditions are the producer's data, and the product only ever
// publishes region-level information about a hive.
//
// The track is rendered twice and translated 50% (see .marquee-track in
// globals.css) so the loop has no visible seam.

const signals = [
  "Temperature",
  "Humidity",
  "Hive weight",
  "Colony sound",
  "Vibration",
  "Entrance camera",
];

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
    "No account needed to verify",
  ];

  const track = (
    <ul className="flex shrink-0 items-center" aria-hidden>
      {items.map((item, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6 text-xs font-semibold uppercase tracking-[0.2em] text-cream/70">{item}</span>
          <span className="size-1.5 rotate-45 bg-honey/70" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative overflow-hidden border-y border-honey/20 bg-charcoal py-3.5">
      {/* Screen readers get the content once, as plain text, instead of the
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
