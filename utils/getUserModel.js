// utils/getUserModel.js
// Safely resolves whichever User-like model exists in this project.

const mongoose = require("mongoose");

// Try common filenames and model names
const CANDIDATES = [
  // require paths
  { path: "../models/User", name: "User" },
  { path: "../models/user.model", name: "User" },
  { path: "../models/User.model", name: "User" },
  { path: "../models/Staff", name: "Staff" },
  { path: "../models/staff.model", name: "Staff" },
  { path: "../models/Staff.model", name: "Staff" },
  { path: "../models/Admin", name: "Admin" },
  { path: "../models/admin.model", name: "Admin" },
  { path: "../models/Admin.model", name: "Admin" },
  { path: "../models/auth.model", name: "User" },
];

let cached = null;

function loadModel(candidate) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const mod = require(candidate.path);

    // Module may export the model directly (mongoose.Model)
    if (mod && typeof mod.findById === "function" && mod.modelName) {
      return mod;
    }

    // Or export named
    if (mod && mod[candidate.name]) {
      return mod[candidate.name];
    }

    // Or export { default }
    if (mod && mod.default) {
      return mod.default;
    }

    // Or module.exports = { User: ... } with a different name
    if (mod && typeof mod === "object") {
      const firstModel = Object.values(mod).find(
        (v) => v && typeof v.findById === "function" && v.modelName
      );
      if (firstModel) return firstModel;
    }
  } catch (err) {
    // file doesn't exist or require failed — keep trying
  }
  return null;
}

/**
 * Return the User/Staff/Admin model that this project actually uses.
 * Cached after first successful resolve.
 */
function getUserModel() {
  if (cached) return cached;

  // 1) Try each candidate file
  for (const c of CANDIDATES) {
    const m = loadModel(c);
    if (m) {
      cached = m;
      console.log(`✅ [getUserModel] resolved model: ${m.modelName} (${c.path})`);
      return cached;
    }
  }

  // 2) Try mongoose already-registered models
  const registered = ["User", "Staff", "Admin", "user", "staff", "admin"];
  for (const name of registered) {
    const m = mongoose.models[name];
    if (m && typeof m.findById === "function") {
      cached = m;
      console.log(`✅ [getUserModel] using registered model: ${name}`);
      return cached;
    }
  }

  throw new Error(
    "❌ [getUserModel] No User/Staff/Admin model found. " +
      "Check your ./models folder and update utils/getUserModel.js CANDIDATES."
  );
}

module.exports = { getUserModel };