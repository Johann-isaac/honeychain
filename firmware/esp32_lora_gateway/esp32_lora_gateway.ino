/*
  HoneyChain — LoRa-to-WiFi Gateway
  ==================================

  Pairs with firmware/esp32_hive_node_lora/ (HONEY CHAIN - ESP32 #1 HIVE
  NODE). This ESP32 has WiFi and sits somewhere with internet access. It
  listens for LoRa packets from any number of hive nodes and forwards
  each one to the website:

    Hive node(s) --(LoRa, 433 MHz)--> Gateway (this file) --(HTTPS POST)--> /api/hive-data --> Supabase

  There is exactly ONE gateway needed no matter how many hives you have —
  every hive node embeds its own hive_id inside the packet it transmits.

  FIELD NAME TRANSLATION: the hive node sends snake_case fields
  (hive_id, sound_level, hive_weight) to keep its own code simple. The
  website's /api/hive-data expects camelCase (hiveId, soundLevel,
  prototypeWeight) — see app/api/hive-data/route.ts. Rather than change
  either the hive node firmware or the website API, this gateway
  translates one to the other. That keeps the backend contract stable
  even if you later add different sensor nodes with their own field
  names.

  RADIO SETTINGS MUST MATCH THE HIVE NODE EXACTLY, OR PACKETS WILL NOT
  DECODE: frequency, spreading factor, signal bandwidth, coding rate,
  and sync word (this project uses the LoRa library's default sync word
  on both ends — neither file calls setSyncWord()).

  LoRa module (SX1278 / "Ra-02" style, 433 MHz) wiring — must match the
  hive node's SPI bus pins (SCK/MISO/MOSI are shared hardware SPI pins;
  SS/RST/DIO0 can differ per board, but these are what the hive node
  uses and are known-good on the ESP32, so this gateway uses the same):
    - SS   (a.k.a. NSS/CS) -> GPIO 5
    - RST                  -> GPIO 14
    - DIO0                 -> GPIO 26
    - SCK                  -> GPIO 18
    - MISO                 -> GPIO 19
    - MOSI                 -> GPIO 23
    - VCC                  -> 3.3V ONLY (5V will damage most of these modules)
    - GND                  -> GND

  Required Arduino libraries (Library Manager):
    - "LoRa" by Sandeep Mistry
    - "ArduinoJson" by Benoit Blanchon
    (WiFi and HTTPClient ship with the ESP32 board package — nothing to install.)

  Serial commands (type into Serial Monitor, 115200 baud, then Enter):
    w  -> print WiFi status
*/

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ---------------------------------------------------------------------------
// CONFIGURE THESE BEFORE FLASHING
// ---------------------------------------------------------------------------

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Your deployed HoneyChain URL (or http://<lan-ip>:3000 while testing on
// the same network as your dev machine — HTTP, not HTTPS, for localhost).
const char* SERVER_URL = "https://YOUR-DOMAIN.com/api/hive-data";

// Must match HIVE_DEVICE_API_KEY in the server's .env.local exactly.
const char* DEVICE_API_KEY = "YOUR_DEVICE_API_KEY";

// ---------------------------------------------------------------------------
// Radio settings — must match every hive node's setup() exactly
// ---------------------------------------------------------------------------

#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26

#define LORA_FREQUENCY 433E6

// ---------------------------------------------------------------------------

bool loraReady = false;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("   HONEY CHAIN - LORA GATEWAY");
  Serial.println("================================");

  initLoRa();
  connectWiFi();

  Serial.println();
  Serial.println("Gateway ready — listening for hive nodes. Serial commands: w=wifi status");
}

void loop() {
  handleSerialCommands();
  ensureWiFiConnected();
  ensureLoRaReady();

  int packetSize = LoRa.parsePacket();
  if (packetSize > 0) {
    handleIncomingPacket(packetSize);
  }
}

// ---------------------------------------------------------------------------
// LoRa init
// ---------------------------------------------------------------------------

void initLoRa() {
  SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_SS);
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);

  Serial.println("Starting LoRa...");

  if (!LoRa.begin(LORA_FREQUENCY)) {
    Serial.println("ERROR: LoRa initialization failed! Will retry in loop().");
    loraReady = false;
    return;
  }

  // Must be identical to every hive node's radio settings.
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);

  loraReady = true;
  Serial.println("LoRa initialized successfully — listening.");
}

void ensureLoRaReady() {
  if (loraReady) return;
  initLoRa();
}

// ---------------------------------------------------------------------------
// WiFi
// ---------------------------------------------------------------------------

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed — will keep retrying in the background.");
  }
}

void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected — reconnecting...");
    connectWiFi();
  }
}

// ---------------------------------------------------------------------------
// LoRa receive -> translate -> HTTP forward
// ---------------------------------------------------------------------------

void handleIncomingPacket(int packetSize) {
  String raw;
  raw.reserve(packetSize + 1);
  while (LoRa.available()) {
    raw += (char)LoRa.read();
  }

  int rssi = LoRa.packetRssi();
  float snr = LoRa.packetSnr();

  Serial.println("----------------------------------------");
  Serial.print("LoRa packet received (");
  Serial.print(packetSize);
  Serial.println(" bytes)");
  Serial.print("RSSI: ");
  Serial.print(rssi);
  Serial.print(" dBm   SNR: ");
  Serial.println(snr);
  Serial.print("Raw payload: ");
  Serial.println(raw);

  String translated;
  if (!translatePayload(raw, translated)) {
    Serial.println("Ignoring — payload could not be translated (see error above).");
    return;
  }

  Serial.print("Forwarding as: ");
  Serial.println(translated);

  forwardToServer(translated);
}

// Converts the hive node's { hive_id, temperature, humidity, sound_level,
// vibration, hive_weight } into what POST /api/hive-data expects:
// { hiveId, temperature, humidity, prototypeWeight, soundLevel, vibration }.
bool translatePayload(const String &raw, String &outJson) {
  JsonDocument in;
  DeserializationError err = deserializeJson(in, raw);
  if (err) {
    Serial.print("JSON parse failed: ");
    Serial.println(err.c_str());
    return false;
  }

  if (!in["hive_id"].is<const char*>()) {
    Serial.println("Missing hive_id in payload.");
    return false;
  }

  JsonDocument out;
  out["hiveId"] = in["hive_id"].as<const char*>();
  out["temperature"] = in["temperature"].as<float>();
  out["humidity"] = in["humidity"].as<float>();
  out["prototypeWeight"] = in["hive_weight"].as<float>();
  out["soundLevel"] = in["sound_level"].as<int>();
  out["vibration"] = in["vibration"].as<bool>();

  serializeJson(out, outJson);
  return true;
}

void forwardToServer(const String &payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot forward — WiFi not connected. Reading dropped.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_API_KEY);

  int statusCode = http.POST(payload);

  Serial.print("Forwarded to server. HTTP Response: ");
  Serial.println(statusCode);

  if (statusCode == 200 || statusCode == 201) {
    Serial.println("Data relayed successfully");
  } else {
    Serial.print("Relay failed. Server said: ");
    Serial.println(http.getString());
  }

  http.end();
}

// ---------------------------------------------------------------------------
// Serial commands
// ---------------------------------------------------------------------------

void handleSerialCommands() {
  if (!Serial.available()) return;
  char cmd = Serial.read();

  if (cmd == 'w' || cmd == 'W') {
    Serial.print("WiFi status: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    }
  }
}
