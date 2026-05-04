// const mongoose = require('mongoose');

// const activityLogSchema = new mongoose.Schema({
//   timestamp: {
//     type: Date,
//     default: Date.now
//   },
//   type: {
//     type: String,
//     enum: ['active', 'idle', 'break_start', 'break_end', 'work_start', 'work_end', 'idle_popup_shown'],
//     required: true
//   },
//   duration: {
//     type: Number,
//     default: 0
//   },
//   details: {
//     type: String,
//     default: ''
//   }
// });

// const breakSchema = new mongoose.Schema({
//   type: {
//     type: String,
//     enum: ['tea', 'lunch', 'other'],
//     required: true
//   },
//   startTime: {
//     type: Date,
//     required: true
//   },
//   endTime: {
//     type: Date,
//     default: null
//   },
//   duration: {
//     type: Number,
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['active', 'ended'],
//     default: 'active'
//   }
// });

// const workSessionSchema = new mongoose.Schema({
//   employeeId: {
//     type: String,
//     required: true,
//     unique: true,
//     ref: 'Staff'
//   },
//   employeeName: {
//     type: String,
//     required: true
//   },
//   date: {
//     type: Date,
//     required: true,
//     default: () => new Date().setHours(0, 0, 0, 0)
//   },
//   startTime: {
//     type: Date,
//     default: null
//   },
//   endTime: {
//     type: Date,
//     default: null
//   },
//   totalWorkDuration: {
//     type: Number,
//     default: 0
//   },
//   totalBreakDuration: {
//     type: Number,
//     default: 0
//   },
//   totalIdleTime: {
//     type: Number,
//     default: 0
//   },
//   status: {
//     type: String,
//     enum: ['not_started', 'working', 'idle', 'on_break', 'completed'],
//     default: 'not_started'
//   },
//   currentBreak: {
//     type: breakSchema,
//     default: null
//   },
//   breaks: [breakSchema],
//   activityLogs: [activityLogSchema],
//   idleStartTime: {
//     type: Date,
//     default: null
//   },
//   idlePopupShown: {
//     type: Boolean,
//     default: false
//   },
//   lastActiveTime: {
//     type: Date,
//     default: null
//   }
// }, {
//   timestamps: true
// });

// // // Indexes for faster queries
// // workSessionSchema.index({ employeeId: 1, date: 1 }, { unique: true });
// // workSessionSchema.index({ employeeId: 1 });
// // workSessionSchema.index({ date: 1 });
// // workSessionSchema.index({ status: 1 });

// const WorkSession = mongoose.model('WorkSession', workSessionSchema);

// module.exports = WorkSession;


const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['active', 'idle', 'break_start', 'break_end', 'work_start', 'work_end', 'idle_popup_shown'], required: true },
  duration: { type: Number, default: 0 },
  details: { type: String, default: '' }
});

const breakSchema = new mongoose.Schema({
  type: { type: String, enum: ['tea', 'lunch', 'other'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'ended'], default: 'active' }
});

const workSessionSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    // ❌ REMOVE THIS: unique: true
    ref: 'Staff'
  },
  employeeName: { type: String, required: true },
  date: { type: Date, required: true, default: () => new Date().setHours(0, 0, 0, 0) },
  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },
  totalWorkDuration: { type: Number, default: 0 },
  totalBreakDuration: { type: Number, default: 0 },
  totalIdleTime: { type: Number, default: 0 },
  status: { type: String, enum: ['not_started', 'working', 'idle', 'on_break', 'completed'], default: 'not_started' },
  currentBreak: { type: breakSchema, default: null },
  breaks: [breakSchema],
  activityLogs: [activityLogSchema],
  idleStartTime: { type: Date, default: null },
  idlePopupShown: { type: Boolean, default: false },
  lastActiveTime: { type: Date, default: null }
}, { timestamps: true });

// ✅ Non-unique index for faster queries
workSessionSchema.index({ employeeId: 1, date: -1 });
workSessionSchema.index({ status: 1 });

const WorkSession = mongoose.model('WorkSession', workSessionSchema);
module.exports = WorkSession;