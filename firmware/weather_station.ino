// ═══════════════════════════════════════════════════════════════════
// weather_station.ino — IoT Weather Station Firmware
// ═══════════════════════════════════════════════════════════════════
//
// Supports: ESP32 and ESP8266 (NodeMCU)
// Sensors:  BME280, SCD41, LTR390, Anemometer
// Protocol: HTTP POST over Wi-Fi to Express.js backend
//

#include "config.h"

// ─── Platform-specific includes ─────────────────────────────────
#if defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
  #include <WiFiClient.h>
#endif

#include <Wire.h>
#include <ArduinoJson.h>

// ─── Sensor Libraries ───────────────────────────────────────────
#if ENABLE_BME280
  #include <Adafruit_BME280.h>
#endif

#if ENABLE_SCD41
  #include <SensirionI2CScd4x.h>
#endif

#if ENABLE_LTR390
  #include <Adafruit_LTR390.h>
#endif

// ═══════════════════════════════════════════════════════════════════
// Global Objects & Variables
// ═══════════════════════════════════════════════════════════════════

#if ENABLE_BME280
  Adafruit_BME280 bme;
  bool bmeReady = false;
#endif

#if ENABLE_SCD41
  SensirionI2CScd4x scd41;
  bool scdReady = false;
#endif

#if ENABLE_LTR390
  Adafruit_LTR390 ltr;
  bool ltrReady = false;
#endif

// ─── Anemometer ISR variables ───────────────────────────────────
#if ENABLE_ANEMOMETER
  volatile unsigned long anemometerPulseCount = 0;
  volatile unsigned long lastPulseTime = 0;
  unsigned long lastWindCalcTime = 0;
  float windSpeedKmh = 0.0;

  #if defined(ESP32)
    void IRAM_ATTR anemometerISR() {
  #elif defined(ESP8266)
    ICACHE_RAM_ATTR void anemometerISR() {
  #endif
      unsigned long now = millis();
      if (now - lastPulseTime >= ANEMOMETER_DEBOUNCE_MS) {
        anemometerPulseCount++;
        lastPulseTime = now;
      }
    }
#endif

// Timing
unsigned long lastReadTime = 0;

// ═══════════════════════════════════════════════════════════════════
// Wi-Fi Management
// ═══════════════════════════════════════════════════════════════════

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("\n📶 Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < WIFI_MAX_RETRIES) {
    delay(WIFI_RETRY_DELAY_MS);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Wi-Fi connected!");
    Serial.print("   IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Wi-Fi connection failed. Will retry on next loop.");
  }
}

// ═══════════════════════════════════════════════════════════════════
// Sensor Initialization
// ═══════════════════════════════════════════════════════════════════

void initSensors() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  // ── BME280 (Temperature, Humidity, Pressure) ──────────────────
  #if ENABLE_BME280
    bmeReady = bme.begin(0x76, &Wire);
    if (!bmeReady) {
      bmeReady = bme.begin(0x77, &Wire); // Try alternate address
    }
    if (bmeReady) {
      bme.setSampling(
        Adafruit_BME280::MODE_NORMAL,
        Adafruit_BME280::SAMPLING_X2,   // temperature
        Adafruit_BME280::SAMPLING_X16,  // pressure
        Adafruit_BME280::SAMPLING_X1,   // humidity
        Adafruit_BME280::FILTER_X16,
        Adafruit_BME280::STANDBY_MS_500
      );
      Serial.println("✅ BME280 initialized");
    } else {
      Serial.println("⚠️  BME280 not found");
    }
  #endif

  // ── SCD41 (CO2) ──────────────────────────────────────────────
  #if ENABLE_SCD41
    scd41.begin(Wire);
    uint16_t stopErr = scd41.stopPeriodicMeasurement();
    uint16_t startErr = scd41.startPeriodicMeasurement();
    scdReady = (startErr == 0);
    if (scdReady) {
      Serial.println("✅ SCD41 initialized");
    } else {
      Serial.println("⚠️  SCD41 not found or failed to start");
    }
  #endif

  // ── LTR390 (UV / Ambient Light) ─────────────────────────────
  #if ENABLE_LTR390
    ltrReady = ltr.begin();
    if (ltrReady) {
      ltr.setMode(LTR390_MODE_UVS);
      ltr.setGain(LTR390_GAIN_3);
      ltr.setResolution(LTR390_RESOLUTION_16BIT);
      ltr.setThresholds(100, 1000);
      Serial.println("✅ LTR390 initialized");
    } else {
      Serial.println("⚠️  LTR390 not found");
    }
  #endif

  // ── Anemometer (Wind Speed) ──────────────────────────────────
  #if ENABLE_ANEMOMETER
    pinMode(ANEMOMETER_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(ANEMOMETER_PIN), anemometerISR, FALLING);
    lastWindCalcTime = millis();
    Serial.println("✅ Anemometer initialized");
  #endif
}

// ═══════════════════════════════════════════════════════════════════
// Sensor Reading Functions
// ═══════════════════════════════════════════════════════════════════

struct SensorReadings {
  // BME280
  float temperature;
  float humidity;
  float pressure;
  bool hasBME280;

  // SCD41
  float co2;
  bool hasSCD41;

  // LTR390
  float uvIndex;
  float ambientLight;
  bool hasLTR390;

  // Anemometer
  float windSpeed;
  float windDirection;
  bool hasAnemometer;

  // Rain Sensor
  float rainIntensity;   // 0–100 (0=dry, 100=heavy rain)
  bool hasRainSensor;
};

SensorReadings readAllSensors() {
  SensorReadings r;
  r.hasBME280 = false;
  r.hasSCD41 = false;
  r.hasLTR390 = false;
  r.hasAnemometer = false;
  r.hasRainSensor = false;

  #if SIMULATION_MODE
    // ── Simulated data for testing ────────────────────────────
    r.temperature = 22.0 + random(-50, 50) / 10.0;
    r.humidity = 55.0 + random(-100, 100) / 10.0;
    r.pressure = 1013.0 + random(-30, 30) / 10.0;
    r.hasBME280 = true;

    r.co2 = 400 + random(0, 200);
    r.hasSCD41 = true;

    r.uvIndex = 3.0 + random(0, 80) / 10.0;
    r.ambientLight = 10000 + random(0, 20000);
    r.hasLTR390 = true;

    r.windSpeed = 5.0 + random(0, 300) / 10.0;
    r.windDirection = random(0, 360);
    r.hasAnemometer = true;

    r.rainIntensity = random(0, 100);
    r.hasRainSensor = true;

    return r;
  #endif

  // ── BME280 ──────────────────────────────────────────────────
  #if ENABLE_BME280
    if (bmeReady) {
      r.temperature = bme.readTemperature();
      r.humidity = bme.readHumidity();
      r.pressure = bme.readPressure() / 100.0F; // Pa to hPa
      r.hasBME280 = !(isnan(r.temperature) || isnan(r.humidity));
    }
  #endif

  // ── SCD41 ───────────────────────────────────────────────────
  #if ENABLE_SCD41
    if (scdReady) {
      uint16_t co2Raw;
      float tempSCD, humSCD;
      bool isDataReady = false;
      scd41.getDataReadyFlag(isDataReady);
      if (isDataReady) {
        uint16_t err = scd41.readMeasurement(co2Raw, tempSCD, humSCD);
        if (err == 0 && co2Raw > 0) {
          r.co2 = (float)co2Raw;
          r.hasSCD41 = true;
        }
      }
    }
  #endif

  // ── LTR390 ──────────────────────────────────────────────────
  #if ENABLE_LTR390
    if (ltrReady) {
      // Read UV
      ltr.setMode(LTR390_MODE_UVS);
      delay(50);
      if (ltr.newDataAvailable()) {
        uint32_t uvData = ltr.readUVS();
        // Approximate UV Index (sensor-specific calibration recommended)
        r.uvIndex = (float)uvData / 2300.0 * 1.0;
        r.hasLTR390 = true;
      }

      // Read Ambient Light
      ltr.setMode(LTR390_MODE_ALS);
      delay(50);
      if (ltr.newDataAvailable()) {
        uint32_t alsData = ltr.readALS();
        // Convert to lux (approximate — depends on gain & resolution)
        r.ambientLight = (float)alsData * 0.6;
        r.hasLTR390 = true;
      }
    }
  #endif

  // ── Anemometer ──────────────────────────────────────────────
  #if ENABLE_ANEMOMETER
    unsigned long now = millis();
    unsigned long elapsed = now - lastWindCalcTime;

    if (elapsed >= 1000) { // Calculate every second minimum
      noInterrupts();
      unsigned long pulses = anemometerPulseCount;
      anemometerPulseCount = 0;
      interrupts();

      // Rotations per second (assuming 1 pulse per rotation)
      float rps = (float)pulses / ((float)elapsed / 1000.0);

      // Wind speed: v = 2 * π * r * rps * 3.6 (m/s to km/h)
      r.windSpeed = 2.0 * 3.14159 * ANEMOMETER_RADIUS_M * rps * 3.6;
      r.hasAnemometer = true;

      lastWindCalcTime = now;
    }

    // Wind direction from analog vane (0-360 degrees)
    int vaneRaw = analogRead(WIND_VANE_PIN);
    #if defined(ESP32)
      r.windDirection = map(vaneRaw, 0, 4095, 0, 360);
    #elif defined(ESP8266)
      r.windDirection = map(vaneRaw, 0, 1023, 0, 360);
    #endif
    r.hasAnemometer = true;
  #endif

  // ── Rain Sensor ──────────────────────────────────────────────
  #if ENABLE_RAIN_SENSOR
    int rainRaw = analogRead(RAIN_SENSOR_PIN);
    // Rain sensor outputs LOW when wet, HIGH when dry
    // Map to 0 (dry) – 100 (heavy rain)
    #if defined(ESP32)
      r.rainIntensity = 100.0 - (rainRaw / 4095.0 * 100.0);
    #elif defined(ESP8266)
      r.rainIntensity = 100.0 - (rainRaw / 1023.0 * 100.0);
    #endif
    r.rainIntensity = constrain(r.rainIntensity, 0.0, 100.0);
    r.hasRainSensor = true;
  #endif

  return r;
}

// ═══════════════════════════════════════════════════════════════════
// JSON Payload Construction
// ═══════════════════════════════════════════════════════════════════

String buildPayload(const SensorReadings& r) {
  JsonDocument doc;

  doc["siteId"] = SITE_ID;

  JsonObject sensors = doc["sensors"].to<JsonObject>();

  if (r.hasBME280) {
    JsonObject bmeObj = sensors["bme280"].to<JsonObject>();
    bmeObj["temperature"] = round(r.temperature * 100.0) / 100.0;
    bmeObj["humidity"] = round(r.humidity * 100.0) / 100.0;
    bmeObj["pressure"] = round(r.pressure * 100.0) / 100.0;
  }

  if (r.hasSCD41) {
    JsonObject scdObj = sensors["scd41"].to<JsonObject>();
    scdObj["co2"] = round(r.co2);
  }

  if (r.hasLTR390) {
    JsonObject ltrObj = sensors["ltr390"].to<JsonObject>();
    ltrObj["uvIndex"] = round(r.uvIndex * 100.0) / 100.0;
    ltrObj["ambientLight"] = round(r.ambientLight);
  }

  if (r.hasAnemometer) {
    JsonObject windObj = sensors["anemometer"].to<JsonObject>();
    windObj["windSpeed"] = round(r.windSpeed * 100.0) / 100.0;
    windObj["windDirection"] = round(r.windDirection);
  }

  if (r.hasRainSensor) {
    JsonObject rainObj = sensors["rainsensor"].to<JsonObject>();
    rainObj["rainIntensity"] = round(r.rainIntensity * 100.0) / 100.0;
  }

  String payload;
  serializeJson(doc, payload);
  return payload;
}

// ═══════════════════════════════════════════════════════════════════
// HTTP POST with Retry Logic
// ═══════════════════════════════════════════════════════════════════

bool sendData(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  Wi-Fi not connected, attempting reconnect...");
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  String url = String("http://") + SERVER_IP + ":" + String(SERVER_PORT) + API_ENDPOINT;

  for (int attempt = 1; attempt <= HTTP_RETRY_COUNT; attempt++) {
    Serial.printf("📤 POST attempt %d/%d → %s\n", attempt, HTTP_RETRY_COUNT, url.c_str());

    HTTPClient http;

    #if defined(ESP8266)
      WiFiClient wifiClient;
      http.begin(wifiClient, url);
    #else
      http.begin(url);
    #endif

    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-API-Key", DEVICE_API_KEY);
    http.setTimeout(HTTP_TIMEOUT_MS);

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("✅ Response [%d]: %s\n", httpCode, response.c_str());
      http.end();

      if (httpCode == 200 || httpCode == 201) {
        return true;
      }
    } else {
      Serial.printf("❌ HTTP error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();

    if (attempt < HTTP_RETRY_COUNT) {
      Serial.printf("⏳ Retrying in %dms...\n", HTTP_RETRY_DELAY_MS * attempt);
      delay(HTTP_RETRY_DELAY_MS * attempt); // Exponential backoff
    }
  }

  Serial.println("❌ All HTTP POST attempts failed.");
  return false;
}

// ═══════════════════════════════════════════════════════════════════
// Setup & Main Loop
// ═══════════════════════════════════════════════════════════════════

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n══════════════════════════════════");
  Serial.println("  🌤  IoT Weather Station");
  Serial.println("══════════════════════════════════");

  #if SIMULATION_MODE
    Serial.println("⚠️  SIMULATION MODE ACTIVE");
  #endif

  connectWiFi();
  initSensors();

  Serial.println("\n✅ Setup complete. Starting data collection...\n");
}

void loop() {
  unsigned long now = millis();

  // Ensure Wi-Fi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Read and send data at the configured interval
  if (now - lastReadTime >= SENSOR_READ_INTERVAL_MS) {
    lastReadTime = now;

    SensorReadings readings = readAllSensors();
    String payload = buildPayload(readings);

    Serial.println("─────────────────────────────────");
    Serial.println("📊 Sensor Readings:");

    if (readings.hasBME280) {
      Serial.printf("   🌡  Temp: %.1f°C  |  💧 Humidity: %.1f%%  |  📊 Pressure: %.1f hPa\n",
                     readings.temperature, readings.humidity, readings.pressure);
    }
    if (readings.hasSCD41) {
      Serial.printf("   🏭 CO2: %.0f ppm\n", readings.co2);
    }
    if (readings.hasLTR390) {
      Serial.printf("   ☀️  UV: %.2f  |  💡 Light: %.0f lux\n",
                     readings.uvIndex, readings.ambientLight);
    }
    if (readings.hasAnemometer) {
      Serial.printf("   💨 Wind: %.1f km/h @ %.0f°\n",
                     readings.windSpeed, readings.windDirection);
    }
    if (readings.hasRainSensor) {
      Serial.printf("   🌧️  Rain: %.0f%%\n", readings.rainIntensity);
    }

    Serial.printf("📦 Payload: %s\n", payload.c_str());

    sendData(payload);
    Serial.println("─────────────────────────────────\n");
  }
}
