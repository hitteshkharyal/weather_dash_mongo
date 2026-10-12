// ================================================================
// ESP32 IoT WEATHER STATION
// DHT11 + MQ-3
//
// DATA FLOW:
//
// DHT11 ──┐
//         │
// MQ-3 ───┤
//         ▼
//        ESP32
//         │
//         │ Wi-Fi
//         ▼
//     Node / Express
//         │
//         │ WebSocket / API
//         ▼
//       React
//
// ================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ================================================================
// 1. WIFI CONFIGURATION
// ================================================================

const char* WIFI_SSID = "pc_h";
const char* WIFI_PASSWORD = "12345678";

// ================================================================
// 2. BACKEND CONFIGURATION
// ================================================================
//
// IMPORTANT:
//
// SERVER_IP must be the IP address of the PC running Node.js.
//
// DO NOT use:
// localhost
// 127.0.0.1
//
// Example:
// If your PC hotspot gateway is 192.168.137.1,
// use 192.168.137.1.
//
// ================================================================

const char* SERVER_IP = "192.168.137.1";

const uint16_t SERVER_PORT = 5000;

// IMPORTANT:
// Change this to your EXISTING Express POST endpoint.

// Changed to match the actual route mounted in server.js
const char* API_ENDPOINT = "/api/v1/sensors/data";

// ================================================================
// 3. DEVICE CONFIGURATION
// ================================================================

const char* SITE_ID = "weather-station-01";

// Add API KEY (Required by backend middleware deviceAuth.js)
const char* DEVICE_API_KEY = "YOUR_DEVICE_API_KEY"; 

// ================================================================
// 4. SENSOR CONFIGURATION
// ================================================================

// DHT11
#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// MQ-3
#define MQ3_PIN 34

// ================================================================
// 5. TIMING
// ================================================================

// Send data every 5 seconds
const unsigned long SENSOR_INTERVAL = 5000;

unsigned long lastSensorRead = 0;

// ================================================================
// 6. WIFI CONNECTION
// ================================================================

bool connectWiFi() {

  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println();
  Serial.println("======================================");
  Serial.println("Connecting to Wi-Fi");
  Serial.println("======================================");

  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED && attempts < 30) {

    delay(500);

    Serial.print(".");

    attempts++;
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("✅ Wi-Fi CONNECTED");

    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());

    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());

    Serial.print("Subnet: ");
    Serial.println(WiFi.subnetMask());

    Serial.print("RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    return true;

  } else {

    Serial.println("❌ Wi-Fi connection failed");

    Serial.print("Status: ");
    Serial.println(WiFi.status());

    return false;
  }
}

// ================================================================
// 7. READ DHT11
// ================================================================

bool readDHT11(float &temperature, float &humidity) {

  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("❌ DHT11 read failed");

    return false;
  }

  return true;
}

// ================================================================
// 8. READ MQ-3
// ================================================================

int readMQ3() {

  int value = analogRead(MQ3_PIN);

  return value;
}

// ================================================================
// 9. BUILD JSON
// ================================================================

String buildJSON(
  float temperature,
  float humidity,
  int gasRaw,
  bool dhtValid
) {

  JsonDocument doc;

  // Device/site
  doc["siteId"] = SITE_ID;

  // Timestamp from ESP32 uptime
  doc["uptime"] = millis();

  // Sensors
  JsonObject sensors =
    doc["sensors"].to<JsonObject>();

  // -----------------------------
  // Map DHT11 -> BME280 for backend compatibility
  // -----------------------------

  if (dhtValid) {

    JsonObject dhtObj =
      sensors["bme280"].to<JsonObject>();

    dhtObj["temperature"] =
      round(temperature * 100.0) / 100.0;

    dhtObj["humidity"] =
      round(humidity * 100.0) / 100.0;
  }

  // -----------------------------
  // Map MQ-3 -> SCD41 (CO2) for dashboard testing
  // -----------------------------

  JsonObject mq3Obj =
    sensors["scd41"].to<JsonObject>();

  mq3Obj["co2"] = gasRaw;

  // -----------------------------
  // Convert JSON → String
  // -----------------------------

  String payload;

  serializeJson(doc, payload);

  return payload;
}

// ================================================================
// 10. SEND DATA TO EXPRESS
// ================================================================

bool sendToBackend(String payload) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("❌ Wi-Fi not connected");

    return false;
  }

  // Build URL
  String url =
    String("http://") +
    SERVER_IP +
    ":" +
    String(SERVER_PORT) +
    API_ENDPOINT;

  Serial.println();
  Serial.println("======================================");
  Serial.println("Sending data to backend");
  Serial.println("======================================");

  Serial.print("URL: ");
  Serial.println(url);

  Serial.print("Payload: ");
  Serial.println(payload);

  HTTPClient http;

  // Start HTTP connection
  http.begin(url);

  // Tell Express we're sending JSON
  http.addHeader(
    "Content-Type",
    "application/json"
  );
  
  // Send the mandatory authentication header
  http.addHeader(
    "x-device-api-key",
    DEVICE_API_KEY
  );

  // Timeout
  http.setTimeout(5000);

  // POST
  int httpCode = http.POST(payload);

  // -----------------------------
  // Response
  // -----------------------------

  if (httpCode > 0) {

    Serial.print("HTTP Status: ");
    Serial.println(httpCode);

    String response =
      http.getString();

    Serial.print("Backend Response: ");
    Serial.println(response);

    http.end();

    if (httpCode >= 200 && httpCode < 300) {

      Serial.println("✅ Data successfully sent");

      return true;
    }

    Serial.println("⚠️ Backend returned an error");

    return false;

  } else {

    Serial.print("❌ HTTP request failed: ");

    Serial.println(
      http.errorToString(httpCode)
    );

    http.end();

    return false;
  }
}

// ================================================================
// 11. SETUP
// ================================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println();
  Serial.println("======================================");
  Serial.println("       IoT WEATHER STATION");
  Serial.println("======================================");
  Serial.println("ESP32 + DHT11 + MQ-3");
  Serial.println("======================================");

  // ==============================================================
  // SENSOR INITIALIZATION
  // ==============================================================

  Serial.println();
  Serial.println("Initializing sensors...");

  // DHT11
  dht.begin();

  Serial.println("✅ DHT11 initialized");
  Serial.println("   DATA → GPIO 4");

  // MQ3
  pinMode(MQ3_PIN, INPUT);

  Serial.println("✅ MQ-3 initialized");
  Serial.println("   AO → GPIO 34");

  // ==============================================================
  // WIFI
  // ==============================================================

  connectWiFi();

  // ==============================================================
  // BACKEND INFORMATION
  // ==============================================================

  Serial.println();
  Serial.println("Backend configuration:");
  Serial.print("Server: ");
  Serial.println(SERVER_IP);

  Serial.print("Port: ");
  Serial.println(SERVER_PORT);

  Serial.print("Endpoint: ");
  Serial.println(API_ENDPOINT);

  Serial.println();
  Serial.println("======================================");
  Serial.println("Setup complete");
  Serial.println("======================================");
}

// ================================================================
// 12. MAIN LOOP
// ================================================================

void loop() {

  // ==============================================================
  // KEEP WIFI CONNECTED
  // ==============================================================

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println();
    Serial.println("⚠️ Wi-Fi disconnected");

    connectWiFi();

    // Don't continue until Wi-Fi reconnects
    if (WiFi.status() != WL_CONNECTED) {

      delay(3000);

      return;
    }
  }

  // ==============================================================
  // SENSOR INTERVAL
  // ==============================================================

  unsigned long now = millis();

  if (now - lastSensorRead < SENSOR_INTERVAL) {

    delay(10);

    return;
  }

  lastSensorRead = now;

  // ==============================================================
  // READ SENSORS
  // ==============================================================

  float temperature = 0;
  float humidity = 0;

  bool dhtValid =
    readDHT11(
      temperature,
      humidity
    );

  int gasRaw =
    readMQ3();

  // ==============================================================
  // SERIAL DISPLAY
  // ==============================================================

  Serial.println();
  Serial.println("--------------------------------------");
  Serial.println("📊 SENSOR READINGS");
  Serial.println("--------------------------------------");

  if (dhtValid) {

    Serial.print("🌡 Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("💧 Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");

  } else {

    Serial.println("🌡 Temperature : ERROR");
    Serial.println("💧 Humidity    : ERROR");
  }

  Serial.print("🧪 MQ-3 Raw    : ");
  Serial.println(gasRaw);

  // ==============================================================
  // BUILD JSON
  // ==============================================================

  String payload =
    buildJSON(
      temperature,
      humidity,
      gasRaw,
      dhtValid
    );

  Serial.println();
  Serial.println("📦 JSON PAYLOAD:");

  Serial.println(payload);

  // ==============================================================
  // SEND TO NODE
  // ==============================================================

  sendToBackend(payload);

  Serial.println("--------------------------------------");
}
