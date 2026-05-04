const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  name: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    required: true
  },
  dayType: {
    type: String,
    enum: ['fullDay', 'halfDay', 'extraHours'],
    required: function() {
      return this.status === 'present';
    }
  },
  hoursWorked: {
    type: Number,
    min: 0,
    max: 24,
    required: function() {
      return this.status === 'present' && 
             (this.dayType === 'halfDay' || this.dayType === 'extraHours');
    }
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

// Compound index to ensure one attendance per staff per day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

// Update timestamps on save
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);