const DelayRequest = require('../models/DelayRequest');
const WorkSession = require('../models/Worksession');
const { Staff } = require('../models/Staff');

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

const findSessionForTime = async (employeeId, at) => {
  return WorkSession.findOne({
    employeeId,
    startTime: { $lte: at },
    $or: [{ endTime: null }, { endTime: { $gte: at } }],
  }).sort({ startTime: -1 });
};

const recalcSessionTotals = (session, now = new Date()) => {
  const startMs = new Date(session.startTime).getTime();
  const endMs = session.endTime
    ? new Date(session.endTime).getTime()
    : now.getTime();
  const elapsedMinutes = Math.max(0, (endMs - startMs) / 60000);

  session.totalWorkDuration = Math.max(
    0,
    elapsedMinutes -
      (Number(session.totalBreakDuration) || 0) -
      (Number(session.totalIdleTime) || 0)
  );

  return session.totalWorkDuration;
};

// ---------------------------------------------------------------------------
// 1) EMPLOYEE — SUBMIT DELAY REQUEST
// POST /api/work-session/delay-request
// ---------------------------------------------------------------------------
exports.createDelayRequest = async (req, res) => {
  try {
    const employeeId =
      (req.user && req.user.employeeId) || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required',
      });
    }

    const {
      clientRequestId,
      reason,
      startTime,
      endTime,
      durationSeconds,
      location,
      requestType,
    } = req.body;

    if (!clientRequestId || !reason || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'clientRequestId, reason, startTime and endTime are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startTime or endTime',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime',
      });
    }

    // ✅ CHECK FOR EXISTING REQUEST WITH SAME clientRequestId
    const existing = await DelayRequest.findOne({
      employeeId,
      clientRequestId,
    });

    if (existing) {
      // If it's already approved or rejected, do NOT allow changing it
      if (existing.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: `Delay request already ${existing.status}`,
          data: existing,
          duplicate: true,
        });
      }

      // If it is still PENDING, update it with the new times and reason
      // (This handles the case where the frontend reuses the sessionId as clientRequestId)
      existing.reason = reason.trim();
      existing.startTime = start;
      existing.endTime = end;
      existing.durationSeconds = Number(durationSeconds) > 0 ? Number(durationSeconds) : Math.round((end - start) / 1000);
      existing.location = location || 'Office';
      existing.requestType = requestType || 'idle_delay';
      
      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Pending delay request updated with new times.',
        data: existing,
        updated: true,
      });
    }

    const staff = await Staff.findOne({ employeeId }).select(
      'employeeId employeeName role'
    );
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const session = await findSessionForTime(employeeId, start);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No work session found covering this time window',
      });
    }

    if (session.endTime && end > new Date(session.endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Delay window extends beyond the end of the work session',
      });
    }

    const computedSeconds = Math.round((end - start) / 1000);
    const finalDuration =
      Number(durationSeconds) > 0 ? Number(durationSeconds) : computedSeconds;

    // Overlap check for OTHER pending requests (ignoring the one we just checked)
    const overlap = await DelayRequest.findOne({
      employeeId,
      status: 'pending',
      clientRequestId: { $ne: clientRequestId }, // Exclude the current one
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'An overlapping delay request is already pending for this time window',
        data: { existingRequestId: overlap._id },
      });
    }

    const delayRequest = await DelayRequest.create({
      employeeId,
      employeeName: staff.employeeName || '',
      sessionId: session._id,
      clientRequestId,
      reason: reason.trim(),
      startTime: start,
      endTime: end,
      durationSeconds: finalDuration,
      location: location || 'Office',
      requestType: requestType || 'idle_delay',
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Delay request submitted. Awaiting admin approval.',
      data: delayRequest,
    });
  } catch (error) {
    console.error('createDelayRequest error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate delay request for this employee',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// 2) ADMIN — REVIEW (approve / reject)
// PATCH /api/work-session/delay-request/:id/review
// ---------------------------------------------------------------------------
exports.reviewDelayRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminComment = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action must be "approve" or "reject"',
      });
    }

    const delayRequest = await DelayRequest.findById(id);
    if (!delayRequest) {
      return res.status(404).json({
        success: false,
        message: 'Delay request not found',
      });
    }

    if (delayRequest.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `Delay request already ${delayRequest.status}`,
        data: delayRequest,
      });
    }

    const session = await WorkSession.findById(delayRequest.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Associated work session not found',
      });
    }

    const now = new Date();
    const durationMinutes = delayRequest.durationSeconds / 60;

    if (action === 'approve') {
      // Approved → delay time becomes WORK (subtract from idle)
      session.totalIdleTime = Math.max(
        0,
        (Number(session.totalIdleTime) || 0) - durationMinutes
      );

      delayRequest.status = 'approved';
      delayRequest.appliedToSession = true;

      if (!Array.isArray(session.activityLogs)) session.activityLogs = [];
      session.activityLogs.push({
        timestamp: now,
        type: 'active', 
        duration: Math.round(durationMinutes),
        details:
          `[delay_approved] ${delayRequest.reason} — ` +
          `${Math.round(durationMinutes)} min credited as work. ` +
          `(delayRequestId: ${delayRequest._id})`,
      });
    } else {
      // Rejected → delay time counted as IDLE/DELAY (add to idle)
      session.totalIdleTime =
        (Number(session.totalIdleTime) || 0) + durationMinutes;

      delayRequest.status = 'rejected';
      delayRequest.appliedToSession = true;

      if (!Array.isArray(session.activityLogs)) session.activityLogs = [];
      session.activityLogs.push({
        timestamp: now,
        type: 'active', 
        duration: Math.round(durationMinutes),
        details:
          `[delay_rejected] ${delayRequest.reason} — ` +
          `${Math.round(durationMinutes)} min counted as delay/idle. ` +
          `(delayRequestId: ${delayRequest._id})`,
      });
    }

    delayRequest.reviewedBy =
      (req.user && (req.user.name || req.user.email)) || 'admin';
    delayRequest.reviewedAt = now;
    delayRequest.adminComment = adminComment;

    recalcSessionTotals(session, now);

    await Promise.all([delayRequest.save(), session.save()]);

    return res.status(200).json({
      success: true,
      message: `Delay request ${delayRequest.status} successfully`,
      data: {
        delayRequest,
        session: {
          _id: session._id,
          status: session.status,
          totalWorkDuration: session.totalWorkDuration,
          totalWorkSeconds: Math.round(session.totalWorkDuration * 60),
          totalIdleTime: Math.round(session.totalIdleTime),
          totalBreakDuration: Math.round(session.totalBreakDuration || 0),
        },
      },
    });
  } catch (error) {
    console.error('reviewDelayRequest error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// 3) ADMIN — LIST
// GET /api/work-session/delay-request?status=&employeeId=&date=&page=&limit=
// ---------------------------------------------------------------------------
exports.getDelayRequests = async (req, res) => {
  try {
    const {
      status,
      employeeId,
      date,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    } else if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const f = new Date(fromDate);
        f.setHours(0, 0, 0, 0);
        query.createdAt.$gte = f;
      }
      if (toDate) {
        const t = new Date(toDate);
        t.setHours(23, 59, 59, 999);
        query.createdAt.$lte = t;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      DelayRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DelayRequest.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------------------------------------------------------------------
// 4) EMPLOYEE — MY REQUESTS
// GET /api/work-session/delay-request/my/:employeeId?date=&fromDate=&toDate=
// ---------------------------------------------------------------------------
exports.getMyDelayRequests = async (req, res) => {
  try {
    let employeeId = req.params.employeeId;

    if (req.user && req.user.type === 'staff') {
      if (req.user.employeeId !== employeeId) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own delay requests',
        });
      }
      employeeId = req.user.employeeId;
    }

    const { date, fromDate, toDate, status, page = 1, limit = 50 } = req.query;
    const query = { employeeId };

    if (status) query.status = status;

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
      }
    } else if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const f = new Date(fromDate);
        f.setHours(0, 0, 0, 0);
        query.createdAt.$gte = f;
      }
      if (toDate) {
        const t = new Date(toDate);
        t.setHours(23, 59, 59, 999);
        query.createdAt.$lte = t;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      DelayRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DelayRequest.countDocuments(query),
    ]);

    const stats = await DelayRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSeconds: { $sum: '$durationSeconds' },
        },
      },
    ]);

    const summary = {
      total: total,
      pending: 0,
      approved: 0,
      rejected: 0,
      approvedSeconds: 0,
      rejectedSeconds: 0,
      pendingSeconds: 0,
    };
    stats.forEach((s) => {
      summary[s._id] = s.count;
      if (s._id === 'approved') summary.approvedSeconds = s.totalSeconds;
      else if (s._id === 'rejected') summary.rejectedSeconds = s.totalSeconds;
      else if (s._id === 'pending') summary.pendingSeconds = s.totalSeconds;
    });

    return res.json({
      success: true,
      data: records,
      summary,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};