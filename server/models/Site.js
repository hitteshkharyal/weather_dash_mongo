const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    location: {
      address: { type: String, trim: true, default: '' },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },
    apiKey: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Site', siteSchema);
