const mongoose = require('mongoose');

const delayRequestSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, default: '' },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkSession',
      required: true,
      index: true,
    },
    clientRequestId: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationSeconds: { type: Number, required: true, min: 1 },
    location: { type: String, default: 'Office' },
    requestType: {
      type: String,
      enum: ['idle_delay'],
      default: 'idle_delay',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    adminComment: { type: String, default: '' },
    appliedToSession: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

delayRequestSchema.index(
  { employeeId: 1, clientRequestId: 1 },
  { unique: true }
);
delayRequestSchema.index({ employeeId: 1, startTime: 1, endTime: 1 });
delayRequestSchema.index({ employeeId: 1, status: 1, startTime: -1 });

module.exports = mongoose.model('DelayRequest', delayRequestSchema);