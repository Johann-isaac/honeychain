/*
  HoneyChain — ESP32 Hive Monitor
  ================================

  One ESP32 per hive. Each device has its own HIVE_ID (get this from
  the website: Beekeeper Dashboard → My Hives → Register Hive — the
  generated Hive ID, e.g. "HIVE-001", goes in HIVE_ID below).

  Sensors on this prototype (do not change pins):
    - DHT22            temperature + humidity      -> GPIO 5
    - HX711 + 1x load cell   weight                -> DT=GPIO 27, SCK=GPIO 26
    - Analog microphone      sound level            -> GPIO 34 (ADC1, input-only)
    - Digital vibration sensor                      -> GPIO 25

  Required Arduino libraries (Library Manager):
    - "DHT sensor library" by Adafruit (+ its "Adafruit Unified Sensor" dependency)
    - "HX711" by bogde
    (WiFi and HTTPClient ship with the ESP32 board package — nothing to install.)

  Data flow (see project README for the full picture):
    ESP32 --(HTTPS POST, Bearer token)--> Next.js /api/hive-data --> Supabase

  SECURITY: this firmware holds only a device API key (HIVE_DEVICE_API_KEY),
  never a Supabase key. The Next.js server is the only thing that talks to
  Supabase. If this device key ever leaks, rotate HIVE_DEVICE_API_KEY on the
  server and reflash every device with the new value.

  Serial commands (type into Serial Monitor, 115200 baud, then Enter):
    t  -> tare the load cell (run this with an empty platform)
    c  -> calibration mode (place a known weight, note the reading, compute
          calibration_factor = raw_reading / known_weight_kg)
    r  -> print current sensor readings without sending
    w  -> print WiFi status
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <HX711.h>

// ---------------------------------------------------------------------------
// CONFIGURE THESE BEFORE FLASHING
// ---------------------------------------------------------------------------

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// From the website: Beekeeper Dashboard -> My Hives -> Register Hive.
// Every physical hive must use a DIFFERENT HIVE_ID.
const char* HIVE_ID = "HIVE-001";

// Your deployed HoneyChain URL (or http://<lan-ip>:3000 while testing on
// the same network as your dev machine — HTTP, not HTTPS, for localhost).
const char* SERVER_URL = "https://YOUR-DOMAIN.com/api/hive-data";

// Must match HIVE_DEVICE_API_KEY in the server's .env.local exactly.
const char* DEVICE_API_KEY = "YOUR_DEVICE_API_KEY";

// How often to send a reading. 5 minutes for real deployment; drop to
// something like 10000 (10s) while testing.
const unsigned long SEND_INTERVAL = 300000; // 5 minutes
// const unsigned long SEND_INTERVAL = 10000; // 10 seconds — testing

// Load cell calibration factor. Use the 'c' serial command to find this:
// place a known weight on the platform, read the raw value, then
// calibration_factor = raw_reading / known_weight_kg.
float calibration_factor = 420.0; // <-- REPLACE WITH YOUR OWN CALIBRATION FACTOR

// ---------------------------------------------------------------------------
// Pins — do not change
// ---------------------------------------------------------------------------

#define DHT_PIN 5
#define DHT_TYPE DHT22

#define HX711_DT 27
#define HX711_SCK 26

#define MIC_PIN 34       // ADC1 input-only pin — analog reads only
#define VIBRATION_PIN 25

// ---------------------------------------------------------------------------

DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;

bool hx711Ready = false;
unsigned long lastSendAt = 0;

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(VIBRATION_PIN, INPUT);

  dht.begin();

  scale.begin(HX711_DT, HX711_SCK);
  if (scale.wait_ready_timeout(2000)) {
    scale.set_scale(calibration_factor);
    scale.tare();
    hx711Ready = true;
    Serial.println("HX711 ready and tared.");
  } else {
    hx711Ready = false;
    Serial.println("HX711 NOT DETECTED — weight readings will report 0.");
  }

  connectWiFi();

  Serial.println();
  Serial.println("Ready. Serial commands: t=tare  c=calibrate  r=readings  w=wifi status");
}

void loop() {
  handleSerialCommands();
  ensureWiFiConnected();

  unsigned long now = millis();
  if (now - lastSendAt >= SEND_INTERVAL || lastSendAt == 0) {
    lastSendAt = now;
    sendReading();
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

// ---------------------------------------------------------------------------
// Sensor reads
// ---------------------------------------------------------------------------

struct Reading {
  float temperature;
  float humidity;
  bool dhtOk;
  float weight;
  int soundLevel;
  bool vibration;
};

Reading readAllSensors() {
  Reading r;

  r.humidity = dht.readHumidity();
  r.temperature = dht.readTemperature();
  r.dhtOk = !(isnan(r.humidity) || isnan(r.temperature));
  if (!r.dhtOk) {
    Serial.println("DHT22 READ ERROR");
    r.temperature = 0;
    r.humidity = 0;
  }

  if (hx711Ready && scale.wait_ready_timeout(500)) {
    r.weight = scale.get_units(10); // averaged over 10 samples
    if (r.weight < 0) r.weight = 0;
  } else {
    r.weight = 0;
  }

  // Average multiple ADC samples from the microphone to smooth noise.
  long micSum = 0;
  const int MIC_SAMPLES = 100;
  for (int i = 0; i < MIC_SAMPLES; i++) {
    micSum += analogRead(MIC_PIN);
    delayMicroseconds(200);
  }
  r.soundLevel = micSum / MIC_SAMPLES;

  r.vibration = digitalRead(VIBRATION_PIN) == HIGH;

  return r;
}

void printReading(const Reading &r) {
  Serial.println("========================================");
  Serial.print("       HONEY CHAIN - HIVE ");
  Serial.println(HIVE_ID);
  Serial.println("========================================");
  Serial.print("WiFi        : ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  Serial.print("Temperature : ");
  Serial.print(r.temperature, 1);
  Serial.println(" \xC2\xB0C");
  Serial.print("Humidity    : ");
  Serial.print(r.humidity, 1);
  Serial.println(" %");
  Serial.print("Weight      : ");
  Serial.print(r.weight, 2);
  Serial.println(" kg");
  Serial.print("Sound       : ");
  Serial.println(r.soundLevel);
  Serial.print("Vibration   : ");
  Serial.println(r.vibration ? "DETECTED" : "NORMAL");
  Serial.println("========================================");
}

// ---------------------------------------------------------------------------
// Networking
// ---------------------------------------------------------------------------

void sendReading() {
  Reading r = readAllSensors();
  printReading(r);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping send — WiFi not connected.");
    return;
  }

  // Built by hand (no ArduinoJson dependency) — keep field names/types
  // exactly matching what POST /api/hive-data expects.
  char payload[256];
  snprintf(
    payload, sizeof(payload),
    "{\"hiveId\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f,\"prototypeWeight\":%.2f,\"soundLevel\":%d,\"vibration\":%s}",
    HIVE_ID, r.temperature, r.humidity, r.weight, r.soundLevel, r.vibration ? "true" : "false"
  );

  Serial.println("Sending data...");

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_API_KEY);

  int statusCode = http.POST((uint8_t*)payload, strlen(payload));

  Serial.print("HTTP Response: ");
  Serial.println(statusCode);

  if (statusCode == 200 || statusCode == 201) {
    Serial.println("Data sent successfully");
  } else {
    Serial.print("Send failed. Server said: ");
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

  switch (cmd) {
    case 't':
    case 'T':
      if (hx711Ready) {
        Serial.println("Taring... remove all weight from the platform.");
        scale.tare();
        Serial.println("Tare complete.");
      } else {
        Serial.println("HX711 not detected — cannot tare.");
      }
      break;

    case 'c':
    case 'C':
      calibrationMode();
      break;

    case 'r':
    case 'R': {
      Reading r = readAllSensors();
      printReading(r);
      break;
    }

    case 'w':
    case 'W':
      Serial.print("WiFi status: ");
      Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
      if (WiFi.status() == WL_CONNECTED) {
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
      }
      break;

    default:
      break; // ignore newlines / unknown characters
  }
}

void calibrationMode() {
  if (!hx711Ready) {
    Serial.println("HX711 not detected — cannot calibrate.");
    return;
  }
  Serial.println("--- Calibration mode ---");
  Serial.println("1. Remove all weight, then send 't' to tare (do this first if you haven't).");
  Serial.println("2. Place a known weight on the platform.");
  Serial.println("3. Reading raw units for 10 seconds...");

  scale.set_scale(); // raw mode (factor = 1) so we can read units directly
  unsigned long start = millis();
  while (millis() - start < 10000) {
    if (scale.wait_ready_timeout(500)) {
      long raw = scale.get_units(5);
      Serial.print("Raw reading: ");
      Serial.println(raw);
    }
    delay(500);
  }

  Serial.println("Now compute: calibration_factor = raw_reading / known_weight_kg");
  Serial.println("Update the calibration_factor constant at the top of this file with that value, then re-flash.");

  scale.set_scale(calibration_factor); // restore normal operation
}
