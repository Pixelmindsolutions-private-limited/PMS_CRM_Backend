

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
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Staff = require('../models/Staff');
const cron = require('node-cron');
const transporter = require('../config/mailConfig');
const Invoice = require('../models/Invoice');
const { generatePDFReceipt } = require('../services/pdfService');


// ==================== CREATE ====================

// @desc    Create new project
// @route   POST /api/projects
// exports.createProject = async (req, res) => {
//     try {
//         const { clientId, projectName, projectCost, projectStartDate, projectEndDate, deadline, paymentMilestone, category, workDivision, teamAssignment, digitalMarketing  } = req.body;

//         if (!clientId || !projectName) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Client ID and project name are required'
//             });
//         }

//         const client = await Client.findById(clientId);
//         if (!client) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Client not found'
//             });
//         }

//         const project = new Project({
//             clientId,
//             projectName: projectName.trim(),
//             projectCost: projectCost ? Number(projectCost) : 0,
//             projectStartDate: projectStartDate || null,
//             projectEndDate: projectEndDate || null,
//             deadline: deadline || null,
//             paymentMilestone: paymentMilestone ? Number(paymentMilestone) : 0,
//             category: category || 'website',
//             workDivision: workDivision || { designing: 0, frontend: 0, backend: 0, testing: 0, deployment: 0 },
//             teamAssignment: teamAssignment || { designing: [], frontend: [], backend: [], testing: [], deployment: [] }
//         });

//         await project.save();

//         const populatedProject = await Project.findById(project._id)
//             .populate('clientId', 'name email mobile address')
//             .select('-__v');

//         res.status(201).json({
//             success: true,
//             message: 'Project created successfully',
//             data: {
//                 _id: populatedProject._id,
//                 projectId: populatedProject.projectId,
//                 projectName: populatedProject.projectName,
//                 projectCost: populatedProject.projectCost,
//                 projectStartDate: populatedProject.projectStartDate,
//                 projectEndDate: populatedProject.projectEndDate,
//                 deadline: populatedProject.deadline,
//                 paymentMilestone: populatedProject.paymentMilestone,
//                 category: populatedProject.category,
//                 workDivision: populatedProject.workDivision,
//                 teamAssignment: populatedProject.teamAssignment,
//                 client: {
//                     _id: populatedProject.clientId._id,
//                     name: populatedProject.clientId.name,
//                     mobile: populatedProject.clientId.mobile,
//                     email: populatedProject.clientId.email,
//                     address: populatedProject.clientId.address
//                 },
//                 status: 'active',
//                 createdAt: populatedProject.createdAt,
//                 updatedAt: populatedProject.updatedAt
//             }
//         });
//     } catch (error) {
//         console.error('Create project error:', error);
//         if (error.code === 11000) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Duplicate value found. Please try again.'
//             });
//         }
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Server error while creating project'
//         });
//     }
// };

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
    try {
        const { 
            clientId, 
            projectName, 
            projectCost, 
            projectStartDate, 
            projectEndDate, 
            deadline, 
            paymentMilestone, 
            category, 
            workDivision, 
            teamAssignment,
            digitalMarketing  // ← ADD THIS
        } = req.body;

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

        // ============ HANDLE DIGITAL MARKETING ============
        let finalProjectCost = projectCost ? Number(projectCost) : 0;
        let digitalMarketingData = null;

        if (category === 'digital marketing' && digitalMarketing) {
            const DigitalMarketingPlan = require('../models/DigitalMarketingPlan');
            
            // Find the plan
            const plan = await DigitalMarketingPlan.findById(digitalMarketing.planId);
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Digital marketing plan not found'
                });
            }

            // Find price for selected duration
            const durationData = plan.durations.find(d => d.duration === digitalMarketing.duration);
            if (!durationData) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid duration for this plan'
                });
            }

            // Set project cost from plan
            finalProjectCost = durationData.price;

            // Prepare digital marketing data
            digitalMarketingData = {
                planId: plan._id,
                planName: plan.planName,
                duration: digitalMarketing.duration,
                price: durationData.price,
                features: plan.features || []
            };
        }

        // ============ PREPARE WORK DIVISION ============
        let workDivisionData = workDivision || { 
            designing: 0, 
            frontend: 0, 
            backend: 0, 
            testing: 0, 
            deployment: 0,
            marketing: 0 
        };

        // ============ PREPARE TEAM ASSIGNMENT ============
        let teamAssignmentData = teamAssignment || { 
            designing: [], 
            frontend: [], 
            backend: [], 
            testing: [], 
            deployment: [],
            marketing: [] 
        };

        const project = new Project({
            clientId,
            projectName: projectName.trim(),
            projectCost: finalProjectCost,
            projectStartDate: projectStartDate || null,
            projectEndDate: projectEndDate || null,
            deadline: deadline || null,
            paymentMilestone: paymentMilestone ? Number(paymentMilestone) : 0,
            category: category || 'website',
            workDivision: workDivisionData,
            teamAssignment: teamAssignmentData,
            digitalMarketing: digitalMarketingData  // ← ADD THIS
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
                digitalMarketing: populatedProject.digitalMarketing || null,  // ← ADD THIS
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

        console.log(filteredProjects );

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
            digitalMarketing: project.digitalMarketing || null,
            client: {
                _id: project.clientId?._id,
                name: project.clientId?.name || 'Unknown Client',
                mobile: project.clientId?.mobile || '',
                email: project.clientId?.email || '',
                address: project.clientId?.address || ''
            },
            installments: project.installments || [],
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
                digitalMarketing: project.digitalMarketing || null,
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
                deployment: Number(updateData.workDivision.deployment) || 0,
                marketing: Number(updateData.workDivision.marketing) || 0
            };
        }

        // Handle teamAssignment
        if (updateData.teamAssignment) {
            updateData.teamAssignment = {
                designing: updateData.teamAssignment.designing || [],
                frontend: updateData.teamAssignment.frontend || [],
                backend: updateData.teamAssignment.backend || [],
                testing: updateData.teamAssignment.testing || [],
                deployment: updateData.teamAssignment.deployment || [],
                marketing: updateData.teamAssignment.marketing || []
            };
        }

         // Handle digitalMarketing update
        if (updateData.digitalMarketing) {
            // If updating digital marketing, validate plan and duration
            const { planId, duration } = updateData.digitalMarketing;
            if (planId && duration) {
                const DigitalMarketingPlan = require('../models/DigitalMarketingPlan');
                const plan = await DigitalMarketingPlan.findById(planId);
                if (!plan) {
                    return res.status(404).json({
                        success: false,
                        message: 'Digital marketing plan not found'
                    });
                }
                const durationData = plan.durations.find(d => d.duration === duration);
                if (!durationData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid duration for this plan'
                    });
                }
                // Update project cost if needed
                if (updateData.projectCost === undefined || updateData.projectCost === null) {
                    updateData.projectCost = durationData.price;
                }
            }
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
                digitalMarketing: updatedProject.digitalMarketing || null,
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

// @desc    Permanently delete projects (Single or Bulk)
// @route   DELETE /api/projects/:id/permanent (Single)
// @route   DELETE /api/projects/bulk/permanent (Bulk)
exports.permanentDeleteProjects = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectIds } = req.body;
        const ObjectId = require('mongoose').Types.ObjectId;

        // ============ BULK PERMANENT DELETE ============
        if (projectIds && Array.isArray(projectIds) && projectIds.length > 0) {
            // Validate each ID format
            const invalidIds = projectIds.filter(id => !ObjectId.isValid(id));
            
            if (invalidIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid project ID format',
                    invalidIds: invalidIds
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

        // ============ SINGLE PERMANENT DELETE ============
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID format'
            });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const projectData = {
            _id: project._id,
            projectId: project.projectId,
            projectName: project.projectName
        };

        await Project.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Project permanently deleted',
            data: projectData
        });
    } catch (error) {
        console.error('Permanent delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== INSTALLMENTS OPERATIONS ====================

// @desc    Add installment to project
// @route   POST /api/projects/:id/installments
exports.addInstallment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, type, value, dueDate } = req.body;

        if (!title || !type || !value) {
            return res.status(400).json({
                success: false,
                message: 'Title, type, and value are required'
            });
        }

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if installments exceed milestones
        if (project.installments.length >= project.paymentMilestone) {
            return res.status(400).json({
                success: false,
                message: `Cannot add more than ${project.paymentMilestone} installments`
            });
        }

        const installment = {
            title,
            type,
            value,
            dueDate: dueDate || null,
            status: 'pending'
        };

        project.installments.push(installment);
        await project.save();

        res.status(201).json({
            success: true,
            message: 'Installment added successfully',
            data: {
                projectId: project.projectId,
                projectName: project.projectName,
                installments: project.installments,
                totalPaid: project.totalPaid,
                remainingAmount: project.remainingAmount
            }
        });
    } catch (error) {
        console.error('Add installment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Edit installment details
// @route   PUT /api/projects/:id/installments/:installmentId
exports.editInstallment = async (req, res) => {
    try {
        const { id, installmentId } = req.params;
        const { title, type, value, dueDate } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const installment = project.installments.id(installmentId);
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: 'Installment not found'
            });
        }

        if (installment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit paid installment'
            });
        }

        if (title) installment.title = title;
        if (type) installment.type = type;
        if (value !== undefined && value !== null) installment.value = value;
        if (dueDate !== undefined) installment.dueDate = dueDate;

        await project.save();

        res.json({
            success: true,
            message: 'Installment updated successfully',
            data: {
                projectId: project.projectId,
                projectName: project.projectName,
                installments: project.installments,
                totalPaid: project.totalPaid,
                remainingAmount: project.remainingAmount
            }
        });
    } catch (error) {
        console.error('Edit installment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete installment
// @route   DELETE /api/projects/:id/installments/:installmentId
exports.deleteInstallment = async (req, res) => {
    try {
        const { id, installmentId } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const installment = project.installments.id(installmentId);
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: 'Installment not found'
            });
        }

        if (installment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete paid installment'
            });
        }

        project.installments = project.installments.filter(
            i => i._id.toString() !== installmentId
        );

        await project.save();

        res.json({
            success: true,
            message: 'Installment deleted successfully',
            data: {
                projectId: project.projectId,
                projectName: project.projectName,
                installments: project.installments,
                totalPaid: project.totalPaid,
                remainingAmount: project.remainingAmount
            }
        });
    } catch (error) {
        console.error('Delete installment error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all installments
// @route   GET /api/projects/:id/installments
exports.getInstallments = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id)
            .select('projectId projectName projectCost installments totalPaid remainingAmount paymentMilestone');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const totalInstallments = project.installments.length;
        const paidInstallments = project.installments.filter(i => i.status === 'paid').length;
        const pendingInstallments = project.installments.filter(i => i.status === 'pending').length;
        const overdueInstallments = project.installments.filter(i => 
            i.status === 'pending' && i.dueDate && new Date(i.dueDate) < new Date()
        ).length;

        res.json({
            success: true,
            data: {
                projectId: project.projectId,
                projectName: project.projectName,
                projectCost: project.projectCost,
                totalPaid: project.totalPaid,
                remainingAmount: project.remainingAmount,
                maxInstallments: project.paymentMilestone,
                installments: project.installments,
                summary: {
                    totalInstallments,
                    paidInstallments,
                    pendingInstallments,
                    overdueInstallments
                }
            }
        });
    } catch (error) {
        console.error('Get installments error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark installment as paid & send invoice
// @route   PUT /api/projects/:id/installments/:installmentId/mark-paid
// exports.markAsPaid = async (req, res) => {
//     try {
//         const { id, installmentId } = req.params;
//         const { paymentMode, transactionId } = req.body;

//         const project = await Project.findById(id).populate('clientId');
//         if (!project) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Project not found'
//             });
//         }

//         const installment = project.installments.id(installmentId);
//         if (!installment) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Installment not found'
//             });
//         }

//         if (installment.status === 'paid') {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Installment already paid'
//             });
//         }

//         // Mark as paid
//         installment.status = 'paid';
//         await project.save();

//         // ============ GENERATE INVOICE ============
//         let invoice = null;
//         let invoiceNumber = null;

//         try {
//             // Calculate amount
//             let amount = 0;
//             if (installment.type === 'percentage') {
//                 amount = (installment.value / 100) * project.projectCost;
//             } else {
//                 amount = installment.value;
//             }

//             const tax = amount * 0.18; // 18% GST
//             const totalAmount = amount + tax;

//             // Create invoice
//             invoice = new Invoice({
//                 projectId: project._id,
//                 clientId: project.clientId._id,
//                 installmentId: installment._id,
//                 installmentTitle: installment.title,
//                 amount: amount,
//                 tax: tax,
//                 totalAmount: totalAmount,
//                 status: 'generated',
//                 dueDate: installment.dueDate || new Date(),
//                 paymentDate: new Date(),
//                 paymentMode: paymentMode || 'cash',
//                 transactionId: transactionId || ''
//             });

//             await invoice.save();
//             invoiceNumber = invoice.invoiceNumber;

//             // ============ SEND INVOICE EMAIL ============
//             const client = project.clientId;

//             const htmlContent = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body { font-family: Arial, sans-serif; }
//                     .container { max-width: 700px; margin: auto; padding: 20px; }
//                     .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
//                     .company { font-size: 24px; font-weight: bold; }
//                     .invoice-title { font-size: 20px; margin: 10px 0; }
//                     .details { padding: 20px; }
//                     .row { display: flex; justify-content: space-between; margin: 10px 0; }
//                     .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
//                     .table th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
//                     .table td { padding: 10px; border-bottom: 1px solid #ddd; }
//                     .total { font-size: 18px; font-weight: bold; text-align: right; margin: 20px 0; }
//                     .footer { text-align: center; padding: 20px; color: #777; border-top: 1px solid #eee; }
//                     .paid-badge { background: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="header">
//                         <div class="company">${process.env.COMPANY_NAME || 'Your Company'}</div>
//                         <div class="invoice-title">PAYMENT RECEIPT / INVOICE</div>
//                         <div>Invoice #: ${invoice.invoiceNumber}</div>
//                         <div>Date: ${new Date().toLocaleDateString()}</div>
//                     </div>
                    
//                     <div class="details">
//                         <div class="row">
//                             <div>
//                                 <strong>Bill To:</strong><br>
//                                 ${client.name}<br>
//                                 ${client.email}<br>
//                                 ${client.address || ''}
//                             </div>
//                             <div>
//                                 <strong>Project:</strong><br>
//                                 ${project.projectName}
//                             </div>
//                         </div>

//                         <div style="text-align: center; margin: 20px 0;">
//                             <span class="paid-badge">✅ PAID</span>
//                         </div>

//                         <table class="table">
//                             <thead>
//                                 <tr>
//                                     <th>Description</th>
//                                     <th style="text-align:right;">Amount</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 <tr>
//                                     <td>${invoice.installmentTitle}</td>
//                                     <td style="text-align:right;">₹${invoice.amount.toFixed(2)}</td>
//                                 </tr>
//                                 ${invoice.tax > 0 ? `<tr>
//                                     <td>Tax (18% GST)</td>
//                                     <td style="text-align:right;">₹${invoice.tax.toFixed(2)}</td>
//                                 </tr>` : ''}
//                             </tbody>
//                         </table>

//                         <div class="total">
//                             Total Amount: ₹${invoice.totalAmount.toFixed(2)}
//                         </div>

//                         <div style="margin: 20px 0; padding: 15px; background: #f8f9fa;">
//                             <strong>Payment Status:</strong> ✅ Paid<br>
//                             <strong>Payment Date:</strong> ${new Date().toLocaleDateString()}<br>
//                             <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
//                             ${invoice.transactionId ? `<br><strong>Transaction ID:</strong> ${invoice.transactionId}` : ''}
//                         </div>
//                     </div>

//                     <div class="footer">
//                         Thank you for your business!<br>
//                         ${process.env.COMPANY_EMAIL || 'info@yourcompany.com'} | ${process.env.COMPANY_PHONE || '1234567890'}
//                     </div>
//                 </div>
//             </body>
//             </html>
//             `;

//             const mailOptions = {
//                 from: process.env.MAIL_USER,
//                 to: client.email,
//                 cc: process.env.MAIL_USER,
//                 subject: `✅ Payment Receipt - Invoice #${invoice.invoiceNumber}`,
//                 html: htmlContent
//             };

//             await transporter.sendMail(mailOptions);

//             // Update invoice status
//             invoice.status = 'sent';
//             invoice.sentAt = new Date();
//             await invoice.save();

//             console.log(`✅ Invoice ${invoice.invoiceNumber} sent to ${client.email}`);

//         } catch (error) {
//             console.error('Invoice generation/email error:', error);
//         }

//         res.json({
//             success: true,
//             message: 'Installment marked as paid. Invoice sent to client.',
//             data: {
//                 projectId: project.projectId,
//                 projectName: project.projectName,
//                 installment,
//                 totalPaid: project.totalPaid,
//                 remainingAmount: project.remainingAmount,
//                 invoice: invoice ? {
//                     _id: invoice._id,
//                     invoiceNumber: invoice.invoiceNumber,
//                     amount: invoice.amount,
//                     totalAmount: invoice.totalAmount,
//                     status: invoice.status,
//                     paymentDate: invoice.paymentDate,
//                     transactionId: invoice.transactionId
//                 } : null
//             }
//         });
//     } catch (error) {
//         console.error('Mark as paid error:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// @desc    Mark installment as paid & send invoice with PDF
// @route   PUT /api/projects/:id/installments/:installmentId/mark-paid
exports.markAsPaid = async (req, res) => {
    try {
        const { id, installmentId } = req.params;
        const { paymentMode, transactionId, applyGst } = req.body;  

        const project = await Project.findById(id).populate('clientId');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const installment = project.installments.id(installmentId);
        if (!installment) {
            return res.status(404).json({
                success: false,
                message: 'Installment not found'
            });
        }

        if (installment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Installment already paid'
            });
        }

        // Mark as paid
        installment.status = 'paid';
        await project.save();

        // ============ GENERATE INVOICE ============
        let invoice = null;
        let pdfBuffer = null;

        try {
            // Calculate amount
            let amount = 0;
            if (installment.type === 'percentage') {
                amount = (installment.value / 100) * project.projectCost;
            } else {
                amount = installment.value;
            }

            // ============ GST BASED ON BOOLEAN FLAG ============
            // Get tax rate from .env (default 18)
            const taxRate = parseFloat(process.env.TAX_RATE) || 18; 
            const shouldApplyGst = applyGst === true;
            const tax = shouldApplyGst ? (amount * taxRate) / 100 : 0;
            const totalAmount = amount + tax;

            // Create invoice
            invoice = new Invoice({
                projectId: project._id,
                clientId: project.clientId._id,
                installmentId: installment._id,
                installmentTitle: installment.title,
                amount: amount,
                tax: tax,
                totalAmount: totalAmount,
                status: 'generated',
                dueDate: installment.dueDate || new Date(),
                paymentDate: new Date(),
                paymentMode: paymentMode || 'cash',
                transactionId: transactionId || ''
            });

            await invoice.save();

            // ============ GENERATE PDF ============
            pdfBuffer = await generatePDFReceipt(invoice, project, project.clientId);

            // ============ SAVE PDF TO DISK ============
            const pdfFileName = `invoice-${invoice.invoiceNumber}.pdf`;
            
            const invoicesDir = path.join(__dirname, '../uploads/invoices');
            if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true });
            }

            const pdfPath = path.join(invoicesDir, pdfFileName);
            fs.writeFileSync(pdfPath, pdfBuffer);
            
            const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
            const pdfUrl = `${baseUrl}/uploads/invoices/${pdfFileName}`;

            // ============ UPDATE INVOICE WITH PDF PATHS ============
            invoice.invoicePdf = pdfPath;
            invoice.invoicePdfURL = pdfUrl;
            await invoice.save();

            console.log(`✅ PDF saved: ${pdfPath}`);
            console.log(`✅ PDF URL: ${pdfUrl}`);

            // ============ SEND EMAIL ============
            const client = project.clientId;
            const htmlContent = getInvoiceEmailHTML(client, project, invoice);

            const mailOptions = {
                from: process.env.MAIL_USER,
                to: client.email,
                cc: process.env.MAIL_USER,
                subject: `✅ Payment Receipt - ${invoice.invoiceNumber}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `invoice-${invoice.invoiceNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            await transporter.sendMail(mailOptions);

            invoice.status = 'sent';
            invoice.sentAt = new Date();
            await invoice.save();

            console.log(`✅ Invoice ${invoice.invoiceNumber} sent to ${client.email} with PDF`);

        } catch (error) {
            console.error('Invoice generation/email error:', error);
        }

        res.json({
            success: true,
            message: 'Installment marked as paid. Invoice sent to client.',
            data: {
                projectId: project.projectId,
                projectName: project.projectName,
                installment: {
                    _id: installment._id,
                    title: installment.title,
                    type: installment.type,
                    value: installment.value,
                    status: installment.status,
                    dueDate: installment.dueDate
                },
                totalPaid: project.totalPaid,
                remainingAmount: project.remainingAmount,
                invoice: invoice ? {
                    _id: invoice._id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: invoice.amount,
                    tax: invoice.tax,
                    totalAmount: invoice.totalAmount,
                    status: invoice.status,
                    paymentDate: invoice.paymentDate,
                    transactionId: invoice.transactionId,
                    invoicePdf: invoice.invoicePdf,
                    invoicePdfURL: invoice.invoicePdfURL,
                    gstApplied: applyGst === true
                } : null
            }
        });
    } catch (error) {
        console.error('Mark as paid error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// Email Template
function getInvoiceEmailHTML(client, project, invoice) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: auto; padding: 20px; }
            .header { background: #1a6354; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .details { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 5px; }
            .footer { text-align: center; padding: 15px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 20px; }
            .paid-badge { background: #1a6354; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>✅ Payment Confirmation</h2>
            </div>
            <div class="content">
                <h3>Dear ${client.name},</h3>
                <p>We are pleased to inform you that your payment has been successfully received.</p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span class="paid-badge">✅ PAID</span>
                </div>

                <div class="details">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td><strong>Invoice #:</strong></td>
                            <td>${invoice.invoiceNumber}</td>
                        </tr>
                        <tr>
                            <td><strong>Project:</strong></td>
                            <td>${project.projectName}</td>
                        </tr>
                        <tr>
                            <td><strong>Installment:</strong></td>
                            <td>${invoice.installmentTitle}</td>
                        </tr>
                        <tr>
                            <td><strong>Amount Paid:</strong></td>
                            <td><strong>₹${invoice.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Payment Date:</strong></td>
                            <td>${new Date().toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td><strong>Payment Mode:</strong></td>
                            <td>${invoice.paymentMode || 'Cash'}</td>
                        </tr>
                        ${invoice.transactionId ? `<tr>
                            <td><strong>Transaction ID:</strong></td>
                            <td>${invoice.transactionId}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <p style="margin-top: 20px;">
                    <strong>Payment Summary:</strong><br>
                    Total Project Cost: ₹${project.projectCost.toFixed(2)}<br>
                    Total Paid: ₹${project.totalPaid.toFixed(2)}<br>
                    Remaining Amount: ₹${project.remainingAmount.toFixed(2)}
                </p>

                <p>Please find your invoice attached as a PDF for your records.</p>
            </div>
            <div class="footer">
                <p>Thank you for your business!</p>
                <p><strong>${process.env.COMPANY_NAME || 'Pixel Mind Solutions'}</strong></p>
                <p>${process.env.COMPANY_EMAIL || 'info@pixelmindsolutions.com'} | ${process.env.COMPANY_PHONE || '+919666317749'}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}


// Send reminder email (reused from cron)
const sendReminderEmail = (clientEmail, clientName, installment, projectName) => {
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: clientEmail,
        cc: process.env.COMPANY_EMAIL || process.env.MAIL_USER,
        bcc: process.env.COMPANY_BCC_EMAIL || '',
        subject: `⏰ Installment Reminder - ${projectName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: auto; padding: 20px; }
                    .header { background: #2c3e50; color: white; padding: 15px; text-align: center; }
                    .content { padding: 20px; }
                    .details { margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                    .footer { text-align: center; padding: 15px; color: #777; border-top: 1px solid #eee; margin-top: 20px; }
                    .highlight { color: #e74c3c; font-weight: bold; }
                    .company-logo { font-size: 20px; font-weight: bold; color: white; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="company-logo">${process.env.COMPANY_NAME || 'Your Company'}</div>
                        <h2>⏰ Installment Reminder</h2>
                    </div>
                    <div class="content">
                        <h3>Hello ${clientName},</h3>
                        <p>This is a reminder for your upcoming installment.</p>
                        
                        <div class="details">
                            <div class="detail-row">
                                <span><strong>Project:</strong></span>
                                <span>${projectName}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Installment:</strong></span>
                                <span>${installment.title}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Amount:</strong></span>
                                <span class="highlight">${installment.type === 'percentage' ? installment.value + '%' : '₹' + installment.value}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Due Date:</strong></span>
                                <span class="highlight">${installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span><strong>Status:</strong></span>
                                <span>${installment.status === 'pending' ? '⏳ Pending' : '✅ Paid'}</span>
                            </div>
                        </div>

                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>📌 Please Note:</strong></p>
                            <p>Please ensure the payment is completed on time to avoid any delay in the project.</p>
                            <p>If you have already made the payment, please ignore this email.</p>
                        </div>

                        <div style="text-align: center; margin: 20px 0;">
                            <p style="color: #777; font-size: 12px;">
                                This is an automated reminder. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for your business!</p>
                        <p><strong>${process.env.COMPANY_NAME || 'Your Company'}</strong></p>
                        <p>${process.env.COMPANY_EMAIL || 'info@yourcompany.com'} | ${process.env.COMPANY_PHONE || '1234567890'}</p>
                        <p style="font-size: 12px; color: #999;">
                            ${process.env.COMPANY_ADDRESS || ''}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error(`❌ Error sending email to ${clientEmail}:`, err);
        } else {
            console.log(`✅ Reminder email sent to ${clientEmail} for ${projectName}`);
            if (process.env.COMPANY_EMAIL) {
                console.log(`📧 CC sent to company: ${process.env.COMPANY_EMAIL}`);
            }
        }
    });
};

// ==================== CONTROLLER FUNCTIONS ====================

// @desc    Send reminder emails manually (same logic as cron)
// @route   POST /api/reminders/send
exports.sendReminders = async (req, res) => {
    try {
        console.log('🔄 Running installment reminder check (Manual)...');
        console.log(`⏰ Time: ${new Date().toLocaleString()}`);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);

        const projects = await Project.find({
            isDeleted: false,
            'installments.status': 'pending',
            'installments.dueDate': {
                $gte: tomorrow,
                $lt: nextDay
            }
        }).populate('clientId');

        console.log(`📋 Found ${projects.length} projects with due installments`);

        let totalReminders = 0;
        const reminderDetails = [];

        for (const project of projects) {
            const dueInstallments = project.installments.filter(i => 
                i.status === 'pending' && 
                i.dueDate && 
                new Date(i.dueDate).setHours(0,0,0,0) === tomorrow.getTime()
            );

            console.log(`  📌 Project: ${project.projectName} - ${dueInstallments.length} due installments`);

            for (const installment of dueInstallments) {
                if (project.clientId && project.clientId.email) {
                    sendReminderEmail(
                        project.clientId.email,
                        project.clientId.name || 'Client',
                        installment,
                        project.projectName
                    );
                    totalReminders++;
                    reminderDetails.push({
                        projectName: project.projectName,
                        clientName: project.clientId.name,
                        clientEmail: project.clientId.email,
                        installmentTitle: installment.title,
                        amount: installment.type === 'percentage' ? `${installment.value}%` : `₹${installment.value}`,
                        dueDate: installment.dueDate
                    });
                } else {
                    console.log(`⚠️ No email found for client: ${project.clientId?.name || 'Unknown'}`);
                }
            }
        }

        console.log(`✅ ${totalReminders} reminder emails sent for tomorrow's due installments.`);
        console.log('---');

        res.json({
            success: true,
            message: `${totalReminders} reminder emails sent successfully`,
            data: {
                totalReminders,
                reminders: reminderDetails,
                runAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error in reminder check:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get upcoming installments (preview)
// @route   GET /api/reminders/upcoming
exports.getUpcomingInstallments = async (req, res) => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);

        const projects = await Project.find({
            isDeleted: false,
            'installments.status': 'pending',
            'installments.dueDate': {
                $gte: tomorrow,
                $lt: nextDay
            }
        }).populate('clientId', 'name email mobile');

        const upcoming = [];

        for (const project of projects) {
            const dueInstallments = project.installments.filter(i => 
                i.status === 'pending' && 
                i.dueDate && 
                new Date(i.dueDate).setHours(0,0,0,0) === tomorrow.getTime()
            );

            for (const installment of dueInstallments) {
                upcoming.push({
                    projectId: project._id,
                    projectName: project.projectName,
                    clientName: project.clientId?.name || 'Unknown',
                    clientEmail: project.clientId?.email || 'No Email',
                    clientMobile: project.clientId?.mobile || 'N/A',
                    installmentId: installment._id,
                    installmentTitle: installment.title,
                    amount: installment.type === 'percentage' ? `${installment.value}%` : `₹${installment.value}`,
                    dueDate: installment.dueDate,
                    status: installment.status
                });
            }
        }

        res.json({
            success: true,
            data: {
                total: upcoming.length,
                dueDate: tomorrow.toLocaleDateString(),
                installments: upcoming
            }
        });
    } catch (error) {
        console.error('❌ Error in getUpcomingInstallments:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Send test reminder for specific project
// @route   POST /api/reminders/test/:projectId
exports.sendTestReminder = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { installmentId } = req.body;

        const project = await Project.findById(projectId).populate('clientId');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        let installment;
        if (installmentId) {
            installment = project.installments.id(installmentId);
            if (!installment) {
                return res.status(404).json({
                    success: false,
                    message: 'Installment not found'
                });
            }
        } else {
            // Get first pending installment
            installment = project.installments.find(i => i.status === 'pending');
            if (!installment) {
                return res.status(404).json({
                    success: false,
                    message: 'No pending installment found'
                });
            }
        }

        if (!project.clientId || !project.clientId.email) {
            return res.status(400).json({
                success: false,
                message: 'Client has no email address'
            });
        }

        // Send test email
        sendReminderEmail(
            project.clientId.email,
            project.clientId.name || 'Client',
            installment,
            project.projectName
        );

        res.json({
            success: true,
            message: 'Test reminder sent successfully',
            data: {
                projectName: project.projectName,
                clientName: project.clientId.name,
                clientEmail: project.clientId.email,
                installmentTitle: installment.title,
                amount: installment.type === 'percentage' ? `${installment.value}%` : `₹${installment.value}`,
                dueDate: installment.dueDate,
                sentAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error in sendTestReminder:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get reminder statistics
// @route   GET /api/reminders/stats
exports.getReminderStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);

        // Total pending installments
        const totalPending = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$installments' },
            { $match: { 'installments.status': 'pending' } },
            { $count: 'total' }
        ]);

        // Due today
        const dueToday = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$installments' },
            { 
                $match: { 
                    'installments.status': 'pending',
                    'installments.dueDate': {
                        $gte: today,
                        $lt: tomorrow
                    }
                }
            },
            { $count: 'total' }
        ]);

        // Due tomorrow
        const dueTomorrow = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$installments' },
            { 
                $match: { 
                    'installments.status': 'pending',
                    'installments.dueDate': {
                        $gte: tomorrow,
                        $lt: nextDay
                    }
                }
            },
            { $count: 'total' }
        ]);

        // Overdue
        const overdue = await Project.aggregate([
            { $match: { isDeleted: false } },
            { $unwind: '$installments' },
            { 
                $match: { 
                    'installments.status': 'pending',
                    'installments.dueDate': { $lt: today }
                }
            },
            { $count: 'total' }
        ]);

        res.json({
            success: true,
            data: {
                totalPending: totalPending[0]?.total || 0,
                dueToday: dueToday[0]?.total || 0,
                dueTomorrow: dueTomorrow[0]?.total || 0,
                overdue: overdue[0]?.total || 0,
                asOf: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Error in getReminderStats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// ==================== INVOICE CONTROLLERS ====================

exports.getInvoices = async (req, res) => {
    try {
        const { 
            id, 
            projectId, 
            clientId, 
            status, 
            page = 1, 
            limit = 10 
        } = req.query;

        // ============ GET BY ID ============
        if (id) {
            const invoice = await Invoice.findById(id)
                .populate('clientId', 'name email mobile address')
                .populate('projectId', 'projectName projectId category');

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            return res.json({
                success: true,
                data: invoice
            });
        }

        // ============ BUILD QUERY ============
        const query = {};

        if (projectId) query.projectId = projectId;
        if (clientId) query.clientId = clientId;
        if (status) query.status = status;

        // ============ GET ALL OR FILTERED ============
        const total = await Invoice.countDocuments(query);
        const invoices = await Invoice.find(query)
            .populate('clientId', 'name email mobile address')
            .populate('projectId', 'projectName projectId category')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        // Calculate total amount
        const totalAmount = await Invoice.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // Check if no invoices found
        if (invoices.length === 0) {
            let message = 'No invoices found';
            if (projectId) message = 'No invoices found for this project';
            if (clientId) message = 'No invoices found for this client';
            
            return res.status(404).json({
                success: false,
                message: message
            });
        }

        // ============ RESPONSE ============
        const response = {
            success: true,
            data: invoices,
            total: invoices.length,
            totalAmount: totalAmount[0]?.total || 0,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
                total: total
            }
        };

        // Add filter info
        if (projectId) response.filter = { projectId };
        if (clientId) response.filter = { clientId };
        if (status) response.filter = { ...response.filter, status };

        res.json(response);

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
exports.getInvoiceStats = async (req, res) => {
    try {
        const total = await Invoice.countDocuments();
        const sent = await Invoice.countDocuments({ status: 'sent' });
        const paid = await Invoice.countDocuments({ status: 'paid' });
        const generated = await Invoice.countDocuments({ status: 'generated' });
        const overdue = await Invoice.countDocuments({ status: 'overdue' });

        const totalAmount = await Invoice.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            success: true,
            data: {
                total,
                sent,
                paid,
                generated,
                overdue,
                totalAmount: totalAmount[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Get invoice stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};




// @desc    Get tomorrow's reminders
// @route   GET /api/projects/tomorrowreminders
exports.getTomorrowReminders = async (req, res) => {
    try {
        // Get tomorrow's date as string (YYYY-MM-DD)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        console.log(`📅 Tomorrow's date: ${tomorrowStr}`);

        // Find ALL projects with pending installments (not deleted)
        const projects = await Project.find({
            isDeleted: false
        }).populate('clientId', 'name email mobile address');

        console.log(`📋 Found ${projects.length} total active projects`);

        const reminders = [];
        let totalDueTomorrow = 0;

        for (const project of projects) {
            // Filter pending installments due tomorrow
            const dueInstallments = project.installments.filter(i => {
                if (i.status !== 'pending') return false;
                if (!i.dueDate) return false;
                
                // Compare date strings (YYYY-MM-DD)
                const dueDateStr = new Date(i.dueDate).toISOString().split('T')[0];
                return dueDateStr === tomorrowStr;
            });

            if (dueInstallments.length === 0) continue;

            console.log(`✅ Project: ${project.projectName} - ${dueInstallments.length} installments due tomorrow`);

            for (const installment of dueInstallments) {
                let amount = 0;
                if (installment.type === 'percentage') {
                    amount = (installment.value / 100) * project.projectCost;
                } else {
                    amount = installment.value;
                }

                totalDueTomorrow++;
                reminders.push({
                    projectId: project._id,
                    projectName: project.projectName,
                    projectCost: project.projectCost,
                    client: {
                        _id: project.clientId?._id,
                        name: project.clientId?.name || 'Unknown Client',
                        email: project.clientId?.email || 'No Email',
                        mobile: project.clientId?.mobile || 'N/A',
                        address: project.clientId?.address || ''
                    },
                    installment: {
                        _id: installment._id,
                        title: installment.title,
                        type: installment.type,
                        value: installment.value,
                        amount: amount,
                        dueDate: installment.dueDate,
                        status: installment.status
                    }
                });
            }
        }

        res.json({
            success: true,
            data: {
                dueDate: tomorrowStr,
                totalDueTomorrow: totalDueTomorrow,
                totalClients: new Set(reminders.map(r => r.client._id?.toString())).size,
                reminders: reminders
            }
        });
    } catch (error) {
        console.error('❌ Error in getTomorrowReminders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    DEBUG: Check all pending installments and their due dates
// @route   GET /api/reminders/debug
exports.debugReminders = async (req, res) => {
    try {
        // Get ALL projects with pending installments
        const projects = await Project.find({
            isDeleted: false,
            'installments.status': 'pending'
        }).populate('clientId', 'name email');

        console.log(`📋 Found ${projects.length} projects with pending installments`);

        const result = {
            totalProjects: projects.length,
            totalPendingInstallments: 0,
            installments: []
        };

        for (const project of projects) {
            const pendingInstallments = project.installments.filter(i => i.status === 'pending');
            
            console.log(`📌 Project: ${project.projectName} - ${pendingInstallments.length} pending installments`);

            for (const installment of pendingInstallments) {
                result.totalPendingInstallments++;
                
                // Calculate amount
                let amount = 0;
                if (installment.type === 'percentage') {
                    amount = (installment.value / 100) * project.projectCost;
                } else {
                    amount = installment.value;
                }

                result.installments.push({
                    projectName: project.projectName,
                    projectId: project._id,
                    installmentId: installment._id,
                    title: installment.title,
                    type: installment.type,
                    value: installment.value,
                    amount: amount,
                    dueDate: installment.dueDate,
                    dueDateType: typeof installment.dueDate,
                    dueDateString: installment.dueDate ? installment.dueDate.toString() : 'null',
                    status: installment.status,
                    clientName: project.clientId?.name || 'No Client',
                    clientEmail: project.clientId?.email || 'No Email'
                });

                console.log(`   📅 Installment: ${installment.title} - Due: ${installment.dueDate}`);
            }
        }

        // Check tomorrow's date
        const now = new Date();
        const tomorrow = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0, 0, 0, 0
        ));
        
        const tomorrowStr = tomorrow.toISOString();
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        console.log(`📅 Tomorrow (UTC): ${tomorrowStr}`);
        console.log(`📅 Tomorrow (Date only): ${tomorrowDate}`);

        // Filter installments due tomorrow
        const dueTomorrow = result.installments.filter(i => {
            if (!i.dueDate) return false;
            const dueDateStr = i.dueDate.split('T')[0]; // Get YYYY-MM-DD
            return dueDateStr === tomorrowDate;
        });

        result.dueTomorrow = {
            count: dueTomorrow.length,
            installments: dueTomorrow
        };

        res.json({
            success: true,
            data: {
                debug: result,
                tomorrow: {
                    date: tomorrowStr,
                    dateOnly: tomorrowDate
                },
                query: {
                    isDeleted: false,
                    'installments.status': 'pending',
                    'installments.dueDate': {
                        $gte: tomorrow,
                        $lt: new Date(Date.UTC(
                            now.getUTCFullYear(),
                            now.getUTCMonth(),
                            now.getUTCDate() + 2,
                            0, 0, 0, 0
                        ))
                    }
                }
            }
        });
    } catch (error) {
        console.error('❌ Debug error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};