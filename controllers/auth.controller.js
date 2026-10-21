const Admin = require('../models/Admin');
const { Staff } = require('../models/Staff');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Pending widget syncs: in-memory storage.
// Note: this is suitable only when POST and GET requests
// reach the same running Node.js process.
const pendingWidgetSyncs = new Map();

exports.loginSync = async (req, res) => {
  try {
    const token = req.body?.token;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Staff token is required",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mysecretkey"
    );

    if (decoded.type !== "staff" || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid staff token",
      });
    }

    const staff = await Staff.findById(decoded.id).select("-password");

    if (!staff || !staff.isActive) {
      return res.status(401).json({
        success: false,
        message: "Staff account is unavailable",
      });
    }

    const syncId = crypto.randomBytes(24).toString("hex");
    const expiresAt = Date.now() + 60_000;

    const payload = {
      token,
      user: {
        _id: String(staff._id),
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        name: staff.name,
        role: staff.role,
      },
      type: "staff",
    };

    pendingWidgetSyncs.set(syncId, {
      expiresAt,
      payload: {
        token,
        user: staff.toObject(),
        type: "staff",
      },
    });

    for (const [id, pending] of pendingWidgetSyncs) {
      if (pending.expiresAt <= Date.now()) {
        pendingWidgetSyncs.delete(id);
      }
    }

    console.log("Staff login sync created:", {
      syncId,
      employeeId: staff.employeeId,
      employeeName: staff.employeeName,
    });

    return res.json({
      success: true,
      message: "Staff login synchronized",
      ...payload,
      syncId,
    });
  } catch (error) {
    console.error("Staff login sync failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired staff token",
    });
  }
};

exports.consumeLoginSync = (req, res) => {
  const { syncId } = req.params;

  if (!/^[a-f0-9]{48}$/.test(syncId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid sync ID",
    });
  }

  const pending = pendingWidgetSyncs.get(syncId);

  if (!pending || pending.expiresAt <= Date.now()) {
    pendingWidgetSyncs.delete(syncId);

    return res.status(404).json({
      success: false,
      message: "Sync request expired or already used",
    });
  }

  // One-time consumption.
  pendingWidgetSyncs.delete(syncId);

  console.log("Staff login sync consumed:", {
    employeeId: pending.payload.user.employeeId,
    employeeName: pending.payload.user.employeeName,
  });

  return res.json({
    success: true,
    data: pending.payload,
  });
};