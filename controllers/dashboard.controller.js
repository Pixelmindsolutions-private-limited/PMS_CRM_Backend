const Project = require('../models/Project');
const Staff = require('../models/Staff');

// @desc    Get dashboard counts and statistics
// @route   GET /api/dashboard/counts
// @access  Private
exports.getCounts = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard counts...');

    // Get total projects
    const totalProjects = await Project.countDocuments();

    // Get category counts
    const categoryCounts = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format category counts
    const categoryCountsMap = {};
    categoryCounts.forEach(item => {
      categoryCountsMap[item._id] = item.count;
    });

    // Get staff count
    const staffCount = await Staff.countDocuments({ isActive: true });

    // Get project status counts
    const statusCounts = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCountsMap = {};
    statusCounts.forEach(item => {
      statusCountsMap[item._id] = item.count;
    });

    // Get upcoming deadlines (projects with deadline in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = await Project.countDocuments({
      status: 'active',
      deadlineDate: { 
        $gte: new Date(),
        $lte: thirtyDaysFromNow 
      }
    });

    res.json({
      success: true,
      totalProjects,
      categoryCounts: {
        'mobile app': categoryCountsMap['mobile app'] || 0,
        'website': categoryCountsMap['website'] || 0,
        'digital market': categoryCountsMap['digital market'] || 0,
        'software': categoryCountsMap['software'] || 0
      },
      statusCounts: statusCountsMap,
      staffCount,
      upcomingDeadlines
    });

  } catch (error) {
    console.error('❌ Get counts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all projects for dashboard
// @route   GET /api/dashboard/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    console.log('📋 Fetching projects for dashboard...');

    const projects = await Project.find()
      .select('projectId projectName clientName status deadlineDate')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate days remaining for each project
    const projectsWithDaysRemaining = projects.map(project => {
      const projectObj = project.toObject();
      
      if (project.deadlineDate) {
        const today = new Date();
        const deadline = new Date(project.deadlineDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        projectObj.daysRemaining = diffDays;
      } else {
        projectObj.daysRemaining = null;
      }
      
      return projectObj;
    });

    res.json({
      success: true,
      data: projectsWithDaysRemaining,
      count: projects.length
    });

  } catch (error) {
    console.error('❌ Get projects error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all staff for dashboard
// @route   GET /api/dashboard/staff
// @access  Private
exports.getStaff = async (req, res) => {
  try {
    console.log('👥 Fetching staff for dashboard...');

    const staff = await Staff.find({ isActive: true })
      .select('staffId staffName role profileImage')
      .limit(10);

    res.json({
      success: true,
      count: staff.length,
      total: await Staff.countDocuments(),
      data: staff
    });

  } catch (error) {
    console.error('❌ Get staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get upcoming deadlines
// @route   GET /api/dashboard/deadlines
// @access  Private
exports.getDeadlines = async (req, res) => {
  try {
    console.log('⏰ Fetching upcoming deadlines...');

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const projects = await Project.find({
      status: 'active',
      deadlineDate: { 
        $gte: today,
        $lte: thirtyDaysFromNow 
      }
    })
    .select('projectId projectName clientName deadlineDate status')
    .sort({ deadlineDate: 1 })
    .limit(10);

    // Calculate days remaining and format for frontend
    const deadlines = projects.map(project => {
      const deadline = new Date(project.deadlineDate);
      const diffTime = deadline - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: project._id,
        projectId: project.projectId,
        name: project.projectName,
        clientName: project.clientName,
        deadline: project.deadlineDate,
        daysRemaining,
        status: project.status
      };
    });

    res.json({
      success: true,
      data: deadlines,
      count: deadlines.length
    });

  } catch (error) {
    console.error('❌ Get deadlines error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard statistics for chart
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    console.log('📈 Fetching dashboard statistics...');

    // Get counts for different categories
    const totalProjects = await Project.countDocuments();
    
    const categoryCounts = await Project.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const apps = categoryCounts.find(c => c._id === 'mobile app')?.count || 0;
    const websites = categoryCounts.find(c => c._id === 'website')?.count || 0;
    const marketing = categoryCounts.find(c => c._id === 'digital market')?.count || 0;
    
    const staffCount = await Staff.countDocuments({ isActive: true });

    // Format for chart (matching your StatItem structure)
    const stats = [
      {
        label: 'Projects',
        count: totalProjects,
        color: '#009788'
      },
      {
        label: 'Apps',
        count: apps,
        color: '#4CAF50'
      },
      {
        label: 'Websites',
        count: websites,
        color: '#FFC107'
      },
      {
        label: 'Marketing',
        count: marketing,
        color: '#E91E63'
      },
      {
        label: 'Staff',
        count: staffCount,
        color: '#9C27B0'
      }
    ];

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get complete dashboard data (all in one)
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
  try {
    console.log('📊 Fetching complete dashboard data...');

    // Run all queries in parallel for better performance
    const [
      totalProjects,
      categoryCounts,
      staffCount,
      recentProjects,
      upcomingDeadlines
    ] = await Promise.all([
      Project.countDocuments(),
      Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Staff.countDocuments({ isActive: true }),
      Project.find()
        .select('projectId projectName clientName status deadlineDate')
        .sort({ createdAt: -1 })
        .limit(6),
      Project.find({
        status: 'active',
        deadlineDate: { 
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
        .select('projectId projectName clientName deadlineDate')
        .sort({ deadlineDate: 1 })
        .limit(5)
    ]);

    // Format category counts
    const categoryCountsMap = {};
    categoryCounts.forEach(item => {
      categoryCountsMap[item._id] = item.count;
    });

    // Format stats for chart
    const stats = [
      {
        label: 'Projects',
        count: totalProjects,
        color: '#009788'
      },
      {
        label: 'Apps',
        count: categoryCountsMap['mobile app'] || 0,
        color: '#4CAF50'
      },
      {
        label: 'Websites',
        count: categoryCountsMap['website'] || 0,
        color: '#FFC107'
      },
      {
        label: 'Marketing',
        count: categoryCountsMap['digital market'] || 0,
        color: '#E91E63'
      },
      {
        label: 'Staff',
        count: staffCount,
        color: '#9C27B0'
      }
    ];

    // Format projects with days remaining
    const projects = recentProjects.map(project => {
      const projectObj = project.toObject();
      if (project.deadlineDate) {
        const today = new Date();
        const deadline = new Date(project.deadlineDate);
        const diffTime = deadline - today;
        projectObj.daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      return projectObj;
    });

    // Format deadlines
    const deadlines = upcomingDeadlines.map(project => {
      const deadline = new Date(project.deadlineDate);
      const today = new Date();
      const diffTime = deadline - today;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: project._id,
        projectId: project.projectId,
        name: project.projectName,
        clientName: project.clientName,
        deadline: project.deadlineDate,
        daysRemaining
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        projects,
        deadlines,
        counts: {
          totalProjects,
          apps: categoryCountsMap['mobile app'] || 0,
          websites: categoryCountsMap['website'] || 0,
          marketing: categoryCountsMap['digital market'] || 0,
          staff: staffCount,
          upcomingDeadlines: deadlines.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Get dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};