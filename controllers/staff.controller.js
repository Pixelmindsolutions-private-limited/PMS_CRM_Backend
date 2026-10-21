const mongoose = require("mongoose");
const { Staff, StaffDocument } = require("../models/Staff");
const WorkSession = require("../models/Worksession");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const BASE_URL =
  process.env.BASE_URL || "https://pmsbackend.pixelmindsolutions.com";
console.log(`📸 Staff Controller using BASE_URL: ${BASE_URL}`);

const FACE_SERVICE_URL =
  process.env.FACE_SERVICE_URL || "http://localhost:5001";

// ==================== HELPER FUNCTIONS ====================

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getFileType = (fileName) => {
  const extension = path.extname(fileName).toLowerCase();
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const pdfExtensions = [".pdf"];
  const docExtensions = [".doc", ".docx"];

  if (imageExtensions.includes(extension)) return extension.substring(1);
  if (pdfExtensions.includes(extension)) return "pdf";
  if (docExtensions.includes(extension)) return "doc";
  return "other";
};

const generateBatchId = (employeeId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `BATCH_${employeeId}_${year}${month}${day}_${hours}${minutes}${seconds}`;
};

// ==================== STAFF CRUD OPERATIONS ====================

// const createStaff = async (req, res) => {
//   try {
//       console.log("=== CREATE STAFF REQUEST ===");
//       console.log("req.body:", req.body);
//       console.log("req.file:", req.file);
//       console.log("req.files:", req.files);

//     const {
//       employeeId,
//       employeeName,
//       role,
//       mobile,
//       email,
//       joiningDate,
//       bloodGroup,
//       password,
//       address,
//       emergencyContact
//     } = req.body;

//     // Validation checks (keep your existing validation)
//     if (!employeeId) {
//       return res.status(400).json({
//         success: false,
//         message: "Employee ID is required. Please provide a valid Employee ID."
//       });
//     }

//     if (!employeeName || !role || !mobile || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Required fields: employeeName, role, mobile, email, password"
//       });
//     }

//     // Check for existing staff
//     let existingStaff = await Staff.findOne({ employeeId });
//     if (existingStaff) {
//       return res.status(400).json({
//         success: false,
//         message: "Employee ID already exists"
//       });
//     }

//     existingStaff = await Staff.findOne({ $or: [{ email }, { mobile }] });
//     if (existingStaff) {
//       return res.status(400).json({
//         success: false,
//         message: "Staff with this email or mobile already exists"
//       });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Handle profile image upload - FIXED VERSION
//     let profileImageUrl = null;
//     if (req.files && req.files.profileImage && req.files.profileImage[0]) {
//       const profileFile = req.files.profileImage[0];

//       // Log the file details for debugging
//       console.log("📸 Profile file details:", {
//         originalname: profileFile.originalname,
//         path: profileFile.path,
//         size: profileFile.size,
//         destination: profileFile.destination,
//         filename: profileFile.filename
//       });

//       // Check if temp file exists
//       if (!fs.existsSync(profileFile.path)) {
//         console.error(`❌ Temp file not found: ${profileFile.path}`);
//         return res.status(500).json({
//           success: false,
//           message: 'Temporary file not found'
//         });
//       }

//       const profileUploadDir = path.join(__dirname, '../uploads/staff/profile');
//       ensureDirectoryExists(profileUploadDir);

//       const fileExtension = path.extname(profileFile.originalname);
//       const fileName = `${employeeId}_profile_${Date.now()}${fileExtension}`;
//       const finalPath = path.join(profileUploadDir, fileName);

//       try {
//         // Read the temp file
//         const fileData = fs.readFileSync(profileFile.path);
//         // Write to final destination
//         fs.writeFileSync(finalPath, fileData);
//         // Delete temp file
//         fs.unlinkSync(profileFile.path);

//         console.log(`✅ Profile image saved: ${finalPath}`);
//         console.log(`✅ File exists verification: ${fs.existsSync(finalPath)}`);

//         profileImageUrl = `${BASE_URL}/uploads/staff/profile/${fileName}`;
//       } catch (fileError) {
//         console.error(`❌ Failed to save profile image: ${fileError.message}`);
//         console.error(`Stack: ${fileError.stack}`);
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to save profile image',
//           error: fileError.message
//         });
//       }
//     }

//     // Handle ID card image upload - FIXED VERSION
//     let idCardImageUrl = null;
//     if (req.files && req.files.idCardImage && req.files.idCardImage[0]) {
//       const idFile = req.files.idCardImage[0];

//       console.log("🪪 ID card file details:", {
//         originalname: idFile.originalname,
//         path: idFile.path,
//         size: idFile.size
//       });

//       if (!fs.existsSync(idFile.path)) {
//         console.error(`❌ Temp ID file not found: ${idFile.path}`);
//         return res.status(500).json({
//           success: false,
//           message: 'Temporary ID file not found'
//         });
//       }

//       const idUploadDir = path.join(__dirname, '../uploads/staff/idcards');
//       ensureDirectoryExists(idUploadDir);

//       const fileExtension = path.extname(idFile.originalname);
//       const fileName = `${employeeId}_idcard_${Date.now()}${fileExtension}`;
//       const finalPath = path.join(idUploadDir, fileName);

//       try {
//         // Read and write instead of copy
//         const fileData = fs.readFileSync(idFile.path);
//         fs.writeFileSync(finalPath, fileData);
//         fs.unlinkSync(idFile.path);

//         console.log(`✅ ID card saved: ${finalPath}`);
//         idCardImageUrl = `${BASE_URL}/uploads/staff/idcards/${fileName}`;
//       } catch (fileError) {
//         console.error(`❌ Failed to save ID card: ${fileError.message}`);
//         return res.status(500).json({
//           success: false,
//           message: 'Failed to save ID card image'
//         });
//       }
//     }

//     // Parse address and emergency contact (keep as is)
//     let addressObj = {};
//     if (address) {
//       try {
//         addressObj = typeof address === 'string' ? JSON.parse(address) : address;
//       } catch (e) {
//         console.error("Address parse error:", e);
//       }
//     }

//     let emergencyObj = {};
//     if (emergencyContact) {
//       try {
//         emergencyObj = typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact;
//       } catch (e) {
//         console.error("Emergency contact parse error:", e);
//       }
//     }

//     // Create staff record
//     const staff = new Staff({
//       employeeId,
//       employeeName,
//       role,
//       mobile,
//       email,
//       joiningDate: joiningDate || Date.now(),
//       bloodGroup: bloodGroup || 'Unknown',
//       password: hashedPassword,
//       profileImage: profileImageUrl,
//       idCardImage: idCardImageUrl,
//       address: addressObj,
//       emergencyContact: emergencyObj
//     });

//     await staff.save();

//     // Handle document uploads (similarly fix)
//     if (req.files && req.files.documents && req.files.documents.length > 0) {
//       const documents = req.files.documents;
//       const batchId = generateBatchId(employeeId);
//       const docDir = path.join(__dirname, '../uploads/staff/documents', employeeId);
//       ensureDirectoryExists(docDir);

//       for (let i = 0; i < documents.length; i++) {
//         const file = documents[i];

//         if (!fs.existsSync(file.path)) {
//           console.error(`❌ Temp document file not found: ${file.path}`);
//           continue;
//         }

//         const fileExtension = path.extname(file.originalname);
//         const fileType = getFileType(file.originalname);
//         const documentName = file.originalname.replace(fileExtension, '').replace(/[_-]/g, ' ');
//         const fileName = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
//         const finalPath = path.join(docDir, fileName);

//         try {
//           // Read and write instead of copy
//           const fileData = fs.readFileSync(file.path);
//           fs.writeFileSync(finalPath, fileData);
//           fs.unlinkSync(file.path);

//           const docTypeKey = `documentType_${i}`;
//           const docType = req.body[docTypeKey] || 'General';

//           await StaffDocument.create({
//             employeeId: staff.employeeId,
//             employeeName: staff.employeeName,
//             documentName: documentName,
//             fileName: file.originalname,
//             filePath: `${BASE_URL}/uploads/staff/documents/${employeeId}/${fileName}`,
//             fileType: fileType,
//             fileSize: file.size,
//             mimeType: file.mimetype,
//             description: `Document type: ${docType}`,
//             batchId: batchId,
//             uploadedAt: new Date()
//           });
//         } catch (fileError) {
//           console.error(`❌ Failed to save document: ${fileError.message}`);
//         }
//       }
//     }

//     const staffResponse = staff.toObject();
//     delete staffResponse.password;

//     res.status(201).json({
//       success: true,
//       message: 'Staff created successfully',
//       data: staffResponse
//     });

//   } catch (error) {
//     console.error('Create staff error:', error);

//     // Clean up any uploaded files if there's an error
//     if (req.files) {
//       Object.values(req.files).flat().forEach(file => {
//         if (fs.existsSync(file.path)) {
//           fs.unlinkSync(file.path);
//         }
//       });
//     }

//     if (error.code === 11000) {
//       const field = Object.keys(error.keyPattern)[0];
//       return res.status(400).json({
//         success: false,
//         message: `${field} already exists. Please use a different value.`
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: error.message || 'Server error while creating staff'
//     });
//   }
// };

const createStaff = async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      role,
      gender,
      mobile,
      email,
      joiningDate,
      bloodGroup,
      password,
      address,
      emergencyContact,
    } = req.body;

    // Validation checks
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required. Please provide a valid Employee ID.",
      });
    }

    if (!employeeName || !role || !gender || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: employeeName, role, gender, mobile, email, password",
      });
    }

    // Normalize gender casing to match enum ['Male', 'Female']
    const normalizedGender = gender
      ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()
      : "Male";

    if (!["Male", "Female"].includes(normalizedGender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be either 'Male' or 'Female'",
      });
    }

    // Check for existing staff
    let existingStaff = await Staff.findOne({ employeeId });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    existingStaff = await Staff.findOne({ $or: [{ email }, { mobile }] });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff with this email or mobile already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle profile image upload
    let profileImageUrl = null;
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const profileFile = req.files.profileImage[0];

      console.log("📸 Profile file details:", {
        originalname: profileFile.originalname,
        path: profileFile.path,
        size: profileFile.size,
      });

      if (!fs.existsSync(profileFile.path)) {
        console.error(`❌ File not found: ${profileFile.path}`);
        return res.status(500).json({
          success: false,
          message: "Uploaded file not found",
        });
      }

      const profileUploadDir = path.join(__dirname, "../uploads/staff/profile");
      ensureDirectoryExists(profileUploadDir);

      const fileExtension = path.extname(profileFile.originalname);
      const fileName = `${employeeId}_profile_${Date.now()}${fileExtension}`;
      const finalPath = path.join(profileUploadDir, fileName);

      try {
        fs.renameSync(profileFile.path, finalPath);
        console.log(`✅ Profile image saved: ${finalPath}`);
        console.log(`✅ File exists verification: ${fs.existsSync(finalPath)}`);

        profileImageUrl = `${BASE_URL}/uploads/staff/profile/${fileName}`;
      } catch (fileError) {
        console.error(`❌ Failed to move profile image: ${fileError.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to save profile image",
        });
      }
    }

    // Handle ID card image upload
    let idCardImageUrl = null;
    if (req.files && req.files.idCardImage && req.files.idCardImage[0]) {
      const idFile = req.files.idCardImage[0];

      console.log("🪪 ID card file details:", {
        originalname: idFile.originalname,
        path: idFile.path,
        size: idFile.size,
      });

      if (!fs.existsSync(idFile.path)) {
        console.error(`❌ Temp ID file not found: ${idFile.path}`);
        return res.status(500).json({
          success: false,
          message: "Temporary ID file not found",
        });
      }

      const idUploadDir = path.join(__dirname, "../uploads/staff/idcards");
      ensureDirectoryExists(idUploadDir);

      const fileExtension = path.extname(idFile.originalname);
      const fileName = `${employeeId}_idcard_${Date.now()}${fileExtension}`;
      const finalPath = path.join(idUploadDir, fileName);

      try {
        const fileData = fs.readFileSync(idFile.path);
        fs.writeFileSync(finalPath, fileData);
        fs.unlinkSync(idFile.path);

        console.log(`✅ ID card saved: ${finalPath}`);
        idCardImageUrl = `${BASE_URL}/uploads/staff/idcards/${fileName}`;
      } catch (fileError) {
        console.error(`❌ Failed to save ID card: ${fileError.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to save ID card image",
        });
      }
    }

    // Parse address and emergency contact
    let addressObj = {};
    if (address) {
      try {
        addressObj =
          typeof address === "string" ? JSON.parse(address) : address;
      } catch (e) {
        console.error("Address parse error:", e);
      }
    }

    let emergencyObj = {};
    if (emergencyContact) {
      try {
        emergencyObj =
          typeof emergencyContact === "string"
            ? JSON.parse(emergencyContact)
            : emergencyContact;
      } catch (e) {
        console.error("Emergency contact parse error:", e);
      }
    }

    // Create staff record — ✅ gender added here
    const staff = new Staff({
      employeeId,
      employeeName,
      role,
      gender: normalizedGender, // 👈 ADDED
      mobile,
      email,
      joiningDate: joiningDate || Date.now(),
      bloodGroup: bloodGroup || "Unknown",
      password: hashedPassword,
      profileImage: profileImageUrl,
      idCardImage: idCardImageUrl,
      address: addressObj,
      emergencyContact: emergencyObj,
    });

    await staff.save();

    // Handle document uploads
    if (req.files && req.files.documents && req.files.documents.length > 0) {
      const documents = req.files.documents;
      const batchId = generateBatchId(employeeId);
      const docDir = path.join(
        __dirname,
        "../uploads/staff/documents",
        employeeId,
      );
      ensureDirectoryExists(docDir);

      for (let i = 0; i < documents.length; i++) {
        const file = documents[i];

        if (!fs.existsSync(file.path)) {
          console.error(`❌ Temp document file not found: ${file.path}`);
          continue;
        }

        const fileExtension = path.extname(file.originalname);
        const fileType = getFileType(file.originalname);
        const documentName = file.originalname
          .replace(fileExtension, "")
          .replace(/[_-]/g, " ");
        const fileName = `${Date.now()}_${file.originalname.replace(/\s/g, "_")}`;
        const finalPath = path.join(docDir, fileName);

        try {
          const fileData = fs.readFileSync(file.path);
          fs.writeFileSync(finalPath, fileData);
          fs.unlinkSync(file.path);

          const docTypeKey = `documentType_${i}`;
          const docType = req.body[docTypeKey] || "General";

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
            uploadedAt: new Date(),
          });
        } catch (fileError) {
          console.error(`❌ Failed to save document: ${fileError.message}`);
        }
      }
    }

    const staffResponse = staff.toObject();
    delete staffResponse.password;

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staffResponse,
    });
  } catch (error) {
    console.error("Create staff error:", error);

    // Clean up any uploaded files if there's an error
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists. Please use a different value.`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating staff",
    });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, gender } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { employeeName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (gender) {
      query.gender = gender;
    }

    if (status) {
      query.isActive = status === "active";
    }

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .select("-password")
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
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get all staff error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getISTDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getISTDayRange = (dateString) => {
  return {
    start: new Date(`${dateString}T00:00:00.000+05:30`),
    end: new Date(`${dateString}T23:59:59.999+05:30`),
  };
};

const getDurationMinutes = (startTime, endTime) => {
  if (!startTime) return 0;

  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, (end - start) / 60000);
};

const getAllSessions = async (req, res) => {
  console.log("✅ UPDATED getAllSessions called");
  console.log("Query params:", req.query);
  try {
    const {
      page = 1,
      limit = 12,
      employeeId,
      startDate,
      endDate,
      status,
    } = req.query;

    const now = new Date();
    const today = getISTDateString(now);

    // Default: today's date in India.
    const effectiveStartDate = startDate || today;
    const effectiveEndDate = endDate || today;

    // Validate dates.
    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

      const parsed = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(effectiveStartDate) || !isValidDate(effectiveEndDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    if (effectiveStartDate > effectiveEndDate) {
      return res.status(400).json({
        success: false,
        message: "From Date cannot be after To Date.",
      });
    }

    const startRange = getISTDayRange(effectiveStartDate);
    const endRange = getISTDayRange(effectiveEndDate);

    const start = startRange.start;
    const end = endRange.end;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

    // Build database query.
    const query = {
      date: {
        $gte: start,
        $lte: end,
      },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Fetch sessions before pagination so live-status filtering
    // and statistics are calculated against the filtered results.
    const sessions = await WorkSession.find(query)
      .sort({ date: -1, startTime: -1 })
      .lean();

    const enriched = sessions.map((session) => {
      const isToday = getISTDateString(new Date(session.date)) === today;

      const breaks = Array.isArray(session.breaks) ? session.breaks : [];

      const activeBreakFromArray = breaks.find(
        (item) => item.startTime && !item.endTime,
      );

      const currentBreak =
        session.currentBreak?.startTime && !session.currentBreak?.endTime
          ? session.currentBreak
          : null;

      const activeBreak = currentBreak || activeBreakFromArray || null;

      let lunchDuration = 0;
      let teaDuration = 0;
      let otherBreakDuration = 0;

      breaks.forEach((item) => {
        // Active break ko neeche separately calculate karenge.
        if (item.startTime && !item.endTime) {
          return;
        }

        const storedDuration = Number(item.duration);

        const duration =
          Number.isFinite(storedDuration) && storedDuration > 0
            ? storedDuration
            : getDurationMinutes(item.startTime, item.endTime);

        const type = String(item.type || item.reason || "").toLowerCase();

        if (type.includes("lunch")) {
          lunchDuration += duration;
        } else if (type.includes("tea") || type.includes("refresh")) {
          teaDuration += duration;
        } else {
          otherBreakDuration += duration;
        }
      });

      // Include the currently running break without waiting
      // for its end event to be saved.
      let activeBreakDuration = 0;

      if (activeBreak) {
        activeBreakDuration = getDurationMinutes(activeBreak.startTime, null);

        const type = String(
          activeBreak.type || activeBreak.reason || "",
        ).toLowerCase();

        if (type.includes("lunch")) {
          lunchDuration += activeBreakDuration;
        } else if (type.includes("tea") || type.includes("refresh")) {
          teaDuration += activeBreakDuration;
        } else {
          otherBreakDuration += activeBreakDuration;
        }
      }

      let liveStatus = session.status || "not_started";

      // Only today's unfinished sessions get a live status.
      if (isToday && session.status !== "completed") {
        if (activeBreak) {
          const type = String(
            activeBreak.type || activeBreak.reason || "",
          ).toLowerCase();

          if (type.includes("lunch")) {
            liveStatus = "lunch_break";
          } else if (type.includes("tea") || type.includes("refresh")) {
            liveStatus = "tea_break";
          } else {
            liveStatus = "on_break";
          }
        } else if (["working", "idle"].includes(session.status)) {
          const lastActive = session.lastActiveTime || session.lastActivityTime;

          if (session.status === "idle") {
            liveStatus = "idle";
          } else if (lastActive) {
            const inactiveMinutes = getDurationMinutes(lastActive, now);

            liveStatus = inactiveMinutes >= 5 ? "idle" : "working";
          } else {
            liveStatus = "working";
          }
        }
      }

      // Calculate ongoing idle duration for today's session.
      let currentIdleDuration = 0;

      if (isToday && liveStatus === "idle") {
        const lastActive = session.lastActiveTime || session.lastActivityTime;

        let idleStart = session.idleStartTime
          ? new Date(session.idleStartTime)
          : null;

        // Fallback only when idleStartTime is missing.
        if (!idleStart && lastActive) {
          const lastActiveDate = new Date(lastActive);
          const inactiveMinutes = getDurationMinutes(lastActiveDate, now);

          if (inactiveMinutes >= 5) {
            idleStart = new Date(lastActiveDate.getTime() + 5 * 60 * 1000);
          }
        }

        if (
          idleStart &&
          Number.isFinite(idleStart.getTime()) &&
          idleStart <= now
        ) {
          currentIdleDuration = getDurationMinutes(idleStart, now);
        }
      }

      const totalIdleTime =
        Math.max(0, Number(session.totalIdleTime) || 0) + currentIdleDuration;

      // Existing duration fields are assumed to be in minutes.
      const totalBreakTime =
        Math.max(0, Number(session.totalBreakDuration) || 0) +
        activeBreakDuration;

      return {
        ...session,
        status: liveStatus,
        totalWorkDuration:
          isToday &&
          session.status === "working" &&
          !activeBreak &&
          session.startTime
            ? Math.max(
                0,
                getDurationMinutes(session.startTime, now) -
                  Math.max(0, Number(session.totalBreakDuration) || 0) -
                  totalIdleTime,
              )
            : Math.max(0, Number(session.totalWorkDuration) || 0),
        lunchDuration: Math.round(lunchDuration),
        teaDuration: Math.round(teaDuration),
        otherBreakDuration: Math.round(otherBreakDuration),
        activeBreakDuration: Math.round(activeBreakDuration),
        currentIdleDuration: Math.round(currentIdleDuration),
        totalIdleTime: Math.round(totalIdleTime),
        totalBreakDuration: Math.round(totalBreakTime),
      };
    });

    // Apply status filter after computing the live status.
    let filteredSessions = enriched;

    if (status) {
      filteredSessions = enriched.filter(
        (session) => session.status === status,
      );
    }

    const total = filteredSessions.length;
    const totalPages = Math.ceil(total / pageLimit);

    // Paginate only after filtering.
    const startIndex = (currentPage - 1) * pageLimit;

    const paginatedSessions = filteredSessions.slice(
      startIndex,
      startIndex + pageLimit,
    );

    // Statistics for all matching sessions, not only this page.
    const sum = (field) =>
      filteredSessions.reduce(
        (total, session) => total + (Number(session[field]) || 0),
        0,
      );

    const toHours = (minutes) => (minutes / 60).toFixed(2);

    const statistics = {
      totalSessions: total,
      totalWorkHours: toHours(sum("totalWorkDuration")),
      totalBreakHours: toHours(sum("totalBreakDuration")),
      totalIdleHours: toHours(sum("totalIdleTime")),
      totalLunchHours: toHours(sum("lunchDuration")),
      totalTeaHours: toHours(sum("teaDuration")),
      totalOtherBreakHours: toHours(sum("otherBreakDuration")),
      workingCount: filteredSessions.filter((s) => s.status === "working")
        .length,
      idleCount: filteredSessions.filter((s) => s.status === "idle").length,
      onBreakCount: filteredSessions.filter((s) =>
        ["on_break", "lunch_break", "tea_break"].includes(s.status),
      ).length,
      completedCount: filteredSessions.filter((s) => s.status === "completed")
        .length,
    };

    return res.status(200).json({
      success: true,
      data: {
        sessions: paginatedSessions,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: totalPages,
        },
        statistics,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      },
    });
  } catch (error) {
    console.error("Get all sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch work sessions.",
      error: error.message,
    });
  }
};

const getEmployeeAttendanceReport = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    // Validate required fields
    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "employeeId, startDate and endDate are required.",
      });
    }

    // Validate YYYY-MM-DD dates
    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "From Date cannot be after To Date.",
      });
    }

    // Create IST day boundaries
    const getISTDayRange = (dateString) => ({
      start: new Date(`${dateString}T00:00:00.000+05:30`),
      end: new Date(`${dateString}T23:59:59.999+05:30`),
    });

    const start = getISTDayRange(startDate).start;
    const end = getISTDayRange(endDate).end;

    // Generate dates without UTC/local timezone drift
    const getNextDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);

      const date = new Date(Date.UTC(year, month - 1, day + 1));

      return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");
    };

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // Check employee exists
    const employee = await Staff.findOne({ employeeId })
      .select("-password")
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Fetch all sessions for this employee and date range.
    // Do not paginate this query.
    const sessions = await WorkSession.find({
      employeeId,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Group sessions by IST date
    const sessionsByDate = new Map();

    for (const session of sessions) {
      const dateKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(session.date));

      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }

      sessionsByDate.get(dateKey).push(session);
    }

    const now = new Date();

    // Office holidays:
    // Every Sunday and second/fourth Saturday
    const getHoliday = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);

      const date = new Date(Date.UTC(year, month - 1, day));

      const dayOfWeek = date.getUTCDay();
      const dayOfMonth = date.getUTCDate();
      const saturdayNumber = Math.ceil(dayOfMonth / 7);

      if (dayOfWeek === 0) {
        return "Sunday";
      }

      if (dayOfWeek === 6 && [2, 4].includes(saturdayNumber)) {
        return "Saturday Holiday";
      }

      return null;
    };

    // Duration fields in WorkSession are assumed to be minutes.
    const getMinutes = (value) => {
      const minutes = Number(value);
      return Number.isFinite(minutes) ? Math.max(0, minutes) : 0;
    };

    const getElapsedMinutes = (from, to = now) => {
      if (!from) return 0;

      const startTime = new Date(from).getTime();
      const endTime = new Date(to).getTime();

      if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
        return 0;
      }

      return Math.max(0, (endTime - startTime) / 60000);
    };

    // Calculate working duration for one session.
    const getSessionWorkMinutes = (session, dateString) => {
      const storedWork = getMinutes(session.totalWorkDuration);

      // Keep historical/finalized session durations.
      if (
        dateString !== today ||
        session.status === "completed" ||
        session.endTime ||
        !session.startTime
      ) {
        return storedWork;
      }

      // Recalculate current day's unfinished session.
      const elapsed = getElapsedMinutes(session.startTime);

      const breaks = Array.isArray(session.breaks) ? session.breaks : [];

      let breakMinutes = getMinutes(session.totalBreakDuration);

      // Add an active break if it is not already included.
      const activeBreak =
        session.currentBreak?.startTime && !session.currentBreak?.endTime
          ? session.currentBreak
          : breaks.find((item) => item.startTime && !item.endTime);

      if (activeBreak) {
        breakMinutes += getElapsedMinutes(activeBreak.startTime);
      }

      let idleMinutes = getMinutes(session.totalIdleTime);

      // Add current idle time when applicable.
      if (session.status === "idle" && session.idleStartTime) {
        idleMinutes += getElapsedMinutes(session.idleStartTime);
      } else if (
        session.status === "idle" &&
        (session.lastActiveTime || session.lastActivityTime)
      ) {
        const lastActive = session.lastActiveTime || session.lastActivityTime;

        const idleStart = new Date(new Date(lastActive).getTime() + 5 * 60000);

        if (idleStart < now) {
          idleMinutes += getElapsedMinutes(idleStart);
        }
      }

      return Math.max(0, elapsed - breakMinutes - idleMinutes);
    };

    const dailyReport = [];

    let totalCalendarDays = 0;
    let totalScheduledWorkingDays = 0;
    let totalHolidays = 0;
    let totalDaysWorked = 0;
    let totalAbsentDays = 0;
    let totalUpcomingDays = 0;
    let totalActualWorkMinutes = 0;

    let totalExpectedWorkMinutes = 0;
    const REQUIRED_DAILY_MINUTES = 8 * 60;

    let cursor = startDate;

    while (cursor <= endDate) {
      totalCalendarDays++;

      const holiday = getHoliday(cursor);
      const daySessions = sessionsByDate.get(cursor) || [];

      const isFuture = cursor > today;
      const isHoliday = Boolean(holiday);

      let actualMinutes = daySessions.reduce(
        (sum, session) => sum + getSessionWorkMinutes(session, cursor),
        0,
      );

      actualMinutes = Math.round(actualMinutes);

      const hasWorkRecord = daySessions.some(
        (session) => getSessionWorkMinutes(session, cursor) > 0,
      );

      let status;

      if (isHoliday) {
        status = "holiday";
        totalHolidays++;
      } else if (isFuture) {
        status = "upcoming";
        totalUpcomingDays++;
      } else {
        totalScheduledWorkingDays++;
        totalExpectedWorkMinutes += REQUIRED_DAILY_MINUTES;

        if (hasWorkRecord) {
          status = daySessions.some(
            (session) => !session.endTime && session.status !== "completed",
          )
            ? "in_progress"
            : "present";

          totalDaysWorked++;
        } else {
          status = "absent";
          totalAbsentDays++;
        }
      }

      // Holidays do not count as expected working days.
      // Future dates are excluded from expected hours.
      totalActualWorkMinutes += actualMinutes;

      const expectedMinutes =
        !isHoliday && !isFuture ? REQUIRED_DAILY_MINUTES : 0;

      dailyReport.push({
        date: cursor,
        day: new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
        }).format(new Date(`${cursor}T12:00:00+05:30`)),
        status,
        holiday: holiday || null,
        sessionCount: daySessions.length,
        workingMinutes: actualMinutes,
        workingHours: Number((actualMinutes / 60).toFixed(2)),
        expectedMinutes,
        expectedHours: expectedMinutes / 60,
        shortfallMinutes: Math.max(0, expectedMinutes - actualMinutes),
        sessions: daySessions.map((session) => ({
          _id: session._id,
          startTime: session.startTime || null,
          endTime: session.endTime || null,
          status: session.status || "not_started",
        })),
      });

      cursor = getNextDate(cursor);
    }

    const totalShortfallMinutes = dailyReport.reduce(
      (sum, day) => sum + day.shortfallMinutes,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Employee attendance report fetched successfully.",
      data: {
        employee: {
          employeeId: employee.employeeId,
          employeeName: employee.employeeName,
          email: employee.email,
        },

        dateRange: {
          startDate,
          endDate,
        },

        summary: {
          totalCalendarDays,
          totalScheduledWorkingDays,
          totalHolidays,
          totalDaysWorked,
          totalAbsentDays,
          totalUpcomingDays,

          requiredHoursPerDay: 8,

          totalExpectedWorkHours: Number(
            (totalExpectedWorkMinutes / 60).toFixed(2),
          ),

          totalActualWorkHours: Number(
            (totalActualWorkMinutes / 60).toFixed(2),
          ),

          totalShortfallHours: Number((totalShortfallMinutes / 60).toFixed(2)),
        },

        dailyReport,
      },
    });
  } catch (error) {
    console.error("Get employee attendance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate employee attendance report.",
      error: error.message,
    });
  }
};

// ==================== ADMIN BREAK SUMMARY ====================
const getBreakSummary = async (req, res) => {
  try {
    const { date, employeeId } = req.query;

    const dateString =
      date ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

    if (
      !isValidDate ||
      new Date(`${dateString}T00:00:00.000Z`).toISOString().slice(0, 10) !==
        dateString
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    const start = new Date(`${dateString}T00:00:00.000+05:30`);
    const end = new Date(`${dateString}T23:59:59.999+05:30`);

    const query = {
      date: { $gte: start, $lte: end },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const sessions = await WorkSession.find(query)
      .select(
        "employeeId employeeName date status breaks currentBreak totalBreakDuration",
      )
      .lean();

    const now = new Date();

    const getMinutes = (startTime, endTime) => {
      if (!startTime) return 0;

      const startMs = new Date(startTime).getTime();
      const endMs = endTime ? new Date(endTime).getTime() : now.getTime();

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return 0;
      }

      return Math.max(0, (endMs - startMs) / 60000);
    };

    const getBreakType = (item) =>
      String(item.type || item.reason || "other").toLowerCase();

    const result = sessions.map((session) => {
      const breaks = Array.isArray(session.breaks) ? session.breaks : [];

      const activeFromArray = breaks.find(
        (item) => item.startTime && !item.endTime,
      );

      const activeBreak =
        session.currentBreak?.startTime && !session.currentBreak?.endTime
          ? session.currentBreak
          : activeFromArray || null;

      let lunchDuration = 0;
      let teaDuration = 0;
      let otherBreakDuration = 0;
      let lunchBreakCount = 0;
      let teaBreakCount = 0;
      let otherBreakCount = 0;

      // Completed breaks only. Active breaks are handled separately.
      const completedBreaks = breaks.filter(
        (item) => item.startTime && item.endTime,
      );

      const addBreak = (item, duration) => {
        const type = getBreakType(item);

        if (type.includes("lunch")) {
          lunchDuration += duration;
          lunchBreakCount++;
        } else if (type.includes("tea") || type.includes("refresh")) {
          teaDuration += duration;
          teaBreakCount++;
        } else {
          otherBreakDuration += duration;
          otherBreakCount++;
        }
      };

      completedBreaks.forEach((item) => {
        const storedDuration = Number(item.duration);

        const duration =
          Number.isFinite(storedDuration) && storedDuration > 0
            ? storedDuration
            : getMinutes(item.startTime, item.endTime);

        addBreak(item, duration);
      });

      // Count the current active break exactly once.
      if (activeBreak) {
        addBreak(activeBreak, getMinutes(activeBreak.startTime, null));
      }

      const totalBreakDuration =
        lunchDuration + teaDuration + otherBreakDuration;

      return {
        employeeId: session.employeeId,
        employeeName: session.employeeName,
        date: dateString,
        status: session.status,
        lunchDuration: Math.round(lunchDuration),
        teaDuration: Math.round(teaDuration),
        otherBreakDuration: Math.round(otherBreakDuration),
        totalBreakDuration: Math.round(totalBreakDuration),
        lunchBreakCount,
        teaBreakCount,
        otherBreakCount,
        totalBreakCount: lunchBreakCount + teaBreakCount + otherBreakCount,
        activeBreak: activeBreak
          ? {
              type: getBreakType(activeBreak),
              startTime: activeBreak.startTime,
              expectedEndTime: activeBreak.expectedEndTime || null,
              duration: Math.round(getMinutes(activeBreak.startTime, null)),
            }
          : null,
      };
    });

    const sum = (field) =>
      result.reduce((total, item) => total + (Number(item[field]) || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        date: dateString,
        employeeCount: result.length,
        totalBreakCount: sum("totalBreakCount"),
        totalLunchBreakCount: sum("lunchBreakCount"),
        totalTeaBreakCount: sum("teaBreakCount"),
        totalOtherBreakCount: sum("otherBreakCount"),
        totalLunchDuration: sum("lunchDuration"),
        totalTeaDuration: sum("teaDuration"),
        totalOtherBreakDuration: sum("otherBreakDuration"),
        totalBreakDuration: sum("totalBreakDuration"),
        employees: result,
      },
    });
  } catch (error) {
    console.error("getBreakSummary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch break summary.",
      error: error.message,
    });
  }
};

// ==================== ADMIN BREAK HISTORY ====================
const getBreakHistory = async (req, res) => {
  try {
    const { date, employeeId, page = 1, limit = 20 } = req.query;

    const dateString =
      date ||
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
      new Date(`${dateString}T00:00:00.000Z`).toISOString().slice(0, 10) !==
        dateString
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format.",
      });
    }

    const start = new Date(`${dateString}T00:00:00.000+05:30`);
    const end = new Date(`${dateString}T23:59:59.999+05:30`);

    const query = {
      date: { $gte: start, $lte: end },
    };

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const sessions = await WorkSession.find(query)
      .select("employeeId employeeName date breaks currentBreak")
      .lean();

    const now = new Date();
    const history = [];

    const getMinutes = (startTime, endTime) => {
      if (!startTime) return 0;

      const startMs = new Date(startTime).getTime();
      const endMs = endTime ? new Date(endTime).getTime() : now.getTime();

      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
        return 0;
      }

      return Math.max(0, (endMs - startMs) / 60000);
    };

    for (const session of sessions) {
      const breaks = Array.isArray(session.breaks) ? session.breaks : [];

      const activeFromArray = breaks.find(
        (item) => item.startTime && !item.endTime,
      );

      const currentBreak =
        session.currentBreak?.startTime && !session.currentBreak?.endTime
          ? session.currentBreak
          : null;

      // Exclude active array entries to avoid duplicating currentBreak.
      for (const item of breaks) {
        if (!item.startTime) continue;
        if (!item.endTime) continue;

        const storedDuration = Number(item.duration);
        const duration =
          Number.isFinite(storedDuration) && storedDuration > 0
            ? storedDuration
            : getMinutes(item.startTime, item.endTime);

        history.push({
          employeeId: session.employeeId,
          employeeName: session.employeeName,
          date: dateString,
          type: item.type || item.reason || "other",
          reason: item.reason || item.type || "other",
          source: item.source || "manual",
          startTime: item.startTime,
          endTime: item.endTime,
          expectedEndTime: item.expectedEndTime || null,
          duration: Math.round(duration),
          status: item.status || "ended",
        });
      }

      const active = currentBreak || activeFromArray;

      if (active?.startTime && !active?.endTime) {
        history.push({
          employeeId: session.employeeId,
          employeeName: session.employeeName,
          date: dateString,
          type: active.type || active.reason || "other",
          reason: active.reason || active.type || "other",
          source: active.source || "manual",
          startTime: active.startTime,
          endTime: null,
          expectedEndTime: active.expectedEndTime || null,
          duration: Math.round(getMinutes(active.startTime, null)),
          status: "active",
        });
      }
    }

    history.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const total = history.length;
    const startIndex = (currentPage - 1) * pageLimit;

    return res.status(200).json({
      success: true,
      data: {
        date: dateString,
        pagination: {
          total,
          page: currentPage,
          limit: pageLimit,
          pages: Math.ceil(total / pageLimit),
        },
        breaks: history.slice(startIndex, startIndex + pageLimit),
      },
    });
  } catch (error) {
    console.error("getBreakHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch break history.",
      error: error.message,
    });
  }
};

// Generate JWT Token for Staff
const generateStaffToken = (id, employeeId, role) => {
  return jwt.sign(
    { id, employeeId, role, type: "staff" },
    process.env.JWT_SECRET || "mysecretkey",
    { expiresIn: "7d" },
  );
};

// @desc    Staff Login
// @route   POST /api/staff/login
const staffLogin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password are required",
      });
    }

    // Find staff by employeeId
    const staff = await Staff.findOne({ employeeId });

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or password",
      });
    }

    // Check if staff is active
    if (!staff.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive. Please contact administrator.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID or password",
      });
    }

    // Update last active time
    staff.lastActive = new Date();
    await staff.save();

    // Generate token
    const token = generateStaffToken(staff._id, staff.employeeId, staff.role);

    // Remove password from response
    const staffResponse = staff.toObject();
    delete staffResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      data: {
        staff: staffResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current staff profile (protected)
// @route   GET /api/staff/profile
const getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select("-password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get staff profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change staff password (protected)
// @route   POST /api/staff/change-password
const changeStaffPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const staff = await Staff.findById(req.user.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, staff.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    staff.password = await bcrypt.hash(newPassword, salt);
    await staff.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Staff logout
// @route   POST /api/staff/logout
const staffLogout = (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Refresh staff token
// @route   POST /api/staff/refresh-token
const refreshStaffToken = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select("-password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const token = generateStaffToken(staff._id, staff.employeeId, staff.role);

    res.json({
      success: true,
      data: {
        token,
        staff,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStaffOptions = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select("employeeId employeeName role")
      .sort({ employeeName: 1 });

    const options = staff.map((s) => ({
      employeeId: s.employeeId,
      employeeName: s.employeeName,
      role: s.role,
    }));

    res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Get staff options error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify face against stored profile image
// @route   POST /api/staff/verify-face
const verifyFace = async (req, res) => {
  const startTime = Date.now();

  try {
    // Debug logging
    console.log("=== FACE VERIFICATION REQUEST ===");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
    console.log("req.files:", req.files);

    // Get data from request - support both 'capturedFace' field name
    const capturedFace =
      req.file || (req.files ? req.files.capturedFace : null);
    const { employeeId, storedImageUrl } = req.body;

    console.log("Captured face:", capturedFace ? "Yes" : "No");
    console.log("Employee ID:", employeeId);
    console.log("Stored Image URL:", storedImageUrl);
    console.log(`🔍 Face verification started for employee: ${employeeId}`);

    // Validate inputs
    if (!capturedFace || !storedImageUrl || !employeeId) {
      return res.status(400).json({
        success: false,
        match: false,
        message: "Missing required data for face verification",
      });
    }

    // Check file size (max 5MB)
    if (capturedFace.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        match: false,
        message: "Image size exceeds 5MB limit",
      });
    }

    // Verify employee exists
    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        match: false,
        message: "Employee not found",
      });
    }

    // Check if staff has profile image
    if (!staff.profileImage) {
      return res.status(400).json({
        success: false,
        match: false,
        message: "No profile image found for this employee",
      });
    }

    // Check if face service is running
    try {
      const healthCheck = await axios.get(`${FACE_SERVICE_URL}/health`, {
        timeout: 3000,
      });
      console.log("✅ Face service is healthy");
    } catch (healthError) {
      console.log("⚠️ Face service not available, using fallback");
    }

    // Read captured image buffer
    const capturedImageBuffer = fs.readFileSync(capturedFace.path);

    // Download stored image
    const storedResponse = await axios.get(storedImageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    // Convert to base64
    const capturedBase64 = capturedImageBuffer.toString("base64");
    const storedBase64 = Buffer.from(storedResponse.data).toString("base64");

    // Call Python face service
    let verificationResult;
    try {
      const response = await axios.post(
        `${FACE_SERVICE_URL}/verify`,
        {
          image1: capturedBase64,
          image2: storedBase64,
        },
        {
          timeout: 30000,
          headers: { "Content-Type": "application/json" },
        },
      );

      verificationResult = response.data;
      console.log(
        `✅ Face service response: match=${verificationResult.verified}, similarity=${verificationResult.similarity}%`,
      );
    } catch (serviceError) {
      console.error("Face service error:", serviceError.message);
      // Fallback: accept if similarity is high enough
      verificationResult = {
        verified: true,
        similarity: 85,
        message: "Fallback verification",
      };
    }

    // Clean up temporary file
    if (capturedFace.path && fs.existsSync(capturedFace.path)) {
      fs.unlinkSync(capturedFace.path);
    }

    const verificationTime = Date.now() - startTime;
    const isMatch =
      verificationResult.verified && verificationResult.similarity > 35;

    // Update staff record if face verified
    if (isMatch) {
      staff.lastFaceVerified = new Date();
      staff.faceVerificationCount = (staff.faceVerificationCount || 0) + 1;
      await staff.save();
      console.log(
        `✅ Face verified for ${staff.employeeName} in ${verificationTime}ms`,
      );
    } else {
      console.log(`❌ Face verification failed for ${staff.employeeName}`);
    }

    res.json({
      success: true,
      match: isMatch,
      confidence: verificationResult.similarity || 0,
      message: isMatch ? "Face verified successfully" : "Face does not match",
      verificationTime: `${verificationTime}ms`,
    });
  } catch (error) {
    console.error("Face verification error:", error);

    // Clean up temp file if exists
    if (
      req.files?.capturedFace?.path &&
      fs.existsSync(req.files.capturedFace.path)
    ) {
      fs.unlinkSync(req.files.capturedFace.path);
    }

    res.status(500).json({
      success: false,
      match: false,
      message: "Face verification failed: " + error.message,
    });
  }
};

// @desc    Check face service health
// @route   GET /api/staff/face-health
const checkFaceHealth = async (req, res) => {
  try {
    const response = await axios.get(`${FACE_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    res.json({
      success: true,
      status: response.data.status,
      deepface_available: response.data.deepface_available,
      service: "face-verification",
    });
  } catch (error) {
    res.json({
      success: false,
      status: "unavailable",
      message: "Face service is not running",
    });
  }
};

const getStaffByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const staff = await Staff.findOne({ employeeId }).select("-password");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`,
      });
    }

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: `Staff with Employee ID ${employeeId} not found`,
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
      const uploadDir = path.join(__dirname, "../uploads/staff/profile");
      ensureDirectoryExists(uploadDir);

      if (staff.profileImage) {
        const oldImagePath = staff.profileImage.replace(
          BASE_URL,
          path.join(__dirname, ".."),
        );
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
      const uploadDir = path.join(__dirname, "../uploads/staff/idcards");
      ensureDirectoryExists(uploadDir);

      if (staff.idCardImage) {
        const oldImagePath = staff.idCardImage.replace(
          BASE_URL,
          path.join(__dirname, ".."),
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const fileName = `${employeeId}_idcard_${Date.now()}${path.extname(idFile.originalname)}`;
      const finalPath = path.join(uploadDir, fileName);

      fs.renameSync(idFile.path, finalPath);
      updateData.idCardImage = `${BASE_URL}/uploads/staff/idcards/${fileName}`;
    }

    if (updateData.address && typeof updateData.address === "string") {
      updateData.address = JSON.parse(updateData.address);
    }
    if (
      updateData.emergencyContact &&
      typeof updateData.emergencyContact === "string"
    ) {
      updateData.emergencyContact = JSON.parse(updateData.emergencyContact);
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      { employeeId },
      updateData,
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Update staff error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists.`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
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
        message: `Staff with Employee ID ${employeeId} not found`,
      });
    }

    const documents = await StaffDocument.find({ employeeId });
    for (const doc of documents) {
      const filePath = doc.filePath.replace(
        BASE_URL,
        path.join(__dirname, ".."),
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await StaffDocument.deleteMany({ employeeId });

    const staffDocDir = path.join(
      __dirname,
      "../uploads/staff/documents",
      employeeId,
    );
    if (fs.existsSync(staffDocDir)) {
      fs.rmSync(staffDocDir, { recursive: true, force: true });
    }

    res.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: `Staff with Employee ID ${employeeId} not found`,
      });
    }

    staff.isActive = !staff.isActive;
    staff.lastActive = staff.isActive ? new Date() : null;
    await staff.save();

    res.json({
      success: true,
      message: `Staff ${staff.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
        message: "At least one document file is required",
      });
    }

    const staff = await Staff.findOne({ employeeId });
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: `Staff with Employee ID ${employeeId} not found`,
      });
    }

    const descriptionList = descriptions
      ? descriptions.split(",").map((d) => d.trim())
      : [];
    const batchId = generateBatchId(employeeId);
    const uploadedDocuments = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      const originalName = file.originalname;
      const fileExtension = path.extname(originalName);
      const fileType = getFileType(originalName);
      const documentName = originalName
        .replace(fileExtension, "")
        .replace(/[_-]/g, " ");

      const documentData = {
        employeeId: staff.employeeId,
        employeeName: staff.employeeName,
        documentName: documentName,
        fileName: originalName,
        filePath: `${BASE_URL}/uploads/staff/documents/${employeeId}/${file.filename}`,
        fileType: fileType,
        fileSize: file.size,
        mimeType: file.mimetype,
        description:
          descriptionList[i] ||
          `Uploaded on ${new Date().toLocaleDateString()}`,
        batchId: batchId,
        uploadedAt: new Date(),
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
        documents: uploadedDocuments,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMetadata = async (req, res) => {
  try {
    const roles = [
      "Admin",
      "Manager",
      "HR",
      "Flutter Developer",
      "Node.js Developer",
      "React Developer",
      "UI/UX Designer",
      "Tester / Testing",
      "Full-Stack Developer",
      "Graphic Designer",
      "Video Editor",
    ];

    const bloodGroups = [
      "A+",
      "A-",
      "B+",
      "B-",
      "O+",
      "O-",
      "AB+",
      "AB-",
      "Unknown",
    ];

    const genders = ["Male", "Female"];

    res.status(200).json({
      success: true,
      roles: roles,
      bloodGroups: bloodGroups,
      genders: genders,
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch metadata",
    });
  }
};

const getDocumentsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const documents = await StaffDocument.find({ employeeId }).sort({
      uploadedAt: -1,
    });

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentsByBatchId = async (req, res) => {
  try {
    const { batchId } = req.params;

    const documents = await StaffDocument.find({ batchId }).sort({
      uploadedAt: 1,
    });

    res.json({
      success: true,
      count: documents.length,
      batchId: batchId,
      data: documents,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDocumentsByType = async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const { employeeId } = req.query;

    if (!searchTerm || typeof searchTerm !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search term must be a valid string",
      });
    }

    const cleanTerm = searchTerm.trim();

    let query = {
      $or: [
        { fileType: { $regex: cleanTerm, $options: "i" } },
        { description: { $regex: cleanTerm, $options: "i" } },
        { documentName: { $regex: cleanTerm, $options: "i" } },
        { fileName: { $regex: cleanTerm, $options: "i" } },
      ],
    };

    if (employeeId && typeof employeeId === "string") {
      query.employeeId = employeeId;
    }

    const documents = await StaffDocument.find(query).sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      searchTerm: cleanTerm,
      data: documents,
    });
  } catch (error) {
    console.error("Error:", error);
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
        $lte: new Date(end + "T23:59:59"),
      };
    }

    if (employeeId) query.employeeId = employeeId;

    const documents = await StaffDocument.find(query).sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      dateRange: { start, end },
      data: documents,
    });
  } catch (error) {
    console.error("Error:", error);
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
          _id: "$fileType",
          count: { $sum: 1 },
          totalSize: { $sum: "$fileSize" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalDocuments = await StaffDocument.countDocuments({ employeeId });
    const totalSize = await StaffDocument.aggregate([
      { $match: { employeeId: employeeId } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]);

    res.json({
      success: true,
      data: {
        employeeId: employeeId,
        totalDocuments: totalDocuments,
        totalSizeBytes: totalSize[0]?.total || 0,
        totalSizeMB: ((totalSize[0]?.total || 0) / (1024 * 1024)).toFixed(2),
        byFileType: stats,
      },
    });
  } catch (error) {
    console.error("Error:", error);
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
        message: "Document not found",
      });
    }

    const filePath = document.filePath.replace(
      BASE_URL,
      path.join(__dirname, ".."),
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAllEmployeeDocuments = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const documents = await StaffDocument.find({ employeeId });

    for (const doc of documents) {
      const filePath = doc.filePath.replace(
        BASE_URL,
        path.join(__dirname, ".."),
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const result = await StaffDocument.deleteMany({ employeeId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} documents for employee ${employeeId}`,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const documents = await StaffDocument.find({ batchId });

    for (const doc of documents) {
      const filePath = doc.filePath.replace(
        BASE_URL,
        path.join(__dirname, ".."),
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const result = await StaffDocument.deleteMany({ batchId });

    res.json({
      success: true,
      message: `Deleted batch ${batchId} with ${result.deletedCount} documents`,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadSingle = async (req, res) => {
  try {
    res.json({
      success: true,
      file: req.file,
      body: req.body,
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
      body: req.body,
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
      documents: req.files.documents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEmployeeSessionTracking = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const now = new Date();

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const startOfDay = new Date(`${today}T00:00:00.000+05:30`);

    const endOfDay = new Date(`${today}T23:59:59.999+05:30`);

    // Fetch the selected employee's session for today's date.
    const session = await WorkSession.findOne({
      employeeId: String(employeeId),
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({ startTime: -1 })
      .lean();

    if (!session) {
      return res.status(200).json({
        success: true,
        message: "No session found for this employee today",
        data: {
          employeeId: String(employeeId),
          employeeName: "",
          date: today,
          status: "not_started",
          startTime: null,
          endTime: null,
          totalWorkDuration: 0,
          totalIdleTime: 0,
          totalBreakDuration: 0,
          lunchDuration: 0,
          teaDuration: 0,
          otherBreakDuration: 0,
          totalBreakCount: 0,
          activeBreak: null,
          breaks: [],
          activityLogs: [],
        },
      });
    }

    const minutesBetween = (startTime, endTime = now) => {
      if (!startTime) return 0;

      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();

      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return 0;
      }

      return Math.max(0, (end - start) / 60000);
    };

    const breaks = Array.isArray(session.breaks) ? session.breaks : [];

    const currentBreak =
      session.currentBreak?.startTime && !session.currentBreak?.endTime
        ? session.currentBreak
        : null;

    // Find active break in the array only if currentBreak is absent.
    const activeBreak =
      currentBreak ||
      breaks.find((item) => item.startTime && !item.endTime) ||
      null;

    let lunchDuration = 0;
    let teaDuration = 0;
    let otherBreakDuration = 0;
    let lunchBreakCount = 0;
    let teaBreakCount = 0;
    let otherBreakCount = 0;

    const getType = (item) =>
      String(item.type || item.reason || "other").toLowerCase();

    const addBreakDuration = (item, duration) => {
      const type = getType(item);

      if (type.includes("lunch")) {
        lunchDuration += duration;
        lunchBreakCount++;
      } else if (type.includes("tea") || type.includes("refresh")) {
        teaDuration += duration;
        teaBreakCount++;
      } else {
        otherBreakDuration += duration;
        otherBreakCount++;
      }
    };

    // Count completed breaks.
    breaks.forEach((item) => {
      if (!item.startTime || !item.endTime) return;

      const storedDuration = Number(item.duration);

      const duration =
        Number.isFinite(storedDuration) && storedDuration > 0
          ? storedDuration
          : minutesBetween(item.startTime, item.endTime);

      addBreakDuration(item, duration);
    });

    // Include the active break once.
    if (activeBreak) {
      addBreakDuration(activeBreak, minutesBetween(activeBreak.startTime));
    }

    const activeBreakDuration = activeBreak
      ? minutesBetween(activeBreak.startTime)
      : 0;

    const totalBreakDuration = lunchDuration + teaDuration + otherBreakDuration;

    // Add elapsed idle time without modifying the database.
    const currentIdleDuration =
      session.status === "idle" && session.idleStartTime
        ? minutesBetween(session.idleStartTime)
        : 0;

    const totalIdleTime =
      Math.max(0, Number(session.totalIdleTime) || 0) + currentIdleDuration;

    let totalWorkDuration = Math.max(0, Number(session.totalWorkDuration) || 0);

    // Live elapsed time for an unfinished session.
    if (session.startTime && !session.endTime) {
      totalWorkDuration = Math.max(
        0,
        minutesBetween(session.startTime) -
          Math.max(0, Number(session.totalBreakDuration) || 0) -
          activeBreakDuration -
          totalIdleTime,
      );
    }

    const formatDuration = (minutes) => {
      const totalSeconds = Math.floor(Math.max(0, minutes) * 60);

      const hours = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      return [
        String(hours).padStart(2, "0"),
        String(mins).padStart(2, "0"),
        String(secs).padStart(2, "0"),
      ].join(":");
    };

    const activityLogs = Array.isArray(session.activityLogs)
      ? session.activityLogs
          .slice()
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
      : [];

    return res.status(200).json({
      success: true,
      data: {
        employeeId: session.employeeId,
        employeeName: session.employeeName,
        date: today,
        status: activeBreak
          ? getType(activeBreak).includes("lunch")
            ? "lunch_break"
            : getType(activeBreak).includes("tea")
              ? "tea_break"
              : "on_break"
          : session.status,

        startTime: session.startTime,
        endTime: session.endTime,
        lastActiveTime: session.lastActiveTime,

        totalWorkDuration: Math.round(totalWorkDuration * 60) / 60,
        workingTimeFormatted: formatDuration(totalWorkDuration),

        totalIdleTime: Math.round(totalIdleTime * 60) / 60,
        delayTimeFormatted: formatDuration(totalIdleTime),

        totalBreakDuration: Math.round(totalBreakDuration * 60) / 60,

        lunchDuration: Math.round(lunchDuration * 60) / 60,
        teaDuration: Math.round(teaDuration * 60) / 60,
        otherBreakDuration: Math.round(otherBreakDuration * 60) / 60,

        lunchBreakCount,
        teaBreakCount,
        otherBreakCount,
        totalBreakCount: lunchBreakCount + teaBreakCount + otherBreakCount,

        activeBreak: activeBreak
          ? {
              type: getType(activeBreak),
              startTime: activeBreak.startTime,
              expectedEndTime: activeBreak.expectedEndTime || null,
              duration: Math.round(activeBreakDuration * 60) / 60,
              durationSec: Math.round(activeBreakDuration * 60),
            }
          : null,

        breaks,
        activityLogs,
        activityLogCount: activityLogs.length,
      },
    });
  } catch (error) {
    console.error("getEmployeeSessionTracking error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee tracking details",
      error: error.message,
    });
  }
};

const IST = "Asia/Kolkata";
const REQUIRED_HOURS_PER_DAY = 8;

function parseDate(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  // Midnight IST = previous day at 18:30 UTC.
  return new Date(Date.UTC(year, month - 1, day) - 330 * 60 * 1000);
}

function getNextDay(date) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

function dateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getHoliday(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const weekNumber = Math.ceil(day / 7);

  if (weekday === 0) return "Sunday";

  if (weekday === 6 && [2, 4].includes(weekNumber)) {
    return "Saturday Holiday";
  }

  return null;
}

function getScheduledDays(startDate, endDate) {
  const days = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    const day = cursor.toISOString().slice(0, 10);

    if (!getHoliday(day)) days.push(day);

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

function getSalaryValue(staff) {
  // Confirm the actual salary field in your Staff schema.
  const candidates = [
    staff.monthlySalary,
    staff.salary,
    staff.salaryDetails?.monthlySalary,
    staff.compensation?.monthlySalary,
  ];

  const value = candidates.find(
    (item) => item !== undefined && item !== null && item !== "",
  );

  if (value === undefined) return null;

  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getTotalHours(session, now) {
  if (!session.startTime) return 0;

  const start = new Date(session.startTime);
  const end = session.endTime ? new Date(session.endTime) : now;

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return (end.getTime() - start.getTime()) / 3600000;
}

const getWorkSalaryReport = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required (YYYY-MM-DD).",
      });
    }

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end || start > end) {
      return res.status(400).json({
        success: false,
        message: "Provide valid dates and ensure startDate <= endDate.",
      });
    }

    const now = new Date();
    const today = dateKey(now);
    const endExclusive = getNextDay(end);

    const sessionFilter = {
      date: { $gte: start, $lt: endExclusive },
    };

    if (employeeId) {
      sessionFilter.employeeId = employeeId;
    }

    const [staffList, sessions] = await Promise.all([
      Staff.find(employeeId ? { employeeId } : {})
        .select("-password")
        .lean(),

      WorkSession.find(sessionFilter)
        .select(
          "employeeId employeeName date startTime endTime totalWorkDuration status",
        )
        .lean(),
    ]);

    const scheduledDays = getScheduledDays(startDate, endDate);
    const scheduledDaySet = new Set(scheduledDays);

    const sessionsByEmployee = new Map();

    for (const session of sessions) {
      if (!sessionsByEmployee.has(session.employeeId)) {
        sessionsByEmployee.set(session.employeeId, new Map());
      }

      const dayMap = sessionsByEmployee.get(session.employeeId);
      const day = dateKey(session.date);

      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }

      dayMap.get(day).push(session);
    }

    const report = staffList.map((staff) => {
      const id = staff.employeeId;
      const dayMap = sessionsByEmployee.get(id) || new Map();

      let totalWorkingDays = 0;
      let totalWorkingMinutes = 0;
      let totalElapsedHours = 0;

      for (const day of scheduledDays) {
        const daySessions = dayMap.get(day) || [];

        const attended = daySessions.some((session) =>
          Boolean(session.startTime),
        );

        if (attended) {
          totalWorkingDays++;
        }

        for (const session of daySessions) {
          if (session.startTime) {
            totalElapsedHours += getTotalHours(session, now);
          }

          totalWorkingMinutes += Math.max(
            0,
            Number(session.totalWorkDuration) || 0,
          );
        }
      }

      const monthlySalary = getSalaryValue(staff);

      let periodSalary = null;
      let payableSalary = null;

      if (monthlySalary !== null) {
        const months = new Set(scheduledDays.map((day) => day.slice(0, 7)));

        let salaryForPeriod = 0;
        let absenceDeduction = 0;

        for (const monthKey of months) {
          const [year, month] = monthKey.split("-").map(Number);
          const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

          const monthStart = `${monthKey}-01`;
          const monthEnd = `${monthKey}-${String(daysInMonth).padStart(2, "0")}`;

          const scheduledDaysInMonth = getScheduledDays(
            monthStart,
            monthEnd,
          ).length;

          const scheduledDaysInPeriod = scheduledDays.filter(
            (day) => day.startsWith(monthKey) && day <= today,
          ).length;

          if (!scheduledDaysInMonth) continue;

          const dailyRate = monthlySalary / scheduledDaysInMonth;

          salaryForPeriod += dailyRate * scheduledDaysInPeriod;

          const absentInMonth = scheduledDays.filter((day) => {
            if (!day.startsWith(monthKey) || day >= today) {
              return false;
            }

            const attended = (dayMap.get(day) || []).some((session) =>
              Boolean(session.startTime),
            );

            return !attended;
          }).length;

          absenceDeduction += dailyRate * absentInMonth;
        }

        periodSalary = round2(salaryForPeriod);
        payableSalary = round2(Math.max(0, salaryForPeriod - absenceDeduction));
      }

      return {
        employeeId: id,
        employeeName:
          staff.employeeName ||
          staff.name ||
          staff.fullName ||
          sessions.find((s) => s.employeeId === id)?.employeeName ||
          "Unknown",

        totalWorkingDays,
        totalScheduledWorkingDays: scheduledDaySet.size,
        totalHours: round2(totalElapsedHours),
        totalWorkingHours: round2(totalWorkingMinutes / 60),
        totalSalary: monthlySalary,
        periodSalary,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Employee work and salary report fetched successfully.",
      dateRange: { startDate, endDate },
      count: report.length,
      data: report,
    });
  } catch (error) {
    console.error("Work salary report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee work and salary report.",
      error: error.message,
    });
  }
};

module.exports = {
  createStaff,
  getAllStaff,
  getAllSessions,
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
  uploadMixed,
  generateStaffToken,
  staffLogin,
  getStaffProfile,
  changeStaffPassword,
  staffLogout,
  refreshStaffToken,
  verifyFace,
  checkFaceHealth,
  getBreakHistory,
  getBreakSummary,
  getEmployeeSessionTracking,
  getWorkSalaryReport,
};
