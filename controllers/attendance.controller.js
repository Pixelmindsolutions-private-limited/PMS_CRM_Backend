// const Attendance = require('../models/Attendance');
// const { Staff } = require('../models/Staff');
// const mongoose = require('mongoose');

// // @desc    Get all staff options for attendance dropdown
// // @route   GET /api/attendance/staff-options
// // @access  Private
// exports.getStaffOptions = async (req, res) => {
//   try {
//     console.log('👥 Fetching staff options for attendance...');

//     // Staff is now defined and can use .find()
//     const staff = await Staff.find({ isActive: true })
//       .select('employeeId employeeName role')
//       .sort({ employeeName: 1 });  // Changed from staffName to employeeName

//     const options = staff.map(s => ({
//       _id: s._id,
//       employeeId: s.employeeId,
//       employeeName: s.employeeName,
//       role: s.role
//     }));

//     res.json({
//       success: true,
//       data: options
//     });

//   } catch (error) {
//     console.error('❌ Get staff options error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Create new attendance
// // @route   POST /api/attendance
// // @access  Private
// exports.createAttendance = async (req, res) => {
//   try {

//     const { staffId, name, date, status, dayType, hoursWorked } = req.body;

//     // Check if attendance already exists for this staff on this date
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);
    
//     const endOfDay = new Date(date);
//     endOfDay.setHours(23, 59, 59, 999);

//     const existingAttendance = await Attendance.findOne({
//       staffId,
//       date: { $gte: startOfDay, $lte: endOfDay }
//     });

//     if (existingAttendance) {
//       return res.status(400).json({
//         success: false,
//         message: 'Attendance already recorded for this staff on this date'
//       });
//     }

//     // Validate hours based on day type
//     if (status === 'present') {
//       if (dayType === 'halfDay' && (hoursWorked <= 0 || hoursWorked > 4)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Hours must be between 1 and 4 for half day'
//         });
//       }
//       if (dayType === 'extraHours' && hoursWorked <= 8) {
//         return res.status(400).json({
//           success: false,
//           message: 'Extra hours must be greater than 8'
//         });
//       }
//     }

//     const attendance = await Attendance.create({
//       staffId,
//       name,
//       date: startOfDay,
//       status,
//       dayType: status === 'present' ? dayType : undefined,
//       hoursWorked: status === 'present' ? 
//         (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
//     });

//     console.log('✅ Attendance created successfully');

//     res.status(201).json({
//       success: true,
//       message: 'Attendance submitted successfully!',
//       data: attendance
//     });

//   } catch (error) {
//     console.error('❌ Create attendance error:', error);

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplicate attendance record for this date'
//       });
//     }

//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to submit attendance'
//     });
//   }
// };

// // @desc    Get all attendance records
// // @route   GET /api/attendance
// // @access  Private
// exports.getAllAttendance = async (req, res) => {
//   try {
//     console.log('📋 Fetching all attendance records...');

//     const { month, year, staffId } = req.query;
//     const query = {};

//     // Filter by month/year
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
//       query.date = {
//         $gte: startDate,
//         $lte: endDate
//       };
//     }

//     // Filter by staff
//     if (staffId) {
//       query.staffId = staffId;
//     }

//     const attendance = await Attendance.find(query)
//       .sort({ date: -1 });

//     console.log(`✅ Found ${attendance.length} attendance records`);

//     res.json({
//       success: true,
//       data: attendance
//     });

//   } catch (error) {
//     console.error('❌ Get all attendance error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get attendance by staff ID
// // @route   GET /api/attendance/staff/:staffId
// // @access  Private
// exports.getAttendanceByStaff = async (req, res) => {
//   try {
//     console.log(`🔍 Fetching attendance for staff: ${req.params.staffId}`);

//     const { month, year } = req.query;
//     const query = { staffId: req.params.staffId };

//     // Filter by month/year
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
//       query.date = {
//         $gte: startDate,
//         $lte: endDate
//       };
//     }

//     const attendance = await Attendance.find(query)
//       .sort({ date: -1 });

//     // Calculate statistics
//     const stats = {
//       present: attendance.filter(a => a.status === 'present').length,
//       absent: attendance.filter(a => a.status === 'absent').length,
//       leave: attendance.filter(a => a.status === 'leave').length,
//       total: attendance.length
//     };

//     res.json({
//       success: true,
//       data: attendance,
//       stats
//     });

//   } catch (error) {
//     console.error('❌ Get attendance by staff error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get attendance statistics
// // @route   GET /api/attendance/stats
// // @access  Private
// exports.getAttendanceStats = async (req, res) => {
//   try {
//     console.log('📊 Fetching attendance statistics...');

//     const { month, year } = req.query;
//     const query = {};

//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
//       query.date = {
//         $gte: startDate,
//         $lte: endDate
//       };
//     }

//     // Aggregate by staff
//     const stats = await Attendance.aggregate([
//       { $match: query },
//       {
//         $group: {
//           _id: '$staffId',
//           name: { $first: '$name' },
//           present: {
//             $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
//           },
//           absent: {
//             $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
//           },
//           leave: {
//             $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
//           },
//           total: { $sum: 1 }
//         }
//       },
//       { $sort: { name: 1 } }
//     ]);

//     // Overall statistics
//     const overall = await Attendance.aggregate([
//       { $match: query },
//       {
//         $group: {
//           _id: null,
//           present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
//           absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
//           leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
//           total: { $sum: 1 }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         byStaff: stats,
//         overall: overall[0] || { present: 0, absent: 0, leave: 0, total: 0 }
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get attendance stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Update attendance
// // @route   PUT /api/attendance/:id
// // @access  Private
// exports.updateAttendance = async (req, res) => {
//   try {
//     console.log('✏️ Updating attendance ID:', req.params.id);

//     const { status, dayType, hoursWorked } = req.body;

//     // Validate hours based on day type
//     if (status === 'present') {
//       if (dayType === 'halfDay' && (hoursWorked <= 0 || hoursWorked > 4)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Hours must be between 1 and 4 for half day'
//         });
//       }
//       if (dayType === 'extraHours' && hoursWorked <= 8) {
//         return res.status(400).json({
//           success: false,
//           message: 'Extra hours must be greater than 8'
//         });
//       }
//     }

//     const attendance = await Attendance.findByIdAndUpdate(
//       req.params.id,
//       {
//         status,
//         dayType: status === 'present' ? dayType : undefined,
//         hoursWorked: status === 'present' ? 
//           (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
//       },
//       { new: true, runValidators: true }
//     );

//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         message: 'Attendance record not found'
//       });
//     }

//     console.log('✅ Attendance updated successfully');

//     res.json({
//       success: true,
//       message: 'Attendance updated successfully',
//       data: attendance
//     });

//   } catch (error) {
//     console.error('❌ Update attendance error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Delete attendance
// // @route   DELETE /api/attendance/:id
// // @access  Private
// exports.deleteAttendance = async (req, res) => {
//   try {
//     console.log('🗑️ Deleting attendance ID:', req.params.id);

//     const attendance = await Attendance.findByIdAndDelete(req.params.id);

//     if (!attendance) {
//       return res.status(404).json({
//         success: false,
//         message: 'Attendance record not found'
//       });
//     }

//     console.log('✅ Attendance deleted successfully');

//     res.json({
//       success: true,
//       message: 'Attendance deleted successfully'
//     });

//   } catch (error) {
//     console.error('❌ Delete attendance error:', error);

//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid attendance ID format'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Bulk create attendance (for multiple staff on same date)
// // @route   POST /api/attendance/bulk
// // @access  Private
// exports.bulkCreateAttendance = async (req, res) => {
//   try {
//     console.log('📦 Bulk creating attendance records...');

//     const { date, records } = req.body;
//     const startOfDay = new Date(date);
//     startOfDay.setHours(0, 0, 0, 0);

//     const attendanceRecords = records.map(record => ({
//       ...record,
//       date: startOfDay
//     }));

//     // Use insertMany with ordered: false to continue even if some fail
//     const result = await Attendance.insertMany(attendanceRecords, { 
//       ordered: false,
//       rawResult: true 
//     });

//     console.log(`✅ Created ${result.insertedCount} attendance records`);

//     res.status(201).json({
//       success: true,
//       message: `Created ${result.insertedCount} attendance records`,
//       data: {
//         inserted: result.insertedCount,
//         failed: records.length - result.insertedCount
//       }
//     });

//   } catch (error) {
//     console.error('❌ Bulk create attendance error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };



const Attendance = require('../models/Attendance');
const { Staff } = require('../models/Staff');

// ============ GET STAFF OPTIONS ============
exports.getStaffOptions = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName role')
      .sort({ employeeName: 1 });

    res.json({
      success: true,
      data: staff.map(s => ({
        _id: s._id,
        employeeId: s.employeeId,
        employeeName: s.employeeName,
        role: s.role
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ CREATE ATTENDANCE ============
exports.createAttendance = async (req, res) => {
  try {
    const { staffId, name, date, status, dayType, hoursWorked } = req.body;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existing = await Attendance.findOne({
      staffId,
      date: { $gte: startDate, $lte: endDate }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this date'
      });
    }

    const attendance = await Attendance.create({
      staffId,
      name,
      date: startDate,
      status,
      dayType: status === 'present' ? dayType : undefined,
      hoursWorked: status === 'present' ? (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
    });

    res.status(201).json({
      success: true,
      message: 'Attendance submitted successfully',
      data: attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate attendance record'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET ALL ATTENDANCE ============
exports.getAllAttendance = async (req, res) => {
  try {
    const { month, year, staffId, status, date, limit = 100, page = 1 } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (staffId) query.staffId = staffId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [attendance, total] = await Promise.all([
      Attendance.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET ATTENDANCE BY STAFF ============
exports.getAttendanceByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { month, year, date } = req.query;
    const query = { staffId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query).sort({ date: -1 });

    const stats = attendance.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'present') {
        acc.present++;
        acc.totalHours += record.hoursWorked || 0;
      } else if (record.status === 'absent') {
        acc.absent++;
      } else if (record.status === 'leave') {
        acc.leave++;
      }
      return acc;
    }, { present: 0, absent: 0, leave: 0, total: 0, totalHours: 0 });

    res.json({
      success: true,
      data: attendance,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET ATTENDANCE STATS ============
exports.getAttendanceStats = async (req, res) => {
  try {
    const { date, month, year } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query);

    const overall = records.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'present') {
        acc.present++;
        acc.totalHours += record.hoursWorked || 0;
      } else if (record.status === 'absent') {
        acc.absent++;
      } else if (record.status === 'leave') {
        acc.leave++;
      }
      return acc;
    }, { present: 0, absent: 0, leave: 0, total: 0, totalHours: 0 });

    const byStaff = {};
    records.forEach(record => {
      if (!byStaff[record.staffId]) {
        byStaff[record.staffId] = {
          staffId: record.staffId,
          name: record.name,
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          totalHours: 0
        };
      }
      byStaff[record.staffId].total++;
      if (record.status === 'present') {
        byStaff[record.staffId].present++;
        byStaff[record.staffId].totalHours += record.hoursWorked || 0;
      } else if (record.status === 'absent') {
        byStaff[record.staffId].absent++;
      } else if (record.status === 'leave') {
        byStaff[record.staffId].leave++;
      }
    });

    let filterInfo = {};
    if (date) {
      const d = new Date(date);
      filterInfo = {
        type: 'date',
        date: date,
        dateFormatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        day: d.toLocaleDateString('en-IN', { weekday: 'long' })
      };
    } else {
      const m = month ? parseInt(month) : new Date().getMonth() + 1;
      const y = year ? parseInt(year) : new Date().getFullYear();
      filterInfo = {
        type: 'month',
        month: m,
        year: y,
        monthName: new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      };
    }

    const totalStaff = await Staff.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        filter: filterInfo,
        overall: {
          totalStaff,
          totalRecords: overall.total,
          present: overall.present,
          absent: overall.absent,
          leave: overall.leave,
          presentPercentage: overall.total > 0 ? ((overall.present / overall.total) * 100).toFixed(2) : '0.00',
          absentPercentage: overall.total > 0 ? ((overall.absent / overall.total) * 100).toFixed(2) : '0.00',
          leavePercentage: overall.total > 0 ? ((overall.leave / overall.total) * 100).toFixed(2) : '0.00',
          totalHoursWorked: overall.totalHours
        },
        byStaff: Object.values(byStaff)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ GET ATTENDANCE HISTORY ============
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { month, year, staffId, date, status, limit = 10, page = 1 } = req.query;
    const query = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (staffId) query.staffId = staffId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Attendance.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Attendance.countDocuments(query)
    ]);

    // Calculate summary
    const summary = records.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'present') {
        acc.present++;
        acc.totalHours += record.hoursWorked || 0;
      } else if (record.status === 'absent') {
        acc.absent++;
      } else if (record.status === 'leave') {
        acc.leave++;
      }
      return acc;
    }, { present: 0, absent: 0, leave: 0, total: 0, totalHours: 0 });

    // Group by date for daily summary
    const dailySummary = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          dateFormatted: new Date(dateKey).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          day: new Date(dateKey).toLocaleDateString('en-IN', { weekday: 'long' }),
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
          totalHours: 0,
          records: []
        };
      }
      dailySummary[dateKey].total++;
      dailySummary[dateKey].records.push(record);
      if (record.status === 'present') {
        dailySummary[dateKey].present++;
        dailySummary[dateKey].totalHours += record.hoursWorked || 0;
      } else if (record.status === 'absent') {
        dailySummary[dateKey].absent++;
      } else if (record.status === 'leave') {
        dailySummary[dateKey].leave++;
      }
    });

    // Get staff info if staffId provided
    let employeeInfo = null;
    if (staffId) {
      const staff = await Staff.findOne({ _id: staffId });
      if (staff) {
        employeeInfo = {
          staffId: staff._id,
          employeeId: staff.employeeId,
          employeeName: staff.employeeName,
          role: staff.role,
          email: staff.email,
          mobile: staff.mobile
        };
      }
    }

    let filterInfo = {};
    if (date) {
      const d = new Date(date);
      filterInfo = {
        type: 'date',
        date: date,
        dateFormatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        day: d.toLocaleDateString('en-IN', { weekday: 'long' })
      };
    } else {
      const m = month ? parseInt(month) : new Date().getMonth() + 1;
      const y = year ? parseInt(year) : new Date().getFullYear();
      filterInfo = {
        type: 'month',
        month: m,
        year: y,
        monthName: new Date(y, m - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      };
    }

    res.json({
      success: true,
      data: {
        employee: employeeInfo,
        filter: filterInfo,
        summary: {
          totalRecords: summary.total,
          present: summary.present,
          absent: summary.absent,
          leave: summary.leave,
          presentPercentage: summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(2) : '0.00',
          totalHoursWorked: summary.totalHours
        },
        dailySummary: Object.values(dailySummary),
        records: records,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ UPDATE ATTENDANCE ============
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, dayType, hoursWorked } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      {
        status,
        dayType: status === 'present' ? dayType : undefined,
        hoursWorked: status === 'present' ? (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
      },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ DELETE ATTENDANCE ============
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByIdAndDelete(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ BULK CREATE ATTENDANCE ============
exports.bulkCreateAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const attendanceRecords = records.map(record => ({
      ...record,
      date: startDate,
      dayType: record.status === 'present' ? record.dayType : undefined,
      hoursWorked: record.status === 'present' ? 
        (record.dayType === 'fullDay' ? 8 : record.hoursWorked) : undefined
    }));

    const result = await Attendance.insertMany(attendanceRecords, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Created ${result.length} attendance records`,
      data: {
        inserted: result.length,
        total: records.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompleteEmployeeAttendance = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year, month, day, startDay, endDay } = req.query;

    let employee = null;

    employee = await Staff.findOne({ employeeId: staffId });
    // // 1. GET EMPLOYEE - Find by either _id or employeeId
    // const employee = await Staff.findOne({ 
    //   $or: [
    //     { _id: staffId },
    //     { employeeId: staffId }
    //   ]
    // });
    
    if (!employee && mongoose.Types.ObjectId.isValid(staffId)) {
      employee = await Staff.findById(staffId);
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Use employee._id for consistent querying
    const employeeObjectId = employee._id;
    const employeeIdString = employee.employeeId;

    // 2. BUILD QUERY - Use employee._id for consistency
    const query = {
      $or: [
        { staffId: employeeObjectId },
        { staffId: employeeIdString }
      ]
    };

    // 3. APPLY FILTERS
    let filterInfo = { type: 'all', message: 'Showing all records' };

    if (year && month && day) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      
      filterInfo = {
        type: 'day',
        date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dateFormatted: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        day: date.toLocaleDateString('en-IN', { weekday: 'long' })
      };
    } else if (year && month && startDay && endDay) {
      const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(startDay));
      start.setHours(0, 0, 0, 0);
      const end = new Date(parseInt(year), parseInt(month) - 1, parseInt(endDay));
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      
      filterInfo = {
        type: 'dateRange',
        from: `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
        to: `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
        fromFormatted: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        toFormatted: end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        range: `Day ${startDay} to ${endDay} of ${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`
      };
    } else if (year && month) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      
      filterInfo = {
        type: 'month',
        month: parseInt(month),
        year: parseInt(year),
        monthName: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      };
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1);
      const end = new Date(parseInt(year), 11, 31, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
      
      filterInfo = {
        type: 'year',
        year: parseInt(year)
      };
    }

    // 4. GET RECORDS
    const records = await Attendance.find(query).sort({ date: -1 });

    // 5. CALCULATE STATS
    const stats = records.reduce((acc, r) => {
      acc.total++;
      if (r.status === 'present') {
        acc.present++;
        acc.totalHours += r.hoursWorked || 0;
        if (r.dayType === 'fullDay') acc.fullDays++;
        else if (r.dayType === 'halfDay') acc.halfDays++;
        else if (r.dayType === 'extraHours') acc.extraHours++;
      } else if (r.status === 'absent') acc.absent++;
      else if (r.status === 'leave') acc.leave++;
      return acc;
    }, { present: 0, absent: 0, leave: 0, total: 0, totalHours: 0, fullDays: 0, halfDays: 0, extraHours: 0 });

    // 6. GROUP BY MONTH
    const monthlyBreakdown = {};
    records.forEach(r => {
      const m = r.date.getMonth() + 1;
      const y = r.date.getFullYear();
      const key = `${y}-${String(m).padStart(2, '0')}`;
      
      if (!monthlyBreakdown[key]) {
        monthlyBreakdown[key] = {
          month: m, year: y,
          monthName: new Date(y, m - 1).toLocaleString('en-IN', { month: 'long' }),
          present: 0, absent: 0, leave: 0, total: 0, totalHours: 0,
          fullDays: 0, halfDays: 0, extraHours: 0
        };
      }
      
      monthlyBreakdown[key].total++;
      if (r.status === 'present') {
        monthlyBreakdown[key].present++;
        monthlyBreakdown[key].totalHours += r.hoursWorked || 0;
        if (r.dayType === 'fullDay') monthlyBreakdown[key].fullDays++;
        else if (r.dayType === 'halfDay') monthlyBreakdown[key].halfDays++;
        else if (r.dayType === 'extraHours') monthlyBreakdown[key].extraHours++;
      } else if (r.status === 'absent') monthlyBreakdown[key].absent++;
      else if (r.status === 'leave') monthlyBreakdown[key].leave++;
    });

    // 7. GROUP BY YEAR
    const yearlyBreakdown = {};
    records.forEach(r => {
      const y = r.date.getFullYear();
      if (!yearlyBreakdown[y]) {
        yearlyBreakdown[y] = {
          year: y, present: 0, absent: 0, leave: 0, total: 0,
          totalHours: 0, fullDays: 0, halfDays: 0, extraHours: 0
        };
      }
      yearlyBreakdown[y].total++;
      if (r.status === 'present') {
        yearlyBreakdown[y].present++;
        yearlyBreakdown[y].totalHours += r.hoursWorked || 0;
        if (r.dayType === 'fullDay') yearlyBreakdown[y].fullDays++;
        else if (r.dayType === 'halfDay') yearlyBreakdown[y].halfDays++;
        else if (r.dayType === 'extraHours') yearlyBreakdown[y].extraHours++;
      } else if (r.status === 'absent') yearlyBreakdown[y].absent++;
      else if (r.status === 'leave') yearlyBreakdown[y].leave++;
    });

    // 8. CALCULATE TRENDS
    const sortedMonths = Object.values(monthlyBreakdown).sort((a, b) => a.year - b.year || a.month - b.month);
    let bestMonth = null, worstMonth = null, totalPct = 0;
    
    sortedMonths.forEach(m => {
      const pct = m.total > 0 ? parseFloat(((m.present / m.total) * 100).toFixed(2)) : 0;
      m.percentage = pct;
      totalPct += pct;
      if (!bestMonth || pct > bestMonth.percentage) bestMonth = m;
      if (!worstMonth || pct < worstMonth.percentage) worstMonth = m;
    });

    const avgPct = sortedMonths.length > 0 ? parseFloat((totalPct / sortedMonths.length).toFixed(2)) : 0;

    // 9. RESPONSE
    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          role: employee.role,
          email: employee.email,
          mobile: employee.mobile,
          profileImage: employee.profileImage || null,
          department: employee.department || null,
          designation: employee.designation || null,
          joinDate: employee.joinDate || null,
          isActive: employee.isActive
        },
        filter: filterInfo,
        summary: {
          totalRecords: stats.total,
          present: stats.present,
          absent: stats.absent,
          leave: stats.leave,
          presentPercentage: stats.total > 0 ? parseFloat(((stats.present / stats.total) * 100).toFixed(2)) : 0,
          absentPercentage: stats.total > 0 ? parseFloat(((stats.absent / stats.total) * 100).toFixed(2)) : 0,
          leavePercentage: stats.total > 0 ? parseFloat(((stats.leave / stats.total) * 100).toFixed(2)) : 0,
          totalHoursWorked: stats.totalHours,
          averageHoursPerDay: stats.present > 0 ? parseFloat((stats.totalHours / stats.present).toFixed(2)) : 0,
          fullDays: stats.fullDays,
          halfDays: stats.halfDays,
          extraHours: stats.extraHours
        },
        yearlyBreakdown: Object.values(yearlyBreakdown).sort((a, b) => b.year - a.year),
        monthlyBreakdown: sortedMonths,
        dailyRecords: records.map(r => ({
          _id: r._id,
          date: r.date,
          dateFormatted: r.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          day: r.date.toLocaleDateString('en-IN', { weekday: 'long' }),
          status: r.status,
          dayType: r.dayType || null,
          hoursWorked: r.hoursWorked || null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })),
        trends: {
          bestMonth: bestMonth ? { month: bestMonth.monthName, year: bestMonth.year, percentage: bestMonth.percentage } : null,
          worstMonth: worstMonth ? { month: worstMonth.monthName, year: worstMonth.year, percentage: worstMonth.percentage } : null,
          averageMonthlyPercentage: avgPct,
          totalMonths: sortedMonths.length,
          consistency: avgPct >= 80 ? 'Excellent' : avgPct >= 70 ? 'Good' : avgPct >= 60 ? 'Average' : 'Needs Improvement'
        },
        pagination: { total: records.length, filtered: records.length }
      }
    });

  } catch (error) {
    console.error('Get complete employee attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};