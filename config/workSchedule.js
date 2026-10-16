const WORK_SCHEDULE = {
  timezone: 'Asia/Kolkata',

  officeStart: '10:00',
  officeEnd: '19:00',

  lunch: {
    start: '13:00',
    end: '13:45',
    durationMinutes: 45
  },

  tea: {
    start: '17:00',
    end: '17:15',
    durationMinutes: 15
  },

  idleThresholdMinutes: 2
};

module.exports = WORK_SCHEDULE;
