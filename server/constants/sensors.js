const SENSOR_CATALOG = [
  { type: 'bme280', name: 'BME280', description: 'Temperature, humidity, and pressure', macro: 'ENABLE_BME280' },
  { type: 'dht11', name: 'DHT11', description: 'Temperature and humidity', macro: 'ENABLE_DHT11' },
  { type: 'dht22', name: 'DHT22', description: 'Temperature and humidity', macro: 'ENABLE_DHT22' },
  { type: 'bmp280', name: 'BMP280', description: 'Temperature and pressure', macro: 'ENABLE_BMP280' },
  { type: 'scd41', name: 'SCD41', description: 'CO2 concentration', macro: 'ENABLE_SCD41' },
  { type: 'mq2', name: 'MQ-2', description: 'Combustible gas and smoke', macro: 'ENABLE_MQ2' },
  { type: 'mq3', name: 'MQ-3', description: 'Alcohol vapour', macro: 'ENABLE_MQ3' },
  { type: 'mq7', name: 'MQ-7', description: 'Carbon monoxide', macro: 'ENABLE_MQ7' },
  { type: 'mq135', name: 'MQ-135', description: 'Air quality and gas resistance', macro: 'ENABLE_MQ135' },
  { type: 'ltr390', name: 'LTR390', description: 'UV index and ambient light', macro: 'ENABLE_LTR390' },
  { type: 'bh1750', name: 'BH1750', description: 'Ambient light', macro: 'ENABLE_BH1750' },
  { type: 'rainsensor', name: 'Rain-drop sensor', description: 'Rain intensity', macro: 'ENABLE_RAIN_SENSOR' },
  { type: 'soilmoisture', name: 'Soil moisture', description: 'Soil moisture level', macro: 'ENABLE_SOIL_MOISTURE' },
  { type: 'anemometer', name: 'Anemometer', description: 'Wind speed', macro: 'ENABLE_ANEMOMETER' },
  { type: 'windvane', name: 'Wind vane', description: 'Wind direction', macro: 'ENABLE_WIND_VANE' },
];

const SENSOR_TYPES = SENSOR_CATALOG.map(({ type }) => type);

module.exports = { SENSOR_CATALOG, SENSOR_TYPES };
