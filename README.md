# HoneyChain

A blockchain-based honey traceability platform (SIH) with a real ESP32 hive-monitoring pipeline. Connects **ESP32 sensors → Supabase → Beekeeper Dashboard → Honey Batches → Blockchain Verification → Consumers**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4, Recharts, Lucide icons
- **Supabase (Postgres)** for all persistence — schema in [`supabase/schema.sql`](supabase/schema.sql)
- Mock blockchain provider (`lib/blockchainService.ts`) — clearly labeled "Demo Blockchain Transaction" everywhere in the UI
- ESP32 firmware — two options depending on whether a hive has WiFi (see "Registering a hive" below):
  - [`firmware/esp32_hive_monitor/`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino) — direct WiFi, one device per hive
  - [`firmware/esp32_hive_node_lora/`](firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino) + [`firmware/esp32_lora_gateway/`](firmware/esp32_lora_gateway/esp32_lora_gateway.ino) — for hives with no WiFi coverage, relayed over a 433 MHz LoRa link to one WiFi gateway
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

Either path ends the same way: the website's `POST /api/hive-data` never changes, and neither does the JSON payload shape. Start with:

On the website: `/beekeeper/hives` → **Register Hive**. This generates a unique **Hive ID** (e.g. `HIVE-001`) — one per physical hive. Every ESP32 maps 1:1 to a `hive_code`, and one beekeeper account can have many hives/devices.

### Option A — hive has WiFi coverage

1. Open [`firmware/esp32_hive_monitor/esp32_hive_monitor.ino`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino) in the Arduino IDE and fill in the placeholders at the top: WiFi credentials, `HIVE_ID`, `SERVER_URL` (your deployed domain, or `http://<your-lan-ip>:3000` while testing on the same network), and `DEVICE_API_KEY` (must match `HIVE_DEVICE_API_KEY` from `.env.local`).
2. Install the two required Arduino libraries: **DHT sensor library** (Adafruit) and **HX711** (bogde). WiFi/HTTPClient ship with the ESP32 board package.
3. Flash it, open Serial Monitor at 115200 baud. Send `t` to tare the load cell with an empty platform, and `c` to calibrate against a known weight (instructions print to Serial).
4. Once WiFi connects, the device posts a reading every `SEND_INTERVAL` (5 minutes by default — drop to 10 seconds while testing) directly to `POST /api/hive-data`.

### Option B — hive has NO WiFi coverage (433 MHz LoRa)

One hive node per hive (sensors + LoRa transmitter, no WiFi needed), relaying through a single shared gateway (LoRa receiver + WiFi) placed anywhere with internet access. The gateway needs no per-hive setup — it just forwards whatever it hears.

```
Hive node (sensors + LoRa TX)  --433 MHz-->  Gateway (LoRa RX + WiFi)  --HTTPS-->  /api/hive-data
```

The hive node sends its own field names (`hive_id`, `sound_level`, `hive_weight`) to keep its firmware simple — the **gateway translates these to what `/api/hive-data` expects** (`hiveId`, `soundLevel`, `prototypeWeight`) before forwarding, so neither the hive node's code nor the website's API had to change to match the other.

1. **Per hive**, flash [`firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino`](firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino) onto that hive's ESP32.
   - ⚠️ **`HIVE_ID` must exactly match the Hive ID the website generated** when you clicked Register Hive (e.g. `HIVE-001`, with the dash) — the placeholder in the file is `HIVE001` without a dash and needs to be changed per hive, or the gateway will get a 404 "Unknown hiveId" back from the server.
   - Calibrate the load cell: send `t` over Serial to tare, place a known weight, watch the raw output, then compute and hardcode `calibration_factor = raw_reading / known_weight_kg` at the top of the file.
2. **Once**, flash [`firmware/esp32_lora_gateway/esp32_lora_gateway.ino`](firmware/esp32_lora_gateway/esp32_lora_gateway.ino) onto a separate ESP32 that has WiFi/internet access, filling in WiFi credentials, `SERVER_URL`, and `DEVICE_API_KEY`. This one needs no `HIVE_ID` — it just relays whatever it hears.
3. Install libraries: **LoRa** by Sandeep Mistry (both boards), **DHT sensor library** by Adafruit + **HX711** by bogde (hive node only), **ArduinoJson** by Benoit Blanchon (gateway only, used to parse+translate the payload).
4. **Radio settings must match exactly between every hive node and the gateway**, not just the frequency: spreading factor (7), signal bandwidth (125 kHz), coding rate (4/5), and sync word (both files use the LoRa library's default — neither calls `setSyncWord()`, so don't add one to only one side). The `.ino` files already have all of these set consistently; if you change one, change it everywhere.
5. Flash both, open Serial Monitor on each. The hive node transmits every `SEND_INTERVAL` (30s by default); the gateway prints every packet it receives (with RSSI/SNR), the translated JSON it forwards, and the resulting `HTTP Response` code from the website — same success path as Option A, just arriving via the gateway.

⚠️ Use the frequency your actual LoRa modules are built for (433 MHz is the common hobbyist band in India) — transmitting on the wrong frequency for your hardware simply won't work.

## Sensors → data model

The sensor model in the app matches the physical prototype exactly — nothing invented. Pins differ slightly between the two firmware options since they're independent files (see each `.ino`'s header comment for its exact wiring):

| Sensor | Field sent to `/api/hive-data` |
|---|---|
| DHT22 | `temperature`, `humidity` |
| Load cell + HX711 | `prototypeWeight` |
| Analog microphone | `soundLevel` |
| Digital vibration sensor | `vibration` (boolean) |

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
