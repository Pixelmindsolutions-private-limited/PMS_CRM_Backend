const mongoose = require('mongoose');

const staffDocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

const staffSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  employeeName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    default: 'O+'
  },
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: null
  },
  idCardImage: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
  },
  documents: {
    type: Map,
    of: [staffDocumentSchema],
    default: {}
  }
}, {
  timestamps: true
});

// Generate employee ID before saving if not provided
staffSchema.pre('save', async function(next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Staff').countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    this.employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);