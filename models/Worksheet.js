// const mongoose = require('mongoose');

// const projectAssignmentSchema = new mongoose.Schema({
//   projectName: {
//     type: String,
//     required: true
//   },
//   startDate: {
//     type: String,
//     required: true
//   },
//   endDate: {
//     type: String,
//     required: true
//   },
//   comment: {
//     type: String,
//     default: ''
//   },
//   hours: {
//     type: String,
//     required: true
//   },
//   shift: {
//     type: String,
//     enum: ['morning', 'afternoon', 'fullday'],
//     default: 'morning'
//   }
// });

// const worksheetSchema = new mongoose.Schema({
//   empId: {
//     type: String,
//     required: true,
//     ref: 'Staff'
//   },
//   employName: {
//     type: String,
//     required: true
//   },
//   sheet: {
//     type: String,
//     enum: ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'],
//     required: true
//   },
//   projects: [projectAssignmentSchema],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });

// // Update timestamps on save
// worksheetSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// module.exports = mongoose.model('Worksheet', worksheetSchema);




const mongoose = require('mongoose');

// Project assignment schema
const projectAssignmentSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  hours: { type: Number, required: true, min: 1 },
  shift: { 
    type: String, 
    enum: ['morning', 'afternoon', 'fullday'], 
    default: 'morning' 
  },
  comment: { type: String, default: '' }
}, { _id: true });

// Main Worksheet Schema
const worksheetSchema = new mongoose.Schema({
  empId: { type: String, required: true, trim: true },
  employName: { type: String, required: true, trim: true },
  sheet: { 
    type: String, 
    enum: ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'], 
    required: true 
  },
  projects: [projectAssignmentSchema]
}, { timestamps: true });

// Create indexes for better query performance
worksheetSchema.index({ empId: 1 });
worksheetSchema.index({ employName: 1 });
worksheetSchema.index({ sheet: 1 });
worksheetSchema.index({ 'projects.projectName': 1 });
worksheetSchema.index({ createdAt: -1 });

const Worksheet = mongoose.models.Worksheet || mongoose.model('Worksheet', worksheetSchema);

module.exports = Worksheet;