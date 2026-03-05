const Project = require('../models/Project');
const Staff = require('../models/Staff');

// @desc    Get dashboard counts
// @route   GET /api/counts
// @access  Private
exports.getCounts = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    
    const categoryCounts = await Project.aggregate([
      {
        $group: {
          _id: '$selectcategory',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {};
    categoryCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json({
      success: true,
      totalProjects,
      categoryCounts: counts
    });
  } catch (error) {
    console.error('Get counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all projects (for dashboard)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .select('projectid projectname clientname status deadlineDate')
      .sort('-createdAt');

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all staff (for dashboard)
// @route   GET /api/get_all_staffs
// @access  Private
exports.getAllStaffs = async (req, res) => {
  try {
    const staff = await Staff.find().select('staffId staffName role isActive');
    
    res.json({
      success: true,
      count: staff.length,
      total: staff.length,
      page: 1,
      pages: 1,
      data: staff
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};