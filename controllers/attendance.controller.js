const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');

// @desc    Get all staff options for attendance dropdown
// @route   GET /api/attendance/staff-options
// @access  Private
exports.getStaffOptions = async (req, res) => {
  try {
    console.log('👥 Fetching staff options for attendance...');

    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName role')
      .sort({ staffName: 1 });

    const options = staff.map(s => {
      // Log each staff to debug
      console.log('Processing staff:', {
        id: s._id,
        staffId: s.employeeId,
        employeeId: s.employeeId,
        staffName: s.employeeName,
        role: s.role
      });

      return {
        id: s._id,
        staffId: s.staffId || s.employeeId || '', // Use staffId or employeeId as fallback
        staffName: s.employeeName || '', // This is the correct field name
        role: s.role || ''
      };
    });

    console.log("jjjjjjjjjjjjjjjjjjjjjjjjj",options)

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('❌ Get staff options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new attendance
// @route   POST /api/attendance
// @access  Private
exports.createAttendance = async (req, res) => {
  try {
    console.log('📝 Creating attendance for staff:', req.body.name);

    const { staffId, name, date, status, dayType, hoursWorked } = req.body;

    // Check if attendance already exists for this staff on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      staffId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this staff on this date'
      });
    }

    // Validate hours based on day type
    if (status === 'present') {
      if (dayType === 'halfDay' && (hoursWorked <= 0 || hoursWorked > 4)) {
        return res.status(400).json({
          success: false,
          message: 'Hours must be between 1 and 4 for half day'
        });
      }
      if (dayType === 'extraHours' && hoursWorked <= 8) {
        return res.status(400).json({
          success: false,
          message: 'Extra hours must be greater than 8'
        });
      }
    }

    const attendance = await Attendance.create({
      staffId,
      name,
      date: startOfDay,
      status,
      dayType: status === 'present' ? dayType : undefined,
      hoursWorked: status === 'present' ? 
        (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
    });

    console.log('✅ Attendance created successfully');

    res.status(201).json({
      success: true,
      message: 'Attendance submitted successfully!',
      data: attendance
    });

  } catch (error) {
    console.error('❌ Create attendance error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate attendance record for this date'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit attendance'
    });
  }
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
exports.getAllAttendance = async (req, res) => {
  try {
    console.log('📋 Fetching all attendance records...');

    const { month, year, staffId } = req.query;
    const query = {};

    // Filter by month/year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Filter by staff
    if (staffId) {
      query.staffId = staffId;
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 });

    console.log(`✅ Found ${attendance.length} attendance records`);

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error('❌ Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance by staff ID
// @route   GET /api/attendance/staff/:staffId
// @access  Private
exports.getAttendanceByStaff = async (req, res) => {
  try {
    console.log(`🔍 Fetching attendance for staff: ${req.params.staffId}`);

    const { month, year } = req.query;
    const query = { staffId: req.params.staffId };

    // Filter by month/year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      leave: attendance.filter(a => a.status === 'leave').length,
      total: attendance.length
    };

    res.json({
      success: true,
      data: attendance,
      stats
    });

  } catch (error) {
    console.error('❌ Get attendance by staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
exports.getAttendanceStats = async (req, res) => {
  try {
    console.log('📊 Fetching attendance statistics...');

    const { month, year } = req.query;
    const query = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Aggregate by staff
    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$staffId',
          name: { $first: '$name' },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          leave: {
            $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Overall statistics
    const overall = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStaff: stats,
        overall: overall[0] || { present: 0, absent: 0, leave: 0, total: 0 }
      }
    });

  } catch (error) {
    console.error('❌ Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private
exports.updateAttendance = async (req, res) => {
  try {
    console.log('✏️ Updating attendance ID:', req.params.id);

    const { status, dayType, hoursWorked } = req.body;

    // Validate hours based on day type
    if (status === 'present') {
      if (dayType === 'halfDay' && (hoursWorked <= 0 || hoursWorked > 4)) {
        return res.status(400).json({
          success: false,
          message: 'Hours must be between 1 and 4 for half day'
        });
      }
      if (dayType === 'extraHours' && hoursWorked <= 8) {
        return res.status(400).json({
          success: false,
          message: 'Extra hours must be greater than 8'
        });
      }
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        status,
        dayType: status === 'present' ? dayType : undefined,
        hoursWorked: status === 'present' ? 
          (dayType === 'fullDay' ? 8 : hoursWorked) : undefined
      },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    console.log('✅ Attendance updated successfully');

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });

  } catch (error) {
    console.error('❌ Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete attendance
// @route   DELETE /api/attendance/:id
// @access  Private
exports.deleteAttendance = async (req, res) => {
  try {
    console.log('🗑️ Deleting attendance ID:', req.params.id);

    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    console.log('✅ Attendance deleted successfully');

    res.json({
      success: true,
      message: 'Attendance deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete attendance error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk create attendance (for multiple staff on same date)
// @route   POST /api/attendance/bulk
// @access  Private
exports.bulkCreateAttendance = async (req, res) => {
  try {
    console.log('📦 Bulk creating attendance records...');

    const { date, records } = req.body;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const attendanceRecords = records.map(record => ({
      ...record,
      date: startOfDay
    }));

    // Use insertMany with ordered: false to continue even if some fail
    const result = await Attendance.insertMany(attendanceRecords, { 
      ordered: false,
      rawResult: true 
    });

    console.log(`✅ Created ${result.insertedCount} attendance records`);

    res.status(201).json({
      success: true,
      message: `Created ${result.insertedCount} attendance records`,
      data: {
        inserted: result.insertedCount,
        failed: records.length - result.insertedCount
      }
    });

  } catch (error) {
    console.error('❌ Bulk create attendance error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};