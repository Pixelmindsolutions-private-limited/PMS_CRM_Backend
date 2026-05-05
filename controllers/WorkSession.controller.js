const WorkSession = require('../Models/Worksession');
const { Staff } = require('../Models/Staff');

const activeBreaks = new Map();

// Helper function to format time
const formatTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// @desc    Start work session
const startWork = async (req, res) => {
  try {
    const { employeeId, notes } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

    const staff = await Staff.findOne({ employeeId });
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const now = new Date();
    if (activeBreaks.has(employeeId)) activeBreaks.delete(employeeId);

    const session = new WorkSession({
      employeeId, employeeName: staff.employeeName, date: today,
      startTime: now, status: 'working', lastActiveTime: now,
      activityLogs: [{ timestamp: now, type: 'work_start', details: notes || 'Work started' }]
    });
    await session.save();

    res.json({ success: true, message: "Work started successfully", data: { sessionId: session._id, startTime: session.startTime, status: session.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start break
const startBreak = async (req, res) => {
  try {
    const { employeeId, breakType } = req.body;
    if (!employeeId || !breakType) return res.status(400).json({ success: false, message: "Employee ID and break type are required" });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today, status: { $in: ['working', 'idle'] } });
    if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

    const breakDuration = breakType === 'lunch' ? 60 : 15;
    const now = new Date();
    const breakEndTime = new Date(now.getTime() + breakDuration * 60000);

    session.status = 'on_break';
    session.lastActiveTime = now;
    session.activityLogs.push({ timestamp: now, type: 'break_start', details: `${breakType} break started for ${breakDuration} minutes` });
    await session.save();

    activeBreaks.set(employeeId, { breakEndTime, breakType, sessionId: session._id, breakDuration });
    setTimeout(() => autoEndBreakAndCheckActivity(employeeId), breakDuration * 60 * 1000);

    res.json({ success: true, message: `${breakType} break started for ${breakDuration} minutes`, data: { breakType, breakDuration, breakEndTime } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Auto end break
const autoEndBreakAndCheckActivity = async (employeeId) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today, status: 'on_break' });
    if (!session) return;
    
    const breakInfo = activeBreaks.get(employeeId);
    const now = new Date();
    const lastActiveTime = session.lastActiveTime || session.startTime;
    const idleMinutes = (now - lastActiveTime) / (1000 * 60);

    session.status = 'idle_checking';
    session.activityLogs.push({ timestamp: now, type: 'break_end', details: `${breakInfo?.breakType} break ended` });
    await session.save();
    activeBreaks.delete(employeeId);

    if (idleMinutes >= 1 && !session.idlePopupShown) {
      session.status = 'idle';
      session.idlePopupShown = true;
      session.idleStartTime = session.idleStartTime || lastActiveTime;
      session.activityLogs.push({ timestamp: now, type: 'idle_popup_shown', duration: idleMinutes });
      await session.save();
    } else {
      session.status = 'working';
      session.lastActiveTime = now;
      session.idlePopupShown = false;
      await session.save();
    }
  } catch (error) { console.error('Auto end break error:', error); }
};

// @desc    Update activity (heartbeat)
const updateActivity = async (req, res) => {
  try {
    const { employeeId, isIdle } = req.body;  // ✅ Added isIdle
    if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

    // If on break, handle separately
    if (activeBreaks.has(employeeId)) {
      const breakInfo = activeBreaks.get(employeeId);
      const remainingMinutes = Math.ceil((breakInfo.breakEndTime - new Date()) / 60000);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const session = await WorkSession.findOne({ employeeId, date: today, status: 'on_break' });
      if (session) { session.lastActiveTime = new Date(); await session.save(); }
      return res.json({ success: true, message: `On ${breakInfo.breakType} break`, data: { status: 'on_break', breakRemaining: `${remainingMinutes} minutes` } });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today, status: { $in: ['working', 'idle', 'idle_checking'] } });
    if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

    const now = new Date();

    // ✅ If frontend says user is idle
    if (isIdle === true || isIdle === 'true') {
      // Calculate idle time since last activity
      if (session.lastActiveTime && session.status === 'working') {
        const idleSince = session.lastActiveTime;
        session.idleStartTime = idleSince;
        session.status = 'idle';
        session.activityLogs.push({ 
          timestamp: now, 
          type: 'idle', 
          details: 'User became idle',
          duration: Math.round((now - idleSince) / (1000 * 60))
        });
        await session.save();
        
        return res.json({ 
          success: true, 
          message: "User is idle", 
          data: { 
            status: 'idle', 
            idleStartTime: idleSince,
            totalWorkDuration: session.totalWorkDuration 
          } 
        });
      }
    }

    // ✅ If user was idle and now active again
    if (session.status === 'idle' && session.idleStartTime) {
      const idleDuration = (now - session.idleStartTime) / (1000 * 60);
      if (idleDuration > 0) {
        session.totalIdleTime += idleDuration;
      }
      session.activityLogs.push({ 
        timestamp: now, 
        type: 'active', 
        details: 'User became active again',
        duration: Math.round(idleDuration)
      });
    }

    // Update to working status
    session.status = 'working';
    session.lastActiveTime = now;
    session.idlePopupShown = false;
    session.idleStartTime = null;
    
    // Calculate work duration (exclude idle time)
    const totalElapsed = (now - session.startTime) / (1000 * 60);
    session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
    
    session.activityLogs.push({ 
      timestamp: now, 
      type: 'active', 
      details: 'User activity detected' 
    });
    await session.save();

    res.json({ 
      success: true, 
      message: "Activity updated", 
      data: { 
        status: session.status, 
        lastActiveTime: session.lastActiveTime, 
        totalWorkDuration: session.totalWorkDuration,
        totalIdleTime: session.totalIdleTime 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Report idle status from frontend
// @route   POST /api/work-session/report-idle
const reportIdle = async (req, res) => {
  try {
    const { employeeId, isIdle } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ 
      employeeId, 
      date: today, 
      status: { $in: ['working', 'idle'] } 
    });
    
    if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

    const now = new Date();

    if (isIdle === true || isIdle === 'true') {
      // User became idle - pause work time
      if (session.status === 'working') {
        session.status = 'idle';
        session.idleStartTime = now;
        session.lastActiveTime = now;
        session.activityLogs.push({ 
          timestamp: now, 
          type: 'idle', 
          details: 'User idle - no mouse/keyboard activity' 
        });
        await session.save();
        
        return res.json({ 
          success: true, 
          message: "Idle status recorded", 
          data: { status: 'idle', idleStartTime: now } 
        });
      }
    } else {
      // User became active again - resume work time
      if (session.status === 'idle' && session.idleStartTime) {
        const idleDuration = (now - session.idleStartTime) / (1000 * 60);
        session.totalIdleTime += idleDuration;
        session.status = 'working';
        session.lastActiveTime = now;
        session.idleStartTime = null;
        session.activityLogs.push({ 
          timestamp: now, 
          type: 'active', 
          details: 'User active again',
          duration: Math.round(idleDuration)
        });
        
        // Recalculate work duration
        const totalElapsed = (now - session.startTime) / (1000 * 60);
        session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
        await session.save();
        
        return res.json({ 
          success: true, 
          message: "Active status restored", 
          data: { 
            status: 'working', 
            idleDuration: Math.round(idleDuration),
            totalWorkDuration: session.totalWorkDuration 
          } 
        });
      }
    }

    res.json({ success: true, data: { status: session.status } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check idle status
const checkIdleStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (activeBreaks.has(employeeId)) {
      const breakInfo = activeBreaks.get(employeeId);
      return res.json({ success: true, shouldShowPopup: false, status: 'on_break', breakInfo: { type: breakInfo.breakType, remainingMinutes: Math.ceil((breakInfo.breakEndTime - new Date()) / 60000) } });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today });
    if (!session) return res.json({ success: true, shouldShowPopup: false, status: 'not_started' });
    if (session.status === 'completed') return res.json({ success: true, shouldShowPopup: false, status: 'completed' });

    const now = new Date();
    const lastActiveTime = session.lastActiveTime || session.startTime;
    const idleMinutes = (now - lastActiveTime) / (1000 * 60);
    const IDLE_THRESHOLD = 5;

    if (idleMinutes >= IDLE_THRESHOLD && !session.idlePopupShown) {
      session.status = 'idle';
      session.idlePopupShown = true;
      session.activityLogs.push({ timestamp: now, type: 'idle_popup_shown', duration: idleMinutes });
      await session.save();
      return res.json({ success: true, shouldShowPopup: true, idleDuration: idleMinutes, status: 'idle' });
    }

    const totalElapsed = (now - session.startTime) / (1000 * 60);
    session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
    await session.save();

    res.json({ success: true, shouldShowPopup: false, idleDuration: idleMinutes, status: session.status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle idle response
const handleIdleResponse = async (req, res) => {
  try {
    const { employeeId, action } = req.body;
    if (!employeeId || !action) return res.status(400).json({ success: false, message: "Employee ID and action are required" });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today, status: { $in: ['working', 'idle', 'idle_checking'] } });
    if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

    const now = new Date();
    if (action === 'continue') {
      if (session.lastActiveTime) {
        const idleDuration = (now - session.lastActiveTime) / (1000 * 60);
        if (idleDuration > 0) session.totalIdleTime += idleDuration;
      }
      session.status = 'working';
      session.lastActiveTime = now;
      session.idlePopupShown = false;
      const totalElapsed = (now - session.startTime) / (1000 * 60);
      session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
      await session.save();
      res.json({ success: true, message: "Work resumed", data: { status: 'working' } });
    } else if (action === 'stop') {
      session.status = 'completed';
      session.endTime = now;
      await session.save();
      res.json({ success: true, message: "Work session stopped", data: { totalWorkDuration: session.totalWorkDuration } });
    } else {
      res.status(400).json({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End work session
const endWork = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

    if (activeBreaks.has(employeeId)) activeBreaks.delete(employeeId);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today, status: { $in: ['working', 'idle', 'on_break', 'idle_checking'] } });
    if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

    const now = new Date();
    const totalElapsed = (now - session.startTime) / (1000 * 60);
    session.status = 'completed';
    session.endTime = now;
    session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
    await session.save();

    res.json({ success: true, message: "Work session ended", data: { totalWorkDuration: session.totalWorkDuration, totalWorkHours: (session.totalWorkDuration / 60).toFixed(2), totalBreakDuration: session.totalBreakDuration, totalIdleTime: session.totalIdleTime, startTime: session.startTime, endTime: session.endTime } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's summary
const getTodaySummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today });
    if (!session) return res.json({ success: true, data: { status: 'not_started' } });

    if (session.status !== 'completed') {
      const now = new Date();
      const totalElapsed = (now - session.startTime) / (1000 * 60);
      session.totalWorkDuration = totalElapsed - session.totalBreakDuration - session.totalIdleTime;
      await session.save();
    }

    res.json({ success: true, data: { status: session.status, startTime: session.startTime, endTime: session.endTime, totalWorkDuration: session.totalWorkDuration, totalWorkHours: (session.totalWorkDuration / 60).toFixed(2), totalBreakDuration: session.totalBreakDuration, totalIdleTime: session.totalIdleTime } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get work history
const getWorkHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    let query = { employeeId };
    if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const sessions = await WorkSession.find(query).sort({ date: -1 });
    const totals = sessions.reduce((acc, s) => ({ totalWork: acc.totalWork + (s.totalWorkDuration || 0), totalBreak: acc.totalBreak + (s.totalBreakDuration || 0), totalIdle: acc.totalIdle + (s.totalIdleTime || 0) }), { totalWork: 0, totalBreak: 0, totalIdle: 0 });

    res.json({ success: true, data: { sessions, totals: { totalWorkHours: (totals.totalWork / 60).toFixed(2), totalBreakHours: (totals.totalBreak / 60).toFixed(2), totalIdleHours: (totals.totalIdle / 60).toFixed(2) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active employees (currently working)
// @route   GET /api/work-session/active-employees
const getActiveEmployees = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all active sessions today (not completed)
    const activeSessions = await WorkSession.find({
      date: today,
      status: { $in: ['working', 'idle', 'on_break', 'idle_checking'] }
    })
    .select('employeeId employeeName startTime status lastActiveTime totalWorkDuration totalBreakDuration')
    .sort({ startTime: -1 });

    // Get detailed info for each active employee
    const activeEmployees = await Promise.all(
      activeSessions.map(async (session) => {
        const staff = await Staff.findOne({ employeeId: session.employeeId })
          .select('employeeId employeeName role mobile email profileImage');

        const now = new Date();
        const totalElapsed = (now - session.startTime) / (1000 * 60);
        const currentWorkDuration = totalElapsed - (session.totalBreakDuration || 0) - (session.totalIdleTime || 0);
        
        // Check if on break
        let breakInfo = null;
        if (session.status === 'on_break' && activeBreaks.has(session.employeeId)) {
          const brk = activeBreaks.get(session.employeeId);
          breakInfo = {
            breakType: brk.breakType,
            remainingMinutes: Math.ceil((brk.breakEndTime - now) / 60000),
            breakEndTime: brk.breakEndTime
          };
        }

        return {
          employeeId: session.employeeId,
          employeeName: session.employeeName,
          role: staff?.role || 'N/A',
          mobile: staff?.mobile || 'N/A',
          email: staff?.email || 'N/A',
          profileImage: staff?.profileImage || null,
          sessionId: session._id,
          status: session.status,
          startTime: session.startTime,
          lastActiveTime: session.lastActiveTime,
          currentWorkDuration: Math.round(currentWorkDuration),
          currentWorkHours: (currentWorkDuration / 60).toFixed(2),
          totalBreakDuration: session.totalBreakDuration || 0,
          breakInfo: breakInfo,
          isIdle: session.status === 'idle',
          isOnBreak: session.status === 'on_break'
        };
      })
    );

    res.json({
      success: true,
      count: activeEmployees.length,
      data: activeEmployees
    });

  } catch (error) {
    console.error('Get active employees error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get all sessions
const getAllSessions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await WorkSession.countDocuments({ employeeId });
    const sessions = await WorkSession.find({ employeeId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    const stats = { totalSessions: total, totalWorkMinutes: sessions.reduce((sum, s) => sum + (s.totalWorkDuration || 0), 0), totalBreakMinutes: sessions.reduce((sum, s) => sum + (s.totalBreakDuration || 0), 0), totalIdleMinutes: sessions.reduce((sum, s) => sum + (s.totalIdleTime || 0), 0) };
    res.json({ success: true, data: { employeeId, sessions, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }, statistics: { totalWorkHours: (stats.totalWorkMinutes / 60).toFixed(2), totalBreakHours: (stats.totalBreakMinutes / 60).toFixed(2), totalIdleHours: (stats.totalIdleMinutes / 60).toFixed(2) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's timeline
const getTodayTimeline = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const session = await WorkSession.findOne({ employeeId, date: today });

    if (!session) {
      return res.json({ success: true, data: { timeline: [], summary: { workStarted: null, totalBreaks: 0, productivity: 0, idleTime: 0, totalWorkHours: 0 } } });
    }

    const timeline = [];
    if (session.startTime) {
      timeline.push({ type: 'work_start', title: 'Punched In — Work Started', time: session.startTime, formattedTime: formatTime(session.startTime), location: 'Office', icon: '💼' });
    }

    let breakCounter = 1, currentBreak = null;
    for (const log of session.activityLogs) {
      if (log.type === 'break_start') {
        const isTea = log.details.includes('tea');
        currentBreak = { title: isTea ? 'Tea Break' : 'Lunch Break', startTime: log.timestamp, location: isTea ? 'Pantry' : 'Cafeteria', icon: isTea ? '☕' : '🍽️', expectedDuration: isTea ? 15 : 60 };
      }
      if (log.type === 'break_end' && currentBreak) {
        const actualDuration = Math.round((new Date(log.timestamp) - new Date(currentBreak.startTime)) / 60000);
        timeline.push({ id: breakCounter++, type: 'break', title: currentBreak.title, time: currentBreak.startTime, formattedTime: formatTime(currentBreak.startTime), location: currentBreak.location, duration: actualDuration, expectedDuration: currentBreak.expectedDuration, icon: currentBreak.icon });
        currentBreak = null;
      }
    }

    const totalWorkMinutes = session.totalWorkDuration || 0;
    const totalBreakMinutes = session.totalBreakDuration || 0;
    const totalSessionMinutes = totalWorkMinutes + totalBreakMinutes;
    const productivity = totalSessionMinutes > 0 ? Math.round((totalWorkMinutes / totalSessionMinutes) * 100) : 0;

    res.json({ success: true, data: { timeline, summary: { workStarted: session.startTime, workStartedFormatted: formatTime(session.startTime), totalBreaks: timeline.filter(t => t.type === 'break').length, productivity, idleTime: Math.round(session.totalIdleTime || 0), totalWorkHours: (totalWorkMinutes / 60).toFixed(2), totalBreakHours: (totalBreakMinutes / 60).toFixed(2), totalIdleHours: ((session.totalIdleTime || 0) / 60).toFixed(2), workStatus: session.status === 'completed' ? 'Completed' : 'In Progress' } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startWork, updateActivity, reportIdle, checkIdleStatus, handleIdleResponse, startBreak, endWork, getTodaySummary, getWorkHistory, getActiveEmployees, getAllSessions, getTodayTimeline };