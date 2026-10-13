const mongoose = require('mongoose');
const { SENSOR_TYPES } = require('../constants/sensors');

const sensorSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    sensorType: {
      type: String,
      required: true,
      enum: SENSOR_TYPES,
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },
    lastPing: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — one sensor type per site
sensorSchema.index({ siteId: 1, sensorType: 1 }, { unique: true });

module.exports = mongoose.model('Sensor', sensorSchema);
