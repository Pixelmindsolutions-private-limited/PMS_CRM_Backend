// middleware/chatAuth.middleware.js
const { resolveTokenUser } = require("../utils/resolveUser");

// Sets: req.user (mongoose doc, has _id), req.userType ("admin" | "staff")
exports.chatProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    const { user, type } = await resolveTokenUser(token);
    req.user = user;
    req.userType = type;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized: " + err.message });
  }
};

exports.chatAdminOnly = (req, res, next) => {
  if (req.userType !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin only" });
  }
  next();
};