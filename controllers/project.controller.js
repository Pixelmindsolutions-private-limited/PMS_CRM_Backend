const Project = require('../models/Project');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    console.log('📝 Creating new project:', req.body.projectName);

    // Generate project ID if not provided
    if (!req.body.projectId) {
      const count = await Project.countDocuments();
      const year = new Date().getFullYear().toString().slice(-2);
      req.body.projectId = `PRJ${year}${String(count + 1).padStart(4, '0')}`;
    }

    const project = await Project.create(req.body);

    console.log('✅ Project created successfully:', project.projectId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });

  } catch (error) {
    console.error('❌ Create project error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

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
      message: error.message || 'Server error while creating project'
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category.toLowerCase();
    }

    // Filter by status
    if (status) {
      query.status = status.toLowerCase();
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    console.log(`✅ Found ${projects.length} projects`);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
  try {
    console.log('🔍 Fetching project with ID:', req.params.id);

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('✅ Project found:', project.projectName);

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('❌ Get project by ID error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    console.log('✏️ Updating project with ID:', req.params.id);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('✅ Project updated successfully:', project.projectName);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error('❌ Update project error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists.`
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    console.log('🗑️ Deleting project with ID:', req.params.id);

    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    console.log('✅ Project deleted successfully:', project.projectName);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete project error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get project options for dropdown
// @route   GET /api/projects/options
// @access  Private
exports.getProjectOptions = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' })
      .select('projectId projectName')
      .sort({ projectName: 1 });

    const options = projects.map(p => ({
      id: p._id,
      projectName: p.projectName
    }));

    console.log(`✅ Found ${options.length} project options`);

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

// @desc    Add milestone payment
// @route   POST /api/projects/:id/milestones
// @access  Private
exports.addMilestonePayment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.milestonePayments) {
      project.milestonePayments = [];
    }

    project.milestonePayments.push(req.body);
    await project.save();

    console.log('✅ Milestone payment added to project:', project.projectName);

    res.json({
      success: true,
      message: 'Milestone payment added successfully',
      data: project
    });

  } catch (error) {
    console.error('❌ Add milestone payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update milestone payment
// @route   PUT /api/projects/:projectId/milestones/:milestoneId
// @access  Private
exports.updateMilestonePayment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const milestone = project.milestonePayments.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone payment not found'
      });
    }

    Object.assign(milestone, req.body);
    await project.save();

    console.log('✅ Milestone payment updated');

    res.json({
      success: true,
      message: 'Milestone payment updated successfully',
      data: project
    });

  } catch (error) {
    console.error('❌ Update milestone payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete milestone payment
// @route   DELETE /api/projects/:projectId/milestones/:milestoneId
// @access  Private
exports.deleteMilestonePayment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.milestonePayments = project.milestonePayments.filter(
      m => m._id.toString() !== req.params.milestoneId
    );
    await project.save();

    console.log('✅ Milestone payment deleted');

    res.json({
      success: true,
      message: 'Milestone payment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete milestone payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add budget installment
// @route   POST /api/projects/:id/budget
// @access  Private
exports.addBudgetInstallment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.budgetInstallments) {
      project.budgetInstallments = [];
    }

    project.budgetInstallments.push(req.body);
    await project.save();

    console.log('✅ Budget installment added');

    res.json({
      success: true,
      message: 'Budget installment added successfully',
      data: project
    });

  } catch (error) {
    console.error('❌ Add budget installment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete budget installment
// @route   DELETE /api/projects/:projectId/budget/:installmentId
// @access  Private
exports.deleteBudgetInstallment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.budgetInstallments = project.budgetInstallments.filter(
      i => i._id.toString() !== req.params.installmentId
    );
    await project.save();

    console.log('✅ Budget installment deleted');

    res.json({
      success: true,
      message: 'Budget installment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete budget installment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const total = await Project.countDocuments();
    const active = await Project.countDocuments({ status: 'active' });
    const completed = await Project.countDocuments({ status: 'completed' });
    const onHold = await Project.countDocuments({ status: 'on hold' });
    const cancelled = await Project.countDocuments({ status: 'cancelled' });

    const categoryDistribution = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const totalBudget = await Project.aggregate([
      { $group: { _id: null, total: { $sum: '$projectCost' } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        onHold,
        cancelled,
        categoryDistribution,
        totalBudget: totalBudget[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('❌ Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};