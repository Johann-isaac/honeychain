# HoneyChain

A blockchain-based honey traceability, quality-monitoring, and authentication platform prototype (SIH). Connects **Beekeepers → Honey Batches → Laboratory Testing → Blockchain Verification → Consumers**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4, Recharts, Lucide icons
- In-memory mock data layer (`lib/db.ts`) standing in for PostgreSQL + Prisma (schema documented in `prisma/schema.prisma`)
- Mock blockchain provider (`lib/blockchainService.ts`) — clearly labeled "Demo Blockchain Transaction" everywhere in the UI
- `jsqr` for in-browser QR scanning via the device camera

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. No login is required — the three portals are reached directly, and a **DEMO MODE** bar with a role switcher sits at the top of every page:

- `/beekeeper` — Beekeeper dashboard (demo account: `beekeeper@honeychain.demo`, BK-2026-0142 / Arjun Kumar)
- `/lab` — Laboratory portal (`lab@honeychain.demo`, LAB-TN-042)
- `/consumer` — Public consumer verification, no login
- `/verify/HC-2026-00982` — the flagship pre-verified batch, useful for a quick demo of the consumer experience

## Demo flow

1. Beekeeper monitors **Hive H-003 (Sunrise Hive)** — AI Hive Health Score and yield prediction on `/beekeeper/hives/hv_h-003`.
2. Create a batch at `/beekeeper/batches/new`, then **Send to Laboratory**.
3. Lab technician opens the new sample under `/lab/samples`, enters the 18 physical/chemical/adulteration/microbiological test values — the quality score, grade, and pass/fail recompute live.
4. **Approve & Register on Blockchain** creates the digital lab report and (if passed) a mock blockchain record, then generates a QR code.
5. Scan the QR (or visit `/verify/<batchCode>`) to see the full public traceability record: origin, lab results, blockchain proof, and timeline.

## Architecture notes

- `lib/db.ts` holds all mutable application state (batches, samples, tests, reports, blockchain records) in memory, pinned to `globalThis` so it survives Next's per-route dev compilation. Swap this file's internals for real Prisma calls to go to production — the function signatures were written to make that a drop-in change.
- `lib/blockchainService.ts` exposes a `BlockchainProvider` interface; the shipped `MockBlockchainProvider` can be swapped for a real Polygon/Ethereum/Hyperledger implementation behind the same interface.
- `lib/aiHealthService.ts` and `lib/qualityService.ts` are deterministic (no `Math.random` at call time) — the same inputs always produce the same health score / yield prediction / quality grade.
- Consumer-facing data (`getPublicVerification` in `lib/db.ts`) is a deliberately narrow projection — it never exposes beekeeper contact details, exact coordinates, or internal lab remarks.
