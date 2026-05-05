const mongoose = require('mongoose');
const { Staff, StaffDocument } = require('../Models/Staff.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || "http://31.97.206.144:5000";

// ==================== HELPER FUNCTIONS ====================

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getFileType = (fileName) => {
  const extension = path.extname(fileName).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const pdfExtensions = ['.pdf'];
  const docExtensions = ['.doc', '.docx'];
  
  if (imageExtensions.includes(extension)) return extension.substring(1);
  if (pdfExtensions.includes(extension)) return 'pdf';
  if (docExtensions.includes(extension)) return 'doc';
  return 'other';
};

const generateBatchId = (employeeId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `BATCH_${employeeId}_${year}${month}${day}_${hours}${minutes}${seconds}`;
};

// ==================== STAFF CRUD OPERATIONS ====================

const createStaff = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      role,
      mobile,
      email,
      joiningDate,
      bloodGroup,
      password,
      address,
      emergencyContact
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required. Please provide a valid Employee ID."
      });
    }
    
    if (!employeeName || !role || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields: employeeName, role, mobile, email, password"
      });
    }

    let existingStaff = await Staff.findOne({ employeeId });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists"
      });
    }
    
    existingStaff = await Staff.findOne({ $or: [{ email }, { mobile }] });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff with this email or mobile already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profileImageUrl = null;
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const profileFile = req.files.profileImage[0];
      const profileUploadDir = path.join(__dirname, '../uploads/staff/profile');
      ensureDirectoryExists(profileUploadDir);
      
      const fileName = `${employeeId}_profile_${Date.now()}${path.extname(profileFile.originalname)}`;
      const finalPath = path.join(profileUploadDir, fileName);
      
      fs.renameSync(profileFile.path, finalPath);
      profileImageUrl = `${BASE_URL}/uploads/staff/profile/${fileName}`;
    }

    let idCardImageUrl = null;
    if (req.files && req.files.idCardImage && req.files.idCardImage[0]) {
      const idFile = req.files.idCardImage[0];
      const idUploadDir = path.join(__dirname, '../uploads/staff/idcards');
      ensureDirectoryExists(idUploadDir);
      
      const fileName = `${employeeId}_idcard_${Date.now()}${path.extname(idFile.originalname)}`;
      const finalPath = path.join(idUploadDir, fileName);
      
      fs.renameSync(idFile.path, finalPath);
      idCardImageUrl = `${BASE_URL}/uploads/staff/idcards/${fileName}`;
    }

    let addressObj = {};
    if (address) {
      addressObj = typeof address === 'string' ? JSON.parse(address) : address;
    }

    let emergencyObj = {};
    if (emergencyContact) {
      emergencyObj = typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyObj;
    }

    const staff = new Staff({
      employeeId,
      employeeName,
      role,
      mobile,
      email,
      joiningDate: joiningDate || Date.now(),
      bloodGroup: bloodGroup || 'Unknown',
      password: hashedPassword,
      profileImage: profileImageUrl,
      idCardImage: idCardImageUrl,
      address: addressObj,
      emergencyContact: emergencyObj
    });

    await staff.save();

    if (req.files && req.files.documents && req.files.documents.length > 0) {
      const documents = req.files.documents;
      const batchId = generateBatchId(employeeId);
      const docDir = path.join(__dirname, '../uploads/staff/documents', employeeId);
      ensureDirectoryExists(docDir);
      
      for (let i = 0; i < documents.length; i++) {
        const file = documents[i];
        const fileExtension = path.extname(file.originalname);
        const fileType = getFileType(file.originalname);
        const documentName = file.originalname.replace(fileExtension, '').replace(/[_-]/g, ' ');
        const fileName = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
        const finalPath = path.join(docDir, fileName);
        
        fs.renameSync(file.path, finalPath);
        
        const docTypeKey = `documentType_${i}`;
        const docType = req.body[docTypeKey] || 'General';
        
        await StaffDocument.create({
          employeeId: staff.employeeId,
          employeeName: staff.employeeName,
          documentName: documentName,
          fileName: file.originalname,
          filePath: `${BASE_URL}/uploads/staff/documents/${employeeId}/${fileName}`,
          fileType: fileType,
          fileSize: file.size,
          mimeType: file.mimetype,
          description: `Document type: ${docType}`,
          batchId: batchId,
          uploadedAt: new Date()
        });
      }
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password;

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staffResponse
    });

  } catch (error) {
    console.error('Create staff error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating staff'
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

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

const getStaffOptions = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName role')
      .sort({ employeeName: 1 });

    const options = staff.map(s => ({
      employeeId: s.employeeId,
      employeeName: s.employeeName,
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

const getStaffByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const staff = await Staff.findOne({ employeeId }).select('-password');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    res.json({
      success: true,
      data: staff
    });

  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateStaff = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = { ...req.body };

    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    if (updateData.password && updateData.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const profileFile = req.files.profileImage[0];
      const uploadDir = path.join(__dirname, '../uploads/staff/profile');
      ensureDirectoryExists(uploadDir);
      
      if (staff.profileImage) {
        const oldImagePath = staff.profileImage.replace(BASE_URL, path.join(__dirname, '..'));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const fileName = `${employeeId}_profile_${Date.now()}${path.extname(profileFile.originalname)}`;
      const finalPath = path.join(uploadDir, fileName);
      
      fs.renameSync(profileFile.path, finalPath);
      updateData.profileImage = `${BASE_URL}/uploads/staff/profile/${fileName}`;
    }

    if (req.files && req.files.idCardImage && req.files.idCardImage[0]) {
      const idFile = req.files.idCardImage[0];
      const uploadDir = path.join(__dirname, '../uploads/staff/idcards');
      ensureDirectoryExists(uploadDir);
      
      if (staff.idCardImage) {
        const oldImagePath = staff.idCardImage.replace(BASE_URL, path.join(__dirname, '..'));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      const fileName = `${employeeId}_idcard_${Date.now()}${path.extname(idFile.originalname)}`;
      const finalPath = path.join(uploadDir, fileName);
      
      fs.renameSync(idFile.path, finalPath);
      updateData.idCardImage = `${BASE_URL}/uploads/staff/idcards/${fileName}`;
    }

    if (updateData.address && typeof updateData.address === 'string') {
      updateData.address = JSON.parse(updateData.address);
    }
    if (updateData.emergencyContact && typeof updateData.emergencyContact === 'string') {
      updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      { employeeId },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: updatedStaff
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

const deleteStaff = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const staff = await Staff.findOneAndDelete({ employeeId });
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    const documents = await StaffDocument.find({ employeeId });
    for (const doc of documents) {
      const filePath = doc.filePath.replace(BASE_URL, path.join(__dirname, '..'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await StaffDocument.deleteMany({ employeeId });

    const staffDocDir = path.join(__dirname, '../uploads/staff/documents', employeeId);
    if (fs.existsSync(staffDocDir)) {
      fs.rmSync(staffDocDir, { recursive: true, force: true });
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

const toggleStaffStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    staff.isActive = !staff.isActive;
    staff.lastActive = staff.isActive ? new Date() : null;
    await staff.save();

    res.json({
      success: true,
      message: `Staff ${staff.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        isActive: staff.isActive
      }
    });

  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== DOCUMENT OPERATIONS ====================

const uploadDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { descriptions } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one document file is required"
      });
    }

    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    const descriptionList = descriptions 
      ? descriptions.split(',').map(d => d.trim()) 
      : [];
    const batchId = generateBatchId(employeeId);
    const uploadedDocuments = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const originalName = file.originalname;
      const fileExtension = path.extname(originalName);
      const fileType = getFileType(originalName);
      const documentName = originalName.replace(fileExtension, '').replace(/[_-]/g, ' ');

      const documentData = {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        documentName: documentName,
        fileName: originalName,
        filePath: `${BASE_URL}/uploads/staff/documents/${employeeId}/${file.filename}`,
        fileType: fileType,
        fileSize: file.size,
        mimeType: file.mimetype,
        description: descriptionList[i] || `Uploaded on ${new Date().toLocaleDateString()}`,
        batchId: batchId,
        uploadedAt: new Date()
      };

      const document = await StaffDocument.create(documentData);
      uploadedDocuments.push(document);
    }

    res.status(200).json({
      success: true,
      message: `${uploadedDocuments.length} document(s) uploaded successfully`,
      data: {
        batchId: batchId,
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        totalDocuments: uploadedDocuments.length,
        documents: uploadedDocuments
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMetadata = async (req, res) => {
  try {
    const roles = [
      "Admin", "Manager", "Staff", "Full Stack Developer", 
      "Teacher", "Accountant", "Librarian", "Other"
    ];
    
    const bloodGroups = [
      "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"
    ];
    
    res.status(200).json({
      success: true,
      roles: roles,
      bloodGroups: bloodGroups
    });
    
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch metadata'
    });
  }
};

const getDocumentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const documents = await StaffDocument.find({ employeeId })
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentsByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const documents = await StaffDocument.find({ batchId })
      .sort({ uploadedAt: 1 });

    res.json({
      success: true,
      count: documents.length,
      batchId: batchId,
      data: documents
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentsByType = async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { employeeId } = req.query;
    
    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Search term must be a valid string"
      });
    }
    
    const cleanTerm = searchTerm.trim();
    
    let query = {
      $or: [
        { fileType: { $regex: cleanTerm, $options: 'i' } },
        { description: { $regex: cleanTerm, $options: 'i' } },
        { documentName: { $regex: cleanTerm, $options: 'i' } },
        { fileName: { $regex: cleanTerm, $options: 'i' } }
      ]
    };
    
    if (employeeId && typeof employeeId === 'string') {
      query.employeeId = employeeId;
    }
    
    const documents = await StaffDocument.find(query)
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      searchTerm: cleanTerm,
      data: documents
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentsByDateRange = async (req, res) => {
  try {
    const { start, end, employeeId } = req.query;
    
    let query = {};
    
    if (start && end) {
      query.uploadedAt = {
        $gte: new Date(start),
        $lte: new Date(end + 'T23:59:59')
      };
    }
    
    if (employeeId) query.employeeId = employeeId;
    
    const documents = await StaffDocument.find(query)
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      dateRange: { start, end },
      data: documents
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentStats = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const stats = await StaffDocument.aggregate([
      { $match: { employeeId: employeeId } },
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalDocuments = await StaffDocument.countDocuments({ employeeId });
    const totalSize = await StaffDocument.aggregate([
      { $match: { employeeId: employeeId } },
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);

    res.json({
      success: true,
      data: {
        employeeId: employeeId,
        totalDocuments: totalDocuments,
        totalSizeBytes: totalSize[0]?.total || 0,
        totalSizeMB: ((totalSize[0]?.total || 0) / (1024 * 1024)).toFixed(2),
        byFileType: stats
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const document = await StaffDocument.findOneAndDelete({ documentId });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }
    
    const filePath = document.filePath.replace(BASE_URL, path.join(__dirname, '..'));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const documents = await StaffDocument.find({ employeeId });
    
    for (const doc of documents) {
      const filePath = doc.filePath.replace(BASE_URL, path.join(__dirname, '..'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const result = await StaffDocument.deleteMany({ employeeId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} documents for employee ${employeeId}`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const documents = await StaffDocument.find({ batchId });
    
    for (const doc of documents) {
      const filePath = doc.filePath.replace(BASE_URL, path.join(__dirname, '..'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const result = await StaffDocument.deleteMany({ batchId });

    res.json({
      success: true,
      message: `Deleted batch ${batchId} with ${result.deletedCount} documents`
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadSingle = async (req, res) => {
  try {
    res.json({
      success: true,
      file: req.file,
      body: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadMultiple = async (req, res) => {
  try {
    res.json({
      success: true,
      count: req.files.length,
      files: req.files,
      body: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadMixed = async (req, res) => {
  try {
    res.json({
      success: true,
      profile: req.files.profileImage?.[0],
      documents: req.files.documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getStaffOptions,
  getStaffByEmployeeId,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  uploadDocuments,
  getMetadata,
  getDocumentsByEmployeeId,
  getDocumentsByBatchId,
  getDocumentsByType,
  getDocumentsByDateRange,
  getDocumentStats,
  deleteDocument,
  deleteAllEmployeeDocuments,
  deleteBatch,
  uploadSingle,
  uploadMultiple,
  uploadMixed
};