import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFirmwareConfig } from '../src/utils/firmwareConfig.js';

const sensorCatalog = [
  ['bme280', 'ENABLE_BME280'],
  ['dht11', 'ENABLE_DHT11'],
  ['dht22', 'ENABLE_DHT22'],
  ['bmp280', 'ENABLE_BMP280'],
  ['scd41', 'ENABLE_SCD41'],
  ['mq2', 'ENABLE_MQ2'],
  ['mq3', 'ENABLE_MQ3'],
  ['mq7', 'ENABLE_MQ7'],
  ['mq135', 'ENABLE_MQ135'],
  ['ltr390', 'ENABLE_LTR390'],
  ['bh1750', 'ENABLE_BH1750'],
  ['rainsensor', 'ENABLE_RAIN_SENSOR'],
  ['soilmoisture', 'ENABLE_SOIL_MOISTURE'],
  ['anemometer', 'ENABLE_ANEMOMETER'],
  ['windvane', 'ENABLE_WIND_VANE'],
].map(([type, macro]) => ({ type, macro }));

function buildConfig(board, serverUrl = 'http://localhost:5000/api/v1/sensors/data') {
  return buildFirmwareConfig({
    board,
    wifiSsid: 'station-net',
    wifiPassword: 'station-secret',
    serverUrl,
    siteId: 'site-id',
    apiKey: 'site-api-key',
    rootCertificate: '-----BEGIN CERTIFICATE-----\nroot\n-----END CERTIFICATE-----',
    sensorCatalog,
    assignedTypes: new Set(['bme280', 'mq135', 'windvane']),
  });
}

test('firmware config enables only sensors assigned to this site', () => {
  const config = buildConfig('ESP32');

  assert.match(config, /#define ENABLE_BME280 true/);
  assert.match(config, /#define ENABLE_MQ135 true/);
  assert.match(config, /#define ENABLE_WIND_VANE true/);
  assert.match(config, /#define ENABLE_DHT11 false/);
  assert.match(config, /#define ENABLE_RAIN_SENSOR false/);
  assert.match(config, /#define WIFI_SSID "station-net"/);
  assert.match(config, /#define DEVICE_API_KEY "site-api-key"/);
  assert.match(config, /#define SERVER_HAS_ROOT_CA false/);
  assert.match(config, /#define MQ2_PIN 34/);
  assert.match(config, /struct SensorReadings \{/);
  assert.match(config, /#define HTTP_RETRY_DELAY_MS 2000/);
});

test('firmware config targets ESP8266 pins and enables TLS verification when configured', () => {
  const config = buildConfig(
    'ESP8266',
    'https://weather-api.example.com/api/v1/sensors/data'
  );

  assert.match(config, /#if defined\(ESP8266\)/);
  assert.match(config, /#define MQ2_PIN A0/);
  assert.match(config, /#define ANEMOMETER_PIN 14/);
  assert.match(config, /#define SERVER_HAS_ROOT_CA true/);
  assert.match(config, /-----BEGIN CERTIFICATE-----/);
});
