// models/Client.js
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: String,
    // Client Requirement
    requirement: {
      type: [String],
      enum: [
        "Static Website",
        "Digital Marketing",
        "Web Application",
        "Maintenance",
        "Other",
      ],
      default: [],
    },
    mobile: String,
    email: String,
    address: String,
    lead: String,

    // ✅ NEW: Lead status with default "Running"
    leadStatus: {
      type: String,
      enum: ["Running", "Converted", "Cancelled"],
      default: "Running",
    },
  },
  { timestamps: true },
);

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
