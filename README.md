# HoneyChain

A blockchain-based honey traceability platform (SIH) with a real ESP32 hive-monitoring pipeline. Connects **ESP32 sensors → Supabase → Beekeeper Dashboard → Honey Batches → Blockchain Verification → Consumers**.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4, Recharts, Lucide icons
- **Supabase (Postgres)** for all persistence — schema in [`supabase/schema.sql`](supabase/schema.sql)
- Mock blockchain provider (`lib/blockchainService.ts`) — clearly labeled "Demo Blockchain Transaction" everywhere in the UI
- **AI hive prediction via OpenRouter** (`lib/aiPredictionService.ts`) — on-demand call, through [OpenRouter](https://openrouter.ai)'s unified API, that reads a hive's recent sensor history and predicts colony health (see "AI features" below)
- ESP32 firmware — two options depending on whether a hive has WiFi (see "Registering a hive" below):
  - [`firmware/esp32_hive_monitor/`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino) — direct WiFi, one device per hive
  - [`firmware/esp32_hive_node_lora/`](firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino) + [`firmware/esp32_lora_gateway/`](firmware/esp32_lora_gateway/esp32_lora_gateway.ino) — for hives with no WiFi coverage, relayed over a 433 MHz LoRa link to one WiFi gateway
- `jsqr` for in-browser QR scanning via the device camera

Beekeepers sign up and log in with a username/password (`/signup`, `/login`); every `/beekeeper/*` page and beekeeper-scoped API route is gated on that session by `proxy.ts`. Each beekeeper can register many hives, each with its own ESP32 **and its own device secret** — a hive's secret is generated once at registration and is the only thing that lets that specific ESP32 post readings; it's unrelated to the beekeeper's login password.

## One-time setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New Project. Once it's created:

1. Open the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all tables (`beekeepers`, `hives`, `sensor_readings`, `alerts`, `honey_batches`, `blockchain_records`) with Row Level Security enabled and no policies — meaning only the `service_role` key (used server-side only, never in the browser) can touch them.
2. Go to **Project Settings → API** and copy the **Project URL** and the **`service_role`** secret key (not the `anon` key).

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from step 1, and set `SESSION_SECRET` to any long random string (e.g. `openssl rand -hex 32`) — this signs beekeeper login sessions. See the comments in `.env.local.example` for every variable.

If you already had a project from before beekeeper login existed, run this once in the Supabase SQL Editor to add the new columns (also folded into `supabase/schema.sql` for fresh installs):

```sql
alter table beekeepers add column if not exists username text unique;
alter table beekeepers add column if not exists password_hash text;
alter table hives add column if not exists device_secret_hash text;
alter table hives add column if not exists ai_insight jsonb;
alter table hives add column if not exists ai_insight_generated_at timestamptz;
```

To use the AI Hive Prediction card, get a key from [openrouter.ai/keys](https://openrouter.ai/keys) and set `OPENROUTER_API_KEY` in `.env.local`. It's optional — without it, that one card shows an error but the rest of the app works normally. It defaults to OpenRouter's free auto-router (no cost, no card needed); see `.env.local.example` for how to point it at a specific paid model like Grok instead.

### 3. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, then go to `/signup` to create your beekeeper account.

## Registering a hive and flashing the ESP32

Either path ends the same way: the website's `POST /api/hive-data` never changes, and neither does the JSON payload shape. Start with:

On the website: sign in, then `/beekeeper/hives` → **Register Hive**. This generates a unique **Hive ID** (e.g. `HIVE-001`) and a **device secret** — shown once, right there. Every ESP32 maps 1:1 to a `hive_code` and needs that hive's own secret; one beekeeper account can have many hives/devices, each independently paired.

⚠️ The device secret is shown exactly once, immediately after registration. If you lose it, there's no way to retrieve it — remove the hive from the dashboard and register it again to get a new one.

### Option A — hive has WiFi coverage

1. Open [`firmware/esp32_hive_monitor/esp32_hive_monitor.ino`](firmware/esp32_hive_monitor/esp32_hive_monitor.ino) in the Arduino IDE and fill in the placeholders at the top: WiFi credentials, `HIVE_ID`, `SERVER_URL` (your deployed domain, or `http://<your-lan-ip>:3000` while testing on the same network), and `DEVICE_SECRET` (the one shown when you registered this hive).
2. Install the two required Arduino libraries: **DHT sensor library** (Adafruit) and **HX711** (bogde). WiFi/HTTPClient ship with the ESP32 board package.
3. Flash it, open Serial Monitor at 115200 baud. Send `t` to tare the load cell with an empty platform, and `c` to calibrate against a known weight (instructions print to Serial).
4. Once WiFi connects, the device posts a reading every `SEND_INTERVAL` (5 minutes by default — drop to 10 seconds while testing) directly to `POST /api/hive-data`.

### Option B — hive has NO WiFi coverage (433 MHz LoRa)

One hive node per hive (sensors + LoRa transmitter, no WiFi needed), relaying through a single shared gateway (LoRa receiver + WiFi) placed anywhere with internet access. The gateway needs no per-hive setup — it just forwards whatever it hears, using whatever device secret each hive node sends along with its own reading.

```
Hive node (sensors + LoRa TX)  --433 MHz-->  Gateway (LoRa RX + WiFi)  --HTTPS-->  /api/hive-data
```

The hive node sends its own field names (`hive_id`, `sound_level`, `hive_weight`, `device_secret`) to keep its firmware simple — the **gateway translates these to what `/api/hive-data` expects** (`hiveId`, `soundLevel`, `prototypeWeight`, and the secret as an `Authorization: Bearer` header) before forwarding, so neither the hive node's code nor the website's API had to change to match the other.

1. **Per hive**, flash [`firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino`](firmware/esp32_hive_node_lora/esp32_hive_node_lora.ino) onto that hive's ESP32.
   - ⚠️ **`HIVE_ID` must exactly match the Hive ID the website generated** when you clicked Register Hive (e.g. `HIVE-001`, with the dash) — the placeholder in the file is `HIVE001` without a dash and needs to be changed per hive, or the server will reject it as unknown.
   - Set `DEVICE_SECRET` to the secret shown for this hive at registration. Every hive has a different one.
   - Calibrate the load cell: send `t` over Serial to tare, place a known weight, watch the raw output, then compute and hardcode `calibration_factor = raw_reading / known_weight_kg` at the top of the file.
2. **Once**, flash [`firmware/esp32_lora_gateway/esp32_lora_gateway.ino`](firmware/esp32_lora_gateway/esp32_lora_gateway.ino) onto a separate ESP32 that has WiFi/internet access, filling in WiFi credentials and `SERVER_URL`. This one needs no `HIVE_ID` and no device secret of its own — it reads each hive's secret back out of the packet it just received and forwards it.
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

## AI features

Two separate systems are both labeled "AI" in the UI, deliberately kept apart because they have very different cost/reliability tradeoffs:

- **AI Hive Health Score** (`lib/aiHealthService.ts`) — deterministic, rule-based scoring straight from sensor thresholds (no external API, no cost, instant, same inputs always give the same output). Runs on every page load. This is what powers yield prediction and auto-generated alerts too.
- **AI Hive Prediction** (`lib/aiPredictionService.ts`) — a genuine LLM call through [OpenRouter](https://openrouter.ai/docs), triggered only when a beekeeper clicks "Analyze with AI" on a hive's detail page (never automatically, since it's a real request with real latency/cost). It sends up to the last 100 sensor readings plus hive metadata (queen age/status, colony strength) and asks the model to return a structured JSON verdict: `healthStatus` (HEALTHY / AT_RISK / CRITICAL), a confidence score, a plain-language summary, risk factors, and recommendations. The result is cached on the hive row (`hives.ai_insight`, `ai_insight_generated_at`) so it survives a page refresh until re-analyzed.
  - Which underlying model actually answers is just `OPENROUTER_MODEL` — defaults to OpenRouter's `openrouter/free` auto-router (always resolves to a currently-available free model, $0 cost), and can be pointed at a specific paid model like `x-ai/grok-4-fast` with no code change, once there are OpenRouter credits for it.

### Adding a camera later

Ideas for extending this once a camera is added to the physical prototype:

- **Entrance traffic counting** — a fixed camera on the hive entrance, frame-differencing or simple optical flow to count bees in/out per minute. Feeds a new `beeTraffic` field alongside the existing four sensors, useful as another health signal (traffic collapsing is often an earlier warning than weight or sound).
- **Varroa mite / pest detection** — a macro lens periodically photographing the brood frame or landing board; many OpenRouter-hosted models accept image inputs (e.g. Grok's vision-capable variants, or Gemini/Qwen-VL models), which can be added directly in the same chat-completions call used in `lib/aiPredictionService.ts` — attach the frame photo as an image content block alongside the existing sensor-data prompt, and ask the model to flag visible pests, mold, or abnormal brood pattern.
- **Queen spotting / swarm precursor detection** — periodic images classified for queen cells or unusual clustering near the entrance (a swarming precursor), correlated with the existing vibration sensor for a stronger swarm-risk signal than either alone.
- **Combining image + sensor analysis in one call** — since `analyzeHiveHealth()` already builds a text prompt from sensor history, the natural next step is a multimodal prompt: keep the sensor time-series as text, add the latest 1-2 camera frames as image inputs (switch `OPENROUTER_MODEL` to a vision-capable one), and extend the requested JSON shape with an optional `visualFindings` field — no architecture change needed, just a richer prompt and response schema.
- **Bandwidth/power constraint**: an ESP32-CAM (or similar) on battery/solar can't stream continuously — capture on a timer (e.g. hourly) or trigger capture from an anomaly (vibration sensor fires → take a photo) rather than constant recording, and upload only the photo needed for that analysis cycle.

## Demo flow

1. Register a hive, flash its ESP32, and watch real readings land on `/beekeeper/hives/<id>` (Temperature / Humidity / Weight / Sound Level / Vibration tabs, AI Hive Health Score, yield prediction).
2. Create a batch at `/beekeeper/batches/new` — it's registered on the (demo) blockchain automatically as part of creation, no separate approval step.
3. The batch detail page shows the blockchain proof and generates a QR code immediately.
4. Scan the QR (or visit `/verify/<batchCode>`) to see the full public traceability record: origin, hive conditions at harvest, blockchain proof, and timeline.

## Architecture notes

- `lib/supabase/server.ts` is the only place the Supabase `service_role` key is read — it's a server-only lazy singleton, never bundled to the client.
- `lib/db.ts` is the only file that queries Supabase. Every function is async; page components and API routes `await` them. Row-to-domain mapping (`snake_case` → `camelCase`) happens here so the rest of the app never sees raw DB columns — password and device-secret hashes in particular are never included in a `map*` result, so they can't accidentally leak into a JSON response.
- **Two independent auth systems, deliberately kept apart:**
  - **Beekeeper login** (`lib/auth.ts`): username + bcrypt-hashed password, session held in an `hc_session` httpOnly cookie (a `jose`-signed JWT carrying the beekeeper id). `proxy.ts` blocks every `/beekeeper/*` page and beekeeper-scoped `/api/*` route without a valid session — pages redirect to `/login`, API routes get a 401. `getCurrentBeekeeperId()` reads that session server-side; nothing trusts a client-supplied beekeeper id.
  - **Hive device auth**: each hive gets its own secret (`generateDeviceSecret()`), generated once at registration and shown to the beekeeper exactly once — only its bcrypt hash (`hives.device_secret_hash`) is stored. `POST /api/hive-data` checks the ESP32's `Authorization: Bearer <secret>` against that specific hive's hash (`verifyHiveDeviceSecret`), so one hive's credential can never be replayed under a different hive's id, and neither auth system can be used to access the other.
- `POST /api/hive-data` is the only endpoint an ESP32 ever calls, and the only one a beekeeper session can't get into (it's gated by device secret, not login). It resolves `hiveId` to a hive, verifies that hive's secret, validates every field's type and range, and inserts one `sensor_readings` row. Malformed or unauthenticated requests never reach Supabase.
- `lib/blockchainService.ts` exposes a `BlockchainProvider` interface; the shipped `MockBlockchainProvider` can be swapped for a real Polygon/Ethereum/Hyperledger implementation behind the same interface. `createBatch()` in `lib/db.ts` calls it as part of batch creation.
- `lib/aiHealthService.ts` is deterministic (no `Math.random` at call time) — the same sensor inputs always produce the same health score, yield prediction, and alerts. `getBeekeeperYieldForecast()` in `lib/db.ts` aggregates every hive's prediction into the dashboard's "Next Expected Yield" feature.
- `lib/aiPredictionService.ts` is the only file that calls OpenRouter. Since the model behind `OPENROUTER_MODEL` can be anything (including free models that don't reliably honor JSON mode), it doesn't depend on `response_format` — the prompt asks for JSON-only and the response is defensively extracted and validated on the way back (clamped confidence, whitelisted `healthStatus`, capped array lengths), since an LLM response is untrusted input, not a typed function return. `POST /api/hives/[id]/ai-insight` is the only route that calls it, and only on an explicit beekeeper click — never from a page render, a cron, or another API route.
- Consumer-facing data (`getPublicVerification` in `lib/db.ts`) is a deliberately narrow projection — it never exposes beekeeper contact details or exact coordinates. It's also the one part of the app that's intentionally public: `/verify/*` and `/api/verify/*` are excluded from `proxy.ts`'s auth gate on purpose.
