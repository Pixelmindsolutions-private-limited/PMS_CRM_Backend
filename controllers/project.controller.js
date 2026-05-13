// const Project = require('../models/Project');

// // @desc    Create new project
// // @route   POST /api/projects
// // @access  Private
// exports.createProject = async (req, res) => {
//   try {
//     console.log('📝 Creating new project:', req.body.projectName);

//     // Generate project ID if not provided
//     if (!req.body.projectId) {
//       const count = await Project.countDocuments();
//       const year = new Date().getFullYear().toString().slice(-2);
//       req.body.projectId = `PRJ${year}${String(count + 1).padStart(4, '0')}`;
//     }

//     const project = await Project.create(req.body);

//     console.log('✅ Project created successfully:', project.projectId);

//     res.status(201).json({
//       success: true,
//       message: 'Project created successfully',
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Create project error:', error);

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({
//         success: false,
//         message: `${field} already exists. Please use a different value.`
//       });
//     }

//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation error',
//         errors: errors
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message || 'Server error while creating project'
//     });
//   }
// };

// // @desc    Get all projects
// // @route   GET /api/projects
// // @access  Private
// exports.getAllProjects = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, category, status } = req.query;
//     const query = {};

//     // Search functionality
//     if (search) {
//       query.$or = [
//         { projectName: { $regex: search, $options: 'i' } },
//         { clientName: { $regex: search, $options: 'i' } },
//         { projectId: { $regex: search, $options: 'i' } },
//         { clientEmail: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Filter by category
//     if (category) {
//       query.category = category.toLowerCase();
//     }

//     // Filter by status
//     if (status) {
//       query.status = status.toLowerCase();
//     }

//     const total = await Project.countDocuments(query);
//     const projects = await Project.find(query)
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit));

//     console.log(`✅ Found ${projects.length} projects`);

//     res.json({
//       success: true,
//       data: projects,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get all projects error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get single project by ID
// // @route   GET /api/projects/:id
// // @access  Private
// exports.getProjectById = async (req, res) => {
//   try {
//     console.log('🔍 Fetching project with ID:', req.params.id);

//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     console.log('✅ Project found:', project.projectName);

//     res.json({
//       success: true,
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Get project by ID error:', error);

//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid project ID format'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Update project
// // @route   PUT /api/projects/:id
// // @access  Private
// exports.updateProject = async (req, res) => {
//   try {
//     console.log('✏️ Updating project with ID:', req.params.id);

//     const project = await Project.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     console.log('✅ Project updated successfully:', project.projectName);

//     res.json({
//       success: true,
//       message: 'Project updated successfully',
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Update project error:', error);

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({
//         success: false,
//         message: `${field} already exists.`
//       });
//     }

//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid project ID format'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Delete project
// // @route   DELETE /api/projects/:id
// // @access  Private
// exports.deleteProject = async (req, res) => {
//   try {
//     console.log('🗑️ Deleting project with ID:', req.params.id);

//     const project = await Project.findByIdAndDelete(req.params.id);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     console.log('✅ Project deleted successfully:', project.projectName);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });

//   } catch (error) {
//     console.error('❌ Delete project error:', error);

//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid project ID format'
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get project options for dropdown
// // @route   GET /api/projects/options
// // @access  Private
// exports.getProjectOptions = async (req, res) => {
//   try {
//     const projects = await Project.find({ status: 'active' })
//       .select('projectId projectName')
//       .sort({ projectName: 1 });

//     const options = projects.map(p => ({
//       id: p._id,
//       projectName: p.projectName
//     }));

//     console.log(`✅ Found ${options.length} project options`);

//     res.json({
//       success: true,
//       data: options
//     });

//   } catch (error) {
//     console.error('❌ Get project options error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Add milestone payment
// // @route   POST /api/projects/:id/milestones
// // @access  Private
// exports.addMilestonePayment = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.milestonePayments) {
//       project.milestonePayments = [];
//     }

//     project.milestonePayments.push(req.body);
//     await project.save();

//     console.log('✅ Milestone payment added to project:', project.projectName);

//     res.json({
//       success: true,
//       message: 'Milestone payment added successfully',
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Add milestone payment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Update milestone payment
// // @route   PUT /api/projects/:projectId/milestones/:milestoneId
// // @access  Private
// exports.updateMilestonePayment = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.projectId);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     const milestone = project.milestonePayments.id(req.params.milestoneId);
//     if (!milestone) {
//       return res.status(404).json({
//         success: false,
//         message: 'Milestone payment not found'
//       });
//     }

//     Object.assign(milestone, req.body);
//     await project.save();

//     console.log('✅ Milestone payment updated');

//     res.json({
//       success: true,
//       message: 'Milestone payment updated successfully',
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Update milestone payment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Delete milestone payment
// // @route   DELETE /api/projects/:projectId/milestones/:milestoneId
// // @access  Private
// exports.deleteMilestonePayment = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.projectId);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     project.milestonePayments = project.milestonePayments.filter(
//       m => m._id.toString() !== req.params.milestoneId
//     );
//     await project.save();

//     console.log('✅ Milestone payment deleted');

//     res.json({
//       success: true,
//       message: 'Milestone payment deleted successfully'
//     });

//   } catch (error) {
//     console.error('❌ Delete milestone payment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Add budget installment
// // @route   POST /api/projects/:id/budget
// // @access  Private
// exports.addBudgetInstallment = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.id);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.budgetInstallments) {
//       project.budgetInstallments = [];
//     }

//     project.budgetInstallments.push(req.body);
//     await project.save();

//     console.log('✅ Budget installment added');

//     res.json({
//       success: true,
//       message: 'Budget installment added successfully',
//       data: project
//     });

//   } catch (error) {
//     console.error('❌ Add budget installment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Delete budget installment
// // @route   DELETE /api/projects/:projectId/budget/:installmentId
// // @access  Private
// exports.deleteBudgetInstallment = async (req, res) => {
//   try {
//     const project = await Project.findById(req.params.projectId);

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     project.budgetInstallments = project.budgetInstallments.filter(
//       i => i._id.toString() !== req.params.installmentId
//     );
//     await project.save();

//     console.log('✅ Budget installment deleted');

//     res.json({
//       success: true,
//       message: 'Budget installment deleted successfully'
//     });

//   } catch (error) {
//     console.error('❌ Delete budget installment error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // @desc    Get project statistics
// // @route   GET /api/projects/stats
// // @access  Private
// exports.getProjectStats = async (req, res) => {
//   try {
//     const total = await Project.countDocuments();
//     const active = await Project.countDocuments({ status: 'active' });
//     const completed = await Project.countDocuments({ status: 'completed' });
//     const onHold = await Project.countDocuments({ status: 'on hold' });
//     const cancelled = await Project.countDocuments({ status: 'cancelled' });

//     const categoryDistribution = await Project.aggregate([
//       { $group: { _id: '$category', count: { $sum: 1 } } }
//     ]);

//     const totalBudget = await Project.aggregate([
//       { $group: { _id: null, total: { $sum: '$projectCost' } } }
//     ]);

//     res.json({
//       success: true,
//       data: {
//         total,
//         active,
//         completed,
//         onHold,
//         cancelled,
//         categoryDistribution,
//         totalBudget: totalBudget[0]?.total || 0
//       }
//     });

//   } catch (error) {
//     console.error('❌ Get project stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


const Project = require('../Models/Project.js');


const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// ==================== PROJECT CRUD OPERATIONS ====================

// @desc    Create new project
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    console.log("📝 Creating new project");
    console.log("req.body:", req.body);

    const {
      projectId,  // This will be undefined if not sent
      projectName,
      clientName,
      clientMobile,
      clientEmail,
      clientAddress,
      category,
      startDate,
      projectHandoverDate,
      deadlineDate,
      duration,
      projectCost,
      milestone,
      status,
      appDetails,
      marketing,
      budgetInstallments,
      milestonePayments,
      teamMembers
    } = req.body;

    // Validate required fields
    if (!projectName || !clientName) {
      return res.status(400).json({
        success: false,
        message: 'Project name and client name are required'
      });
    }

    // Check if project name already exists
    const existingProjectName = await Project.findOne({ projectName });
    if (existingProjectName) {
      return res.status(400).json({
        success: false,
        message: 'Project name already exists'
      });
    }

    // ✅ Only check projectId if it's provided (not undefined or empty string)
    if (projectId && projectId.trim() !== '') {
      const existingProject = await Project.findOne({ projectId });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: 'Project ID already exists. Please use a different ID or leave blank for auto-generation.'
        });
      }
    }

    // Prepare project data
    const projectData = {
      // ✅ Only include projectId if it's provided and not empty
      ...(projectId && projectId.trim() !== '' && { projectId: projectId.trim() }),
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      clientMobile: clientMobile || '',
      clientEmail: clientEmail || '',
      clientAddress: clientAddress || '',
      category: category || 'website',
      startDate: startDate || null,
      projectHandoverDate: projectHandoverDate || null,
      deadlineDate: deadlineDate || null,
      duration: duration || '',
      projectCost: projectCost ? Number(projectCost) : 0,
      milestone: milestone ? Number(milestone) : 0,
      status: status || 'active',
      appDetails: appDetails || { appId: '', appName: '', timeline: {} },
      marketing: marketing || { reels: { enabled: false }, posters: { enabled: false }, seo: false, keywords: false, banners: false },
      budgetInstallments: budgetInstallments || [],
      milestonePayments: milestonePayments || [],
      teamMembers: teamMembers || { frontend: [], backend: [], designer: [], tester: [], manager: [] }
    };

    console.log("📦 Creating project with data:", JSON.stringify(projectData, null, 2));

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Project ID already exists. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating project'
    });
  }
};
// @desc    Get all projects with pagination and filters
// @route   GET /api/projects
const getAllProjects = async (req, res) => {
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
      query.category = category;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

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
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Convert string numbers to actual numbers
    if (updateData.projectCost) updateData.projectCost = Number(updateData.projectCost);
    if (updateData.milestone) updateData.milestone = Number(updateData.milestone);

    // Handle nested objects - merge instead of replace
    if (updateData.teamMembers) {
      updateData.teamMembers = {
        frontend: updateData.teamMembers.frontend || [],
        backend: updateData.teamMembers.backend || [],
        designer: updateData.teamMembers.designer || [],
        tester: updateData.teamMembers.tester || [],
        manager: updateData.teamMembers.manager || []
      };
    }

    if (updateData.milestonePayments) {
      updateData.milestonePayments = updateData.milestonePayments.map(payment => ({
        ...payment,
        amount: Number(payment.amount)
      }));
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.projectId; // Don't allow projectId to be changed

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log("✅ Project updated:", updatedProject.projectName);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value'
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
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== MILESTONE PAYMENT OPERATIONS ====================

// @desc    Add milestone payment to project
// @route   POST /api/projects/:id/milestones
const addMilestonePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, paid, paymentMode, paymentDate } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const newMilestone = {
      description: description || `Milestone ${project.milestonePayments.length + 1}`,
      amount: Number(amount),
      paid: paid || false,
      paymentMode: paymentMode || 'cash',
      paymentDate: paymentDate || null
    };

    project.milestonePayments.push(newMilestone);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Milestone payment added successfully',
      data: project.milestonePayments
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update milestone payment
// @route   PUT /api/projects/:projectId/milestones/:milestoneId
const updateMilestonePayment = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;
    const updateData = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const milestone = project.milestonePayments.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone payment not found'
      });
    }

    if (updateData.amount) updateData.amount = Number(updateData.amount);
    
    Object.keys(updateData).forEach(key => {
      if (key !== '_id') {
        milestone[key] = updateData[key];
      }
    });

    await project.save();

    res.json({
      success: true,
      message: 'Milestone payment updated successfully',
      data: project.milestonePayments
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete milestone payment
// @route   DELETE /api/projects/:projectId/milestones/:milestoneId
const deleteMilestonePayment = async (req, res) => {
  try {
    const { projectId, milestoneId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.milestonePayments = project.milestonePayments.filter(
      m => m._id.toString() !== milestoneId
    );
    await project.save();

    res.json({
      success: true,
      message: 'Milestone payment deleted successfully',
      data: project.milestonePayments
    });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== BUDGET INSTALLMENT OPERATIONS ====================

// @desc    Add budget installment to project
// @route   POST /api/projects/:id/budget
const addBudgetInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, deadline } = req.body;

    if (!title || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Title and amount are required'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.budgetInstallments.push({ 
      title, 
      amount: Number(amount), 
      deadline: deadline || null 
    });
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Budget installment added successfully',
      data: project.budgetInstallments
    });
  } catch (error) {
    console.error('Add budget installment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete budget installment
// @route   DELETE /api/projects/:projectId/budget/:installmentId
const deleteBudgetInstallment = async (req, res) => {
  try {
    const { projectId, installmentId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.budgetInstallments = project.budgetInstallments.filter(
      (_, index) => index.toString() !== installmentId
    );
    await project.save();

    res.json({
      success: true,
      message: 'Budget installment deleted successfully',
      data: project.budgetInstallments
    });
  } catch (error) {
    console.error('Delete budget installment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== TEAM MEMBERS OPERATIONS ====================

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
const addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, memberName } = req.body;

    const validRoles = ['frontend', 'backend', 'designer', 'tester', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles: frontend, backend, designer, tester, manager'
      });
    }

    if (!memberName || !memberName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Member name is required'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.teamMembers[role].includes(memberName.trim())) {
      project.teamMembers[role].push(memberName.trim());
      await project.save();
    }

    res.json({
      success: true,
      message: 'Team member added successfully',
      data: project.teamMembers
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team/:role/:memberName
const removeTeamMember = async (req, res) => {
  try {
    const { id, role, memberName } = req.params;

    const validRoles = ['frontend', 'backend', 'designer', 'tester', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.teamMembers[role] = project.teamMembers[role].filter(
      name => name !== decodeURIComponent(memberName)
    );
    await project.save();

    res.json({
      success: true,
      message: 'Team member removed successfully',
      data: project.teamMembers
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== STATISTICS OPERATIONS ====================

// @desc    Get project statistics
// @route   GET /api/projects/stats
const getProjectStats = async (req, res) => {
  try {
    const total = await Project.countDocuments();
    const active = await Project.countDocuments({ status: 'active' });
    const completed = await Project.countDocuments({ status: 'completed' });
    const onHold = await Project.countDocuments({ status: 'on hold' });
    const cancelled = await Project.countDocuments({ status: 'cancelled' });

    const categoryStats = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const statusStats = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        onHold,
        cancelled,
        categoryStats,
        statusStats
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get project options for dropdowns
// @route   GET /api/projects/options
const getProjectOptions = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'active' })
      .select('projectId projectName clientName')
      .sort({ projectName: 1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Get project options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMilestonePayment,
  updateMilestonePayment,
  deleteMilestonePayment,
  addBudgetInstallment,
  deleteBudgetInstallment,
  addTeamMember,
  removeTeamMember,
  getProjectStats,
  getProjectOptions
};