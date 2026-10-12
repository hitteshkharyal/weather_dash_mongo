const Sensor = require('../models/Sensor');
const Reading = require('../models/Reading');

// Sensor offline threshold (ms) — 60 seconds
const OFFLINE_THRESHOLD_MS = 60 * 1000;

/**
 * @route   POST /api/v1/sensors/data
 * @desc    Ingest sensor data payload from ESP32/ESP8266
 * @access  Device (via X-Device-API-Key)
 *
 * Expected JSON body:
 * {
 *   "siteId": "...",          // optional, derived from API key
 *   "sensors": {
 *     "bme280": { "temperature": 28.5, "humidity": 65.2, "pressure": 1013.25 },
 *     "scd41":  { "co2": 412 },
 *     "ltr390": { "uvIndex": 5.2, "ambientLight": 12000 },
 *     "anemometer": { "windSpeed": 15.3, "windDirection": 220 }
 *   },
 *   "timestamp": "2026-08-10T12:00:00Z"  // optional
 * }
 */
const ingestSensorData = async (req, res) => {
  try {
    const site = req.site; // Set by deviceAuth middleware
    const { sensors, timestamp } = req.body;

    if (!sensors || typeof sensors !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Missing or invalid "sensors" object in payload',
      });
    }

    const now = timestamp ? new Date(timestamp) : new Date();
    const readingData = {};
    const sensorUpdates = [];

    // Process each sensor type in the payload
    for (const [sensorType, data] of Object.entries(sensors)) {
      const validTypes = ['bme280', 'scd41', 'ltr390', 'anemometer', 'rainsensor'];
      if (!validTypes.includes(sensorType)) continue;

      // Merge sensor data into the reading
      Object.assign(readingData, data);

      // Upsert sensor record (create if not exists, update lastPing)
      sensorUpdates.push(
        Sensor.findOneAndUpdate(
          { siteId: site._id, sensorType },
          {
            siteId: site._id,
            sensorType,
            status: 'online',
            lastPing: now,
            label: `${sensorType.toUpperCase()} @ ${site.name}`,
          },
          { upsert: true, new: true }
        )
      );
    }

    // Execute sensor upserts in parallel
    await Promise.all(sensorUpdates);

    // Determine weather condition using the inference engine
    // (Will be wired in Phase 3 — for now store 'unknown')
    let inferredCondition = 'unknown';
    if (req.app.locals.inferWeather) {
      inferredCondition = req.app.locals.inferWeather(readingData);
    }

    // Store the reading
    const reading = await Reading.create({
      siteId: site._id,
      sensorType: 'combined',
      data: readingData,
      inferredCondition,
      timestamp: now,
    });

    // Broadcast via Socket.io if filter passes
    // (Will be wired in Phase 3)
    if (req.app.locals.broadcastReading) {
      req.app.locals.broadcastReading(site._id.toString(), {
        ...readingData,
        inferredCondition,
        timestamp: now,
        siteId: site._id,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        readingId: reading._id,
        inferredCondition,
        timestamp: now,
      },
    });
  } catch (err) {
    console.error('Ingestion error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * @route   GET /api/v1/sensors/status
 * @desc    Get sensor diagnostics (health, last ping, online/offline)
 * @access  Private (JWT, respects site access)
 */
const getSensorStatus = async (req, res) => {
  try {
    // Build query filter based on user permissions
    const filter = {};
    if (req.query.siteId) {
      filter.siteId = req.query.siteId;
    } else if (req.allowedSiteIds) {
      // Non-admin user — restrict to assigned sites
      filter.siteId = { $in: req.allowedSiteIds };
    }

    const sensors = await Sensor.find(filter)
      .populate('siteId', 'name location')
      .sort('siteId sensorType');

    const now = Date.now();

    const diagnostics = sensors.map((sensor) => {
      const lastPingMs = sensor.lastPing ? sensor.lastPing.getTime() : 0;
      const latencyMs = sensor.lastPing ? now - lastPingMs : null;
      const isOnline = latencyMs !== null && latencyMs < OFFLINE_THRESHOLD_MS;

      return {
        _id: sensor._id,
        siteId: sensor.siteId,
        sensorType: sensor.sensorType,
        label: sensor.label,
        status: isOnline ? 'online' : 'offline',
        lastPing: sensor.lastPing,
        latencyMs,
        metadata: sensor.metadata,
      };
    });

    res.status(200).json({
      success: true,
      count: diagnostics.length,
      data: diagnostics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * @route   GET /api/v1/sensors/readings
 * @desc    Get historical readings for a site
 * @access  Private (JWT, respects site access)
 */
const getReadings = async (req, res) => {
  try {
    const { siteId, limit = 100, from, to } = req.query;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'siteId query parameter is required',
      });
    }

    const filter = { siteId };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const readings = await Reading.find(filter)
      .sort('-timestamp')
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = { ingestSensorData, getSensorStatus, getReadings };
