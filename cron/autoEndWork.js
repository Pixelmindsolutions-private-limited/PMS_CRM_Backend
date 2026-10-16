const cron = require("node-cron");
const WorkSession = require("../models/Worksession");
const { finalizeWorkSession } = require("../controllers/WorkSession.controller");

const startAutoEndWork = () => {
  // Runs every day at 12:00 AM India time
  cron.schedule(
    "0 0 * * *",
    async () => {
      const now = new Date();

      console.log(
        "[AUTO END WORK] Running at IST:",
        now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      );

      try {
        const sessions = await WorkSession.find({
          status: { $in: ["working", "idle", "on_break"] },
        });

        for (const session of sessions) {
          try {
            await finalizeWorkSession(
              session,
              now,
              "Automatically ended at midnight IST"
            );

            console.log(
              `[AUTO END WORK] Completed session for employee ${session.employeeId}`
            );
          } catch (error) {
            console.error(
              `[AUTO END WORK] Failed for session ${session._id}:`,
              error.message
            );
          }
        }

        console.log(
          `[AUTO END WORK] Finished. Processed ${sessions.length} sessions.`
        );
      } catch (error) {
        console.error("[AUTO END WORK] Scheduler error:", error);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
};

module.exports = startAutoEndWork;