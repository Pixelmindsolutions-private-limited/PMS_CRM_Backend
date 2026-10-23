// const WorkSession = require('../models/Worksession');
// const { Staff } = require('../models/Staff');
const WorkSchedule = require("../config/workSchedule");

// const activeBreaks = new Map();

// // ============ IST HELPERS ============

// // Get current IST time
// const getISTTime = () => {
//   const now = new Date();
//   return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
// };

// // Get IST date (start of day)
// const getISTDate = () => {
//   const ist = getISTTime();
//   ist.setHours(0, 0, 0, 0);
//   return ist;
// };

// // Format time in IST
// const formatTimeIST = (date) => {
//   if (!date) return null;
//   return new Date(date).toLocaleTimeString('en-IN', {
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true,
//     timeZone: 'Asia/Kolkata'
//   });
// };

// // Format date in IST
// const formatDateIST = (date) => {
//   if (!date) return null;
//   return new Date(date).toLocaleDateString('en-IN', {
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//     timeZone: 'Asia/Kolkata'
//   });
// };

// // Format datetime in IST
// const formatDateTimeIST = (date) => {
//   if (!date) return null;
//   return new Date(date).toLocaleString('en-IN', {
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true,
//     timeZone: 'Asia/Kolkata'
//   });
// };

// // DEVELOPMENT MODE FLAG - Set to false for production
// const DEVELOPMENT_MODE = process.env.NODE_ENV !== 'production' && process.env.WORK_SESSION_DEV_TEST_MODE === 'true';

// // Helper function to check for existing active session
// const checkExistingActiveSession = async (employeeId, excludeSessionId = null) => {
//   const today = getISTDate();

//   let query = {
//     employeeId,
//     status: { $in: ['working', 'idle', 'on_break', 'idle_checking'] }
//   };

//   if (!DEVELOPMENT_MODE) {
//     query.date = today;
//   }

//   if (excludeSessionId) {
//     query._id = { $ne: excludeSessionId };
//   }

//   return await WorkSession.findOne(query);
// };

// // Helper function to calculate current work time
// const calculateCurrentWorkTime = (session, now = new Date()) => {
//   if (!session || session.status === 'completed') return 0;

//   // If on break or idle, work time is frozen - use stored value
//   if (session.status === 'on_break' || session.status === 'idle') {
//     return session.totalWorkDuration || 0;
//   }

//   // If working, calculate up to now
//   const totalElapsed = (now - session.startTime) / (1000 * 60);
//   const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//   return Math.max(0, totalElapsed - totalNonWork);
// };

// // @desc    Start work session
// const startWork = async (req, res) => {
//   try {
//     const { employeeId, notes } = req.body;
//     if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

//     const staff = await Staff.findOne({ employeeId });
//     if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

//     // CHECK FOR EXISTING ACTIVE SESSION
//     const existingSession = await checkExistingActiveSession(employeeId);

//     if (existingSession) {
//       return res.status(400).json({
//         success: false,
//         message: DEVELOPMENT_MODE
//           ? `Employee already has an active session started at ${formatTimeIST(existingSession.startTime)}. Please end that session before starting a new one.`
//           : "Employee already has an active session today. Only one session allowed per day.",
//         data: {
//           existingSessionId: existingSession._id,
//           startTime: existingSession.startTime,
//           startTimeIST: formatTimeIST(existingSession.startTime),
//           dateIST: formatDateIST(existingSession.date),
//           status: existingSession.status
//         }
//       });
//     }

//     const today = getISTDate();
//     const now = getISTTime();

//     if (activeBreaks.has(employeeId)) activeBreaks.delete(employeeId);

//     const session = new WorkSession({
//       employeeId,
//       employeeName: staff.employeeName,
//       date: today,
//       startTime: now,
//       status: 'working',
//       lastActiveTime: now,
//       totalBreakDuration: 0,
//       totalIdleTime: 0,
//       totalWorkDuration: 0,
//       activityLogs: [{
//         timestamp: now,
//         type: 'work_start',
//         details: notes || 'Work started',
//         formattedTime: formatTimeIST(now)
//       }]
//     });
//     await session.save();

//     res.json({
//       success: true,
//       message: "Work started successfully",
//       data: {
//         sessionId: session._id,
//         startTime: session.startTime,
//         startTimeIST: formatTimeIST(session.startTime),
//         dateIST: formatDateIST(session.date),
//         status: session.status,
//         totalWorkDuration: 0
//       }
//     });
//   } catch (error) {
//     console.error('Start work error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update activity (heartbeat) - PAUSES work time during idle
// const updateActivity = async (req, res) => {
//   try {
//     const { employeeId, isIdle } = req.body;
//     if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

//     // If on break, handle separately
//     if (activeBreaks.has(employeeId)) {
//       const breakInfo = activeBreaks.get(employeeId);
//       const remainingMinutes = Math.ceil((breakInfo.breakEndTime - new Date()) / 60000);
//       const session = await WorkSession.findById(breakInfo.sessionId);
//       if (session) {
//         session.lastActiveTime = new Date();
//         await session.save();
//       }
//       return res.json({
//         success: true,
//         message: `On ${breakInfo.breakType} break`,
//         data: {
//           status: 'on_break',
//           breakRemaining: `${remainingMinutes} minutes`,
//           breakType: breakInfo.breakType,
//           breakEndTimeIST: formatTimeIST(breakInfo.breakEndTime),
//           totalWorkDuration: session?.totalWorkDuration || 0,
//           isWorkTimePaused: true
//         }
//       });
//     }

//     const today = getISTDate();

//     // Find active session
//     const session = await WorkSession.findOne({
//       employeeId,
//       date: today,
//       status: { $in: ['working', 'idle', 'idle_checking'] }
//     });

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: "No active work session found. Please start work first."
//       });
//     }

//     const now = getISTDate;

//     // ============================================
//     // CASE 1: USER IS IDLE - PAUSE WORK TIME
//     // ============================================
//     if (isIdle === true || isIdle === 'true') {
//       // If currently working, switch to idle and PAUSE work time
//       if (session.status === 'working') {
//         // Calculate and save work time BEFORE becoming idle
//         const totalElapsed = (now - session.startTime) / (1000 * 60);
//         const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//         session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//         // Switch to idle state
//         session.status = 'idle';
//         session.idleStartTime = now;
//         session.lastActiveTime = now;
//         session.activityLogs.push({
//           timestamp: now,
//           type: 'idle_start',
//           details: 'User became idle - Work time paused',
//           duration: 0,
//           formattedTime: formatTimeIST(now)
//         });

//         await session.save();

//         return res.json({
//           success: true,
//           message: "Work time paused - User idle",
//           data: {
//             status: 'idle',
//             startTime: session.startTime,
//             startTimeIST: formatTimeIST(session.startTime),
//             idleStartTimeIST: formatTimeIST(now),
//             totalWorkDuration: session.totalWorkDuration,
//             totalIdleTime: session.totalIdleTime || 0,
//             totalBreakDuration: session.totalBreakDuration || 0,
//             isWorkTimePaused: true
//           }
//         });
//       }

//       // Already idle, just return current state
//       return res.json({
//         success: true,
//         message: "Still idle - Work time paused",
//         data: {
//           status: 'idle',
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           totalWorkDuration: session.totalWorkDuration || 0,
//           totalIdleTime: session.totalIdleTime || 0,
//           totalBreakDuration: session.totalBreakDuration || 0,
//           isWorkTimePaused: true
//         }
//       });
//     }

//     // ============================================
//     // CASE 2: USER IS ACTIVE - RESUME WORK TIME
//     // ============================================
//     else {
//       let idleDuration = 0;

//       // If was idle, calculate idle duration and RESUME work
//       if (session.status === 'idle' && session.idleStartTime) {
//         idleDuration = (now - session.idleStartTime) / (1000 * 60);

//         if (idleDuration > 0) {
//           session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
//           session.activityLogs.push({
//             timestamp: now,
//             type: 'idle_end',
//             details: 'User became active again - Work time resumed',
//             duration: Math.round(idleDuration),
//             formattedTime: formatTimeIST(now)
//           });
//         }

//         session.idleStartTime = null;
//       }

//       // Resume work
//       session.status = 'working';
//       session.lastActiveTime = now;
//       session.idlePopupShown = false;

//       // Recalculate work time (this will now include time since last update)
//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//       session.activityLogs.push({
//         timestamp: now,
//         type: 'heartbeat',
//         details: 'Activity detected - Work time running',
//         formattedTime: formatTime(now)
//       });

//       await session.save();

//       return res.json({
//         success: true,
//         message: "Work time resumed - User active",
//         data: {
//           status: 'working',
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           lastActiveTime: session.lastActiveTime,
//           totalWorkDuration: session.totalWorkDuration,
//           totalIdleTime: session.totalIdleTime || 0,
//           totalBreakDuration: session.totalBreakDuration || 0,
//           lastIdleDuration: Math.round(idleDuration),
//           isWorkTimePaused: false
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Update activity error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Start break
// const startBreak = async (req, res) => {
//   try {
//     const { employeeId, breakType } = req.body;
//     if (!employeeId || !breakType) return res.status(400).json({
//       success: false,
//       message: "Employee ID and break type are required"
//     });

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: "No active work session found. Please start work first."
//       });
//     }

//     // Check if already on break
//     if (session.status === 'on_break') {
//       return res.status(400).json({
//         success: false,
//         message: "Already on break. Please end current break first."
//       });
//     }

//     const breakDuration = breakType === 'lunch' ? 60 : 15;
//     const now = getISTTime();
//     const breakEndTime = new Date(now.getTime() + breakDuration * 60000);

//     // Calculate and save work time BEFORE break
//     const totalElapsed = (now - session.startTime) / (1000 * 60);
//     const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//     session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//     session.status = 'on_break';
//     session.lastActiveTime = now;
//     session.activityLogs.push({
//       timestamp: now,
//       type: 'break_start',
//       details: `${breakType} break started for ${breakDuration} minutes`,
//       startTime: session.startTime,  // ✅ ADD THIS
//       startTimeIST: formatTimeIST(session.startTime),
//       breakType: breakType,
//       breakDuration: breakDuration,
//       expectedEndTime: breakEndTime,
//       formattedTime: formatTimeIST(now)
//     });

//     await session.save();

//     activeBreaks.set(employeeId, {
//       breakEndTime,
//       breakType,
//       sessionId: session._id,
//       breakDuration,
//       startTime: now
//     });

//     setTimeout(() => autoEndBreakAndCheckActivity(employeeId), breakDuration * 60 * 1000);

//     res.json({
//       success: true,
//       message: `${breakType} break started for ${breakDuration} minutes`,
//       data: {
//         breakType,
//         breakDuration,
//         breakEndTime,
//         breakEndTimeIST: formatTimeIST(breakEndTime),
//         breakStartTimeIST: formatTimeIST(now),
//         totalWorkDuration: session.totalWorkDuration,
//         isWorkTimePaused: true
//       }
//     });
//   } catch (error) {
//     console.error('Start break error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

//
// @desc    End active break manually

const endBreak = async (req, res) => {
  try {
    const employeeId = req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const session = await checkExistingActiveSession(employeeId);

    if (!session || session.status !== "on_break" || !session.currentBreak) {
      return res.status(404).json({
        success: false,
        message: "No active break found to end",
      });
    }

    const now = new Date();
    const br = session.currentBreak;

    const startTime = new Date(br.startTime);
    const durationSeconds = Math.max(
      0,
      Math.floor((now.getTime() - startTime.getTime()) / 1000),
    );

    const durationMinutes = durationSeconds / 60;

    // Preserve the completed break before clearing currentBreak
    const endedBreak = {
      type: br.type,
      reason: br.reason,
      source: br.source || "manual",
      startTime: br.startTime,
      endTime: now,
      duration: Math.round(durationMinutes * 100) / 100,
      durationSeconds,
      status: "ended",
    };

    // Update the existing break record, or add it if missing
    const existingBreak = session.breaks?.find(
      (item) =>
        item.status === "active" &&
        item.startTime &&
        new Date(item.startTime).getTime() === startTime.getTime(),
    );

    if (existingBreak) {
      existingBreak.endTime = now;
      existingBreak.duration = endedBreak.duration;
      existingBreak.status = "ended";
    } else {
      session.breaks.push(endedBreak);
    }

    session.totalBreakDuration =
      (session.totalBreakDuration || 0) + durationMinutes;

    session.status = "working";
    session.currentBreak = null;
    session.lastActiveTime = now;
    session.idleStartTime = null;
    session.idlePopupShown = false;

    session.totalWorkDuration = Math.max(
      0,
      (now.getTime() - new Date(session.startTime).getTime()) / 60000 -
        (session.totalBreakDuration || 0) -
        (session.totalIdleTime || 0),
    );

    session.activityLogs.push({
      timestamp: now,
      type: "break_end",
      duration: endedBreak.duration,
      details: `${br.reason || br.type} break ended. Actual duration: ${durationSeconds} seconds`,
    });

    if (typeof activeBreaks !== "undefined" && activeBreaks.has(employeeId)) {
      activeBreaks.delete(employeeId);
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: "Break ended successfully",
      data: {
        status: session.status,
        currentBreak: null,
        break: endedBreak,
        totalBreakDuration: session.totalBreakDuration,
        ...workTimeResponse(session.totalWorkDuration),
      },
    });
  } catch (error) {
    console.error("END BREAK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Auto end break
// const autoEndBreakAndCheckActivity = async (employeeId) => {
//   try {
//     const breakInfo = activeBreaks.get(employeeId);
//     if (!breakInfo) return;

//     const session = await WorkSession.findById(breakInfo.sessionId);
//     if (!session || session.status !== 'on_break') return;

//     const now = new Date();
//     const actualBreakDuration = (now - breakInfo.startTime) / (1000 * 60);

//     // Add break end to timeline
//     session.activityLogs.push({
//       timestamp: now,
//       type: 'break_end',
//       details: `${breakInfo.breakType} break ended`,
//       breakType: breakInfo.breakType,
//       actualDuration: Math.round(actualBreakDuration),
//       expectedDuration: breakInfo.breakDuration,
//       formattedTime: formatTimeIST(now)
//     });

//     // Update total break duration
//     session.totalBreakDuration = (session.totalBreakDuration || 0) + actualBreakDuration;

//     // Check idle status before resuming work
//     const lastActiveTime = session.lastActiveTime || session.startTime;
//     const idleMinutes = (now - lastActiveTime) / (1000 * 60);

//     if (idleMinutes >= 1 && !session.idlePopupShown) {
//       session.status = 'idle';
//       session.idlePopupShown = true;
//       session.idleStartTime = session.idleStartTime || lastActiveTime;
//       session.activityLogs.push({
//         timestamp: now,
//         type: 'idle_popup_shown',
//         duration: idleMinutes,
//         details: 'Idle detected after break'
//       });
//     } else {
//       session.status = 'working';
//       session.lastActiveTime = now;
//       session.idlePopupShown = false;

//       // Recalculate work time after break
//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);
//     }

//     await session.save();
//     activeBreaks.delete(employeeId);

//     console.log(`Break ended for ${employeeId}. Duration: ${Math.round(actualBreakDuration)} minutes`);
//   } catch (error) {
//     console.error('Auto end break error:', error);
//   }
// };

// // @desc    Report idle status from frontend
// const reportIdle = async (req, res) => {
//   try {
//     const { employeeId, isIdle } = req.body;
//     if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: "No active work session found"
//       });
//     }

//     const now = new Date();

//     if (isIdle === true || isIdle === 'true') {
//       if (session.status === 'working') {
//         // Save work time before becoming idle
//         const totalElapsed = (now - session.startTime) / (1000 * 60);
//         const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//         session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//         session.status = 'idle';
//         session.idleStartTime = now;
//         session.lastActiveTime = now;
//         session.activityLogs.push({
//           timestamp: now,
//           type: 'idle',
//           details: 'User idle - no mouse/keyboard activity',
//           formattedTime: formatTimeIST(now)
//         });
//         await session.save();

//         return res.json({
//           success: true,
//           message: "Work time paused - Idle status recorded",
//           data: {
//             status: 'idle',
//             startTime: session.startTime,
//             startTimeIST: formatTimeIST(session.startTime),
//             idleStartTime: now,
//             totalWorkDuration: session.totalWorkDuration,
//             isWorkTimePaused: true
//           }
//         });
//       }
//     } else {
//       if (session.status === 'idle' && session.idleStartTime) {
//         const idleDuration = (now - session.idleStartTime) / (1000 * 60);
//         session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
//         session.status = 'working';
//         session.lastActiveTime = now;
//         session.idleStartTime = null;
//         session.activityLogs.push({
//           timestamp: now,
//           type: 'active',
//           details: 'User active again',
//           duration: Math.round(idleDuration),
//           formattedTime: formatTime(now)
//         });

//         const totalElapsed = (now - session.startTime) / (1000 * 60);
//         const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//         session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);
//         await session.save();

//         return res.json({
//           success: true,
//           message: "Work time resumed - Active status restored",
//           data: {
//             status: 'working',
//             startTime: session.startTime,
//             startTimeIST: formatTimeIST(session.startTime),
//             idleDuration: Math.round(idleDuration),
//             totalWorkDuration: session.totalWorkDuration,
//             isWorkTimePaused: false
//           }
//         });
//       }
//     }

//     res.json({ success: true, data: { status: session.status } });
//   } catch (error) {
//     console.error('Report idle error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Check idle status
// const checkIdleStatus = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     if (activeBreaks.has(employeeId)) {
//       const breakInfo = activeBreaks.get(employeeId);
//       return res.json({
//         success: true,
//         shouldShowPopup: false,
//         status: 'on_break',
//         breakInfo: {
//           type: breakInfo.breakType,
//           remainingMinutes: Math.ceil((breakInfo.breakEndTime - new Date()) / 60000),
//           breakEndTime: breakInfo.breakEndTime
//         }
//       });
//     }

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) return res.json({ success: true, shouldShowPopup: false, status: 'not_started' });
//     if (session.status === 'completed') return res.json({ success: true, shouldShowPopup: false, status: 'completed' });

//     const now = new Date();
//     const lastActiveTime = session.lastActiveTime || session.startTime;
//     const idleMinutes = (now - lastActiveTime) / (1000 * 60);
//     const IDLE_THRESHOLD = 5;

//     if (idleMinutes >= IDLE_THRESHOLD && !session.idlePopupShown) {
//       session.status = 'idle';
//       session.idlePopupShown = true;
//       session.activityLogs.push({
//         timestamp: now,
//         type: 'idle_popup_shown',
//         duration: idleMinutes,
//         formattedTime: formatTimeIST(now)
//       });
//       await session.save();
//       return res.json({ success: true, shouldShowPopup: true, idleDuration: idleMinutes, status: 'idle', startTime: session.startTime, startTimeIST: formatTimeIST(session.startTime) });
//     }

//     res.json({ success: true, shouldShowPopup: false, idleDuration: idleMinutes, status: session.status, startTime: session.startTime, startTimeIST: formatTimeIST(session.startTime) });
//   } catch (error) {
//     console.error('Check idle status error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Handle idle response
// const handleIdleResponse = async (req, res) => {
//   try {
//     const { employeeId, action } = req.body;
//     if (!employeeId || !action) return res.status(400).json({ success: false, message: "Employee ID and action are required" });

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

//     const now = new Date();
//     if (action === 'continue') {
//       if (session.lastActiveTime && session.status === 'idle') {
//         const idleDuration = (now - session.lastActiveTime) / (1000 * 60);
//         if (idleDuration > 0) session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
//       }
//       session.status = 'working';
//       session.lastActiveTime = now;
//       session.idlePopupShown = false;
//       session.idleStartTime = null;

//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//       session.activityLogs.push({
//         timestamp: now,
//         type: 'active',
//         details: 'Resumed work after idle',
//         formattedTime: formatTime(now)
//       });
//       await session.save();
//       res.json({ success: true, message: "Work resumed",
//          data: {
//           status: 'working',
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           totalWorkDuration: session.totalWorkDuration
//         }
//       });
//     } else if (action === 'stop') {
//       session.status = 'completed';
//       session.endTime = now;
//       session.activityLogs.push({
//         timestamp: now,
//         type: 'work_end',
//         details: 'Work session stopped',
//         formattedTime: formatTimeIST(now)
//       });
//       await session.save();
//       res.json({ success: true, message: "Work session stopped",
//         data: {
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           endTime: now,
//           endTimeIST: formatTimeIST(now),
//           totalWorkDuration: session.totalWorkDuration } });
//     } else {
//       res.status(400).json({ success: false, message: "Invalid action" });
//     }
//   } catch (error) {
//     console.error('Handle idle response error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    End work session
// const endWork = async (req, res) => {
//   try {
//     const { employeeId } = req.body;
//     if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

//     if (activeBreaks.has(employeeId)) activeBreaks.delete(employeeId);

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) return res.status(404).json({ success: false, message: "No active work session found" });

//     const now = getISTTime();
//     const totalElapsed = (now - session.startTime) / (1000 * 60);
//     const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);

//     session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);
//     session.status = 'completed';
//     session.endTime = now;

//     session.activityLogs.push({
//       timestamp: now,
//       type: 'work_end',
//       details: 'Work session ended',
//       formattedTime: formatTimeIST(now),
//       totalWorkHours: ((session.totalWorkDuration || 0) / 60).toFixed(2)
//     });

//     await session.save();

//     res.json({
//       success: true,
//       message: "Work session ended",
//       data: {
//         totalWorkDuration: session.totalWorkDuration,
//         totalWorkHours: (session.totalWorkDuration / 60).toFixed(2),
//         totalBreakDuration: session.totalBreakDuration || 0,
//         totalIdleTime: session.totalIdleTime || 0,
//         startTime: session.startTime,
//         startTimeIST: formatTimeIST(session.startTime),
//         endTimeIST: formatTimeIST(session.endTime),
//         dateIST: formatDateIST(session.date),
//         endTime: session.endTime
//       }
//     });
//   } catch (error) {
//     console.error('End work error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get current status with real-time work time
// const getCurrentStatus = async (req, res) => {
//   try {
//     const { employeeId } = req.params;

//     const session = await checkExistingActiveSession(employeeId);
//     if (!session) {
//       return res.json({
//         success: true,
//         data: {
//           status: 'not_started',
//           message: 'No active work session',
//           isWorkTimePaused: false
//         }
//       });
//     }

//     const now = getISTTime();
//     let currentWorkTime = 0;
//     let isWorkTimePaused = false;

//     if (session.status === 'idle') {
//       currentWorkTime = session.totalWorkDuration || 0;
//       isWorkTimePaused = true;
//     } else if (session.status === 'working') {
//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       currentWorkTime = Math.max(0, totalElapsed - totalNonWork);
//       isWorkTimePaused = false;
//     } else if (session.status === 'on_break') {
//       currentWorkTime = session.totalWorkDuration || 0;
//       isWorkTimePaused = true;
//     }

//     res.json({
//       success: true,
//       data: {
//         status: session.status,
//         startTime: session.startTime,
//         endTime: session.endTime,
//         date: session.date,
//         startTimeIST: formatTimeIST(session.startTime),
//         currentWorkTime: Math.round(currentWorkTime),
//         currentWorkHours: (currentWorkTime / 60).toFixed(2),
//         totalIdleTime: Math.round(session.totalIdleTime || 0),
//         totalBreakDuration: Math.round(session.totalBreakDuration || 0),
//         isWorkTimePaused: isWorkTimePaused,
//         lastActiveTimeIST: formatTimeIST(session.lastActiveTime),
//         idleStartTimeIST: formatTimeIST(session.idleStartTime),
//         currentTimeIST: formatDateTimeIST(now)
//       }
//     });

//   } catch (error) {
//     console.error('Get current status error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get today's summary
// const getTodaySummary = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const today = getISTDate();
//     const session = await WorkSession.findOne({ employeeId, date: today });

//     if (!session) {
//       return res.json({
//         success: true,
//         data: {
//           status: 'not_started',
//           totalWorkDuration: 0,
//           totalWorkHours: 0,
//           totalBreakDuration: 0,
//           totalIdleTime: 0
//         }
//       });
//     }

//     let totalWorkDuration = session.totalWorkDuration || 0;

//     if (session.status !== 'completed') {
//       const now = getISTTime();
//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);
//     }

//     res.json({
//       success: true,
//       data: {
//         status: session.status,
//         startTime: session.startTime,
//         endTime: session.endTime,
//         date: session.date,
//         startTimeIST: formatTimeIST(session.startTime),
//         endTimeIST: formatTimeIST(session.endTime),
//         date: formatDateIST(session.date),
//         totalWorkDuration: Math.round(totalWorkDuration),
//         totalWorkHours: (totalWorkDuration / 60).toFixed(2),
//         totalBreakDuration: Math.round(session.totalBreakDuration || 0),
//         totalIdleTime: Math.round(session.totalIdleTime || 0),
//         totalBreakHours: ((session.totalBreakDuration || 0) / 60).toFixed(2),
//         totalIdleHours: ((session.totalIdleTime || 0) / 60).toFixed(2)
//       }
//     });
//   } catch (error) {
//     console.error('Get today summary error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get work history
// const getWorkHistory = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { startDate, endDate } = req.query;
//     let query = { employeeId };
//     if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

//     const sessions = await WorkSession.find(query).sort({ date: -1 });
//     const totals = sessions.reduce((acc, s) => ({
//       totalWork: acc.totalWork + (s.totalWorkDuration || 0),
//       totalBreak: acc.totalBreak + (s.totalBreakDuration || 0),
//       totalIdle: acc.totalIdle + (s.totalIdleTime || 0)
//     }), { totalWork: 0, totalBreak: 0, totalIdle: 0 });

//     const formattedSessions = sessions.map(s => ({
//         ...s.toObject(),
//         startTime: s.startTime,
//         startTimeIST: formatTimeIST(s.startTime),
//         endTime: s.endTime,
//         endTimeIST: s.endTime ? formatTimeIST(s.endTime) : null,
//         date: s.date,
//         dateIST: formatDateIST(s.date)
//       }));

//     res.json({
//       success: true,
//       data: {
//         sessions: formattedSessions,
//         totals: {
//           totalWorkHours: (totals.totalWork / 60).toFixed(2),
//           totalBreakHours: (totals.totalBreak / 60).toFixed(2),
//           totalIdleHours: (totals.totalIdle / 60).toFixed(2)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get work history error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get all active employees
// const getActiveEmployees = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let query = {
//       status: { $in: ['working', 'idle', 'on_break', 'idle_checking'] }
//     };

//     if (!DEVELOPMENT_MODE) {
//       query.date = today;
//     }

//     const activeSessions = await WorkSession.find(query)
//       .select('employeeId employeeName startTime status lastActiveTime totalWorkDuration totalBreakDuration totalIdleTime currentBreak')
//       .sort({ startTime: -1 });

//     const activeEmployees = await Promise.all(
//       activeSessions.map(async (session) => {
//         const staff = await Staff.findOne({ employeeId: session.employeeId })
//           .select('employeeId employeeName role mobile email profileImage');

//         const now = new Date();
//         let currentWorkDuration = 0;

//         if (session.status === 'working') {
//           const totalElapsed = (now - session.startTime) / (1000 * 60);
//           const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//           currentWorkDuration = Math.max(0, totalElapsed - totalNonWork);
//         } else {
//           currentWorkDuration = session.totalWorkDuration || 0;
//         }

//         let breakInfo = null;
//         if (session.status === 'on_break' && activeBreaks.has(session.employeeId)) {
//           const brk = activeBreaks.get(session.employeeId);
//           breakInfo = {
//             breakType: brk.breakType,
//             remainingMinutes: Math.ceil((brk.breakEndTime - now) / 60000),
//             breakEndTime: brk.breakEndTime,
//             breakStartTime: brk.startTime
//           };
//         }

//         return {
//           employeeId: session.employeeId,
//           employeeName: session.employeeName,
//           role: staff?.role || 'N/A',
//           mobile: staff?.mobile || 'N/A',
//           email: staff?.email || 'N/A',
//           profileImage: staff?.profileImage || null,
//           sessionId: session._id,
//           status: session.status,
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           endTime: session.endTime,
//           endTimeIST: formatTimeIST(session.endTime),
//           lastActiveTimeIST: formatTimeIST(session.lastActiveTime),
//           lastActiveTime: session.lastActiveTime,
//           currentWorkDuration: Math.round(currentWorkDuration),
//           currentWorkHours: (currentWorkDuration / 60).toFixed(2),
//           totalBreakDuration: session.totalBreakDuration || 0,
//           breakInfo: breakInfo,
//           isIdle: session.status === 'idle',
//           isOnBreak: session.status === 'on_break'
//         };
//       })
//     );

//     res.json({
//       success: true,
//       count: activeEmployees.length,
//       data: activeEmployees
//     });

//   } catch (error) {
//     console.error('Get active employees error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get all sessions for an employee
// const getAllSessions = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const { limit = 100, page = 1 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const total = await WorkSession.countDocuments({ employeeId });
//     const sessions = await WorkSession.find({ employeeId }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

//     const stats = {
//       totalSessions: total,
//       totalWorkMinutes: sessions.reduce((sum, s) => sum + (s.totalWorkDuration || 0), 0),
//       totalBreakMinutes: sessions.reduce((sum, s) => sum + (s.totalBreakDuration || 0), 0),
//       totalIdleMinutes: sessions.reduce((sum, s) => sum + (s.totalIdleTime || 0), 0)
//     };

//     const formattedSessions = sessions.map(s => ({
//       ...s.toObject(),
//       startTime: s.startTime,
//       startTimeIST: formatTimeIST(s.startTime),
//       endTime: s.endTime,
//       endTimeIST: s.endTime ? formatTimeIST(s.endTime) : null,
//       date: s.date,
//       dateIST: formatDateIST(s.date)
//     }));

//     res.json({
//       success: true,
//       data: {
//         employeeId,
//         sessions: formattedSessions,
//         pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
//         statistics: {
//           totalWorkHours: (stats.totalWorkMinutes / 60).toFixed(2),
//           totalBreakHours: (stats.totalBreakMinutes / 60).toFixed(2),
//           totalIdleHours: (stats.totalIdleMinutes / 60).toFixed(2)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get all sessions error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get today's timeline
// // const getTodayTimeline = async (req, res) => {
// //   try {
// //     const { employeeId } = req.params;
// //     const today = getISTDate();
// //     const session = await WorkSession.findOne({ employeeId, date: today });

// //     if (!session) {
// //       return res.json({
// //         success: true,
// //         data: {
// //           timeline: [],
// //           breaks: [],
// //           summary: {
// //             workStarted: null,
// //             totalBreaks: 0,
// //             productivity: 0,
// //             idleTime: 0,
// //             totalWorkHours: 0,
// //             totalBreakHours: 0,
// //             totalIdleHours: 0
// //           }
// //         }
// //       });
// //     }

// //     const timeline = [];
// //     const breaks = [];

// //     // Add work start to timeline
// //     if (session.startTime) {
// //       timeline.push({
// //         id: 'work-start',
// //         type: 'work_start',
// //         title: 'Punched In — Work Started',
// //         time: session.startTime,
// //         formattedTime: formatTimeIST(session.startTime),
// //         location: 'Office',
// //         icon: '💼'
// //       });
// //     }

// //     // Process activity logs for breaks
// //     let breakCounter = 1;
// //     let currentBreak = null;

// //     for (const log of session.activityLogs) {
// //       if (log.type === 'break_start') {
// //         const isTea = log.breakType === 'tea' || (log.details && log.details.includes('tea'));
// //         currentBreak = {
// //           id: `break-${breakCounter}`,
// //           type: 'break',
// //           title: isTea ? 'Tea Break' : 'Lunch Break',
// //           startTime: log.timestamp,
// //           location: isTea ? 'Pantry' : 'Cafeteria',
// //           icon: isTea ? '☕' : '🍽️',
// //           expectedDuration: log.breakDuration || (isTea ? 15 : 60),
// //           breakType: log.breakType || (isTea ? 'tea' : 'lunch')
// //         };
// //       }

// //       if (log.type === 'break_end' && currentBreak) {
// //         const actualDuration = log.actualDuration || Math.round((new Date(log.timestamp) - new Date(currentBreak.startTime)) / 60000);
// //         const breakItem = {
// //           ...currentBreak,
// //           time: currentBreak.startTime,
// //           formattedTime: formatTime(currentBreak.startTime),
// //           formattedTimeIST: formatTimeIST(currentBreak.startTime),
// //           endTime: log.timestamp,
// //           formattedEndTime: formatTime(log.timestamp),
// //           formattedEndTimeIST: formatTimeIST(log.timestamp),
// //           duration: actualDuration,
// //           expectedDuration: currentBreak.expectedDuration,
// //           isOverdue: actualDuration > currentBreak.expectedDuration,
// //           overdueMinutes: actualDuration > currentBreak.expectedDuration ? actualDuration - currentBreak.expectedDuration : 0
// //         };
// //         timeline.push(breakItem);
// //         breaks.push(breakItem);
// //         currentBreak = null;
// //         breakCounter++;
// //       }
// //     }

// //     // Add work end if completed
// //     if (session.endTime) {
// //       timeline.push({
// //         id: 'work-end',
// //         type: 'work_end',
// //         title: 'Punched Out — Work Ended',
// //         time: session.endTime,
// //         formattedTime: formatTime(session.endTime),
// //         formattedTimeIST: formatTimeIST(session.endTime),
// //         location: 'Office',
// //         icon: '🏁'
// //       });
// //     }

// //     // Calculate summary
// //     const totalWorkMinutes = session.totalWorkDuration || 0;
// //     const totalBreakMinutes = session.totalBreakDuration || 0;
// //     const totalIdleMinutes = session.totalIdleTime || 0;
// //     const totalSessionMinutes = totalWorkMinutes + totalBreakMinutes;
// //     const productivity = totalSessionMinutes > 0 ? Math.round((totalWorkMinutes / totalSessionMinutes) * 100) : 0;

// //     res.json({
// //       success: true,
// //       data: {
// //         timeline,
// //         breaks,
// //         summary: {
// //           workStarted: session.startTime,
// //           workStartedFormatted: formatTime(session.startTime),
// //           workStartedFormattedIST: formatTimeIST(session.startTime),
// //           workEnded: session.endTime,
// //           workEndedFormatted: session.endTime ? formatTime(session.endTime) : null,
// //           workEndedFormattedIST: session.endTime ? formatTimeIST(session.endTime) : null,
// //           totalBreaks: breaks.length,
// //           productivity,
// //           idleTime: Math.round(totalIdleMinutes),
// //           totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
// //           totalBreakHours: (totalBreakMinutes / 60).toFixed(2),
// //           totalIdleHours: (totalIdleMinutes / 60).toFixed(2),
// //           workStatus: session.status === 'completed' ? 'Completed' : 'In Progress',
// //           totalElapsedHours: ((totalWorkMinutes + totalBreakMinutes) / 60).toFixed(2)
// //         }
// //       }
// //     });
// //   } catch (error) {
// //     console.error('Get today timeline error:', error);
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // };

// const getTodayTimeline = async (req, res) => {
//   try {
//     const { employeeId } = req.params;
//     const today = getISTDate();
//     const session = await WorkSession.findOne({ employeeId, date: today });

//     if (!session) {
//       return res.json({
//         success: true,
//         data: {
//           timeline: [],
//           breaks: [],
//           summary: {
//             workStarted: null,
//             totalBreaks: 0,
//             productivity: 0,
//             idleTime: 0,
//             totalWorkHours: 0,
//             totalBreakHours: 0,
//             totalIdleHours: 0
//           }
//         }
//       });
//     }

//     const timeline = [];
//     const breaks = [];

//     // Add work start to timeline
//     if (session.startTime) {
//       timeline.push({
//         id: 'work-start',
//         type: 'work_start',
//         title: 'Punched In — Work Started',
//         time: session.startTime,
//         formattedTime: formatTimeIST(session.startTime),
//         location: 'Office',
//         icon: '💼'
//       });
//     }

//     // Process activity logs for breaks
//     let breakCounter = 1;
//     let currentBreak = null;

//     for (const log of session.activityLogs) {
//       if (log.type === 'break_start') {
//         const isTea = log.breakType === 'tea' || (log.details && log.details.includes('tea'));
//         currentBreak = {
//           id: `break-${breakCounter}`,
//           type: 'break',
//           title: isTea ? 'Tea Break' : 'Lunch Break',
//           startTime: log.timestamp,
//           location: isTea ? 'Pantry' : 'Cafeteria',
//           icon: isTea ? '☕' : '🍽️',
//           expectedDuration: log.breakDuration || (isTea ? 15 : 60),
//           breakType: log.breakType || (isTea ? 'tea' : 'lunch')
//         };
//       }

//       if (log.type === 'break_end' && currentBreak) {
//         const actualDuration = log.actualDuration || Math.round((new Date(log.timestamp) - new Date(currentBreak.startTime)) / 60000);
//         const breakItem = {
//           ...currentBreak,
//           time: currentBreak.startTime,
//           formattedTime: formatTimeIST(currentBreak.startTime),  // ✅ FIXED
//           endTime: log.timestamp,
//           formattedEndTime: formatTimeIST(log.timestamp),  // ✅ FIXED
//           duration: actualDuration,
//           expectedDuration: currentBreak.expectedDuration,
//           isOverdue: actualDuration > currentBreak.expectedDuration,
//           overdueMinutes: actualDuration > currentBreak.expectedDuration ? actualDuration - currentBreak.expectedDuration : 0
//         };
//         timeline.push(breakItem);
//         breaks.push(breakItem);
//         currentBreak = null;
//         breakCounter++;
//       }
//     }

//     // Add work end if completed
//     if (session.endTime) {
//       timeline.push({
//         id: 'work-end',
//         type: 'work_end',
//         title: 'Punched Out — Work Ended',
//         time: session.endTime,
//         formattedTime: formatTimeIST(session.endTime),  // ✅ FIXED
//         location: 'Office',
//         icon: '🏁'
//       });
//     }

//     // Calculate summary
//     const totalWorkMinutes = session.totalWorkDuration || 0;
//     const totalBreakMinutes = session.totalBreakDuration || 0;
//     const totalIdleMinutes = session.totalIdleTime || 0;
//     const totalSessionMinutes = totalWorkMinutes + totalBreakMinutes;
//     const productivity = totalSessionMinutes > 0 ? Math.round((totalWorkMinutes / totalSessionMinutes) * 100) : 0;

//     res.json({
//       success: true,
//       data: {
//         timeline,
//         breaks,
//         summary: {
//           workStarted: session.startTime,
//           workStartedFormatted: formatTimeIST(session.startTime),  // ✅ FIXED
//           workEnded: session.endTime,
//           workEndedFormatted: session.endTime ? formatTimeIST(session.endTime) : null,  // ✅ FIXED
//           totalBreaks: breaks.length,
//           productivity,
//           idleTime: Math.round(totalIdleMinutes),
//           totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
//           totalBreakHours: (totalBreakMinutes / 60).toFixed(2),
//           totalIdleHours: (totalIdleMinutes / 60).toFixed(2),
//           workStatus: session.status === 'completed' ? 'Completed' : 'In Progress',
//           totalElapsedHours: ((totalWorkMinutes + totalBreakMinutes) / 60).toFixed(2)
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get today timeline error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   startWork,
//   updateActivity,
//   reportIdle,
//   checkIdleStatus,
//   handleIdleResponse,
//   startBreak,
//   endWork,
//   getCurrentStatus,
//   getTodaySummary,
//   getWorkHistory,
//   getActiveEmployees,
//   getAllSessions,
//   getTodayTimeline
// };

const WorkSession = require("../models/Worksession");
const { Staff } = require("../models/Staff");

const activeBreaks = new Map();
let idleDetectionTimer = null;
let idleDetectionRunning = false;

// ============ IST HELPERS ============

// Get current time - UTC
const getISTTime = () => {
  return new Date();
};

// Get IST date as string "YYYY-MM-DD"
const getISTDate = () => {
  const now = new Date();
  const istDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get IST date as Date object (for date range queries)
const getISTDateObject = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};
const getISTDayRange = (date = new Date()) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const start = new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - 330 * 60000);
  return { start, end: new Date(start.getTime() + 86400000) };
};
const findTodaySession = (employeeId) => {
  const { start, end } = getISTDayRange();
  return WorkSession.findOne({
    employeeId,
    date: { $gte: start, $lt: end },
  }).sort({ startTime: -1 });
};

// Format time in IST
const formatTimeIST = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

// Format date in IST
const formatDateIST = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

// Format datetime in IST
const formatDateTimeIST = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

// DEVELOPMENT MODE FLAG - Set to false for production
const DEVELOPMENT_MODE =
  process.env.NODE_ENV !== "production" &&
  process.env.WORK_SESSION_DEV_TEST_MODE === "true";

// Helper function to check for existing active session
const checkExistingActiveSession = async (
  employeeId,
  excludeSessionId = null,
) => {
  const { start, end } = getISTDayRange();
  const q = {
    employeeId,
    date: { $gte: start, $lt: end },
    status: { $in: ["working", "idle", "on_break", "idle_checking"] },
  };
  if (excludeSessionId) q._id = { $ne: excludeSessionId };
  return WorkSession.findOne(q);
};

// Helper function to calculate current work time
const calculateCurrentWorkTime = (session, now = new Date()) => {
  if (!session || session.status === "completed") return 0;

  if (session.status === "on_break" || session.status === "idle") {
    return session.totalWorkDuration || 0;
  }

  const totalElapsed = (now - session.startTime) / (1000 * 60);
  const totalNonWork =
    (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
  return Math.max(0, totalElapsed - totalNonWork);
};

const workTimeResponse = (minutes) => {
  const totalWorkSeconds = Math.max(0, Math.round((Number(minutes) || 0) * 60));
  return { totalWorkDuration: totalWorkSeconds / 60, totalWorkSeconds };
};

// @desc    Start work session
// Helper function to reconcile inactive periods (e.g. laptop shut down, power off, or away)

const reconcileSession = async (session, now = new Date()) => {
  if (!session || session.status === "completed") {
    return session;
  }

  const thresholdMs = (Number(WorkSchedule?.idleThresholdMinutes) || 2) * 60000;

  let changed = false;

  // Active breaks remain on break until the employee ends the break.
  // Start idle only once when the inactivity threshold is reached.
  if (session.status === "working") {
    const lastActive = new Date(
      session.lastActiveTime || session.startTime || now,
    );

    const inactiveMs = Math.max(0, now.getTime() - lastActive.getTime());

    if (inactiveMs >= thresholdMs) {
      const idleStart = new Date(lastActive.getTime() + thresholdMs);

      const logs = session.activityLogs || [];
      // Prevent duplicate idle transitions if this period was
      // already recorded in the activity logs.
      const alreadyLogged = logs.some(
        (log) =>
          log.type === "idle_start" &&
          new Date(log.timestamp).getTime() === idleStart.getTime(),
      );

      session.status = "idle";
      session.idleStartTime = idleStart;

      if (!alreadyLogged) {
        session.activityLogs.push({
          timestamp: idleStart,
          type: "idle_start",
          details: "Inactivity threshold reached",
        });
      }

      // Show one popup for this idle period.
      const popupAlreadyLogged = logs.some(
        (log) =>
          log.type === "idle_popup_shown" &&
          new Date(log.timestamp).getTime() === idleStart.getTime(),
      );

      if (!session.idlePopupShown || !popupAlreadyLogged) {
        session.idlePopupShown = true;
        if (!popupAlreadyLogged) {
          session.activityLogs.push({
            timestamp: idleStart,
            type: "idle_popup_shown",
            details: "Idle prompt shown",
          });
        }
      }

      // Store work duration up to the beginning of this idle period.
      const startTime = new Date(session.startTime || idleStart);

      session.totalWorkDuration = Math.max(
        0,
        (idleStart.getTime() - startTime.getTime()) / 60000 -
          (Number(session.totalBreakDuration) || 0) -
          (Number(session.totalIdleTime) || 0),
      );

      changed = true;
    }
  }

  if (changed) {
    await session.save();
  }

  return session;
};

const startIdleDetection = () => {
  if (idleDetectionTimer) return idleDetectionTimer;

  const reconcileWorkingSessions = async () => {
    if (idleDetectionRunning) return;
    idleDetectionRunning = true;

    try {
      const now = new Date();
      const sessions = await WorkSession.find({ status: "working" });

      for (const session of sessions) {
        await reconcileSession(session, now);
      }
    } catch (error) {
      console.error("Idle detection error:", error);
    } finally {
      idleDetectionRunning = false;
    }
  };

  idleDetectionTimer = setInterval(reconcileWorkingSessions, 5000);
  idleDetectionTimer.unref?.();
  reconcileWorkingSessions();

  return idleDetectionTimer;
};
// @desc    Start work session
const startWork = async (req, res) => {
  try {
    const { employeeId, notes } = req.body;
    const staff = await Staff.findOne({ employeeId });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });
    let existing = await findTodaySession(employeeId);
    if (existing) {
      existing = await reconcileSession(existing, new Date());
      return res.json({
        success: true,
        message: "Existing work session restored",
        data: {
          sessionId: existing._id,
          startTime: existing.startTime,
          startTimeIST: formatTimeIST(existing.startTime),
          status: existing.status,
          currentBreak: existing.currentBreak,
          ...workTimeResponse(existing.totalWorkDuration),
          shouldShowStartReminder: false,
          existing: true,
        },
      });
    }
    const now = new Date();
    const { start: dayStart } = getISTDayRange(now);
    const session = new WorkSession({
      employeeId,
      employeeName: staff.employeeName,
      date: dayStart,
      startTime: now,
      status: "working",
      lastActiveTime: now,
      totalWorkDuration: 0,
      activityLogs: [
        {
          timestamp: now,
          type: "work_start",
          details: notes || "Work started",
        },
      ],
    });
    await session.save();
    return res.status(201).json({
      success: true,
      message: "Work started",
      data: {
        sessionId: session._id,
        startTime: now,
        status: session.status,
        totalWorkDuration: 0,
        totalWorkSeconds: 0,
        existing: false,
      },
    });
  } catch (e) {
    if (e.code === 11000) {
      let x = await findTodaySession(req.body.employeeId);
      if (x) {
        x = await reconcileSession(x, new Date());
        return res.json({
          success: true,
          message: "Existing work session restored",
          data: {
            sessionId: x._id,
            startTime: x.startTime,
            status: x.status,
            currentBreak: x.currentBreak,
            ...workTimeResponse(x.totalWorkDuration),
            existing: true,
          },
        });
      }
    }
    return res.status(500).json({ success: false, message: e.message });
  }
};

// @desc    Update activity (heartbeat)
// const updateActivity = async (req, res) => {
//   try {
//     const { employeeId, isIdle } = req.body;
//     if (!employeeId) return res.status(400).json({ success: false, message: "Employee ID is required" });

//     if (activeBreaks.has(employeeId)) {
//       const breakInfo = activeBreaks.get(employeeId);
//       const remainingMinutes = Math.ceil((breakInfo.breakEndTime - new Date()) / 60000);
//       const session = await WorkSession.findById(breakInfo.sessionId);
//       if (session) {
//         session.lastActiveTime = new Date();
//         await session.save();
//       }
//       return res.json({
//         success: true,
//         message: `On ${breakInfo.breakType} break`,
//         data: {
//           status: 'on_break',
//           breakRemaining: `${remainingMinutes} minutes`,
//           breakType: breakInfo.breakType,
//           breakEndTimeIST: formatTimeIST(breakInfo.breakEndTime),
//           totalWorkDuration: session?.totalWorkDuration || 0,
//           isWorkTimePaused: true
//         }
//       });
//     }

//     const today = getISTDate();

//     const session = await WorkSession.findOne({
//       employeeId,
//       date: today,
//       status: { $in: ['working', 'idle', 'idle_checking'] }
//     });

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: "No active work session found. Please start work first."
//       });
//     }

//     const now = new Date();

//     if (isIdle === true || isIdle === 'true') {
//       if (session.status === 'working') {
//         const totalElapsed = (now - session.startTime) / (1000 * 60);
//         const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//         session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//         session.status = 'idle';
//         session.idleStartTime = now;
//         session.lastActiveTime = now;
//         session.activityLogs.push({
//           timestamp: now,
//           type: 'idle_start',
//           details: 'User became idle - Work time paused',
//           duration: 0,
//           formattedTime: formatTimeIST(now)
//         });

//         await session.save();

//         return res.json({
//           success: true,
//           message: "Work time paused - User idle",
//           data: {
//             status: 'idle',
//             startTime: session.startTime,
//             startTimeIST: formatTimeIST(session.startTime),
//             idleStartTimeIST: formatTimeIST(now),
//             totalWorkDuration: session.totalWorkDuration,
//             totalIdleTime: session.totalIdleTime || 0,
//             totalBreakDuration: session.totalBreakDuration || 0,
//             isWorkTimePaused: true
//           }
//         });
//       }

//       return res.json({
//         success: true,
//         message: "Still idle - Work time paused",
//         data: {
//           status: 'idle',
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           totalWorkDuration: session.totalWorkDuration || 0,
//           totalIdleTime: session.totalIdleTime || 0,
//           totalBreakDuration: session.totalBreakDuration || 0,
//           isWorkTimePaused: true
//         }
//       });
//     } else {
//       let idleDuration = 0;

//       if (session.status === 'idle' && session.idleStartTime) {
//         idleDuration = (now - session.idleStartTime) / (1000 * 60);

//         if (idleDuration > 0) {
//           session.totalIdleTime = (session.totalIdleTime || 0) + idleDuration;
//           session.activityLogs.push({
//             timestamp: now,
//             type: 'idle_end',
//             details: 'User became active again - Work time resumed',
//             duration: Math.round(idleDuration),
//             formattedTime: formatTimeIST(now)
//           });
//         }

//         session.idleStartTime = null;
//       }

//       session.status = 'working';
//       session.lastActiveTime = now;
//       session.idlePopupShown = false;

//       const totalElapsed = (now - session.startTime) / (1000 * 60);
//       const totalNonWork = (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
//       session.totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);

//       session.activityLogs.push({
//         timestamp: now,
//         type: 'heartbeat',
//         details: 'Activity detected - Work time running',
//         formattedTime: formatTimeIST(now)
//       });

//       await session.save();

//       return res.json({
//         success: true,
//         message: "Work time resumed - User active",
//         data: {
//           status: 'working',
//           startTime: session.startTime,
//           startTimeIST: formatTimeIST(session.startTime),
//           lastActiveTime: session.lastActiveTime,
//           totalWorkDuration: session.totalWorkDuration,
//           totalIdleTime: session.totalIdleTime || 0,
//           totalBreakDuration: session.totalBreakDuration || 0,
//           lastIdleDuration: Math.round(idleDuration),
//           isWorkTimePaused: false
//         }
//       });
//     }
//   } catch (error) {
//     console.error('Update activity error:', error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const updateActivity = async (req, res) => {
  try {
    const { employeeId, activityType, isIdle } = req.body;

    let x = await checkExistingActiveSession(employeeId);

    if (!x) {
      return res.status(404).json({
        success: false,
        message: "No active work session",
      });
    }

    const now = new Date();
    x = await reconcileSession(x, now);

    // Break time must not be counted as idle or working time.
    if (x.status === "on_break") {
      return res.json({
        success: true,
        data: {
          status: x.status,
          currentBreak: x.currentBreak,
          shouldShowPopup: false,
          isWorkTimePaused: true,
        },
      });
    }

    // Only confirmed human input ends an idle period.
    if (activityType === "human") {
      if (x.status === "idle" && x.idleStartTime) {
        const idleMinutes = Math.max(
          0,
          (now.getTime() - new Date(x.idleStartTime).getTime()) / 60000,
        );

        x.totalIdleTime = (Number(x.totalIdleTime) || 0) + idleMinutes;

        x.activityLogs.push({
          timestamp: now,
          type: "idle_end",
          duration: Math.round(idleMinutes),
          details: "Human activity resumed",
        });
      }

      x.status = "working";
      // Retain the last idle start timestamp. Status and lastActiveTime
      // determine whether a new idle period is active.
      x.idlePopupShown = false;
      x.lastActiveTime = now;

      const elapsedMinutes =
        (now.getTime() - new Date(x.startTime).getTime()) / 60000;

      x.totalWorkDuration = Math.max(
        0,
        elapsedMinutes -
          (Number(x.totalBreakDuration) || 0) -
          (Number(x.totalIdleTime) || 0),
      );

      x.activityLogs.push({
        timestamp: now,
        type: "active",
        details: "Qualifying human activity",
      });

      await x.save();
    } else if (activityType === "heartbeat") {
      // Heartbeat is not proof of human activity.
      // Do not reset lastActiveTime or resume an idle session.
      // Reconciliation above handles the inactivity threshold.
      if (x.status === "working" && isIdle === true) {
        // Do not mark idle from this client flag alone.
        // The server's lastActiveTime and threshold remain authoritative.
      }
    }

    return res.json({
      success: true,
      data: {
        status: x.status,
        shouldShowPopup: x.status === "idle" && x.idlePopupShown,
        lastActiveTime: x.lastActiveTime,
        idleStartTime: x.idleStartTime,
        currentBreak: x.currentBreak,
        totalIdleTime: Number(x.totalIdleTime) || 0,
        totalBreakDuration: Number(x.totalBreakDuration) || 0,
        ...workTimeResponse(x.totalWorkDuration),
        isWorkTimePaused: x.status !== "working",
      },
    });
  } catch (e) {
    console.error("updateActivity error:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// @desc    Start break

const startBreak = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Validate employee ID
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    // Accept break reason from multiple field names
    const reasonCandidates = [
      req.body.breakType,
      req.body.type,
      req.body.reason,
    ];

    const mapBreakReason = (raw) => {
      const v = String(raw || "")
        .trim()
        .toLowerCase();

      if (!v) return "";

      if (["tea", "lunch", "personal", "other"].includes(v)) {
        return v;
      }

      if (v.includes("tea")) return "tea";
      if (v.includes("lunch")) return "lunch";

      if (v.includes("personal") || v.includes("short")) {
        return "personal";
      }

      if (
        v.includes("meeting") ||
        v.includes("other") ||
        v.includes("custom")
      ) {
        return "other";
      }

      if (v.includes("break")) return "personal";

      return "";
    };

    const reason = reasonCandidates.map(mapBreakReason).find(Boolean) || "";

    // IMPORTANT: Declare duration before using it
    const duration = Number(
      req.body.durationMinutes ?? req.body.breakDuration ?? req.body.duration,
    );

    // Debug logs
    console.log("START BREAK REQUEST BODY:", req.body);
    console.log("BREAK REASON CANDIDATES:", reasonCandidates);
    console.log("NORMALIZED REASON:", reason);
    console.log("DURATION:", duration);

    // Validate reason
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Invalid break reason. Use tea, lunch, personal, or other.",
      });
    }

    // Validate duration
    if (![5, 10, 15, 30, 45, 60].includes(duration)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid break duration. Use 5, 10, 15, 30, 45, or 60 minutes.",
      });
    }

    // Find employee's active session
    let session = await checkExistingActiveSession(employeeId);
    console.log("EMPLOYEE ID:", employeeId);
    console.log("SESSION STATUS:", session?.status);
    console.log("CURRENT BREAK:", session?.currentBreak);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "No active session found",
      });
    }

    session = await reconcileSession(session, new Date());

    // Allow starting a break only while working or idle
    if (!["working", "idle"].includes(session.status)) {
      return res.status(409).json({
        success: false,
        message:
          "Break cannot start because the session is not working or idle",
      });
    }

    const now = new Date();

    const br = {
      type: reason,
      reason,
      source: "manual",
      startTime: now,
      expectedEndTime: new Date(now.getTime() + duration * 60000),
      endTime: null,
      duration: 0,
      status: "active",
    };

    // Save any idle time accumulated before starting the break
    const wasIdle = session.status === "idle";

    const idleMinutes =
      wasIdle && session.idleStartTime
        ? Math.max(0, (now - new Date(session.idleStartTime)) / 60000)
        : 0;

    const updatedSession = await WorkSession.findOneAndUpdate(
      {
        _id: session._id,
        status: { $in: ["working", "idle"] },
        currentBreak: null,
      },
      {
        $set: {
          status: "on_break",
          currentBreak: br,
          idleStartTime: null,
          idlePopupShown: false,
          totalIdleTime: (session.totalIdleTime || 0) + idleMinutes,
          totalWorkDuration: Math.max(
            0,
            (now - new Date(session.startTime)) / 60000 -
              (session.totalBreakDuration || 0) -
              (session.totalIdleTime || 0) -
              idleMinutes,
          ),
          lastActiveTime: now,
        },
        $push: {
          breaks: br,
          activityLogs: {
            timestamp: now,
            type: "break_start",
            details: `Manual ${reason} break`,
          },
        },
      },
      { new: true },
    );

    if (!updatedSession) {
      return res.status(409).json({
        success: false,
        message: "A break is already active or the session is not working",
      });
    }

    // The timer is a convenience; reconcileSession also handles this break
    // after a process restart or application interruption.
    setTimeout(
      () => autoEndBreakAndCheckActivity(employeeId),
      duration * 60000,
    );

    return res.status(200).json({
      success: true,
      message: `${reason} break started successfully`,
      data: {
        status: updatedSession.status,
        currentBreak: updatedSession.currentBreak,
        expectedEndTime: br.expectedEndTime,
      },
    });
  } catch (e) {
    console.error("START BREAK ERROR:", e);

    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// Auto end break
const autoEndBreakAndCheckActivity = async (employeeId) => {
  try {
    const session = await checkExistingActiveSession(employeeId);
    if (!session || session.status !== "on_break" || !session.currentBreak)
      return;

    const expectedEnd = session.currentBreak.expectedEndTime
      ? new Date(session.currentBreak.expectedEndTime)
      : null;
    if (expectedEnd && expectedEnd > new Date()) {
      setTimeout(
        () => autoEndBreakAndCheckActivity(employeeId),
        expectedEnd.getTime() - Date.now(),
      );
      return;
    }

    await reconcileSession(session, new Date());
  } catch (error) {
    console.error("Auto end break error:", error);
  }
};

// @desc    Report idle status from frontend
const reportIdle = async (req, res) => {
  req.body.activityType =
    req.body.activityType === "human" ? "human" : undefined;
  return updateActivity(req, res);
};

// @desc    Check idle status
const checkIdleStatus = async (req, res) => {
  try {
    let x = await findTodaySession(req.params.employeeId);
    if (!x) {
      const hm = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      return res.json({
        success: true,
        status: "not_started",
        shouldShowPopup: false,
        shouldShowStartReminder:
          DEVELOPMENT_MODE ||
          (hm >= WorkSchedule.officeStart && hm < WorkSchedule.officeEnd),
        currentBreak: null,
      });
    }

    const now = new Date();
    x = await reconcileSession(x, now);

    if (x.status === "on_break") {
      return res.json({
        success: true,
        status: x.status,
        shouldShowPopup: false,
        currentBreak: x.currentBreak,
      });
    }

    const idleAnchor =
      x.status === "idle" && x.idleStartTime
        ? x.idleStartTime
        : x.lastActiveTime || x.startTime;
    const idle = Math.max(0, (now - new Date(idleAnchor)) / 60000);
    const popup = x.status === "idle" && x.idlePopupShown;

    return res.json({
      success: true,
      status: x.status,
      shouldShowPopup: popup,
      idleDuration: Math.floor(idle),
      idleStartTime: x.idleStartTime,
      lastActiveTime: x.lastActiveTime,
      currentBreak: x.currentBreak,
      ...workTimeResponse(x.totalWorkDuration),
      isWorkTimePaused: x.status === "idle",
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// @desc    Handle idle response
const handleIdleResponse = async (req, res) => {
  try {
    const { employeeId, action } = req.body;
    if (!["continue", "stop"].includes(action))
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    let x = await checkExistingActiveSession(employeeId);
    if (!x)
      return res
        .status(404)
        .json({ success: false, message: "No active work session" });

    const now = new Date();
    const idle =
      x.status === "idle" && x.idleStartTime
        ? Math.max(0, (now - x.idleStartTime) / 60000)
        : 0;
    x.totalIdleTime = (x.totalIdleTime || 0) + idle;
    x.idlePromptResponse = action;
    x.idlePromptRespondedAt = now;
    x.activityLogs.push({
      timestamp: now,
      type: "idle_response",
      details: "Employee selected " + action,
    });

    if (action === "continue") {
      x.status = "working";
      x.lastActiveTime = now;
      x.idleStartTime = null;
      x.idlePopupShown = false;
      x.totalWorkDuration = Math.max(
        0,
        (now - x.startTime) / 60000 -
          (x.totalBreakDuration || 0) -
          x.totalIdleTime,
      );
    } else {
      x.status = "completed";
      x.endTime = now;
      x.idleStartTime = null;
      x.totalWorkDuration = Math.max(
        0,
        (now - x.startTime) / 60000 -
          (x.totalBreakDuration || 0) -
          x.totalIdleTime,
      );
      x.activityLogs.push({
        timestamp: now,
        type: "work_end",
        details: "Stopped from idle prompt",
      });
    }
    await x.save();
    return res.json({
      success: true,
      data: {
        status: x.status,
        idlePromptResponse: action,
        ...workTimeResponse(x.totalWorkDuration),
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

const finalizeWorkSession = async (
  x,
  now = new Date(),
  details = "Work session ended",
) => {
  await reconcileSession(x, now);

  // End an active break
  if (x.currentBreak?.status === "active") {
    const br = x.currentBreak;
    // Count the full actual break, including time beyond expectedEndTime.
    const endAt = now;

    br.endTime = endAt;
    br.duration = Math.max(
      0,
      (endAt.getTime() - new Date(br.startTime).getTime()) / 60000,
    );
    br.status = "ended";

    const item = x.breaks.find(
      (b) =>
        b.status === "active" &&
        new Date(b.startTime).getTime() === new Date(br.startTime).getTime(),
    );

    if (item) {
      item.endTime = endAt;
      item.duration = br.duration;
      item.status = "ended";
    }

    x.totalBreakDuration = (Number(x.totalBreakDuration) || 0) + br.duration;
  }

  // Finalize ongoing idle time once, through the actual work end time.
  if (x.status === "idle" && x.idleStartTime) {
    const idleMinutes = Math.max(
      0,
      (now.getTime() - new Date(x.idleStartTime).getTime()) / 60000,
    );
    x.totalIdleTime = (Number(x.totalIdleTime) || 0) + idleMinutes;
  }

  const elapsedMinutes =
    (now.getTime() - new Date(x.startTime).getTime()) / 60000;
  x.totalWorkDuration = Math.max(
    0,
    elapsedMinutes -
      (Number(x.totalBreakDuration) || 0) -
      (Number(x.totalIdleTime) || 0),
  );

  x.status = "completed";
  x.endTime = now;
  x.idleStartTime = null;
  x.currentBreak = null;

  x.activityLogs.push({
    timestamp: now,
    type: "work_end",
    details,
  });

  await x.save();
  return x;
};
// @desc    End work session
const endWork = async (req, res) => {
  try {
    const x = await checkExistingActiveSession(req.body.employeeId);

    if (!x) {
      return res.status(404).json({
        success: false,
        message: "No active work session",
      });
    }

    await finalizeWorkSession(x, new Date(), "Work session ended manually");

    return res.json({
      success: true,
      message: "Work session ended",
      data: {
        status: x.status,
        ...workTimeResponse(x.totalWorkDuration),
        totalBreakDuration: Math.round(x.totalBreakDuration || 0),
        totalIdleTime: Math.round(x.totalIdleTime || 0),
        startTime: x.startTime,
        endTime: x.endTime,
      },
    });
  } catch (e) {
    console.error("endWork error:", e);
    return res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};
// @desc    Get current status with real-time work time
const getCurrentStatus = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    let x = await findTodaySession(employeeId);
    if (!x) {
      const hm = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());
      return res.json({
        success: true,
        data: {
          status: "not_started",
          shouldShowStartReminder:
            DEVELOPMENT_MODE ||
            (hm >= WorkSchedule.officeStart && hm < WorkSchedule.officeEnd),
          shouldShowPopup: false,
          currentBreak: null,
          isWorkTimePaused: false,
          totalWorkDuration: 0,
          totalWorkSeconds: 0,
        },
      });
    }

    const now = new Date();
    x = await reconcileSession(x, now);

    let workMinutes = x.totalWorkDuration || 0;
    if (x.status === "working") {
      workMinutes = Math.max(
        0,
        (now - x.startTime) / 60000 -
          (x.totalBreakDuration || 0) -
          (x.totalIdleTime || 0),
      );
    }

    let activeIdleMinutes = 0;
    if (x.status === "idle" && x.idleStartTime) {
      activeIdleMinutes = Math.max(0, (now - x.idleStartTime) / 60000);
    }

    let activeBreakMinutes = 0;
    if (x.status === "on_break" && x.currentBreak?.startTime) {
      activeBreakMinutes = Math.max(
        0,
        (now - x.currentBreak.startTime) / 60000,
      );
    }

    const totalIdleTime = (x.totalIdleTime || 0) + activeIdleMinutes;
    const totalBreakDuration = (x.totalBreakDuration || 0) + activeBreakMinutes;

    return res.json({
      success: true,
      data: {
        sessionId: x._id,
        status: x.status,
        startTime: x.startTime,
        endTime: x.endTime,
        date: x.date,
        ...workTimeResponse(workMinutes),
        currentWorkTime: workTimeResponse(workMinutes).totalWorkDuration,
        currentWorkHours: (workMinutes / 60).toFixed(2),
        totalIdleTime: Math.round(totalIdleTime),
        totalBreakDuration: Math.round(totalBreakDuration),
        lastActiveTime: x.lastActiveTime,
        idleStartTime: x.idleStartTime,
        currentBreak: x.currentBreak,
        shouldShowPopup: x.status === "idle" && x.idlePopupShown,
        shouldShowStartReminder: false,
        isWorkTimePaused: x.status !== "working",
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

// @desc    Get today's summary
const getTodaySummary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    let session = await findTodaySession(employeeId);

    if (!session) {
      return res.json({
        success: true,
        data: {
          status: "not_started",
          totalWorkDuration: 0,
          totalWorkSeconds: 0,
          totalWorkHours: "0.00",
          totalBreakDuration: 0,
          totalIdleTime: 0,
        },
      });
    }

    const now = new Date();
    session = await reconcileSession(session, now);

    let totalWorkDuration = session.totalWorkDuration || 0;
    let activeIdleDuration = 0;
    let activeBreakDuration = 0;

    if (session.status === "working") {
      const totalElapsed = (now - session.startTime) / (1000 * 60);
      const totalNonWork =
        (session.totalBreakDuration || 0) + (session.totalIdleTime || 0);
      totalWorkDuration = Math.max(0, totalElapsed - totalNonWork);
    } else if (session.status === "idle" && session.idleStartTime) {
      activeIdleDuration = Math.max(
        0,
        (now - session.idleStartTime) / (1000 * 60),
      );
    } else if (
      session.status === "on_break" &&
      session.currentBreak?.startTime
    ) {
      activeBreakDuration = Math.max(
        0,
        (now - session.currentBreak.startTime) / (1000 * 60),
      );
    }

    const totalBreak = (session.totalBreakDuration || 0) + activeBreakDuration;
    const totalIdle = (session.totalIdleTime || 0) + activeIdleDuration;

    res.json({
      success: true,
      data: {
        status: session.status,
        sessionId: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        date: session.date,
        startTimeIST: formatTimeIST(session.startTime),
        endTimeIST: formatTimeIST(session.endTime),
        dateIST: formatDateIST(session.date),
        ...workTimeResponse(totalWorkDuration),
        totalWorkHours: (totalWorkDuration / 60).toFixed(2),
        totalBreakDuration: Math.round(totalBreak),
        totalIdleTime: Math.round(totalIdle),
        totalBreakHours: (totalBreak / 60).toFixed(2),
        totalIdleHours: (totalIdle / 60).toFixed(2),
        breaks: session.breaks || [],
        currentBreak: session.currentBreak || null,
      },
    });
  } catch (error) {
    console.error("Get today summary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get work history
const getWorkHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    let query = { employeeId };
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };

    const sessions = await WorkSession.find(query).sort({ date: -1 });
    const totals = sessions.reduce(
      (acc, s) => ({
        totalWork: acc.totalWork + (s.totalWorkDuration || 0),
        totalBreak: acc.totalBreak + (s.totalBreakDuration || 0),
        totalIdle: acc.totalIdle + (s.totalIdleTime || 0),
      }),
      { totalWork: 0, totalBreak: 0, totalIdle: 0 },
    );

    const formattedSessions = sessions.map((s) => ({
      ...s.toObject(),
      startTime: s.startTime,
      startTimeIST: formatTimeIST(s.startTime),
      endTime: s.endTime,
      endTimeIST: s.endTime ? formatTimeIST(s.endTime) : null,
      date: s.date,
      dateIST: formatDateIST(s.date),
    }));

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        totals: {
          totalWorkHours: (totals.totalWork / 60).toFixed(2),
          totalBreakHours: (totals.totalBreak / 60).toFixed(2),
          totalIdleHours: (totals.totalIdle / 60).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Get work history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active employees
const getActiveEmployees = async (req, res) => {
  try {
    const { start, end } = getISTDayRange();
    let query = {
      date: { $gte: start, $lt: end },
      status: { $in: ["working", "idle", "on_break", "idle_checking"] },
    };

    const activeSessions = await WorkSession.find(query)
      .select(
        "employeeId employeeName startTime status lastActiveTime idleStartTime totalWorkDuration totalBreakDuration totalIdleTime breaks currentBreak",
      )
      .sort({ startTime: -1 });

    await Promise.all(
      activeSessions.map((session) => reconcileSession(session, new Date())),
    );

    const activeEmployees = await Promise.all(
      activeSessions.map(async (session) => {
        const staff = await Staff.findOne({
          employeeId: session.employeeId,
        }).select("employeeId employeeName role mobile email profileImage");

        const now = new Date();
        const breaks = Array.isArray(session.breaks) ? session.breaks : [];
        const activeBreakFromArray = breaks.find(
          (b) => b.startTime && !b.endTime,
        );
        const currentBreak =
          session.currentBreak?.startTime && !session.currentBreak?.endTime
            ? session.currentBreak
            : null;
        const activeBreak = currentBreak || activeBreakFromArray || null;

        let lunchSec = 0;
        let teaSec = 0;
        let otherBreakSec = 0;

        breaks.forEach((b) => {
          if (b.startTime && !b.endTime) return;
          const durSec = b.duration
            ? Math.round(b.duration * 60)
            : b.startTime && b.endTime
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(b.endTime) - new Date(b.startTime)) / 1000,
                  ),
                )
              : 0;
          const r = String(b.type || b.reason || "").toLowerCase();
          if (r.includes("lunch")) lunchSec += durSec;
          else if (r.includes("tea") || r.includes("refresh")) teaSec += durSec;
          else otherBreakSec += durSec;
        });

        let activeBreakSec = 0;
        if (activeBreak) {
          activeBreakSec = Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(activeBreak.startTime).getTime()) /
                1000,
            ),
          );
          const r = String(
            activeBreak.type || activeBreak.reason || "",
          ).toLowerCase();
          if (r.includes("lunch")) lunchSec += activeBreakSec;
          else if (r.includes("tea") || r.includes("refresh"))
            teaSec += activeBreakSec;
          else otherBreakSec += activeBreakSec;
        }

        const activeBreakType = activeBreak
          ? String(
              activeBreak.type || activeBreak.reason || "break",
            ).toLowerCase()
          : null;

        let liveStatus = session.status;
        if (activeBreak) {
          if (activeBreakType.includes("lunch")) liveStatus = "lunch_break";
          else if (
            activeBreakType.includes("tea") ||
            activeBreakType.includes("refresh")
          )
            liveStatus = "tea_break";
          else liveStatus = "on_break";
        }

        let currentIdleSec = 0;
        if (session.status === "idle" && session.idleStartTime) {
          currentIdleSec = Math.max(
            0,
            Math.floor(
              (now.getTime() - new Date(session.idleStartTime).getTime()) /
                1000,
            ),
          );
        }

        const totalIdleSec =
          Math.round((Number(session.totalIdleTime) || 0) * 60) +
          currentIdleSec;
        const totalBreakSec = lunchSec + teaSec + otherBreakSec;

        let workingSeconds = 0;
        if (session.startTime) {
          if (session.status === "working") {
            const elapsedSec = Math.max(
              0,
              Math.floor(
                (now.getTime() - new Date(session.startTime).getTime()) / 1000,
              ),
            );
            workingSeconds = Math.max(
              0,
              elapsedSec - totalBreakSec - totalIdleSec,
            );
          } else {
            workingSeconds = Math.round(
              (Number(session.totalWorkDuration) || 0) * 60,
            );
          }
        }

        let breakInfo = null;
        if (activeBreak) {
          breakInfo = {
            breakType: activeBreak.type || activeBreak.reason || "Break",
            breakStartTime: activeBreak.startTime,
            breakEndTime: activeBreak.expectedEndTime || null,
            durationSec: activeBreakSec,
          };
        } else if (
          session.status === "on_break" &&
          activeBreaks.has(session.employeeId)
        ) {
          const brk = activeBreaks.get(session.employeeId);
          breakInfo = {
            breakType: brk.breakType,
            remainingMinutes: Math.ceil((brk.breakEndTime - now) / 60000),
            breakEndTime: brk.breakEndTime,
            breakStartTime: brk.startTime,
          };
        }

        return {
          employeeId: session.employeeId,
          employeeName: session.employeeName,
          role: staff?.role || "Staff",
          mobile: staff?.mobile || "N/A",
          email: staff?.email || "N/A",
          profileImage: staff?.profileImage || null,
          sessionId: session._id,
          status: liveStatus,
          startTime: session.startTime,
          startTimeIST: formatTimeIST(session.startTime),
          endTime: session.endTime,
          endTimeIST: formatTimeIST(session.endTime),
          lastActiveTimeIST: formatTimeIST(session.lastActiveTime),
          lastActiveTime: session.lastActiveTime,
          currentWorkDuration: Math.round(workingSeconds / 60),
          currentWorkHours: (workingSeconds / 3600).toFixed(2),
          workingSeconds,
          delaySeconds: totalIdleSec,
          idleSeconds: totalIdleSec,
          lunchTakenSec: lunchSec,
          teaTakenSec: teaSec,
          otherBreakSec: otherBreakSec,
          totalBreakDuration: Math.round(totalBreakSec / 60),
          totalIdleTime: Math.round(totalIdleSec / 60),
          lunchDuration: Math.round(lunchSec / 60),
          teaDuration: Math.round(teaSec / 60),
          breakInfo: breakInfo,
          activeBreak: activeBreak,
          breaks: session.breaks || [],
          isIdle: session.status === "idle",
          isOnBreak: ["on_break", "lunch_break", "tea_break"].includes(
            liveStatus,
          ),
        };
      }),
    );

    res.json({
      success: true,
      count: activeEmployees.length,
      data: activeEmployees,
    });
  } catch (error) {
    console.error("Get active employees error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all sessions for an employee
const getAllSessions = async (req, res) => {
  try {
    const employeeId = req.params.employeeId || req.user?.employeeId;
    const { limit = 100, page = 1, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { employeeId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    const total = await WorkSession.countDocuments(query);
    const sessions = await WorkSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const stats = {
      totalSessions: total,
      totalWorkMinutes: sessions.reduce(
        (sum, s) => sum + (s.totalWorkDuration || 0),
        0,
      ),
      totalBreakMinutes: sessions.reduce(
        (sum, s) => sum + (s.totalBreakDuration || 0),
        0,
      ),
      totalIdleMinutes: sessions.reduce(
        (sum, s) => sum + (s.totalIdleTime || 0),
        0,
      ),
    };

    const formattedSessions = sessions.map((s) => ({
      ...s.toObject(),
      startTime: s.startTime,
      startTimeIST: formatTimeIST(s.startTime),
      endTime: s.endTime,
      endTimeIST: s.endTime ? formatTimeIST(s.endTime) : null,
      date: s.date,
      dateIST: formatDateIST(s.date),
    }));

    res.json({
      success: true,
      data: {
        employeeId,
        sessions: formattedSessions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
        statistics: {
          totalWorkHours: (stats.totalWorkMinutes / 60).toFixed(2),
          totalBreakHours: (stats.totalBreakMinutes / 60).toFixed(2),
          totalIdleHours: (stats.totalIdleMinutes / 60).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all sessions for all employees (Admin)
const getAllSessionsAdmin = async (req, res) => {
  try {
    const { limit = 100, page = 1, employeeId, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = {};

    // Filter by employeeId if provided
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get total count
    const total = await WorkSession.countDocuments(query);

    // Get sessions with pagination
    const sessions = await WorkSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate overall statistics
    const stats = sessions.reduce(
      (acc, s) => {
        acc.totalWorkMinutes += s.totalWorkDuration || 0;
        acc.totalBreakMinutes += s.totalBreakDuration || 0;
        acc.totalIdleMinutes += s.totalIdleTime || 0;
        return acc;
      },
      { totalWorkMinutes: 0, totalBreakMinutes: 0, totalIdleMinutes: 0 },
    );

    // Group by employee for employee-wise summary
    const employeeWiseStats = {};
    sessions.forEach((s) => {
      if (!employeeWiseStats[s.employeeId]) {
        employeeWiseStats[s.employeeId] = {
          employeeId: s.employeeId,
          employeeName: s.employeeName || "Unknown",
          totalSessions: 0,
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          totalIdleMinutes: 0,
        };
      }
      employeeWiseStats[s.employeeId].totalSessions++;
      employeeWiseStats[s.employeeId].totalWorkMinutes +=
        s.totalWorkDuration || 0;
      employeeWiseStats[s.employeeId].totalBreakMinutes +=
        s.totalBreakDuration || 0;
      employeeWiseStats[s.employeeId].totalIdleMinutes += s.totalIdleTime || 0;
    });

    const now = new Date();

    // Format sessions with IST times
    const formattedSessions = sessions.map((s) => ({
      ...s.toObject(),
      totalWorkDuration:
        s.status === "working" &&
        s.startTime &&
        formatDateIST(s.date) === formatDateIST(now)
          ? Math.max(
              0,
              (now - new Date(s.startTime)) / 60000 -
                (s.totalBreakDuration || 0) -
                (s.totalIdleTime || 0),
            )
          : s.totalWorkDuration || 0,
      startTime: s.startTime,
      startTimeIST: formatTimeIST(s.startTime),
      endTime: s.endTime,
      endTimeIST: s.endTime ? formatTimeIST(s.endTime) : null,
      date: s.date,
      dateIST: formatDateIST(s.date),
    }));

    // Format employee-wise stats
    const employeeSummary = Object.values(employeeWiseStats).map((emp) => ({
      ...emp,
      totalWorkHours: (emp.totalWorkMinutes / 60).toFixed(2),
      totalBreakHours: (emp.totalBreakMinutes / 60).toFixed(2),
      totalIdleHours: (emp.totalIdleMinutes / 60).toFixed(2),
      averageWorkHours:
        emp.totalSessions > 0
          ? (emp.totalWorkMinutes / emp.totalSessions / 60).toFixed(2)
          : "0.00",
    }));

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        employeeSummary,
        statistics: {
          totalSessions: total,
          totalWorkHours: (stats.totalWorkMinutes / 60).toFixed(2),
          totalBreakHours: (stats.totalBreakMinutes / 60).toFixed(2),
          totalIdleHours: (stats.totalIdleMinutes / 60).toFixed(2),
          totalEmployees: Object.keys(employeeWiseStats).length,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get today's timeline
const getTodayTimeline = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = getISTDate();
    const { start, end } = getISTDayRange();
    let session = await WorkSession.findOne({
      employeeId,
      date: { $gte: start, $lt: end },
    });
    if (session) {
      session = await reconcileSession(session, new Date());
    }

    if (!session) {
      return res.json({
        success: true,
        data: {
          timeline: [],
          breaks: [],
          summary: {
            workStarted: null,
            totalBreaks: 0,
            productivity: 0,
            idleTime: 0,
            totalWorkHours: 0,
            totalBreakHours: 0,
            totalIdleHours: 0,
          },
        },
      });
    }

    const timeline = [];
    const breaks = [];

    if (session.startTime) {
      timeline.push({
        id: "work-start",
        type: "work_start",
        title: "Punched In — Work Started",
        time: session.startTime,
        formattedTime: formatTimeIST(session.startTime),
        location: "Office",
        icon: "💼",
      });
    }

    let breakCounter = 1;
    let currentBreak = null;

    for (const log of session.activityLogs) {
      if (log.type === "break_start") {
        const isTea =
          log.breakType === "tea" ||
          (log.details && log.details.includes("tea"));
        currentBreak = {
          id: `break-${breakCounter}`,
          type: "break",
          title: isTea ? "Tea Break" : "Lunch Break",
          startTime: log.timestamp,
          location: isTea ? "Pantry" : "Cafeteria",
          icon: isTea ? "☕" : "🍽️",
          expectedDuration: log.breakDuration || (isTea ? 15 : 60),
          breakType: log.breakType || (isTea ? "tea" : "lunch"),
        };
      }

      if (log.type === "break_end" && currentBreak) {
        const actualDuration =
          log.actualDuration ||
          Math.round(
            (new Date(log.timestamp) - new Date(currentBreak.startTime)) /
              60000,
          );
        const breakItem = {
          ...currentBreak,
          time: currentBreak.startTime,
          formattedTime: formatTimeIST(currentBreak.startTime),
          endTime: log.timestamp,
          formattedEndTime: formatTimeIST(log.timestamp),
          duration: actualDuration,
          expectedDuration: currentBreak.expectedDuration,
          isOverdue: actualDuration > currentBreak.expectedDuration,
          overdueMinutes:
            actualDuration > currentBreak.expectedDuration
              ? actualDuration - currentBreak.expectedDuration
              : 0,
        };
        timeline.push(breakItem);
        breaks.push(breakItem);
        currentBreak = null;
        breakCounter++;
      }
    }

    if (session.endTime) {
      timeline.push({
        id: "work-end",
        type: "work_end",
        title: "Punched Out — Work Ended",
        time: session.endTime,
        formattedTime: formatTimeIST(session.endTime),
        location: "Office",
        icon: "🏁",
      });
    }

    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    const totalWorkMinutes = session.totalWorkDuration || 0;
    const totalBreakMinutes = session.totalBreakDuration || 0;
    const totalIdleMinutes = session.totalIdleTime || 0;
    const totalSessionMinutes = totalWorkMinutes + totalBreakMinutes;
    const productivity =
      totalSessionMinutes > 0
        ? Math.round((totalWorkMinutes / totalSessionMinutes) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        timeline,
        breaks,
        summary: {
          workStarted: session.startTime,
          workStartedFormatted: formatTimeIST(session.startTime),
          workEnded: session.endTime,
          workEndedFormatted: session.endTime
            ? formatTimeIST(session.endTime)
            : null,
          totalBreaks: breaks.length,
          productivity,
          idleTime: Math.round(totalIdleMinutes),
          totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
          totalBreakHours: (totalBreakMinutes / 60).toFixed(2),
          totalIdleHours: (totalIdleMinutes / 60).toFixed(2),
          workStatus:
            session.status === "completed" ? "Completed" : "In Progress",
          totalElapsedHours: (
            (totalWorkMinutes + totalBreakMinutes) /
            60
          ).toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error("Get today timeline error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startIdleDetection,
  startWork,
  updateActivity,
  reportIdle,
  checkIdleStatus,
  handleIdleResponse,
  startBreak,
  endBreak,
  endWork,
  getCurrentStatus,
  getTodaySummary,
  getWorkHistory,
  getActiveEmployees,
  getAllSessions,
  getAllSessionsAdmin,
  getTodayTimeline,
};
