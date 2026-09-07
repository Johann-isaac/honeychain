# HoneyChain

A blockchain-based honey traceability platform prototype (SIH). Connects **Beekeepers → Honey Batches → Blockchain Verification → Consumers**.

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

Open http://localhost:3000. No login is required — both portals are reached directly, and a **DEMO MODE** bar with a role switcher sits at the top of every page:

- `/beekeeper` — Beekeeper dashboard (demo account: `beekeeper@honeychain.demo`, BK-2026-0142 / Arjun Kumar)
- `/consumer` — Public consumer verification, no login
- `/verify/HC-2026-00982` — the flagship pre-verified batch, useful for a quick demo of the consumer experience

## Demo flow

1. Beekeeper monitors **Hive H-003 (Sunrise Hive)** — AI Hive Health Score, and the "Next Expected Yield" forecast on the dashboard, and the fuller per-hive prediction on `/beekeeper/hives/hv_h-003`.
2. Create a batch at `/beekeeper/batches/new` — it's registered on the (demo) blockchain automatically as part of creation, no separate approval step.
3. The batch detail page shows the blockchain proof and generates a QR code immediately.
4. Scan the QR (or visit `/verify/<batchCode>`) to see the full public traceability record: origin, hive conditions at harvest, blockchain proof, and timeline.

## Architecture notes

- `lib/db.ts` holds all mutable application state (hives, batches, alerts, blockchain records) in memory, pinned to `globalThis` so it survives Next's per-route dev compilation. Swap this file's internals for real Prisma calls to go to production — the function signatures were written to make that a drop-in change.
- `lib/blockchainService.ts` exposes a `BlockchainProvider` interface; the shipped `MockBlockchainProvider` can be swapped for a real Polygon/Ethereum/Hyperledger implementation behind the same interface. `createBatch()` in `lib/db.ts` calls it synchronously as part of batch creation.
- `lib/aiHealthService.ts` is deterministic (no `Math.random` at call time) — the same inputs always produce the same health score and yield prediction. `getBeekeeperYieldForecast()` in `lib/db.ts` aggregates every hive's prediction into the dashboard's "Next Expected Yield" feature.
- Consumer-facing data (`getPublicVerification` in `lib/db.ts`) is a deliberately narrow projection — it never exposes beekeeper contact details or exact coordinates.
