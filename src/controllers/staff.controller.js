const Staff = require('../models/Staff');
const bcrypt = require('bcryptjs');

// @desc    Create new staff
// @route   POST /api/staff
// @access  Private
exports.createStaff = async (req, res) => {
  try {
    console.log('📝 Creating new staff:', req.body.employeeName);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password || 'Staff@123', salt);

    // Prepare staff data matching Flutter model
    const staffData = {
      employeeId: req.body.employeeId,
      employeeName: req.body.employeeName,
      role: req.body.role,
      mobile: req.body.mobile,
      email: req.body.email,
      joiningDate: req.body.joiningDate || new Date(),
      bloodGroup: req.body.bloodGroup || 'O+',
      password: hashedPassword,
      isActive: true,
      profileImage: req.body.profileImage || null,
      idCardImage: req.body.idCardImage || null,
      documents: req.body.documents || {}
    };

    // Create staff
    const staff = await Staff.create(staffData);

    // Remove password from response
    const staffResponse = staff.toObject();
    delete staffResponse.password;

    console.log('✅ Staff created successfully:', staff.employeeId);

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staffResponse
    });

  } catch (error) {
    console.error('❌ Create staff error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating staff'
    });
  }
};

// @desc    Get all staff (for dropdown/options)
// @route   GET /api/staff/options
// @access  Private
exports.getStaffOptions = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName role')
      .sort({ employeeName: 1 });

    const options = staff.map(s => ({
      id: s._id,
      staffId: s.employeeId,
      staffName: s.employeeName,
      role: s.role
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get staff options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all staff with pagination
// @route   GET /api/staff
// @access  Private
exports.getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
    if (status) {
      query.isActive = status === 'active';
    }

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single staff by ID
// @route   GET /api/staff/:id
// @access  Private
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).select('-password');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update staff
// @route   PUT /api/staff/:id
// @access  Private
exports.updateStaff = async (req, res) => {
  try {
    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });
  } catch (error) {
    console.error('Update staff error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
// @access  Private
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle staff status
// @route   PATCH /api/staff/:id/toggle-status
// @access  Private
exports.toggleStatus = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    staff.isActive = !staff.isActive;
    staff.lastActive = staff.isActive ? new Date() : null;
    await staff.save();

    const updatedStaff = await Staff.findById(req.params.id).select('-password');

    res.json({
      success: true,
      message: `Staff ${updatedStaff.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedStaff
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};