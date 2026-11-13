// models/DelayRequest.js
const mongoose = require('mongoose');

const REQUEST_TYPES = [
  'idle_delay', // generic idle / away time
  'meeting',
  'issue',
  'technical_issue',
  'client_call',
  'other',
];

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
    // 1 = first request of this session, 2 = second, 3 = third ...
    requestNumber: { type: Number },
    clientRequestId: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationSeconds: { type: Number, required: true, min: 1 },
    location: { type: String, default: 'Office' },
    requestType: { type: String, enum: REQUEST_TYPES, default: 'idle_delay' },
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
    // seconds actually moved from idle -> work when approved
    creditedSeconds: { type: Number, default: 0 },
  },
  { versionKey: false, timestamps: true }
);

delayRequestSchema.index(
  { employeeId: 1, clientRequestId: 1 },
  { unique: true }
);
// partial: old documents without requestNumber are ignored by this index
delayRequestSchema.index(
  { sessionId: 1, requestNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { requestNumber: { $exists: true } },
  }
);
delayRequestSchema.index({ sessionId: 1, status: 1, startTime: 1 });
delayRequestSchema.index({ employeeId: 1, startTime: 1, endTime: 1 });
delayRequestSchema.index({ employeeId: 1, status: 1, startTime: -1 });

const DelayRequest = mongoose.model('DelayRequest', delayRequestSchema);
DelayRequest.REQUEST_TYPES = REQUEST_TYPES;

module.exports = DelayRequest;