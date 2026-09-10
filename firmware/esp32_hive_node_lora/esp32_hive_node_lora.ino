/*
  HoneyChain — ESP32 Hive Node (LoRa version, no WiFi)
  =====================================================

  Use this instead of firmware/esp32_hive_monitor/ when the hive has no
  WiFi coverage. This node reads the same sensors as before, but instead
  of posting directly to the website over WiFi, it transmits a compact
  JSON payload over a 433 MHz LoRa radio to a separate "gateway" ESP32
  (see firmware/esp32_lora_gateway/), which is the one that actually has
  WiFi and forwards the reading to the website.

    Hive node (this file, no WiFi)
      --(LoRa, 433 MHz)-->
    Gateway (WiFi)
      --(HTTPS POST, Bearer token)--> Next.js /api/hive-data --> Supabase

  The website and /api/hive-data endpoint do NOT change for this setup —
  the gateway just relays the exact same JSON this node already builds.

  One ESP32 per hive, same as before. Each device has its own HIVE_ID
  (get this from the website: Beekeeper Dashboard → My Hives → Register
  Hive — the generated Hive ID, e.g. "HIVE-001", goes in HIVE_ID below).
  Many hive nodes can share one gateway — the gateway doesn't need any
  per-hive configuration, since each node's own HIVE_ID travels inside
  its payload.

  Sensors on this prototype (do not change pins):
    - DHT22            temperature + humidity      -> GPIO 5
    - HX711 + 1x load cell   weight                -> DT=GPIO 27, SCK=GPIO 26
    - Analog microphone      sound level            -> GPIO 34 (ADC1, input-only)
    - Digital vibration sensor                      -> GPIO 25

  LoRa module (SX1278 / "Ra-02" style, 433 MHz) wiring — do not change:
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
    - "DHT sensor library" by Adafruit (+ its "Adafruit Unified Sensor" dependency)
    - "HX711" by bogde

  Serial commands (type into Serial Monitor, 115200 baud, then Enter):
    t  -> tare the load cell (run this with an empty platform)
    c  -> calibration mode (place a known weight, note the reading, compute
          calibration_factor = raw_reading / known_weight_kg)
    r  -> print current sensor readings without sending
    s  -> send one reading right now over LoRa (doesn't wait for SEND_INTERVAL)
*/

#include <SPI.h>
#include <LoRa.h>
#include <DHT.h>
#include <HX711.h>

// ---------------------------------------------------------------------------
// CONFIGURE THESE BEFORE FLASHING
// ---------------------------------------------------------------------------

// From the website: Beekeeper Dashboard -> My Hives -> Register Hive.
// Every physical hive must use a DIFFERENT HIVE_ID.
const char* HIVE_ID = "HIVE-001";

// India's common hobbyist LoRa modules are 433 MHz. This MUST match the
// frequency set in firmware/esp32_lora_gateway/ exactly, and must match
// what your specific module actually is (check the module/listing —
// using the wrong frequency for your hardware will simply not transmit).
const long LORA_FREQUENCY = 433E6;

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

#define LORA_NSS 15
#define LORA_RST 14
#define LORA_DIO0 2

// ---------------------------------------------------------------------------

DHT dht(DHT_PIN, DHT_TYPE);
HX711 scale;

bool hx711Ready = false;
bool loraReady = false;
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

  LoRa.setPins(LORA_NSS, LORA_RST, LORA_DIO0);
  if (LoRa.begin(LORA_FREQUENCY)) {
    LoRa.setSyncWord(0xA5); // must match the gateway; keeps other nearby LoRa traffic out
    loraReady = true;
    Serial.println("LoRa radio ready.");
  } else {
    loraReady = false;
    Serial.println("LoRa init FAILED — check wiring. Will keep retrying each send.");
  }

  Serial.println();
  Serial.println("Ready. Serial commands: t=tare  c=calibrate  r=readings  s=send now");
}

void loop() {
  handleSerialCommands();

  unsigned long now = millis();
  if (now - lastSendAt >= SEND_INTERVAL || lastSendAt == 0) {
    lastSendAt = now;
    sendReading();
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
  Serial.print("LoRa radio  : ");
  Serial.println(loraReady ? "READY" : "NOT DETECTED");
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
// LoRa transmit
// ---------------------------------------------------------------------------

void sendReading() {
  Reading r = readAllSensors();
  printReading(r);

  if (!loraReady) {
    Serial.println("Retrying LoRa init before send...");
    loraReady = LoRa.begin(LORA_FREQUENCY);
    if (loraReady) LoRa.setSyncWord(0xA5);
  }

  if (!loraReady) {
    Serial.println("Skipping send — LoRa radio not available.");
    return;
  }

  // Same JSON shape /api/hive-data expects — the gateway forwards this
  // string as-is, it does not repackage it.
  char payload[200];
  snprintf(
    payload, sizeof(payload),
    "{\"hiveId\":\"%s\",\"temperature\":%.1f,\"humidity\":%.1f,\"prototypeWeight\":%.2f,\"soundLevel\":%d,\"vibration\":%s}",
    HIVE_ID, r.temperature, r.humidity, r.weight, r.soundLevel, r.vibration ? "true" : "false"
  );

  Serial.println("Transmitting over LoRa...");
  LoRa.beginPacket();
  LoRa.print(payload);
  int result = LoRa.endPacket();

  Serial.println(result == 1 ? "LoRa packet sent" : "LoRa send FAILED");
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

    case 's':
    case 'S':
      Serial.println("Manual send requested.");
      lastSendAt = millis();
      sendReading();
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
