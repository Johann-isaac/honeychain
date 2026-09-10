/*
  HoneyChain — LoRa-to-WiFi Gateway
  ==================================

  Pairs with firmware/esp32_hive_node_lora/. This ESP32 has WiFi and sits
  somewhere with internet access (e.g. the beekeeper's house). It listens
  for LoRa packets from any number of hive nodes and forwards each one,
  unmodified, to the website:

    Hive node(s) --(LoRa, 433 MHz)--> Gateway (this file) --(HTTPS POST)--> /api/hive-data --> Supabase

  There is exactly ONE gateway needed no matter how many hives you have —
  every hive node already embeds its own HIVE_ID inside the JSON payload
  it transmits, so this file needs no per-hive configuration at all.

  LoRa module (SX1278 / "Ra-02" style, 433 MHz) wiring — do not change,
  and must match firmware/esp32_hive_node_lora/ exactly:
    - NSS  (a.k.a. CS)  -> GPIO 15
    - RST               -> GPIO 14
    - DIO0              -> GPIO 2
    - SCK               -> GPIO 18   (hardware VSPI)
    - MISO              -> GPIO 19   (hardware VSPI)
    - MOSI              -> GPIO 23   (hardware VSPI)
    - VCC               -> 3.3V ONLY (5V will damage most of these modules)
    - GND               -> GND

  Required Arduino libraries (Library Manager):
    - "LoRa" by Sandeep Mistry
    (WiFi and HTTPClient ship with the ESP32 board package — nothing to install.)

  Serial commands (type into Serial Monitor, 115200 baud, then Enter):
    w  -> print WiFi status
*/

#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <HTTPClient.h>

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

// Must match every hive node's LORA_FREQUENCY exactly.
const long LORA_FREQUENCY = 433E6;

// ---------------------------------------------------------------------------
// Pins — do not change
// ---------------------------------------------------------------------------

#define LORA_NSS 15
#define LORA_RST 14
#define LORA_DIO0 2

// ---------------------------------------------------------------------------

bool loraReady = false;

void setup() {
  Serial.begin(115200);
  delay(300);

  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (LoRa.begin(LORA_FREQUENCY)) {
    LoRa.setSyncWord(0xA5); // must match every hive node
    loraReady = true;
    Serial.println("LoRa radio ready — listening for hive nodes.");
  } else {
    loraReady = false;
    Serial.println("LoRa init FAILED — check wiring. Retrying in loop().");
  }

  connectWiFi();

  Serial.println();
  Serial.println("Gateway ready. Serial commands: w=wifi status");
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

void ensureLoRaReady() {
  if (loraReady) return;
  loraReady = LoRa.begin(LORA_FREQUENCY);
  if (loraReady) {
    LoRa.setSyncWord(0xA5);
    Serial.println("LoRa radio recovered.");
  }
}

// ---------------------------------------------------------------------------
// LoRa receive -> HTTP forward
// ---------------------------------------------------------------------------

void handleIncomingPacket(int packetSize) {
  String payload;
  payload.reserve(packetSize + 1);
  while (LoRa.available()) {
    payload += (char)LoRa.read();
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
  Serial.print("Payload: ");
  Serial.println(payload);

  if (!looksLikeJsonObject(payload)) {
    Serial.println("Ignoring — payload doesn't look like a JSON object.");
    return;
  }

  forwardToServer(payload);
}

bool looksLikeJsonObject(const String &s) {
  String trimmed = s;
  trimmed.trim();
  return trimmed.length() > 0 && trimmed.startsWith("{") && trimmed.endsWith("}");
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
