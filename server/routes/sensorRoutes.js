const express = require('express');
const router = express.Router();
const { deviceAuth } = require('../middleware/deviceAuth');
const { protect } = require('../middleware/auth');
const { enforceSiteAccess } = require('../middleware/siteAccess');
const {
  ingestSensorData,
  getSensorStatus,
  getReadings,
} = require('../controllers/sensorController');

// ─── Device Ingestion (API key auth) ──────────────
router.post('/data', deviceAuth, ingestSensorData);

// ─── Dashboard Queries (JWT auth + site access) ───
router.get('/status', protect, enforceSiteAccess, getSensorStatus);
router.get('/readings', protect, enforceSiteAccess, getReadings);

module.exports = router;
