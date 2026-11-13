// controllers/delayRequestController.js
const crypto = require('crypto');
const mongoose = require('mongoose');
const DelayRequest = require('../models/DelayRequest');
const WorkSession = require('../models/Worksession');
const { Staff } = require('../models/Staff');

const { REQUEST_TYPES } = DelayRequest;
const MAX_BATCH = 20;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const isAdmin = (req) => !!req.user && req.user.type === 'admin';
const isStaff = (req) => !!req.user && req.user.type === 'staff';

const httpError = (status, message, extra) =>
  Object.assign(new Error(message), { status, extra });

const fail = (res, err, label) => {
  console.error(`${label}:`, err);
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: 'Duplicate delay request' });
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message,
    ...(err.extra || {}),
  });
};

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// plain object + "1st request" label
const present = (doc) => {
  const o = doc && doc.toObject ? doc.toObject() : doc;
  return {
    ...o,
    requestLabel: o.requestNumber ? `${ordinal(o.requestNumber)} request` : null,
  };
};

const findSessionForTime = (employeeId, at) =>
  WorkSession.findOne({
    employeeId,
    startTime: { $lte: at },
    $or: [{ endTime: null }, { endTime: { $gte: at } }],
  }).sort({ startTime: -1 });

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

const sessionTotals = (session) => ({
  _id: session._id,
  status: session.status,
  totalWorkDuration: session.totalWorkDuration,
  totalWorkSeconds: Math.round((Number(session.totalWorkDuration) || 0) * 60),
  totalIdleTime: Math.round(Number(session.totalIdleTime) || 0),
  totalBreakDuration: Math.round(Number(session.totalBreakDuration) || 0),
  // needs `totalDelayTime` in the WorkSession schema (see notes)
  totalDelayTime: Math.round(Number(session.totalDelayTime) || 0),
});

function parseWindow(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (!startTime || !endTime || isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw httpError(400, 'Valid startTime and endTime are required');
  }
  if (end <= start) throw httpError(400, 'endTime must be after startTime');
  return { start, end };
}

// the delay window must lie inside the session (and not in the future)
function checkAgainstSession(session, start, end, now = new Date()) {
  if (start < new Date(session.startTime)) {
    throw httpError(400, 'Delay window starts before the work session started');
  }
  const sessionEnd = session.endTime ? new Date(session.endTime) : now;
  if (end.getTime() > sessionEnd.getTime() + 60 * 1000) {
    throw httpError(
      400,
      session.endTime
        ? 'Delay window extends beyond the end of the work session'
        : 'Delay window cannot be in the future'
    );
  }
  // current idle period is not yet counted in totalIdleTime
  if (session.status === 'idle' && session.idleStartTime) {
    if (end > new Date(session.idleStartTime)) {
      throw httpError(
        400,
        'Resume work first, then submit the delay request for the idle period'
      );
    }
  }
}

// pending + approved requests may not overlap (prevents double crediting)
const findOverlap = (sessionId, start, end, excludeId = null) => {
  const q = {
    sessionId,
    status: { $in: ['pending', 'approved'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return DelayRequest.findOne(q);
};

async function nextRequestNumber(sessionId) {
  const last = await DelayRequest.findOne({
    sessionId,
    requestNumber: { $exists: true },
  })
    .sort({ requestNumber: -1 })
    .select('requestNumber')
    .lean();
  return ((last && last.requestNumber) || 0) + 1;
}

// assigns 1st / 2nd / 3rd ... per session, retries if two requests race
async function createWithNumber(data) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const requestNumber = await nextRequestNumber(data.sessionId);
    try {
      return await DelayRequest.create({ ...data, requestNumber });
    } catch (err) {
      const raced =
        err.code === 11000 && err.keyPattern && err.keyPattern.requestNumber;
      if (!raced) throw err;
    }
  }
  throw httpError(409, 'Could not assign a request number, please retry');
}

async function loadSession(sessionId) {
  if (!isValidId(sessionId)) throw httpError(400, 'Invalid sessionId');
  const session = await WorkSession.findById(sessionId);
  if (!session) throw httpError(404, 'Work session not found');
  return session;
}

async function loadRequestForActor(req, id) {
  if (!isValidId(id)) throw httpError(400, 'Invalid delay request id');
  const dr = await DelayRequest.findById(id);
  if (!dr) throw httpError(404, 'Delay request not found');
  if (!isAdmin(req) && dr.employeeId !== (req.user && req.user.employeeId)) {
    throw httpError(403, 'You can only access your own delay requests');
  }
  return dr;
}

function applyDateFilter(query, { date, fromDate, toDate }) {
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
      if (!isNaN(f.getTime())) {
        f.setHours(0, 0, 0, 0);
        query.createdAt.$gte = f;
      }
    }
    if (toDate) {
      const t = new Date(toDate);
      if (!isNaN(t.getTime())) {
        t.setHours(23, 59, 59, 999);
        query.createdAt.$lte = t;
      }
    }
    if (!Object.keys(query.createdAt).length) delete query.createdAt;
  }
}

const paging = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 50, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

async function summaryFor(match) {
  const stats = await DelayRequest.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSeconds: { $sum: '$durationSeconds' },
        creditedSeconds: { $sum: '$creditedSeconds' },
      },
    },
  ]);
  const summary = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingSeconds: 0,
    approvedSeconds: 0,
    rejectedSeconds: 0,
    creditedSeconds: 0,
  };
  stats.forEach((s) => {
    summary.total += s.count;
    summary[s._id] = s.count;
    summary[`${s._id}Seconds`] = s.totalSeconds;
    if (s._id === 'approved') summary.creditedSeconds = s.creditedSeconds;
  });
  return summary;
}

// ---------------------------------------------------------------------------
// 1) STAFF — CREATE (one or many requests, per work session)
// POST /api/work-session/delay-request
// body: { sessionId, requests: [ { reason, startTime, endTime, requestType, location } ] }
//   or  a single object { sessionId, reason, startTime, endTime, ... }
//   or  a bare array [ { sessionId?, reason, ... } ]
// Each request gets requestNumber 1, 2, 3 ... inside its session.
// ---------------------------------------------------------------------------
exports.createDelayRequests = async (req, res) => {
  try {
    if (!isStaff(req)) throw httpError(403, 'Access denied. Staff only.');
    const employeeId = req.user.employeeId;
    const body = req.body || {};

    const items = Array.isArray(body)
      ? body
      : Array.isArray(body.requests)
      ? body.requests
      : [body];

    if (!items.length) throw httpError(400, 'At least one request is required');
    if (items.length > MAX_BATCH) {
      throw httpError(400, `Maximum ${MAX_BATCH} requests per call`);
    }

    const staff = await Staff.findOne({ employeeId }).select(
      'employeeId employeeName'
    );
    if (!staff) throw httpError(404, 'Employee not found');

    const now = new Date();
    const sessions = new Map();
    const errors = [];
    const prepared = [];
    const duplicates = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      try {
        const reason = String(it.reason || '').trim();
        if (!reason) throw httpError(400, 'reason is required');

        const requestType = it.requestType || 'idle_delay';
        if (!REQUEST_TYPES.includes(requestType)) {
          throw httpError(
            400,
            `requestType must be one of: ${REQUEST_TYPES.join(', ')}`
          );
        }

        const { start, end } = parseWindow(it.startTime, it.endTime);

        let session;
        const sid = it.sessionId || body.sessionId;
        if (sid) {
          if (!sessions.has(String(sid))) {
            sessions.set(String(sid), await loadSession(sid));
          }
          session = sessions.get(String(sid));
        } else {
          session = await findSessionForTime(employeeId, start);
          if (!session) {
            throw httpError(
              404,
              'No work session found covering this time window (send sessionId)'
            );
          }
          sessions.set(String(session._id), session);
        }

        if (session.employeeId !== employeeId) {
          throw httpError(403, 'This work session belongs to another employee');
        }
        checkAgainstSession(session, start, end, now);

        // idempotency: same clientRequestId = same request
        const clientRequestId = it.clientRequestId
          ? String(it.clientRequestId).trim()
          : '';
        if (clientRequestId) {
          const ex = await DelayRequest.findOne({ employeeId, clientRequestId });
          if (ex) {
            duplicates.push(present(ex));
            continue;
          }
        }

        const overlap = await findOverlap(session._id, start, end);
        if (overlap) {
          throw httpError(
            409,
            `Overlaps an existing ${overlap.status} request (#${
              overlap.requestNumber || '-'
            })`
          );
        }
        const clash = prepared.find(
          (p) =>
            String(p.sessionId) === String(session._id) &&
            p.startTime < end &&
            p.endTime > start
        );
        if (clash) {
          throw httpError(409, 'Overlaps another request in this same call');
        }

        prepared.push({
          employeeId,
          employeeName: staff.employeeName || '',
          sessionId: session._id,
          clientRequestId:
            clientRequestId ||
            `${session._id}-${Date.now()}-${i}-${crypto
              .randomBytes(3)
              .toString('hex')}`,
          reason,
          startTime: start,
          endTime: end,
          durationSeconds: Math.round((end - start) / 1000),
          location: it.location || 'Office',
          requestType,
          status: 'pending',
        });
      } catch (e) {
        errors.push({ index: i, status: e.status || 500, message: e.message });
      }
    }

    // all-or-nothing validation
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Some requests are invalid. Nothing was saved.',
        errors,
      });
    }

    if (!prepared.length) {
      return res.status(200).json({
        success: true,
        message: 'All requests were already submitted',
        count: 0,
        data: [],
        duplicates,
      });
    }

    const created = [];
    for (const p of prepared) {
      created.push(await createWithNumber(p));
    }

    return res.status(201).json({
      success: true,
      message: `${created.length} delay request(s) submitted. Awaiting admin approval.`,
      count: created.length,
      data: created.map(present),
      duplicates,
    });
  } catch (error) {
    return fail(res, error, 'createDelayRequests');
  }
};
exports.createDelayRequest = exports.createDelayRequests; // old name

// ---------------------------------------------------------------------------
// 2) STAFF — LIST REQUESTS OF ONE WORK SESSION (1st, 2nd, 3rd ...)
// GET /api/work-session/delay-request/session/:sessionId?status=
// ---------------------------------------------------------------------------
exports.getSessionDelayRequests = async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!isAdmin(req) && session.employeeId !== req.user.employeeId) {
      throw httpError(403, 'You can only view your own work sessions');
    }

    const query = { sessionId: session._id };
    if (req.query.status) query.status = req.query.status;

    const [records, summary] = await Promise.all([
      DelayRequest.find(query).sort({ requestNumber: 1, createdAt: 1 }),
      summaryFor({ sessionId: session._id }),
    ]);

    return res.json({
      success: true,
      data: records.map(present),
      summary,
      session: sessionTotals(session),
    });
  } catch (error) {
    return fail(res, error, 'getSessionDelayRequests');
  }
};

// ---------------------------------------------------------------------------
// 3) STAFF — MY REQUESTS
// GET /api/work-session/delay-request/my/:employeeId?status=&date=&fromDate=&toDate=&page=&limit=
// ---------------------------------------------------------------------------
exports.getMyDelayRequests = async (req, res) => {
  try {
    let employeeId = req.params.employeeId;

    if (req.user && req.user.type === 'staff') {
      if (req.user.employeeId !== employeeId) {
        throw httpError(403, 'You can only view your own delay requests');
      }
      employeeId = req.user.employeeId;
    }

    const { status, sessionId } = req.query;
    const query = { employeeId };
    if (status) query.status = status;
    if (sessionId && isValidId(sessionId)) {
      query.sessionId = new mongoose.Types.ObjectId(sessionId);
    }
    applyDateFilter(query, req.query);

    const { page, limit, skip } = paging(req.query);
    const [records, total, summary] = await Promise.all([
      DelayRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DelayRequest.countDocuments(query),
      summaryFor(query),
    ]);

    return res.json({
      success: true,
      data: records.map(present),
      summary,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return fail(res, error, 'getMyDelayRequests');
  }
};

// ---------------------------------------------------------------------------
// 4) ADMIN — LIST ALL
// GET /api/work-session/delay-request?status=&employeeId=&sessionId=&requestType=&date=&fromDate=&toDate=&page=&limit=
// ---------------------------------------------------------------------------
exports.getDelayRequests = async (req, res) => {
  try {
    const { status, employeeId, sessionId, requestType } = req.query;

    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (requestType) query.requestType = requestType;
    if (sessionId) {
      if (!isValidId(sessionId)) throw httpError(400, 'Invalid sessionId');
      query.sessionId = new mongoose.Types.ObjectId(sessionId);
    }
    applyDateFilter(query, req.query);

    const { page, limit, skip } = paging(req.query);
    const [records, total, summary] = await Promise.all([
      DelayRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DelayRequest.countDocuments(query),
      summaryFor(query),
    ]);

    return res.json({
      success: true,
      data: records.map(present),
      summary,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return fail(res, error, 'getDelayRequests');
  }
};

// ---------------------------------------------------------------------------
// 5) GET ONE (owner or admin)
// GET /api/work-session/delay-request/:id
// ---------------------------------------------------------------------------
exports.getDelayRequestById = async (req, res) => {
  try {
    const dr = await loadRequestForActor(req, req.params.id);
    return res.json({ success: true, data: present(dr) });
  } catch (error) {
    return fail(res, error, 'getDelayRequestById');
  }
};

// ---------------------------------------------------------------------------
// 6) STAFF — EDIT (only while pending)
// PUT /api/work-session/delay-request/:id
// body: any of { reason, startTime, endTime, requestType, location }
// ---------------------------------------------------------------------------
exports.updateDelayRequest = async (req, res) => {
  try {
    if (!isStaff(req)) throw httpError(403, 'Access denied. Staff only.');
    const dr = await loadRequestForActor(req, req.params.id);

    if (dr.status !== 'pending') {
      throw httpError(409, `Delay request already ${dr.status}; it can no longer be edited`);
    }

    const { reason, startTime, endTime, requestType, location } = req.body || {};
    if (
      reason === undefined &&
      startTime === undefined &&
      endTime === undefined &&
      requestType === undefined &&
      location === undefined
    ) {
      throw httpError(400, 'Nothing to update');
    }

    if (reason !== undefined) {
      const r = String(reason).trim();
      if (!r) throw httpError(400, 'reason cannot be empty');
      dr.reason = r;
    }
    if (requestType !== undefined) {
      if (!REQUEST_TYPES.includes(requestType)) {
        throw httpError(
          400,
          `requestType must be one of: ${REQUEST_TYPES.join(', ')}`
        );
      }
      dr.requestType = requestType;
    }
    if (location !== undefined) dr.location = String(location).trim() || 'Office';

    if (startTime !== undefined || endTime !== undefined) {
      const { start, end } = parseWindow(
        startTime !== undefined ? startTime : dr.startTime,
        endTime !== undefined ? endTime : dr.endTime
      );
      const session = await loadSession(dr.sessionId);
      checkAgainstSession(session, start, end);

      const overlap = await findOverlap(dr.sessionId, start, end, dr._id);
      if (overlap) {
        throw httpError(
          409,
          `Overlaps an existing ${overlap.status} request (#${
            overlap.requestNumber || '-'
          })`
        );
      }
      dr.startTime = start;
      dr.endTime = end;
      dr.durationSeconds = Math.round((end - start) / 1000);
    }

    await dr.save();
    return res.json({
      success: true,
      message: 'Delay request updated',
      data: present(dr),
    });
  } catch (error) {
    return fail(res, error, 'updateDelayRequest');
  }
};

// ---------------------------------------------------------------------------
// 7) DELETE / CANCEL (owner or admin, only while pending)
// DELETE /api/work-session/delay-request/:id
// ---------------------------------------------------------------------------
exports.deleteDelayRequest = async (req, res) => {
  try {
    const dr = await loadRequestForActor(req, req.params.id);
    if (dr.status !== 'pending') {
      throw httpError(
        409,
        `Delay request already ${dr.status}; it can no longer be deleted`
      );
    }
    await dr.deleteOne();
    return res.json({ success: true, message: 'Delay request deleted' });
  } catch (error) {
    return fail(res, error, 'deleteDelayRequest');
  }
};

// ---------------------------------------------------------------------------
// REVIEW CORE
//  approve → the delay minutes are moved from IDLE to WORK time
//  reject  → the delay minutes stay idle and are recorded as DELAY time
// ---------------------------------------------------------------------------
async function applyReview(id, action, adminComment, reviewer) {
  if (!isValidId(id)) throw httpError(400, 'Invalid delay request id');
  if (!['approve', 'reject'].includes(action)) {
    throw httpError(400, 'action must be "approve" or "reject"');
  }

  const now = new Date();
  const status = action === 'approve' ? 'approved' : 'rejected';

  // atomic claim: two admins cannot review the same request twice
  const dr = await DelayRequest.findOneAndUpdate(
    { _id: id, status: 'pending' },
    {
      $set: {
        status,
        reviewedBy: reviewer,
        reviewedAt: now,
        adminComment: String(adminComment || ''),
      },
    },
    { new: true }
  );

  if (!dr) {
    const existing = await DelayRequest.findById(id);
    if (!existing) throw httpError(404, 'Delay request not found');
    throw httpError(409, `Delay request already ${existing.status}`, {
      data: present(existing),
    });
  }

  try {
    const session = await WorkSession.findById(dr.sessionId);
    if (!session) throw httpError(404, 'Associated work session not found');

    const minutes = dr.durationSeconds / 60;
    if (!Array.isArray(session.activityLogs)) session.activityLogs = [];

    if (action === 'approve') {
      const idle = Number(session.totalIdleTime) || 0;
      const credit = Math.min(minutes, idle);
      session.totalIdleTime = Math.max(0, idle - credit);
      dr.creditedSeconds = Math.round(credit * 60);

      session.activityLogs.push({
        timestamp: now,
        type: 'active',
        duration: Math.round(credit),
        details:
          `[delay_approved #${dr.requestNumber || '-'}] ${dr.reason} — ` +
          `${Math.round(credit)} min credited as work. (delayRequestId: ${dr._id})`,
      });
    } else {
      session.totalDelayTime = (Number(session.totalDelayTime) || 0) + minutes;
      dr.creditedSeconds = 0;

      session.activityLogs.push({
        timestamp: now,
        type: 'active',
        duration: Math.round(minutes),
        details:
          `[delay_rejected #${dr.requestNumber || '-'}] ${dr.reason} — ` +
          `${Math.round(minutes)} min counted as delay. (delayRequestId: ${dr._id})`,
      });
    }

    dr.appliedToSession = true;
    recalcSessionTotals(session, now);

    await session.save();
    await dr.save();

    return { delayRequest: present(dr), session: sessionTotals(session) };
  } catch (err) {
    // put the request back to pending so the admin can retry
    await DelayRequest.updateOne(
      { _id: id },
      {
        $set: {
          status: 'pending',
          reviewedBy: null,
          reviewedAt: null,
          adminComment: '',
          appliedToSession: false,
          creditedSeconds: 0,
        },
      }
    );
    throw err;
  }
}

const reviewerName = (req) =>
  (req.user && (req.user.name || req.user.email)) || 'admin';

// ---------------------------------------------------------------------------
// 8) ADMIN — REVIEW ONE
// PATCH /api/work-session/delay-request/:id/review   body: { action, adminComment }
// ---------------------------------------------------------------------------
exports.reviewDelayRequest = async (req, res) => {
  try {
    const { action, adminComment = '' } = req.body || {};
    const data = await applyReview(
      req.params.id,
      action,
      adminComment,
      reviewerName(req)
    );
    return res.status(200).json({
      success: true,
      message: `Delay request ${data.delayRequest.status} successfully`,
      data,
    });
  } catch (error) {
    return fail(res, error, 'reviewDelayRequest');
  }
};

// ---------------------------------------------------------------------------
// 9) ADMIN — REVIEW MANY (e.g. all requests of a session)
// PATCH /api/work-session/delay-request/review-many
// body: { ids: [...], action, adminComment }
// ---------------------------------------------------------------------------
exports.reviewManyDelayRequests = async (req, res) => {
  try {
    const { ids, action, adminComment = '' } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) {
      throw httpError(400, 'ids array is required');
    }
    if (ids.length > 50) throw httpError(400, 'Maximum 50 ids per call');
    if (!['approve', 'reject'].includes(action)) {
      throw httpError(400, 'action must be "approve" or "reject"');
    }

    const results = [];
    for (const id of ids) {
      try {
        const data = await applyReview(id, action, adminComment, reviewerName(req));
        results.push({ id, success: true, status: data.delayRequest.status });
      } catch (e) {
        results.push({ id, success: false, message: e.message });
      }
    }

    const ok = results.filter((r) => r.success).length;
    return res.status(200).json({
      success: ok > 0,
      message: `${ok} of ${ids.length} request(s) ${action}d`,
      results,
    });
  } catch (error) {
    return fail(res, error, 'reviewManyDelayRequests');
  }
};