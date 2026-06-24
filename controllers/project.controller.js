

//   const Project = require('../models/Project');


//   const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

//   // ==================== PROJECT CRUD OPERATIONS ====================

//   // @desc    Create new project
//   // @route   POST /api/projects
//   const createProject = async (req, res) => {
//     try {
//       console.log("📝 Creating new project");
//       console.log("req.body:", req.body);

//       const {
//         projectId,  
//         projectName,
//         clientName,
//         clientMobile,
//         clientEmail,
//         clientAddress,
//         category,
//         startDate,
//         projectHandoverDate,
//         deadlineDate,
//         duration,
//         projectCost,
//         milestone,
//         status,
//         appDetails,
//         marketing,
//         budgetInstallments,
//         milestonePayments,
//         teamMembers
//       } = req.body;

//       // Validate required fields
//       if (!projectName || !clientName) {
//         return res.status(400).json({
//           success: false,
//           message: 'Project name and client name are required'
//         });
//       }

//       // Check if project name already exists
//       const existingProjectName = await Project.findOne({ projectName });
//       if (existingProjectName) {
//         return res.status(400).json({
//           success: false,
//           message: 'Project name already exists'
//         });
//       }

//       // ✅ Only check projectId if it's provided (not undefined or empty string)
//       if (projectId && projectId.trim() !== '') {
//         const existingProject = await Project.findOne({ projectId });
//         if (existingProject) {
//           return res.status(400).json({
//             success: false,
//             message: 'Project ID already exists. Please use a different ID or leave blank for auto-generation.'
//           });
//         }
//       }

//       // Prepare project data
//       const projectData = {
//         // ✅ Only include projectId if it's provided and not empty
//         ...(projectId && projectId.trim() !== '' && { projectId: projectId.trim() }),
//         projectName: projectName.trim(),
//         clientName: clientName.trim(),
//         clientMobile: clientMobile || '',
//         clientEmail: clientEmail || '',
//         clientAddress: clientAddress || '',
//         category: category || 'website',
//         startDate: startDate || null,
//         projectHandoverDate: projectHandoverDate || null,
//         deadlineDate: deadlineDate || null,
//         duration: duration || '',
//         projectCost: projectCost ? Number(projectCost) : 0,
//         milestone: milestone ? Number(milestone) : 0,
//         status: status || 'active',
//         appDetails: appDetails || { appId: '', appName: '', timeline: {} },
//         marketing: marketing || { reels: { enabled: false }, posters: { enabled: false }, seo: false, keywords: false, banners: false },
//         budgetInstallments: budgetInstallments || [],
//         milestonePayments: milestonePayments || [],
//         teamMembers: teamMembers || { frontend: [], backend: [], designer: [], tester: [], manager: [] }
//       };

//       console.log("📦 Creating project with data:", JSON.stringify(projectData, null, 2));

//       const project = new Project(projectData);
//       await project.save();

//       res.status(201).json({
//         success: true,
//         message: 'Project created successfully',
//         data: project
//       });
//     } catch (error) {
//       console.error('Create project error:', error);
      
//       if (error.code === 11000) {
//         return res.status(400).json({
//           success: false,
//           message: 'Project ID already exists. Please try again.'
//         });
//       }
      
//       res.status(500).json({
//         success: false,
//         message: error.message || 'Server error while creating project'
//       });
//     }
//   };

// //   // @desc    Get all projects with pagination and filters
// // const getAllProjects = async (req, res) => {
// //   try {
// //     console.log('=== DEBUG getAllProjects ===');
// //     console.log('Full URL:', req.originalUrl);
// //     console.log('Query params:', req.query);
// //     console.log('Raw query string:', req.url);
    
// //     const { page = 1, limit = 10, search, category, status } = req.query;
// //     console.log('Parsed values:', { page, limit, search, category, status });
// //       const query = {};

// //       // Search functionality
// //       if (search) {
// //         query.$or = [
// //           { projectName: { $regex: search, $options: 'i' } },
// //           { clientName: { $regex: search, $options: 'i' } },
// //           { projectId: { $regex: search, $options: 'i' } },
// //           { clientEmail: { $regex: search, $options: 'i' } }
// //         ];
// //       }

// //       // Filter by category
// //       if (category) {
// //         query.category = category;
// //       }

// //       // Filter by status
// //       if (status) {
// //         query.status = status;
// //       }

// //       const total = await Project.countDocuments(query);
// //       const projects = await Project.find(query)
// //         .limit(parseInt(limit))
// //         .skip((parseInt(page) - 1) * parseInt(limit))
// //         .sort({ createdAt: -1 });

// //       res.json({
// //         success: true,
// //         data: projects,
// //         pagination: {
// //           total,
// //           page: parseInt(page),
// //           limit: parseInt(limit),
// //           pages: Math.ceil(total / parseInt(limit))
// //         }
// //       });
// //     } catch (error) {
// //       console.error('Get all projects error:', error);
// //       res.status(500).json({
// //         success: false,
// //         message: error.message
// //       });
// //     }
// //   };

// // @desc    Get all projects (NO PAGINATION - returns all projects)
// // @route   GET /api/projects
// const getAllProjects = async (req, res) => {
//   try {
//     console.log('=== Getting ALL projects (no pagination) ===');
//     console.log('Query params:', req.query);
    
//     const { search, category, status } = req.query;
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
//       query.category = category;
//     }

//     // Filter by status
//     if (status) {
//       query.status = status;
//     }

//     // Get ALL projects - NO limit, NO pagination
//     const projects = await Project.find(query).sort({ createdAt: -1 });
//     const total = projects.length;

//     console.log(`✅ Found ${total} projects`);

//     res.json({
//       success: true,
//       data: projects,
//       total: total,
//       message: `Returned ${total} projects`
//     });
//   } catch (error) {
//     console.error('Get all projects error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

//   // @desc    Get project by ID
//   // @route   GET /api/projects/:id
//   const getProjectById = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const project = await Project.findById(id);

//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       res.json({
//         success: true,
//         data: project
//       });
//     } catch (error) {
//       console.error('Get project error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Update project
//   // @route   PUT /api/projects/:id
//   const updateProject = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const updateData = { ...req.body };

//       const project = await Project.findById(id);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       // Convert string numbers to actual numbers
//       if (updateData.projectCost) updateData.projectCost = Number(updateData.projectCost);
//       if (updateData.milestone) updateData.milestone = Number(updateData.milestone);

//       // Handle nested objects - merge instead of replace
//       if (updateData.teamMembers) {
//         updateData.teamMembers = {
//           frontend: updateData.teamMembers.frontend || [],
//           backend: updateData.teamMembers.backend || [],
//           designer: updateData.teamMembers.designer || [],
//           tester: updateData.teamMembers.tester || [],
//           manager: updateData.teamMembers.manager || []
//         };
//       }

//       if (updateData.milestonePayments) {
//         updateData.milestonePayments = updateData.milestonePayments.map(payment => ({
//           ...payment,
//           amount: Number(payment.amount)
//         }));
//       }

//       // Remove fields that shouldn't be updated
//       delete updateData._id;
//       delete updateData.createdAt;
//       delete updateData.projectId; // Don't allow projectId to be changed

//       const updatedProject = await Project.findByIdAndUpdate(
//         id,
//         updateData,
//         { new: true, runValidators: true }
//       );

//       console.log("✅ Project updated:", updatedProject.projectName);

//       res.json({
//         success: true,
//         message: 'Project updated successfully',
//         data: updatedProject
//       });
//     } catch (error) {
//       console.error('Update project error:', error);
      
//       if (error.code === 11000) {
//         return res.status(400).json({
//           success: false,
//           message: 'Duplicate field value'
//         });
//       }
      
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Delete project
//   // @route   DELETE /api/projects/:id
//   const deleteProject = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const project = await Project.findByIdAndDelete(id);

//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       res.json({
//         success: true,
//         message: 'Project deleted successfully'
//       });
//     } catch (error) {
//       console.error('Delete project error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // ==================== MILESTONE PAYMENT OPERATIONS ====================

//   // @desc    Add milestone payment to project
//   // @route   POST /api/projects/:id/milestones
//   const addMilestonePayment = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { description, amount, paid, paymentMode, paymentDate } = req.body;

//       const project = await Project.findById(id);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       const newMilestone = {
//         description: description || `Milestone ${project.milestonePayments.length + 1}`,
//         amount: Number(amount),
//         paid: paid || false,
//         paymentMode: paymentMode || 'cash',
//         paymentDate: paymentDate || null
//       };

//       project.milestonePayments.push(newMilestone);
//       await project.save();

//       res.status(201).json({
//         success: true,
//         message: 'Milestone payment added successfully',
//         data: project.milestonePayments
//       });
//     } catch (error) {
//       console.error('Add milestone error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Update milestone payment
//   // @route   PUT /api/projects/:projectId/milestones/:milestoneId
//   const updateMilestonePayment = async (req, res) => {
//     try {
//       const { projectId, milestoneId } = req.params;
//       const updateData = req.body;

//       const project = await Project.findById(projectId);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       const milestone = project.milestonePayments.id(milestoneId);
//       if (!milestone) {
//         return res.status(404).json({
//           success: false,
//           message: 'Milestone payment not found'
//         });
//       }

//       if (updateData.amount) updateData.amount = Number(updateData.amount);
      
//       Object.keys(updateData).forEach(key => {
//         if (key !== '_id') {
//           milestone[key] = updateData[key];
//         }
//       });

//       await project.save();

//       res.json({
//         success: true,
//         message: 'Milestone payment updated successfully',
//         data: project.milestonePayments
//       });
//     } catch (error) {
//       console.error('Update milestone error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Delete milestone payment
//   // @route   DELETE /api/projects/:projectId/milestones/:milestoneId
//   const deleteMilestonePayment = async (req, res) => {
//     try {
//       const { projectId, milestoneId } = req.params;

//       const project = await Project.findById(projectId);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       project.milestonePayments = project.milestonePayments.filter(
//         m => m._id.toString() !== milestoneId
//       );
//       await project.save();

//       res.json({
//         success: true,
//         message: 'Milestone payment deleted successfully',
//         data: project.milestonePayments
//       });
//     } catch (error) {
//       console.error('Delete milestone error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // ==================== BUDGET INSTALLMENT OPERATIONS ====================

//   // @desc    Add budget installment to project
//   // @route   POST /api/projects/:id/budget
//   const addBudgetInstallment = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { title, amount, deadline } = req.body;

//       if (!title || !amount) {
//         return res.status(400).json({
//           success: false,
//           message: 'Title and amount are required'
//         });
//       }

//       const project = await Project.findById(id);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       project.budgetInstallments.push({ 
//         title, 
//         amount: Number(amount), 
//         deadline: deadline || null 
//       });
//       await project.save();

//       res.status(201).json({
//         success: true,
//         message: 'Budget installment added successfully',
//         data: project.budgetInstallments
//       });
//     } catch (error) {
//       console.error('Add budget installment error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Delete budget installment
//   // @route   DELETE /api/projects/:projectId/budget/:installmentId
//   const deleteBudgetInstallment = async (req, res) => {
//     try {
//       const { projectId, installmentId } = req.params;

//       const project = await Project.findById(projectId);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       project.budgetInstallments = project.budgetInstallments.filter(
//         (_, index) => index.toString() !== installmentId
//       );
//       await project.save();

//       res.json({
//         success: true,
//         message: 'Budget installment deleted successfully',
//         data: project.budgetInstallments
//       });
//     } catch (error) {
//       console.error('Delete budget installment error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // ==================== TEAM MEMBERS OPERATIONS ====================

//   // @desc    Add team member to project
//   // @route   POST /api/projects/:id/team
//   const addTeamMember = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { role, memberName } = req.body;

//       const validRoles = ['frontend', 'backend', 'designer', 'tester', 'manager'];
//       if (!validRoles.includes(role)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid role. Valid roles: frontend, backend, designer, tester, manager'
//         });
//       }

//       if (!memberName || !memberName.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: 'Member name is required'
//         });
//       }

//       const project = await Project.findById(id);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       if (!project.teamMembers[role].includes(memberName.trim())) {
//         project.teamMembers[role].push(memberName.trim());
//         await project.save();
//       }

//       res.json({
//         success: true,
//         message: 'Team member added successfully',
//         data: project.teamMembers
//       });
//     } catch (error) {
//       console.error('Add team member error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Remove team member from project
//   // @route   DELETE /api/projects/:id/team/:role/:memberName
//   const removeTeamMember = async (req, res) => {
//     try {
//       const { id, role, memberName } = req.params;

//       const validRoles = ['frontend', 'backend', 'designer', 'tester', 'manager'];
//       if (!validRoles.includes(role)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid role'
//         });
//       }

//       const project = await Project.findById(id);
//       if (!project) {
//         return res.status(404).json({
//           success: false,
//           message: 'Project not found'
//         });
//       }

//       project.teamMembers[role] = project.teamMembers[role].filter(
//         name => name !== decodeURIComponent(memberName)
//       );
//       await project.save();

//       res.json({
//         success: true,
//         message: 'Team member removed successfully',
//         data: project.teamMembers
//       });
//     } catch (error) {
//       console.error('Remove team member error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // ==================== STATISTICS OPERATIONS ====================

//   // @desc    Get project statistics
//   // @route   GET /api/projects/stats
//   const getProjectStats = async (req, res) => {
//     try {
//       const total = await Project.countDocuments();
//       const active = await Project.countDocuments({ status: 'active' });
//       const completed = await Project.countDocuments({ status: 'completed' });
//       const onHold = await Project.countDocuments({ status: 'on hold' });
//       const cancelled = await Project.countDocuments({ status: 'cancelled' });

//       const categoryStats = await Project.aggregate([
//         { $group: { _id: '$category', count: { $sum: 1 } } },
//         { $sort: { count: -1 } }
//       ]);

//       const statusStats = await Project.aggregate([
//         { $group: { _id: '$status', count: { $sum: 1 } } }
//       ]);

//       res.json({
//         success: true,
//         data: {
//           total,
//           active,
//           completed,
//           onHold,
//           cancelled,
//           categoryStats,
//           statusStats
//         }
//       });
//     } catch (error) {
//       console.error('Get stats error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   // @desc    Get project options for dropdowns
//   // @route   GET /api/projects/options
//   const getProjectOptions = async (req, res) => {
//     try {
//       const projects = await Project.find({ status: 'active' })
//         .select('projectId projectName clientName')
//         .sort({ projectName: 1 });

//       res.json({
//         success: true,
//         data: projects
//       });
//     } catch (error) {
//       console.error('Get project options error:', error);
//       res.status(500).json({
//         success: false,
//         message: error.message
//       });
//     }
//   };

//   module.exports = {
//     createProject,
//     getAllProjects,
//     getProjectById,
//     updateProject,
//     deleteProject,
//     addMilestonePayment,
//     updateMilestonePayment,
//     deleteMilestonePayment,
//     addBudgetInstallment,
//     deleteBudgetInstallment,
//     addTeamMember,
//     removeTeamMember,
//     getProjectStats,
//     getProjectOptions
//   };

// controllers/projectController.js
const Project = require('../models/Project');
const Client = require('../models/Client');
const Staff = require('../models/Staff');

// ==================== CREATE ====================

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
    try {
        const { clientId, projectName, projectCost, projectStartDate, projectEndDate, deadline, paymentMilestone, category, workDivision, teamAssignment } = req.body;

        if (!clientId || !projectName) {
            return res.status(400).json({
                success: false,
                message: 'Client ID and project name are required'
            });
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const project = new Project({
            clientId,
            projectName: projectName.trim(),
            projectCost: projectCost ? Number(projectCost) : 0,
            projectStartDate: projectStartDate || null,
            projectEndDate: projectEndDate || null,
            deadline: deadline || null,
            paymentMilestone: paymentMilestone ? Number(paymentMilestone) : 0,
            category: category || 'website',
            workDivision: workDivision || { designing: 0, frontend: 0, backend: 0, testing: 0, deployment: 0 },
            teamAssignment: teamAssignment || { designing: [], frontend: [], backend: [], testing: [], deployment: [] }
        });

        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate('clientId', 'name email mobile address')
            .select('-__v');

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: {
                _id: populatedProject._id,
                projectId: populatedProject.projectId,
                projectName: populatedProject.projectName,
                projectCost: populatedProject.projectCost,
                projectStartDate: populatedProject.projectStartDate,
                projectEndDate: populatedProject.projectEndDate,
                deadline: populatedProject.deadline,
                paymentMilestone: populatedProject.paymentMilestone,
                category: populatedProject.category,
                workDivision: populatedProject.workDivision,
                teamAssignment: populatedProject.teamAssignment,
                client: {
                    _id: populatedProject.clientId._id,
                    name: populatedProject.clientId.name,
                    mobile: populatedProject.clientId.mobile,
                    email: populatedProject.clientId.email,
                    address: populatedProject.clientId.address
                },
                status: 'active',
                createdAt: populatedProject.createdAt,
                updatedAt: populatedProject.updatedAt
            }
        });
    } catch (error) {
        console.error('Create project error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate value found. Please try again.'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating project'
        });
    }
};


// ==================== READ ====================

// @desc    Get all projects with pagination and filters
// @route   GET /api/projects
exports.getAllProjects = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            category, 
            clientId, 
            isDeleted,
            projectId,
            projectName,
            clientName,
            clientEmail,
            clientMobile
        } = req.query;

        const query = {};

        // Filter by soft delete status
        if (isDeleted === 'true') {
            query.isDeleted = true;
        } else if (isDeleted === 'false') {
            query.isDeleted = false;
        } else {
            query.isDeleted = false; // Default: show only active
        }

        // Search functionality (general search)
        if (search) {
            query.$or = [
                { projectName: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { projectId: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by projectId
        if (projectId) {
            query.projectId = { $regex: projectId, $options: 'i' };
        }

        // Filter by projectName
        if (projectName) {
            query.projectName = { $regex: projectName, $options: 'i' };
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by client
        if (clientId) {
            query.clientId = clientId;
        }

        // Build the query
        let projectsQuery = Project.find(query)
            .populate('clientId', 'name email mobile address')
            .select('-__v')
            .sort({ createdAt: -1 });

        // Apply pagination only if not fetching all
        if (limit !== 'all') {
            const limitNum = parseInt(limit);
            const pageNum = parseInt(page);
            projectsQuery = projectsQuery
                .limit(limitNum)
                .skip((pageNum - 1) * limitNum);
        }

        const projects = await projectsQuery;

        // Filter by client fields (clientName, clientEmail, clientMobile) - post-filtering
        let filteredProjects = projects;
        if (clientName) {
            filteredProjects = filteredProjects.filter(project => 
                project.clientId && project.clientId.name && 
                project.clientId.name.toLowerCase().includes(clientName.toLowerCase())
            );
        }
        if (clientEmail) {
            filteredProjects = filteredProjects.filter(project => 
                project.clientId && project.clientId.email && 
                project.clientId.email.toLowerCase().includes(clientEmail.toLowerCase())
            );
        }
        if (clientMobile) {
            filteredProjects = filteredProjects.filter(project => 
                project.clientId && project.clientId.mobile && 
                project.clientId.mobile.includes(clientMobile)
            );
        }

        // Get total count for pagination
        let total = 0;
        if (limit !== 'all') {
            total = await Project.countDocuments(query);
        } else {
            total = filteredProjects.length;
        }

        const formattedProjects = filteredProjects.map(project => ({
            _id: project._id,
            projectId: project.projectId,
            projectName: project.projectName,
            projectCost: project.projectCost,
            projectStartDate: project.projectStartDate,
            projectEndDate: project.projectEndDate,
            deadline: project.deadline,
            paymentMilestone: project.paymentMilestone,
            category: project.category,
            workDivision: project.workDivision,
            teamAssignment: project.teamAssignment,
            client: {
                _id: project.clientId?._id,
                name: project.clientId?.name || 'Unknown Client',
                mobile: project.clientId?.mobile || '',
                email: project.clientId?.email || '',
                address: project.clientId?.address || ''
            },
            status: project.isDeleted ? 'deleted' : 'active',
            deletedAt: project.deletedAt,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        }));

        // Build response
        const response = {
            success: true,
            data: formattedProjects
        };

        // Add pagination only if not fetching all
        if (limit !== 'all') {
            const limitNum = parseInt(limit);
            const pageNum = parseInt(page);
            response.pagination = {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            };
        }

        res.json(response);
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
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id)
            .populate('clientId', 'name email mobile address')
            .select('-__v');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: {
                _id: project._id,
                projectId: project.projectId,
                projectName: project.projectName,
                projectCost: project.projectCost,
                projectStartDate: project.projectStartDate,
                projectEndDate: project.projectEndDate,
                deadline: project.deadline,
                paymentMilestone: project.paymentMilestone,
                category: project.category,
                workDivision: project.workDivision,
                teamAssignment: project.teamAssignment,
                client: {
                    _id: project.clientId._id,
                    name: project.clientId.name,
                    mobile: project.clientId.mobile,
                    email: project.clientId.email,
                    address: project.clientId.address
                },
                status: project.isDeleted ? 'deleted' : 'active',
                deletedAt: project.deletedAt,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get project options for dropdowns
// @route   GET /api/projects/options
exports.getProjectOptions = async (req, res) => {
    try {
        const projects = await Project.find({ isDeleted: false })
            .select('projectId projectName category clientId')
            .populate('clientId', 'name')
            .sort({ projectName: 1 });

        const formattedOptions = projects.map(project => ({
            _id: project._id,
            projectId: project.projectId,
            projectName: project.projectName,
            category: project.category,
            clientName: project.clientId ? project.clientId.name : 'Unknown Client'
        }));

        res.json({
            success: true,
            data: formattedOptions
        });
    } catch (error) {
        console.error('Get project options error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
exports.getProjectStats = async (req, res) => {
    try {
        const total = await Project.countDocuments({ isDeleted: false });

        const categoryStats = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const totalCost = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$projectCost' } } }
        ]);

        const clientStats = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$clientId', projectCount: { $sum: 1 } } },
            { $sort: { projectCount: -1 } },
            { $limit: 10 }
        ]);

        const topClients = await Client.find({
            _id: { $in: clientStats.map(stat => stat._id) }
        }).select('name email mobile');

        const formattedClientStats = clientStats.map(stat => ({
            client: topClients.find(c => c._id.toString() === stat._id.toString()),
            projectCount: stat.projectCount
        }));

        res.json({
            success: true,
            data: {
                totalProjects: total,
                totalProjectCost: totalCost[0]?.total || 0,
                categoryStats: categoryStats.map(stat => ({
                    category: stat._id,
                    count: stat.count
                })),
                topClients: formattedClientStats
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

// ==================== UPDATE ====================

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
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

        // Convert numbers
        if (updateData.projectCost) updateData.projectCost = Number(updateData.projectCost);
        if (updateData.paymentMilestone) updateData.paymentMilestone = Number(updateData.paymentMilestone);

        // Handle workDivision
        if (updateData.workDivision) {
            updateData.workDivision = {
                designing: Number(updateData.workDivision.designing) || 0,
                frontend: Number(updateData.workDivision.frontend) || 0,
                backend: Number(updateData.workDivision.backend) || 0,
                testing: Number(updateData.workDivision.testing) || 0,
                deployment: Number(updateData.workDivision.deployment) || 0
            };
        }

        // Handle teamAssignment
        if (updateData.teamAssignment) {
            updateData.teamAssignment = {
                designing: updateData.teamAssignment.designing || [],
                frontend: updateData.teamAssignment.frontend || [],
                backend: updateData.teamAssignment.backend || [],
                testing: updateData.teamAssignment.testing || [],
                deployment: updateData.teamAssignment.deployment || []
            };
        }

        // Remove fields that shouldn't be updated
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.clientId;
        delete updateData.projectId;
        delete updateData.isDeleted;
        delete updateData.deletedAt;

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('clientId', 'name email mobile address')
          .select('-__v');

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: {
                _id: updatedProject._id,
                projectId: updatedProject.projectId,
                projectName: updatedProject.projectName,
                projectCost: updatedProject.projectCost,
                projectStartDate: updatedProject.projectStartDate,
                projectEndDate: updatedProject.projectEndDate,
                deadline: updatedProject.deadline,
                paymentMilestone: updatedProject.paymentMilestone,
                category: updatedProject.category,
                workDivision: updatedProject.workDivision,
                teamAssignment: updatedProject.teamAssignment,
                client: {
                    _id: updatedProject.clientId._id,
                    name: updatedProject.clientId.name,
                    mobile: updatedProject.clientId.mobile,
                    email: updatedProject.clientId.email,
                    address: updatedProject.clientId.address
                },
                status: updatedProject.isDeleted ? 'deleted' : 'active',
                createdAt: updatedProject.createdAt,
                updatedAt: updatedProject.updatedAt
            }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== DELETE ====================

// @desc    Bulk delete projects (Soft or Permanent)
// @route   DELETE /api/projects/bulk?permanent=true
exports.bulkDeleteProjects = async (req, res) => {
    try {
        const { projectIds } = req.body;
        const { permanent } = req.query;

        if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Project IDs array is required'
            });
        }

        const projects = await Project.find({
            _id: { $in: projectIds }
        });

        if (projects.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No projects found'
            });
        }

        // ============ PERMANENT BULK DELETE ============
        if (permanent === 'true') {
            const deletedProjects = projects.map(p => ({
                _id: p._id,
                projectId: p.projectId,
                projectName: p.projectName
            }));

            await Project.deleteMany({
                _id: { $in: projectIds }
            });

            return res.json({
                success: true,
                message: `${deletedProjects.length} projects permanently deleted`,
                data: {
                    deletedCount: deletedProjects.length,
                    deletedProjects: deletedProjects
                }
            });
        }

        // ============ SOFT BULK DELETE ============
        const deletedProjects = [];
        for (const project of projects) {
            if (!project.isDeleted) {
                project.isDeleted = true;
                project.deletedAt = new Date();
                await project.save();
                deletedProjects.push({
                    _id: project._id,
                    projectId: project.projectId,
                    projectName: project.projectName
                });
            }
        }

        res.json({
            success: true,
            message: `${deletedProjects.length} projects deleted successfully`,
            data: {
                deletedCount: deletedProjects.length,
                deletedProjects: deletedProjects
            }
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Restore deleted project
// @route   PUT /api/projects/:id/restore
exports.restoreProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!project.isDeleted) {
            return res.status(400).json({
                success: false,
                message: 'Project is not deleted'
            });
        }

        project.isDeleted = false;
        project.deletedAt = null;
        await project.save();

        res.json({
            success: true,
            message: 'Project restored successfully',
            data: {
                _id: project._id,
                projectId: project.projectId,
                projectName: project.projectName,
                status: 'active'
            }
        });
    } catch (error) {
        console.error('Restore project error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

