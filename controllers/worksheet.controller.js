const Worksheet = require('../models/Worksheet');
const Staff = require('../models/Staff');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Get staff options for dropdown
// @route   GET /api/worksheets/staff-options
// @access  Private
exports.getStaffOptions = async (req, res) => {
  try {
    console.log('👥 Fetching staff options for worksheets...');

    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName')
      .sort({ employeeName: 1 });

    const options = staff.map(s => ({
      id: s._id,
      staffId: s.employeeId,
      staffName: s.employeeName
    }));

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

// @desc    Get project options for dropdown
// @route   GET /api/worksheets/project-options
// @access  Private
exports.getProjectOptions = async (req, res) => {
  try {
    console.log('📋 Fetching project options for worksheets...');

    const projects = await Project.find({ status: 'active' })
      .select('projectName')
      .sort({ projectName: 1 });

    const options = projects.map(p => ({
      id: p._id,
      projectName: p.projectName
    }));

    res.json({
      success: true,
      data: options
    });

  } catch (error) {
    console.error('❌ Get project options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new worksheet
// @route   POST /api/worksheets
// @access  Private
exports.createWorksheet = async (req, res) => {
  try {
    console.log('📝 Creating worksheet for employee:', req.body.employName);

    const { empId, employName, sheet, projects } = req.body;

    // Validate projects
    if (!projects || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one project assignment is required'
      });
    }

    // Validate each project
    for (let project of projects) {
      if (!project.projectName || !project.startDate || !project.endDate || !project.hours) {
        return res.status(400).json({
          success: false,
          message: 'All project fields are required'
        });
      }
    }

    const worksheet = await Worksheet.create({
      empId,
      employName,
      sheet,
      projects
    });

    console.log('✅ Worksheet created successfully');

    res.status(201).json({
      success: true,
      message: 'Worksheet created successfully!',
      data: worksheet
    });

  } catch (error) {
    console.error('❌ Create worksheet error:', error);

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
      message: error.message || 'Failed to create worksheet'
    });
  }
};

// @desc    Get all worksheets
// @route   GET /api/worksheets
// @access  Private
exports.getAllWorksheets = async (req, res) => {
  try {
    console.log('📋 Fetching all worksheets...');

    const { page = 1, limit = 10, search, sheet, project } = req.query;
    const query = {};

    // Search by employee name or ID
    if (search) {
      query.$or = [
        { employName: { $regex: search, $options: 'i' } },
        { empId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by sheet type
    if (sheet) {
      query.sheet = sheet;
    }

    // Filter by project name (search in projects array)
    if (project) {
      query['projects.projectName'] = { $regex: project, $options: 'i' };
    }

    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    console.log(`✅ Found ${worksheets.length} worksheets`);

    res.json({
      success: true,
      data: worksheets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Get all worksheets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single worksheet by ID
// @route   GET /api/worksheets/:id
// @access  Private
exports.getWorksheetById = async (req, res) => {
  try {
    console.log('🔍 Fetching worksheet with ID:', req.params.id);

    const worksheet = await Worksheet.findById(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      data: worksheet
    });

  } catch (error) {
    console.error('❌ Get worksheet by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid worksheet ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update worksheet
// @route   PUT /api/worksheets/:id
// @access  Private
exports.updateWorksheet = async (req, res) => {
  try {
    console.log('✏️ Updating worksheet ID:', req.params.id);

    const { empId, employName, sheet, projects } = req.body;

    // Validate projects
    if (!projects || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one project assignment is required'
      });
    }

    const worksheet = await Worksheet.findByIdAndUpdate(
      req.params.id,
      {
        empId,
        employName,
        sheet,
        projects
      },
      { new: true, runValidators: true }
    );

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    console.log('✅ Worksheet updated successfully');

    res.json({
      success: true,
      message: 'Worksheet updated successfully!',
      data: worksheet
    });

  } catch (error) {
    console.error('❌ Update worksheet error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid worksheet ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete worksheet
// @route   DELETE /api/worksheets/:id
// @access  Private
exports.deleteWorksheet = async (req, res) => {
  try {
    console.log('🗑️ Deleting worksheet ID:', req.params.id);

    const worksheet = await Worksheet.findByIdAndDelete(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    console.log('✅ Worksheet deleted successfully');

    res.json({
      success: true,
      message: 'Worksheet deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete worksheet error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid worksheet ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get worksheets by employee
// @route   GET /api/worksheets/employee/:empId
// @access  Private
exports.getWorksheetsByEmployee = async (req, res) => {
  try {
    console.log(`📋 Fetching worksheets for employee: ${req.params.empId}`);

    const worksheets = await Worksheet.find({ empId: req.params.empId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: worksheets
    });

  } catch (error) {
    console.error('❌ Get worksheets by employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get worksheets by project
// @route   GET /api/worksheets/project/:projectName
// @access  Private
exports.getWorksheetsByProject = async (req, res) => {
  try {
    console.log(`📋 Fetching worksheets for project: ${req.params.projectName}`);

    const worksheets = await Worksheet.find({
      'projects.projectName': req.params.projectName
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: worksheets
    });

  } catch (error) {
    console.error('❌ Get worksheets by project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get worksheet statistics
// @route   GET /api/worksheets/stats
// @access  Private
exports.getWorksheetStats = async (req, res) => {
  try {
    console.log('📊 Fetching worksheet statistics...');

    const totalWorksheets = await Worksheet.countDocuments();
    
    const sheetDistribution = await Worksheet.aggregate([
      { $group: { _id: '$sheet', count: { $sum: 1 } } }
    ]);

    const employeeWorkload = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { $group: { 
        _id: { empId: '$empId', name: '$employName' },
        totalProjects: { $sum: 1 },
        totalHours: { $sum: { $toInt: '$projects.hours' } }
      }},
      { $sort: { totalProjects: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalWorksheets,
        sheetDistribution,
        employeeWorkload
      }
    });

  } catch (error) {
    console.error('❌ Get worksheet stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};