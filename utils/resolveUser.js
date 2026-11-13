// utils/resolveUser.js
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const { Staff } = require("../models/Staff");

const ADMIN_SELECT = "_id name email role isActive profileImage";
const STAFF_SELECT =
  "_id employeeName employeeId email role isActive profileImage";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const loadAdmin = (id) => Admin.findById(id).select(ADMIN_SELECT);
const loadStaff = (id) => Staff.findById(id).select(STAFF_SELECT);

/**
 * Verify a JWT and return { user, type: "admin" | "staff" }.
 * Works with:
 *  - admin token from /api/adminpanel/verify-otp  (id or adminId in payload)
 *  - staff token from /api/staff/login            ({ id, type: "staff" })
 */
async function resolveTokenUser(token) {
  if (!token) throw new Error("Token required");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
  } catch (e) {
    throw new Error("Invalid or expired token");
  }

  const id = decoded.id || decoded.adminId || decoded._id || decoded.userId;
  if (!id || !isValidId(id)) throw new Error("Invalid token payload");

  // Decide the account type
  let type = decoded.type;
  if (type !== "admin" && type !== "staff") {
    if (decoded.adminId) type = "admin";
    else if (decoded.employeeId) type = "staff";
    else type = null; // unknown → try both
  }

  if (type === "admin" || type === null) {
    const admin = await loadAdmin(id);
    if (admin) {
      if (admin.isActive === false) throw new Error("Admin inactive");
      return { user: admin, type: "admin" };
    }
    if (type === "admin") throw new Error("Admin not found");
  }

  const staff = await loadStaff(id);
  if (!staff) throw new Error("User not found");
  if (staff.isActive === false) throw new Error("Staff inactive");
  return { user: staff, type: "staff" };
}

function shape(doc, accountType) {
  if (!doc) return null;
  const displayName =
    accountType === "staff" ? doc.employeeName : doc.name || doc.email;
  return { ...doc, accountType, displayName };
}

/**
 * Display info for a user. accountType optional (tries both if unknown).
 */
async function resolveParticipant(participantId, accountType) {
  if (!participantId || !isValidId(participantId)) return null;

  if (accountType === "admin") {
    return shape(
      await Admin.findById(participantId).select(ADMIN_SELECT).lean(),
      "admin"
    );
  }
  if (accountType === "staff") {
    return shape(
      await Staff.findById(participantId).select(STAFF_SELECT).lean(),
      "staff"
    );
  }

  const admin = await Admin.findById(participantId).select(ADMIN_SELECT).lean();
  if (admin) return shape(admin, "admin");
  const staff = await Staff.findById(participantId).select(STAFF_SELECT).lean();
  return shape(staff, "staff");
}

/**
 * Find a person by Mongo _id (admin or staff) OR by staff employeeId.
 */
async function findParticipantByRef(ref) {
  if (!ref) return null;
  const value = String(ref).trim();
  if (isValidId(value)) {
    const found = await resolveParticipant(value);
    if (found) return found;
  }
  const staff = await Staff.findOne({ employeeId: value, isActive: true })
    .select(STAFF_SELECT)
    .lean();
  return shape(staff, "staff");
}

module.exports = { resolveTokenUser, resolveParticipant, findParticipantByRef };