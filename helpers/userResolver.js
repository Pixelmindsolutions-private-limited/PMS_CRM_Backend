// helpers/userResolver.js
const mongoose = require("mongoose");

const Admin = require("../models/Admin");
const { Staff } = require("../models/Staff");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Find a user by id in Admin OR Staff.
 * Returns { _id, name, email, role, model } or null.
 */
async function findAnyUser(userId, projection = "_id name email role employeeName employeeId") {
  if (!isValidId(userId)) return null;

  let doc = await Admin.findById(userId).select(projection).lean();
  if (doc) {
    return { ...doc, model: "Admin", role: doc.role || "admin" };
  }

  doc = await Staff.findById(userId).select(projection).lean();
  if (doc) {
    return { ...doc, model: "Staff", role: doc.role || "staff" };
  }

  return null;
}

/**
 * Batch fetch multiple users from Admin + Staff.
 * Returns a Map<idString, userObject>.
 */
async function findAnyUsers(ids = []) {
  const validIds = ids.filter(isValidId);
  const result = new Map();
  if (!validIds.length) return result;

  const [admins, staff] = await Promise.all([
    Admin.find({ _id: { $in: validIds } })
      .select("_id name email role")
      .lean(),
    Staff.find({ _id: { $in: validIds } })
      .select("_id name email role employeeName employeeId")
      .lean(),
  ]);

  admins.forEach((a) =>
    result.set(a._id.toString(), { ...a, model: "Admin", role: a.role || "admin" })
  );
  staff.forEach((s) =>
    result.set(s._id.toString(), { ...s, model: "Staff", role: s.role || "staff" })
  );

  return result;
}

module.exports = { findAnyUser, findAnyUsers, isValidId };