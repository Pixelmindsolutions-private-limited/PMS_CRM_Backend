const cron = require('node-cron');
const WorkSession = require('../models/Worksession');
const TIMEZONE = 'Asia/Kolkata';
const BREAKS = [
  { type: 'lunch', start: '13:00', end: '13:45' },
  { type: 'tea', start: '17:00', end: '17:15' },
];
const MINUTE = 60000;
function parts(date = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(({ type, value }) => [type, value]));
}
function instantFor(p, hm) {
  const [hour, minute] = hm.split(':').map(Number);
  return new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), hour, minute) - 330 * MINUTE);
}
function todayRange(p) {
  const start = instantFor(p, '00:00');
  return { start, end: new Date(start.getTime() + 24 * 60 * MINUTE) };
}
async function startScheduledBreak(item, now) {
  const p = parts(now);
  const startTime = instantFor(p, item.start);
  const expectedEndTime = instantFor(p, item.end);
  const { start, end } = todayRange(p);
  const sessions = await WorkSession.find({ startTime: { $lt: startTime }, date: { $gte: start, $lt: end }, status: 'working', currentBreak: null, 'breaks.type': { $ne: item.type } }).select('_id employeeId employeeName startTime totalBreakDuration totalIdleTime');
  for (const session of sessions) {
    const br = { type: item.type, startTime, endTime: null, expectedEndTime, duration: 0, status: 'active', source: 'scheduled', reason: item.type };
    await WorkSession.updateOne({ _id: session._id, status: 'working', currentBreak: null, 'breaks.type': { $ne: item.type } }, { $set: { status: 'on_break', currentBreak: br, totalWorkDuration: Math.max(0, (startTime - session.startTime) / MINUTE - (Number(session.totalBreakDuration) || 0) - (Number(session.totalIdleTime) || 0)) }, $push: { breaks: br, activityLogs: { timestamp: startTime, type: 'break_start', details: `Scheduled ${item.type} break` } } });
  }
}
async function endExpiredBreaks(now) {
  const sessions = await WorkSession.find({ status: 'on_break', 'currentBreak.status': 'active', 'currentBreak.expectedEndTime': { $lte: now } }).select('_id currentBreak');
  for (const session of sessions) {
    const br = session.currentBreak;
    const endTime = br.expectedEndTime || now;
    const duration = Math.max(0, Math.round((endTime - br.startTime) / MINUTE));
    const filter = { _id: session._id, status: 'on_break', 'currentBreak.status': 'active', 'currentBreak.startTime': br.startTime };
    const result = await WorkSession.updateOne(filter, { $set: { status: 'working', 'currentBreak.endTime': endTime, 'currentBreak.duration': duration, 'currentBreak.status': 'ended', idlePopupShown: false, lastActiveTime: endTime }, $inc: { totalBreakDuration: duration }, $push: { activityLogs: { timestamp: endTime, type: 'break_end', duration, details: `${br.source === 'scheduled' ? 'Scheduled' : 'Manual'} ${br.type} break ended` } } });
    if (result.modifiedCount) await WorkSession.updateOne({ _id: session._id }, { $set: { 'breaks.$[b].endTime': endTime, 'breaks.$[b].duration': duration, 'breaks.$[b].status': 'ended' } }, { arrayFilters: [{ 'b.startTime': br.startTime, 'b.status': 'active' }] });
  }
}
async function reconcile() {
  const now = new Date();
  const p = parts(now);
  const hm = `${p.hour}:${p.minute}`;
  for (const item of BREAKS) if (hm >= item.start) await startScheduledBreak(item, now);
  await endExpiredBreaks(now);
}
function startStaffWorkScheduler() {
  let running = false;
  const tick = async () => { if (running) return; running = true; try { await reconcile(); } catch (error) { console.error('Staff work scheduler error:', error); } finally { running = false; } };
  cron.schedule('* * * * *', tick, { timezone: TIMEZONE });
  tick();
  console.log('Staff work scheduler initialized (Asia/Kolkata)');
}
module.exports = startStaffWorkScheduler;
