// ═══════════════════════════════════════════════════════════════════
// config.h — Weather Station Firmware Configuration
// ═══════════════════════════════════════════════════════════════════
//
// Edit the values below to match your network and server setup.
// This file is shared between ESP32 and ESP8266 builds.
//

#ifndef CONFIG_H
#define CONFIG_H

// ─── Wi-Fi Credentials ──────────────────────────────────────────
#define WIFI_SSID          "YOUR_WIFI_SSID"
#define WIFI_PASSWORD      "YOUR_WIFI_PASSWORD"

// ─── Server Connection ──────────────────────────────────────────
#define SERVER_IP           "192.168.1.100"     // IP of your Express server
#define SERVER_PORT         5000
#define API_ENDPOINT        "/api/v1/sensors/data"

// ─── Device Identity ────────────────────────────────────────────
#define SITE_ID             "YOUR_SITE_ID"           // MongoDB ObjectId of the Site
#define DEVICE_API_KEY      "YOUR_DEVICE_API_KEY"    // Site.apiKey from the dashboard

// ─── I2C Pin Configuration ──────────────────────────────────────
// Default I2C pins differ between ESP32 and ESP8266
#if defined(ESP32)
  #define I2C_SDA_PIN       21
  #define I2C_SCL_PIN       22
#elif defined(ESP8266)
  #define I2C_SDA_PIN       4    // D2 on NodeMCU
  #define I2C_SCL_PIN       5    // D1 on NodeMCU
#endif

// ─── Anemometer Configuration ───────────────────────────────────
#if defined(ESP32)
  #define ANEMOMETER_PIN    34   // Interrupt-capable GPIO
#elif defined(ESP8266)
  #define ANEMOMETER_PIN    14   // D5 on NodeMCU
#endif
#define ANEMOMETER_DEBOUNCE_MS   15
#define ANEMOMETER_RADIUS_M      0.07   // Radius of anemometer cups in meters

// Wind direction — analog pin (if using a wind vane with voltage divider)
#if defined(ESP32)
  #define WIND_VANE_PIN     35   // ADC1 channel
#elif defined(ESP8266)
  #define WIND_VANE_PIN     A0   // Only analog pin on ESP8266
#endif

// ─── Rain Sensor Configuration ─────────────────────────────────
// Analog rain sensor — outputs 0 (wet) to 1023/4095 (dry)
#if defined(ESP32)
  #define RAIN_SENSOR_PIN   32   // ADC1 channel
#elif defined(ESP8266)
  // ESP8266 has only one analog pin — requires multiplexer if wind vane is also used
  #define RAIN_SENSOR_PIN   A0
#endif

// ─── Timing ─────────────────────────────────────────────────────
#define SENSOR_READ_INTERVAL_MS    10000   // 10 seconds between readings
#define WIFI_RETRY_DELAY_MS        5000    // 5 seconds between Wi-Fi retries
#define WIFI_MAX_RETRIES           20
#define HTTP_RETRY_COUNT           3
#define HTTP_RETRY_DELAY_MS        2000
#define HTTP_TIMEOUT_MS            10000

// ─── Sensor Enable/Disable ──────────────────────────────────────
// Set to false to disable a sensor if not physically connected
#define ENABLE_BME280       true
#define ENABLE_SCD41        true
#define ENABLE_LTR390       true
#define ENABLE_ANEMOMETER   true
#define ENABLE_RAIN_SENSOR  true

// ─── Simulation Mode ────────────────────────────────────────────
// Set to true to generate simulated readings (for testing without hardware)
#define SIMULATION_MODE     false

#endif // CONFIG_H
