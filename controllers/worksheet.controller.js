


const Worksheet = require('../models/Worksheet');
const { Staff } = require('../models/Staff');

// ==================== CREATE WORKSHEET ====================
// @desc    Create new worksheet
// @route   POST /api/worksheets
const createWorksheet = async (req, res) => {
  try {
    console.log("📝 Creating new worksheet");
    console.log("req.body:", req.body);
    
    const { empId, employName, sheet, projects } = req.body;

    // Validate required fields
    if (!empId || !employName || !sheet) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, name, and sheet type are required'
      });
    }

    if (!projects || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one project assignment is required'
      });
    }

    // Validate each project
    for (const project of projects) {
      if (!project.projectName || !project.startDate || !project.endDate || !project.hours) {
        return res.status(400).json({
          success: false,
          message: 'Each project must have name, start date, end date, and hours'
        });
      }
      
      // Check if end date is after start date
      if (new Date(project.endDate) < new Date(project.startDate)) {
        return res.status(400).json({
          success: false,
          message: `End date must be after start date for project: ${project.projectName}`
        });
      }
    }

    const worksheet = new Worksheet({
      empId,
      employName,
      sheet,
      projects
    });

    await worksheet.save();

    res.status(201).json({
      success: true,
      message: 'Worksheet created successfully',
      data: worksheet
    });
  } catch (error) {
    console.error('Create worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating worksheet'
    });
  }
};

// ==================== GET ALL WORKSHEETS ====================
// @desc    Get all worksheets with pagination and filters
// @route   GET /api/worksheets
const getAllWorksheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sheet, project } = req.query;
    const query = {};

    // Search by employee ID or name
    if (search) {
      query.$or = [
        { empId: { $regex: search, $options: 'i' } },
        { employName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by sheet type
    if (sheet) {
      query.sheet = sheet;
    }

    // Filter by project name
    if (project) {
      query['projects.projectName'] = { $regex: project, $options: 'i' };
    }

    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

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
    console.error('Get worksheets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEET BY ID ====================
// @desc    Get worksheet by ID
// @route   GET /api/worksheets/:id
const getWorksheetById = async (req, res) => {
  try {
    const { id } = req.params;
    const worksheet = await Worksheet.findById(id);

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
    console.error('Get worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== UPDATE WORKSHEET ====================
// @desc    Update worksheet
// @route   PUT /api/worksheets/:id
const updateWorksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const worksheet = await Worksheet.findById(id);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Validate projects if present
    if (updateData.projects && updateData.projects.length > 0) {
      for (const project of updateData.projects) {
        if (project.projectName && (!project.startDate || !project.endDate || !project.hours)) {
          return res.status(400).json({
            success: false,
            message: 'Each project must have name, start date, end date, and hours'
          });
        }
        
        if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
          return res.status(400).json({
            success: false,
            message: `End date must be after start date for project: ${project.projectName}`
          });
        }
      }
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;

    const updatedWorksheet = await Worksheet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Worksheet updated successfully',
      data: updatedWorksheet
    });
  } catch (error) {
    console.error('Update worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== DELETE WORKSHEET ====================
// @desc    Delete worksheet
// @route   DELETE /api/worksheets/:id
const deleteWorksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const worksheet = await Worksheet.findByIdAndDelete(id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      message: 'Worksheet deleted successfully'
    });
  } catch (error) {
    console.error('Delete worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== STAFF OPTIONS ====================
// @desc    Get staff options for dropdown (active staff only)
// @route   GET /api/worksheets/staff-options
const getStaffOptions = async (req, res) => {
  try {
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
    console.error('Get staff options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PROJECT OPTIONS ====================
// @desc    Get unique project names from existing worksheets
// @route   GET /api/worksheets/project-options
const getProjectOptions = async (req, res) => {
  try {
    const projects = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { $group: { _id: '$projects.projectName' } },
      { $sort: { _id: 1 } }
    ]);

    const options = projects.map(p => ({
      id: p._id,
      projectName: p._id
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get project options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEETS BY EMPLOYEE ====================
// @desc    Get all worksheets for a specific employee
// @route   GET /api/worksheets/employee/:empId
const getWorksheetsByEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { empId: { $regex: empId, $options: 'i' } };
    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worksheets found for employee ID: ${empId}`
      });
    }

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
    console.error('Get worksheets by employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEETS BY PROJECT ====================
// @desc    Get all worksheets containing a specific project
// @route   GET /api/worksheets/project/:projectName
const getWorksheetsByProject = async (req, res) => {
  try {
    const { projectName } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { 'projects.projectName': { $regex: projectName, $options: 'i' } };
    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worksheets found for project: ${projectName}`
      });
    }

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
    console.error('Get worksheets by project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEET STATISTICS ====================
// @desc    Get worksheet statistics
// @route   GET /api/worksheets/stats
const getWorksheetStats = async (req, res) => {
  try {
    // Total worksheets
    const totalWorksheets = await Worksheet.countDocuments();
    
    // Worksheets by sheet type
    const sheetStats = await Worksheet.aggregate([
      { $group: { _id: '$sheet', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Total projects assigned
    const totalProjects = await Worksheet.aggregate([
      { $project: { projectCount: { $size: '$projects' } } },
      { $group: { _id: null, total: { $sum: '$projectCount' } } }
    ]);
    
    // Total hours across all projects
    const totalHours = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { $group: { _id: null, totalHours: { $sum: '$projects.hours' } } }
    ]);
    
    // Active employees (unique employees with worksheets)
    const activeEmployees = await Worksheet.distinct('empId');
    
    // Recent worksheets (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWorksheets = await Worksheet.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Worksheets by status (based on date ranges)
    const today = new Date();
    const activeProjects = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { 
        $match: { 
          'projects.endDate': { $gte: today }
        } 
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    // Upcoming deadlines (projects ending in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingDeadlines = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { 
        $match: { 
          'projects.endDate': { $gte: today, $lte: nextWeek }
        } 
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalWorksheets,
        sheetStats,
        totalProjects: totalProjects[0]?.total || 0,
        totalHours: totalHours[0]?.totalHours || 0,
        activeEmployees: activeEmployees.length,
        recentWorksheets,
        activeProjects: activeProjects[0]?.count || 0,
        upcomingDeadlines: upcomingDeadlines[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get worksheet stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== EXPORT WORKSHEETS ====================
// @desc    Export worksheets within date range
// @route   POST /api/worksheets/export
const exportWorksheets = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const worksheets = await Worksheet.find({
      'projects.startDate': { $lte: end },
      'projects.endDate': { $gte: start }
    });

    const exportData = [];
    worksheets.forEach(worksheet => {
      worksheet.projects.forEach(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        
        if (projectStart <= end && projectEnd >= start) {
          exportData.push({
            EmployeeID: worksheet.empId,
            Name: worksheet.employName,
            Sheet: worksheet.sheet,
            Project: project.projectName,
            Start: project.startDate,
            End: project.endDate,
            Hours: project.hours,
            Shift: project.shift,
            Comment: project.comment || ''
          });
        }
      });
    });

    res.json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createWorksheet,
  getAllWorksheets,
  getWorksheetById,
  updateWorksheet,
  deleteWorksheet,
  getStaffOptions,
  getProjectOptions,
  getWorksheetsByEmployee,
  getWorksheetsByProject,
  getWorksheetStats,
  exportWorksheets
};