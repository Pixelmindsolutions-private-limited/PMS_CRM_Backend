const mongoose = require("mongoose");

// Staff Document Schema
const staffDocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, unique: true },
    employeeId: { type: String, required: true, ref: "Staff" },
    employeeName: { type: String, required: true },
    documentName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: {
      type: String,
      enum: [
        "pdf",
        "jpg",
        "jpeg",
        "png",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "txt",
        "other",
      ],
      default: "other",
    },
    fileSize: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
    description: { type: String, default: "" },
    batchId: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

staffDocumentSchema.pre("save", async function (next) {
  if (!this.documentId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.documentId = `DOC_${this.employeeId}_${timestamp}_${random}`;
  }
  next();
});

// Main Staff Schema
const staffSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, required: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: [
        "Admin",
        "Manager",
        "HR",
        "Flutter Developer",
        "Node.js Developer",
        "React Developer",
        "UI/UX Designer",
        "Tester / Testing",
        "Full-Stack Developer",
        "Graphic Designer",
        "Video Editor",
      ],
      default: "Staff",
    },
    mobile: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/],
      unique: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true },
    joiningDate: { type: Date, required: true, default: Date.now },
    monthlySalary: {
      type: Number,
      default: null,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female"],
      default: "Male",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"],
      default: "Unknown",
    },
    password: { type: String, required: true },
    adminEmail: { type: String, default: null, lowercase: true },
    adminPanelPassword: { type: String, default: null },
    isAdminPanelAccess: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: null },
    idCardImage: { type: String, default: null },
    lastActive: { type: Date, default: null },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
    emergencyContact: {
      name: { type: String, default: "" },
      relation: { type: String, default: "" },
      mobile: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

// Create models
const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
const StaffDocument =
  mongoose.models.StaffDocument ||
  mongoose.model("StaffDocument", staffDocumentSchema);

module.exports = { Staff, StaffDocument };
