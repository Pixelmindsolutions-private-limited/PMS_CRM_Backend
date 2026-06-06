// const mongoose = require('mongoose');

// // Project assignment schema
// const projectAssignmentSchema = new mongoose.Schema({
//   projectName: { type: String, required: true, trim: true },
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   hours: { type: Number, required: true, min: 1 },
//   shift: { 
//     type: String, 
//     enum: ['morning', 'afternoon', 'fullday'], 
//     default: 'morning' 
//   },
//   comment: { type: String, default: '' }
// }, { _id: true });

// // Main Worksheet Schema
// const worksheetSchema = new mongoose.Schema({
//   empId: { type: String, required: true, trim: true },
//   employName: { type: String, required: true, trim: true },
//   sheet: { 
//     type: String, 
//     enum: ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'], 
//     required: true 
//   },
//   projects: [projectAssignmentSchema]
// }, { timestamps: true });

// // Create indexes for better query performance
// worksheetSchema.index({ empId: 1 });
// worksheetSchema.index({ employName: 1 });
// worksheetSchema.index({ sheet: 1 });
// worksheetSchema.index({ 'projects.projectName': 1 });
// worksheetSchema.index({ createdAt: -1 });

// const Worksheet = mongoose.models.Worksheet || mongoose.model('Worksheet', worksheetSchema);

// module.exports = Worksheet;



const mongoose = require('mongoose');

// Task Item Schema (embedded in projects)
const taskItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  category: { 
    type: String, 
    enum: ['work', 'meeting', 'training', 'planning', 'personal', 'development', 'testing', 'design', 'documentation'],
    default: 'work' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'overdue'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  dueDate: { type: Date },
  assignedDate: { type: Date, default: Date.now },
  completedDate: { type: Date },
  estimatedHours: { type: Number, default: 0, min: 0 },
  actualHours: { type: Number, default: 0, min: 0 },
  assignedBy: {
    empId: { type: String, default: '' },
    employeeName: { type: String, default: '' }
  },
  comments: [{
    text: { type: String },
    postedBy: { type: String },
    postedAt: { type: Date, default: Date.now }
  }]
}, { _id: true });

// Project assignment schema (updated with tasks)
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
  comment: { type: String, default: '' },
  tasks: [taskItemSchema]  // ✅ Added tasks array for each project
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
worksheetSchema.index({ 'projects.tasks.status': 1 });
worksheetSchema.index({ createdAt: -1 });

const Worksheet = mongoose.models.Worksheet || mongoose.model('Worksheet', worksheetSchema);

module.exports = Worksheet;