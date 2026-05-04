// models/Fingerprint.js
const mongoose = require('mongoose');

const fingerprintSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  fingers: [{
    fingerPosition: {
      type: String,
      enum: [
        'RIGHT_THUMB', 'RIGHT_INDEX', 'RIGHT_MIDDLE', 'RIGHT_RING', 'RIGHT_LITTLE',
        'LEFT_THUMB', 'LEFT_INDEX', 'LEFT_MIDDLE', 'LEFT_RING', 'LEFT_LITTLE'
      ],
      required: true
    },
    template: {
      type: String,  // Base64 encoded encrypted template
      required: true
    },
    templateFormat: {
      type: String,
      enum: ['ISO_19794-2', 'ANSI_378', 'PROPRIETARY'],
      default: 'ISO_19794-2'
    },
    quality: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    lastUsed: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Metadata
  enrolledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  deviceInfo: {
    deviceId: String,
    deviceModel: String,
    platform: String  // 'android', 'ios', 'web'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique finger per staff
fingerprintSchema.index({ staffId: 1, 'fingers.fingerPosition': 1 }, { unique: true });

module.exports = mongoose.model('Fingerprint', fingerprintSchema);