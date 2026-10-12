/**
 * Weather Inference Engine
 *
 * Analyzes raw sensor readings to infer the current weather condition.
 * Returns one of: 'clear', 'sunny', 'cloudy', 'rainy', 'fog', 'mist',
 *                 'smog', 'hailstorm', 'storm', 'unknown'
 *
 * Input data shape (any subset):
 *   { temperature, humidity, pressure, co2, uvIndex, ambientLight, windSpeed, windDirection, rainIntensity }
 */

// ─── Configurable Thresholds ────────────────────────────────

const THRESHOLDS = {
  // Hailstorm / Severe Storm
  storm: {
    windSpeedMin: 60,       // km/h — exceptionally high wind
    tempDropRate: 5,        // °C drop (compared to recent baseline, simplified here)
    pressureLow: 990,       // hPa — low pressure system
    rainIntensityMin: 60,   // heavy rain signal
  },

  // Rainy conditions
  rainy: {
    humidityMin: 80,        // %
    pressureLow: 1005,      // hPa
    uvIndexMax: 2,          // low UV during rain
    rainIntensityMin: 30,   // moderate rain signal
  },

  // Cloudy conditions
  cloudy: {
    uvIndexMax: 3,          // lower than expected UV/sunlight
    ambientLightMax: 5000,  // lux — reduced sunlight
    humidityMin: 50,        // moderate humidity
  },

  // Fog / Mist
  fog: {
    tempMax: 20,            // °C — low temperature
    humidityMin: 85,        // % — very high humidity
    windSpeedMax: 10,       // km/h — calm winds
  },

  // Smog
  smog: {
    co2Min: 800,            // ppm — elevated CO2/gas
    humidityMin: 70,        // %
    ambientLightMax: 8000,  // lux — reduced visibility
  },

  // Sunny / Clear
  sunny: {
    uvIndexMin: 5,          // good UV
    ambientLightMin: 15000, // lux — bright
    humidityMax: 60,        // % — not too humid
  },
};

/**
 * Infer weather condition from a flat data object.
 *
 * @param {Object} data - Sensor readings
 * @returns {string} Inferred weather condition
 */
function inferWeather(data) {
  const {
    temperature = null,
    humidity = null,
    pressure = null,
    co2 = null,
    uvIndex = null,
    ambientLight = null,
    windSpeed = null,
    rainIntensity = null,
  } = data;

  // ── Priority 1: Hailstorm / Severe Storm ──────────────────
  if (
    windSpeed !== null &&
    windSpeed >= THRESHOLDS.storm.windSpeedMin &&
    (pressure !== null && pressure <= THRESHOLDS.storm.pressureLow)
  ) {
    return 'hailstorm';
  }

  // High wind + heavy rain = storm
  if (
    windSpeed !== null &&
    windSpeed >= THRESHOLDS.storm.windSpeedMin * 0.7 &&
    (
      (humidity !== null && humidity >= 75) ||
      (rainIntensity !== null && rainIntensity >= THRESHOLDS.storm.rainIntensityMin)
    )
  ) {
    return 'storm';
  }

  // ── Priority 1b: Rain sensor as primary rain signal ───────
  if (
    rainIntensity !== null &&
    rainIntensity >= 70
  ) {
    // Very heavy rain from sensor — check for storm conditions
    if (windSpeed !== null && windSpeed >= 40) {
      return 'storm';
    }
    return 'rainy';
  }

  // ── Priority 2: Smog (elevated CO2 + reduced visibility) ──
  if (
    co2 !== null &&
    co2 >= THRESHOLDS.smog.co2Min &&
    humidity !== null &&
    humidity >= THRESHOLDS.smog.humidityMin &&
    (ambientLight === null || ambientLight <= THRESHOLDS.smog.ambientLightMax)
  ) {
    return 'smog';
  }

  // ── Priority 3: Fog / Mist ────────────────────────────────
  if (
    temperature !== null &&
    temperature <= THRESHOLDS.fog.tempMax &&
    humidity !== null &&
    humidity >= THRESHOLDS.fog.humidityMin &&
    (windSpeed === null || windSpeed <= THRESHOLDS.fog.windSpeedMax) &&
    (rainIntensity === null || rainIntensity < THRESHOLDS.rainy.rainIntensityMin)
  ) {
    return humidity >= 95 ? 'fog' : 'mist';
  }

  // ── Priority 4: Rainy ─────────────────────────────────────
  // Rain sensor moderate signal
  if (
    rainIntensity !== null &&
    rainIntensity >= THRESHOLDS.rainy.rainIntensityMin
  ) {
    return 'rainy';
  }

  // Humidity + pressure based rain (no rain sensor or dry)
  if (
    humidity !== null &&
    humidity >= THRESHOLDS.rainy.humidityMin &&
    (pressure !== null && pressure <= THRESHOLDS.rainy.pressureLow) &&
    (uvIndex === null || uvIndex <= THRESHOLDS.rainy.uvIndexMax)
  ) {
    return 'rainy';
  }

  // ── Priority 5: Cloudy ────────────────────────────────────
  if (
    (uvIndex !== null && uvIndex <= THRESHOLDS.cloudy.uvIndexMax) &&
    (ambientLight !== null && ambientLight <= THRESHOLDS.cloudy.ambientLightMax)
  ) {
    return 'cloudy';
  }

  // ── Priority 6: Sunny / Clear ─────────────────────────────
  if (
    uvIndex !== null &&
    uvIndex >= THRESHOLDS.sunny.uvIndexMin &&
    (ambientLight === null || ambientLight >= THRESHOLDS.sunny.ambientLightMin)
  ) {
    return 'sunny';
  }

  // Fallback — mild conditions
  if (
    temperature !== null &&
    humidity !== null &&
    humidity < 70 &&
    temperature > 15
  ) {
    return 'clear';
  }

  return 'unknown';
}

module.exports = { inferWeather, THRESHOLDS };
