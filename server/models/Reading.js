const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    sensorType: {
      type: String,
      required: true,
      enum: ['bme280', 'scd41', 'ltr390', 'anemometer', 'rainsensor', 'combined'],
    },
    data: {
      // BME280
      temperature: { type: Number },    // °C
      humidity: { type: Number },        // %
      pressure: { type: Number },        // hPa

      // SCD41
      co2: { type: Number },            // ppm

      // LTR390
      uvIndex: { type: Number },        // UV index
      ambientLight: { type: Number },   // lux

      // Anemometer
      windSpeed: { type: Number },      // km/h
      windDirection: { type: Number },  // degrees 0-360

      // Rain Sensor
      rainIntensity: { type: Number },  // 0-100 (0=dry, 100=heavy rain)
    },
    // The weather condition inferred at ingestion time
    inferredCondition: {
      type: String,
      default: 'unknown',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient time-series queries per site
readingSchema.index({ siteId: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', readingSchema);
