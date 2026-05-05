const Project = require('../Models/Project.js');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// @desc    Create new project
// @route   POST /api/projects
const createProject = async (req, res) => {
  try {
    const projectData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      const uploadDir = path.join(__dirname, '../uploads/projects');
      ensureDirectoryExists(uploadDir);

      if (req.files.uploadfile && req.files.uploadfile[0]) {
        const file = req.files.uploadfile[0];
        const fileName = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(uploadDir, fileName);
        fs.renameSync(file.path, finalPath);
        projectData.uploadfile = `${BASE_URL}/uploads/projects/${fileName}`;
      }

      if (req.files.quotationfile && req.files.quotationfile[0]) {
        const file = req.files.quotationfile[0];
        const fileName = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(uploadDir, fileName);
        fs.renameSync(file.path, finalPath);
        projectData.quotationfile = `${BASE_URL}/uploads/projects/${fileName}`;
      }
    }

    // Parse JSON fields if they are strings
    if (projectData.appDetails && typeof projectData.appDetails === 'string') {
      projectData.appDetails = JSON.parse(projectData.appDetails);
    }
    if (projectData.marketing && typeof projectData.marketing === 'string') {
      projectData.marketing = JSON.parse(projectData.marketing);
    }
    if (projectData.budgetInstallments && typeof projectData.budgetInstallments === 'string') {
      projectData.budgetInstallments = JSON.parse(projectData.budgetInstallments);
    }
    if (projectData.milestonePayments && typeof projectData.milestonePayments === 'string') {
      projectData.milestonePayments = JSON.parse(projectData.milestonePayments);
    }
    if (projectData.teamMembers && typeof projectData.teamMembers === 'string') {
      projectData.teamMembers = JSON.parse(projectData.teamMembers);
    }

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating project'
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;

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

    // Handle file uploads
    if (req.files) {
      const uploadDir = path.join(__dirname, '../uploads/projects');
      ensureDirectoryExists(uploadDir);

      if (req.files.uploadfile && req.files.uploadfile[0]) {
        // Delete old file if exists
        if (project.uploadfile) {
          const oldPath = project.uploadfile.replace(BASE_URL, path.join(__dirname, '..'));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        const file = req.files.uploadfile[0];
        const fileName = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(uploadDir, fileName);
        fs.renameSync(file.path, finalPath);
        updateData.uploadfile = `${BASE_URL}/uploads/projects/${fileName}`;
      }

      if (req.files.quotationfile && req.files.quotationfile[0]) {
        if (project.quotationfile) {
          const oldPath = project.quotationfile.replace(BASE_URL, path.join(__dirname, '..'));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        const file = req.files.quotationfile[0];
        const fileName = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(uploadDir, fileName);
        fs.renameSync(file.path, finalPath);
        updateData.quotationfile = `${BASE_URL}/uploads/projects/${fileName}`;
      }
    }

    // Parse JSON fields
    const jsonFields = ['appDetails', 'marketing', 'budgetInstallments', 'milestonePayments', 'teamMembers'];
    jsonFields.forEach(field => {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = JSON.parse(updateData[field]);
      }
    });

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
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

    // Delete associated files
    const filesToDelete = [project.uploadfile, project.quotationfile];
    filesToDelete.forEach(filePath => {
      if (filePath) {
        const fullPath = filePath.replace(BASE_URL, path.join(__dirname, '..'));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      }
    });

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

    res.json({
      success: true,
      data: {
        total,
        active,
        completed,
        onHold,
        cancelled,
        categoryStats
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

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats
};