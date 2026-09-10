/*
  =========================================================
       HONEY CHAIN - ESP32 #1 HIVE NODE
  =========================================================

  Sensors:
    DHT22
    Sound Sensor
    Vibration Sensor
    Load Cell + HX711

  Communication:
    SX1278 / Ra-02 LoRa

  Pairs with firmware/esp32_lora_gateway/, which listens for this
  node's LoRa packets and forwards them to the website
  (POST /api/hive-data) over WiFi. This node has no WiFi at all.

  Every radio setting below (frequency, spreading factor, bandwidth,
  coding rate) and every pin must match the gateway exactly, or the
  gateway will not be able to decode this node's packets.
  =========================================================
*/

#include <SPI.h>
#include <LoRa.h>
#include <DHT.h>
#include "HX711.h"

// ========================================================
// HIVE ID
// ========================================================

#define HIVE_ID "HIVE001"

// ========================================================
// DHT22
// ========================================================

#define DHT_PIN 4
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

// ========================================================
// SOUND SENSOR
// ========================================================

#define SOUND_PIN 34

// ========================================================
// VIBRATION SENSOR
// ========================================================

#define VIBRATION_PIN 27

// ========================================================
// HX711
// ========================================================

#define HX711_DT 32
#define HX711_SCK 33

HX711 scale;

// --------------------------------------------------------
// IMPORTANT:
// Calibration factor is different for every load cell.
// Start with this value only as a placeholder.
// You MUST calibrate your load cell.
// --------------------------------------------------------

float calibration_factor = -7050.0;

// ========================================================
// LORA
// ========================================================

#define LORA_SCK 18
#define LORA_MISO 19
#define LORA_MOSI 23
#define LORA_SS 5
#define LORA_RST 14
#define LORA_DIO0 26

// --------------------------------------------------------
// Use the frequency matching YOUR Ra-02 module.
// The code below assumes a 433 MHz SX1278 module.
// --------------------------------------------------------

#define LORA_FREQUENCY 433E6

// ========================================================
// TIMING
// ========================================================

unsigned long lastSendTime = 0;

// Send every 30 seconds
const unsigned long SEND_INTERVAL = 30000;


// ========================================================
// SETUP
// ========================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("     HONEY CHAIN - HIVE NODE");
  Serial.println("================================");

  // ------------------------------------------------------
  // DHT
  // ------------------------------------------------------

  dht.begin();

  Serial.println("DHT22 initialized");


  // ------------------------------------------------------
  // VIBRATION
  // ------------------------------------------------------

  pinMode(VIBRATION_PIN, INPUT);

  Serial.println("Vibration sensor initialized");


  // ------------------------------------------------------
  // SOUND SENSOR
  // ------------------------------------------------------

  pinMode(SOUND_PIN, INPUT);

  Serial.println("Sound sensor initialized");


  // ------------------------------------------------------
  // HX711
  // ------------------------------------------------------

  scale.begin(HX711_DT, HX711_SCK);

  scale.set_scale(calibration_factor);

  Serial.println("HX711 initialized");

  if (scale.is_ready())
  {
    Serial.println("HX711 is ready");
  }
  else
  {
    Serial.println("WARNING: HX711 not detected!");
  }


  // ------------------------------------------------------
  // LORA
  // ------------------------------------------------------

  SPI.begin(
    LORA_SCK,
    LORA_MISO,
    LORA_MOSI,
    LORA_SS
  );

  LoRa.setPins(
    LORA_SS,
    LORA_RST,
    LORA_DIO0
  );

  Serial.println("Starting LoRa...");

  if (!LoRa.begin(LORA_FREQUENCY))
  {
    Serial.println("ERROR: LoRa initialization failed!");

    while (true)
    {
      delay(1000);
    }
  }

  // Optional radio settings
  LoRa.setTxPower(17);
  LoRa.setSpreadingFactor(7);
  LoRa.setSignalBandwidth(125E3);
  LoRa.setCodingRate4(5);

  Serial.println("LoRa initialized successfully");

  Serial.println();
  Serial.println("Hive node ready.");
}


// ========================================================
// READ SOUND LEVEL
// ========================================================

int readSoundLevel()
{
  long total = 0;

  const int samples = 100;

  for (int i = 0; i < samples; i++)
  {
    int value = analogRead(SOUND_PIN);

    total += value;

    delayMicroseconds(500);
  }

  return total / samples;
}


// ========================================================
// READ VIBRATION
// ========================================================

bool readVibration()
{
  int vibrationState = digitalRead(VIBRATION_PIN);

  // Most SW-420 modules:
  // HIGH = vibration detected
  // LOW  = no vibration

  return vibrationState == HIGH;
}


// ========================================================
// READ WEIGHT
// ========================================================

float readWeight()
{
  if (!scale.is_ready())
  {
    Serial.println("HX711 not ready");

    return -1.0;
  }

  // Average 10 readings
  float weight = scale.get_units(10);

  // Prevent tiny negative values
  if (weight < 0 && weight > -0.5)
  {
    weight = 0;
  }

  return weight;
}


// ========================================================
// SEND DATA USING LORA
// ========================================================

void sendSensorData()
{
  // ------------------------------------------------------
  // DHT22
  // ------------------------------------------------------

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();


  // ------------------------------------------------------
  // SOUND
  // ------------------------------------------------------

  int soundLevel = readSoundLevel();


  // ------------------------------------------------------
  // VIBRATION
  // ------------------------------------------------------

  bool vibration = readVibration();


  // ------------------------------------------------------
  // WEIGHT
  // ------------------------------------------------------

  float weight = readWeight();


  // ------------------------------------------------------
  // Check DHT
  // ------------------------------------------------------

  if (isnan(temperature) || isnan(humidity))
  {
    Serial.println("ERROR: DHT22 reading failed!");

    temperature = -999;
    humidity = -999;
  }


  // ------------------------------------------------------
  // CREATE JSON
  // ------------------------------------------------------

  String json = "{";

  json += "\"hive_id\":\"";
  json += HIVE_ID;
  json += "\",";

  json += "\"temperature\":";
  json += String(temperature, 2);
  json += ",";

  json += "\"humidity\":";
  json += String(humidity, 2);
  json += ",";

  json += "\"sound_level\":";
  json += String(soundLevel);
  json += ",";

  json += "\"vibration\":";
  json += (vibration ? "true" : "false");
  json += ",";

  json += "\"hive_weight\":";
  json += String(weight, 2);

  json += "}";


  // ------------------------------------------------------
  // SERIAL MONITOR
  // ------------------------------------------------------

  Serial.println();
  Serial.println("========== SENSOR DATA ==========");

  Serial.print("Hive ID       : ");
  Serial.println(HIVE_ID);

  Serial.print("Temperature   : ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity      : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Sound Level   : ");
  Serial.println(soundLevel);

  Serial.print("Vibration     : ");
  Serial.println(vibration ? "DETECTED" : "NORMAL");

  Serial.print("Hive Weight   : ");
  Serial.print(weight);
  Serial.println(" kg");

  Serial.println("---------------------------------");

  Serial.println("LoRa packet:");
  Serial.println(json);


  // ------------------------------------------------------
  // SEND LORA
  // ------------------------------------------------------

  LoRa.beginPacket();

  LoRa.print(json);

  int result = LoRa.endPacket();

  if (result == 1)
  {
    Serial.println("LoRa transmission successful!");
  }
  else
  {
    Serial.println("LoRa transmission failed!");
  }

  Serial.println("=================================");
}


// ========================================================
// LOOP
// ========================================================

void loop()
{
  unsigned long currentTime = millis();

  if (currentTime - lastSendTime >= SEND_INTERVAL)
  {
    lastSendTime = currentTime;

    sendSensorData();
  }

  // ------------------------------------------------------
  // OPTIONAL SERIAL COMMANDS
  // ------------------------------------------------------

  if (Serial.available())
  {
    char command = Serial.read();

    // Press 't' to tare the load cell
    if (command == 't' || command == 'T')
    {
      Serial.println();
      Serial.println("Taring load cell...");
      Serial.println("Remove all weight from the load cell!");

      delay(3000);

      scale.tare(20);

      Serial.println("Tare complete!");
    }
  }
}
