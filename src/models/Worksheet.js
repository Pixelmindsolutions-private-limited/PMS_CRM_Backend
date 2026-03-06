const mongoose = require('mongoose');

const projectAssignmentSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  hours: {
    type: String,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'fullday'],
    default: 'morning'
  }
});

const worksheetSchema = new mongoose.Schema({
  empId: {
    type: String,
    required: true,
    ref: 'Staff'
  },
  employName: {
    type: String,
    required: true
  },
  sheet: {
    type: String,
    enum: ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'],
    required: true
  },
  projects: [projectAssignmentSchema],
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

// Update timestamps on save
worksheetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Worksheet', worksheetSchema);