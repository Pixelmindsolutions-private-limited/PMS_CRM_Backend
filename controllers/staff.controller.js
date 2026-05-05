const mongoose = require('mongoose');
const { Staff, StaffDocument } = require('../Models/Staff.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || "http://31.97.206.144:5000";

// ==================== HELPER FUNCTIONS ====================

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Get file type from extension
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

// Generate Batch ID
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

// @desc    Create new staff
// @route   POST /api/staff/create
const createStaff = async (req, res) => {
  try {
    console.log('📝 Creating new staff');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files ? Object.keys(req.files) : 'no files');
    
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
        message: "Employee ID is required",
        receivedBody: req.body
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
      
      console.log(`✅ Uploaded ${documents.length} document(s)`);
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password;

    console.log('✅ Staff created successfully:', staff.employeeId);

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

// @desc    Get all staff members
// @route   GET /api/staff/all
const getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by status
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

// @desc    Get staff options for dropdown
// @route   GET /api/staff/options
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

// @desc    Get staff by Employee ID
// @route   GET /api/staff/:employeeId
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

// @desc    Update staff
// @route   PUT /api/staff/:employeeId
const updateStaff = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = req.body;

    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`
      });
    }

    // Handle password update
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Handle profile image update
    if (req.files && req.files.profileImage) {
      const uploadDir = path.join(__dirname, '../uploads/staff/profile');
      ensureDirectoryExists(uploadDir);
      
      const imageFile = req.files.profileImage;
      const fileName = `${Date.now()}_${imageFile.name.replace(/\s/g, '_')}`;
      const uploadPath = path.join(uploadDir, fileName);
      await imageFile.mv(uploadPath);
      updateData.profileImage = `${BASE_URL}/uploads/staff/profile/${fileName}`;
    }

    // Parse JSON fields
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

// @desc    Delete staff
// @route   DELETE /api/staff/:employeeId
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

    // Delete all documents of this staff
    const documents = await StaffDocument.find({ employeeId });
    for (const doc of documents) {
      const filePath = doc.filePath.replace(BASE_URL, path.join(__dirname, '..'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await StaffDocument.deleteMany({ employeeId });

    // Delete staff folders
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

// @desc    Toggle staff status
// @route   PATCH /api/staff/:employeeId/toggle-status
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
// In staff.controller.js - uploadDocuments function
const uploadDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { descriptions } = req.body;

    console.log(`📄 Uploading documents for staff: ${employeeId}`);
    
    // ✅ Multer puts files in req.files (array)
    console.log('📁 req.files:', req.files);
    console.log('📝 req.body:', req.body);

    // Check if files exist
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one document file is required"
      });
    }

    // Find staff
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

    // ✅ Multer file object uses: originalname, filename, size, mimetype
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const originalName = file.originalname;  // ← Multer uses 'originalname'
      const fileExtension = path.extname(originalName);
      const fileType = getFileType(originalName);
      const documentName = originalName.replace(fileExtension, '').replace(/[_-]/g, ' ');

      const documentData = {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        documentName: documentName,
        fileName: originalName,
        filePath: `${BASE_URL}/uploads/staff/documents/${employeeId}/${file.filename}`, // ← Multer uses 'filename'
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

    console.log(`✅ Uploaded ${uploadedDocuments.length} document(s)`);

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
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ALL documents for an employee
// @route   GET /api/staff/documents/employee/:employeeId
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

// @desc    Get documents by batch ID
// @route   GET /api/staff/documents/batch/:batchId
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

// @desc    Get documents by type, description, document name, or file name
// @route   GET /api/staff/documents/type/:searchTerm
const getDocumentsByType = async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { employeeId } = req.query;
    
    // ✅ Validate searchTerm is a string
    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Search term must be a valid string"
      });
    }
    
    // Clean the search term
    const cleanTerm = searchTerm.trim();
    
    // Build query - NOW searches ALL 4 fields
    let query = {
      $or: [
        { fileType: { $regex: cleanTerm, $options: 'i' } },
        { description: { $regex: cleanTerm, $options: 'i' } },
        { documentName: { $regex: cleanTerm, $options: 'i' } },
        { fileName: { $regex: cleanTerm, $options: 'i' } }  // ✅ ADDED
      ]
    };
    
    // Add employee filter if provided
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


// @desc    Get documents by date range
// @route   GET /api/staff/documents/date-range
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



// @desc    Get document statistics
// @route   GET /api/staff/documents/stats/:employeeId
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

// @desc    Delete a single document
// @route   DELETE /api/staff/documents/:documentId
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
    
    // Delete physical file
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

// @desc    Delete all documents of an employee
// @route   DELETE /api/staff/documents/employee/:employeeId
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

// @desc    Delete a batch of documents
// @route   DELETE /api/staff/documents/batch/:batchId
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
// For upload.single('profileImage')
const uploadSingle = async (req, res) => {
  try {
    // req.file contains the uploaded file
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    res.json({
      success: true,
      file: req.file,
      body: req.body
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// For upload.array('documents', 10)
const uploadMultiple = async (req, res) => {
  try {
    // req.files is an array
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    
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

// For upload.fields([...])
const uploadMixed = async (req, res) => {
  try {
    console.log('Profile:', req.files.profileImage?.[0]);
    console.log('Documents:', req.files.documents);
    
    res.json({
      success: true,
      profile: req.files.profileImage?.[0],
      documents: req.files.documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all functions
module.exports = {
  createStaff,
  getAllStaff,
  getStaffOptions,
  getStaffByEmployeeId,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
  uploadDocuments,
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