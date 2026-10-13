#ifndef CONFIG_H
#define CONFIG_H

#define WIFI_SSID          "YOUR_WIFI_SSID"
#define WIFI_PASSWORD      "YOUR_WIFI_PASSWORD"
#define SERVER_URL         "http://192.168.1.100:5000/api/v1/sensors/data"
#define SITE_ID            "YOUR_SITE_ID"
#define DEVICE_API_KEY     "YOUR_DEVICE_API_KEY"

#define SERVER_HAS_ROOT_CA false
static const char SERVER_ROOT_CA[] PROGMEM = R"WEATHER_CA(
)WEATHER_CA";

#if defined(ESP32)
  #define I2C_SDA_PIN       21
  #define I2C_SCL_PIN       22
  #define DHT11_PIN         16
  #define DHT22_PIN         17
  #define MQ2_PIN           34
  #define MQ3_PIN           35
  #define MQ7_PIN           32
  #define MQ135_PIN         33
  #define RAIN_SENSOR_PIN   36
  #define SOIL_MOISTURE_PIN 39
  #define WIND_VANE_PIN     25
  #define ANEMOMETER_PIN    27
#elif defined(ESP8266)
  #define I2C_SDA_PIN       4
  #define I2C_SCL_PIN       5
  #define DHT11_PIN         12
  #define DHT22_PIN         13
  #define MQ2_PIN           A0
  #define MQ3_PIN           A0
  #define MQ7_PIN           A0
  #define MQ135_PIN         A0
  #define RAIN_SENSOR_PIN   A0
  #define SOIL_MOISTURE_PIN A0
  #define WIND_VANE_PIN     A0
  #define ANEMOMETER_PIN    14
#else
  #error "Select an ESP32 or ESP8266 board"
#endif

#define ANEMOMETER_DEBOUNCE_MS 15
#define ANEMOMETER_RADIUS_M    0.07

#define SENSOR_READ_INTERVAL_MS 10000
#define WIFI_RETRY_DELAY_MS     5000
#define WIFI_MAX_RETRIES        20
#define HTTP_RETRY_COUNT        3
#define HTTP_RETRY_DELAY_MS     2000
#define HTTP_TIMEOUT_MS         10000

#define ENABLE_BME280       true
#define ENABLE_DHT11        false
#define ENABLE_DHT22        false
#define ENABLE_BMP280       false
#define ENABLE_SCD41        true
#define ENABLE_MQ2          false
#define ENABLE_MQ3          false
#define ENABLE_MQ7          false
#define ENABLE_MQ135        false
#define ENABLE_LTR390       true
#define ENABLE_BH1750       false
#define ENABLE_RAIN_SENSOR  true
#define ENABLE_SOIL_MOISTURE false
#define ENABLE_ANEMOMETER   true
#define ENABLE_WIND_VANE    false
#define ENABLE_SIMULATION_MODE false

#endif
