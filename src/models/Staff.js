// const mongoose = require('mongoose');

// const staffDocumentSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   path: {
//     type: String,
//     required: true
//   },
//   uploadDate: {
//     type: Date,
//     default: Date.now
//   }
// });

// const staffSchema = new mongoose.Schema({
//   employeeId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   employeeName: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     required: true
//   },
//   mobile: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   joiningDate: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   bloodGroup: {
//     type: String,
//     enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
//     default: 'O+'
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   profileImage: {
//     type: String,
//     default: null
//   },
//   idCardImage: {
//     type: String,
//     default: null
//   },
//   lastActive: {
//     type: Date,
//     default: null
//   },
//   documents: {
//     type: Map,
//     of: [staffDocumentSchema],
//     default: {}
//   }
// }, {
//   timestamps: true
// });

// // Generate employee ID before saving if not provided
// staffSchema.pre('save', async function(next) {
//   if (!this.employeeId) {
//     const count = await mongoose.model('Staff').countDocuments();
//     const year = new Date().getFullYear().toString().slice(-2);
//     this.employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Staff', staffSchema);


const mongoose = require('mongoose');

// Staff Document Schema
const staffDocumentSchema = new mongoose.Schema({
  documentId: { type: String, unique: true },
  employeeId: { type: String, required: true, ref: 'Staff' },
  employeeName: { type: String, required: true },
  documentName: { type: String, required: true, trim: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'other'], default: 'other' },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, default: '' },
  description: { type: String, default: '' },
  batchId: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: String, default: null },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

staffDocumentSchema.pre('save', async function(next) {
  if (!this.documentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.documentId = `DOC_${this.employeeId}_${timestamp}_${random}`;
  }
  next();
});

// Main Staff Schema
const staffSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  employeeName: { type: String, required: true, trim: true },
  role: { type: String, required: true, enum: ['Admin', 'Manager', 'Staff', 'Teacher', 'Accountant', 'Librarian', 'Other'], default: 'Staff' },
  mobile: { type: String, required: true, match: [/^[0-9]{10}$/], unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  joiningDate: { type: Date, required: true, default: Date.now },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'], default: 'Unknown' },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  profileImage: { type: String, default: null },
  idCardImage: { type: String, default: null },
  lastActive: { type: Date, default: null },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    country: { type: String, default: 'India' }
  },
  emergencyContact: {
    name: { type: String, default: '' },
    relation: { type: String, default: '' },
    mobile: { type: String, default: '' }
  }
}, { timestamps: true });

// Generate Employee ID before saving
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    try {
      const Staff = mongoose.model('Staff');
      const count = await Staff.countDocuments();
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const sequence = String(count + 1).padStart(4, '0');
      this.employeeId = `EMP${year}${month}${sequence}`;
    } catch (error) {
      const fallback = Date.now().toString();
      this.employeeId = `EMP${fallback}`;
    }
  }
  next();
});

// Create models
const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
const StaffDocument = mongoose.models.StaffDocument || mongoose.model('StaffDocument', staffDocumentSchema);

module.exports = { Staff, StaffDocument };