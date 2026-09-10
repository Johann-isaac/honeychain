# HoneyChain

A blockchain-based honey traceability platform (SIH) with a real ESP32 hive-monitoring pipeline. Connects **ESP32 sensors → Supabase → Beekeeper Dashboard → Honey Batches → Blockchain Verification → Consumers**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4, Recharts, Lucide icons
- **Supabase (Postgres)** for all persistence — schema in [`supabase/schema.sql`](supabase/schema.sql)
- Mock blockchain provider (`lib/blockchainService.ts`) — clearly labeled "Demo Blockchain Transaction" everywhere in the UI
- ESP32 firmware in [`firmware/esp32_hive_monitor/`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino)
- `jsqr` for in-browser QR scanning via the device camera

There is no login system yet — the app operates as a single beekeeper account (auto-created on first run), who can register many hives, each with its own ESP32.

## One-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Once it's created:

1. Open the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables (`beekeepers`, `hives`, `sensor_readings`, `alerts`, `honey_batches`, `blockchain_records`) with Row Level Security enabled and no policies — meaning only the `service_role` key (used server-side only, never in the browser) can touch them.
2. Go to **Project Settings → API** and copy the **Project URL** and the **`service_role`** secret key (not the `anon` key).

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from step 1. Also set `HIVE_DEVICE_API_KEY` to any long random string (e.g. `openssl rand -hex 32`) — this is the shared secret every ESP32 uses to authenticate to the ingestion API. See the comments in `.env.local.example` for every variable.

### 3. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Registering a hive and flashing the ESP32

1. On the website: `/beekeeper/hives` → **Register Hive**. This generates a unique **Hive ID** (e.g. `HIVE-001`) — one per physical hive.
2. Open [`firmware/esp32_hive_monitor/esp32_hive_monitor.ino`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino) in the Arduino IDE and fill in the placeholders at the top: WiFi credentials, `HIVE_ID` (from step 1), `SERVER_URL` (your deployed domain, or `http://<your-lan-ip>:3000` while testing on the same network), and `DEVICE_API_KEY` (must match `HIVE_DEVICE_API_KEY` from `.env.local`).
3. Install the two required Arduino libraries: **DHT sensor library** (Adafruit) and **HX711** (bogde). WiFi/HTTPClient ship with the ESP32 board package.
4. Flash it, open Serial Monitor at 115200 baud. Send `t` to tare the load cell with an empty platform, and `c` to calibrate against a known weight (instructions print to Serial).
5. Once WiFi connects, the device posts a reading every `SEND_INTERVAL` (5 minutes by default — drop to 10 seconds while testing) to `POST /api/hive-data`, authenticated with `Authorization: Bearer <HIVE_DEVICE_API_KEY>`.

Every ESP32 maps 1:1 to a `hive_code`, and one beekeeper account can have many hives/devices.

## Sensors → data model

The sensor model in the app matches the physical prototype exactly — nothing invented:

| Sensor | Pin | Field |
|---|---|---|
| DHT22 | GPIO 5 | `temperature`, `humidity` |
| Load cell + HX711 | DT=GPIO 27, SCK=GPIO 26 | `weight` (sent as `prototypeWeight`) |
| Analog microphone | GPIO 34 | `soundLevel` |
| Digital vibration sensor | GPIO 25 | `vibration` (boolean) |

The AI Hive Health Score, yield prediction, and alerts on the dashboard are all computed live from these four fields (`lib/aiHealthService.ts`) — there's no separate "environment" data (weather, air quality, etc.) since no such sensor exists on the prototype.

## Demo flow

1. Register a hive, flash its ESP32, and watch real readings land on `/beekeeper/hives/<id>` (Temperature / Humidity / Weight / Sound Level / Vibration tabs, AI Hive Health Score, yield prediction).
2. Create a batch at `/beekeeper/batches/new` — it's registered on the (demo) blockchain automatically as part of creation, no separate approval step.
3. The batch detail page shows the blockchain proof and generates a QR code immediately.
4. Scan the QR (or visit `/verify/<batchCode>`) to see the full public traceability record: origin, hive conditions at harvest, blockchain proof, and timeline.

## Architecture notes

- `lib/supabase/server.ts` is the only place the Supabase `service_role` key is read — it's a server-only lazy singleton, never bundled to the client.
- `lib/db.ts` is the only file that queries Supabase. Every function is async; page components and API routes `await` them. Row-to-domain mapping (`snake_case` → `camelCase`) happens here so the rest of the app never sees raw DB columns.
- `POST /api/hive-data` is the only endpoint an ESP32 ever calls. It checks a Bearer device token, validates every field's type and range, resolves the device's `hiveId` (a `hive_code` string) to an internal row, and inserts one `sensor_readings` row. Malformed or unauthenticated requests never reach Supabase.
- `lib/blockchainService.ts` exposes a `BlockchainProvider` interface; the shipped `MockBlockchainProvider` can be swapped for a real Polygon/Ethereum/Hyperledger implementation behind the same interface. `createBatch()` in `lib/db.ts` calls it as part of batch creation.
- `lib/aiHealthService.ts` is deterministic (no `Math.random` at call time) — the same sensor inputs always produce the same health score, yield prediction, and alerts. `getBeekeeperYieldForecast()` in `lib/db.ts` aggregates every hive's prediction into the dashboard's "Next Expected Yield" feature.
- Consumer-facing data (`getPublicVerification` in `lib/db.ts`) is a deliberately narrow projection — it never exposes beekeeper contact details or exact coordinates.
- There's no auth system yet: `getDefaultBeekeeperId()` in `lib/db.ts` auto-creates a single beekeeper row (configurable via `DEFAULT_BEEKEEPER_*` env vars) and every hive/batch belongs to it. Adding real multi-beekeeper login is the natural next step and wasn't in scope here.
