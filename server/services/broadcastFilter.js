/**
 * Broadcast Filter Service
 *
 * Stores the last-broadcast values per site and only allows Socket.io
 * emission when sensor readings change by significant amounts.
 *
 * Thresholds:
 *   - Temperature: ≥ 1°C change
 *   - Humidity:    ≥ 2% change
 *   - CO2:        ≥ 50 ppm change
 *   - UV Index:   ≥ 0.5 change
 *   - Wind Speed: ≥ 2 km/h change
 *   - Inferred condition change: always broadcast
 */

const CHANGE_THRESHOLDS = {
  temperature: 1,
  humidity: 2,
  co2: 50,
  uvIndex: 0.5,
  ambientLight: 1000,
  windSpeed: 2,
  pressure: 2,
  windDirection: 15,
  rainIntensity: 5,
};

// In-memory store of last broadcast values per site
const lastBroadcast = new Map();

/**
 * Checks whether the new reading has changed enough to warrant a broadcast.
 *
 * @param {string} siteId - The site identifier
 * @param {Object} newData - New reading data
 * @returns {{ shouldBroadcast: boolean, changes: Object }}
 */
function shouldBroadcast(siteId, newData) {
  const prev = lastBroadcast.get(siteId);

  // First reading for this site — always broadcast
  if (!prev) {
    lastBroadcast.set(siteId, { ...newData });
    return { shouldBroadcast: true, changes: newData };
  }

  // Check if the inferred condition changed
  if (
    newData.inferredCondition &&
    newData.inferredCondition !== prev.inferredCondition
  ) {
    lastBroadcast.set(siteId, { ...newData });
    return { shouldBroadcast: true, changes: newData };
  }

  // Check numerical thresholds
  const changes = {};
  let hasSignificantChange = false;

  for (const [key, threshold] of Object.entries(CHANGE_THRESHOLDS)) {
    if (
      newData[key] !== undefined &&
      newData[key] !== null &&
      prev[key] !== undefined &&
      prev[key] !== null
    ) {
      const diff = Math.abs(newData[key] - prev[key]);
      if (diff >= threshold) {
        changes[key] = { from: prev[key], to: newData[key], diff };
        hasSignificantChange = true;
      }
    } else if (newData[key] !== undefined && prev[key] === undefined) {
      // New data field appeared — count as change
      changes[key] = { from: null, to: newData[key] };
      hasSignificantChange = true;
    }
  }

  if (hasSignificantChange) {
    lastBroadcast.set(siteId, { ...newData });
    return { shouldBroadcast: true, changes };
  }

  return { shouldBroadcast: false, changes: {} };
}

/**
 * Clears stored values for a site (e.g., on disconnect).
 */
function clearSiteCache(siteId) {
  lastBroadcast.delete(siteId);
}

module.exports = { shouldBroadcast, clearSiteCache, CHANGE_THRESHOLDS };
