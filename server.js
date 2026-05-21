// const express = require('express');
// const dns = require('dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']);
// dns.setDefaultResultOrder('ipv4first');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const dotenv = require('dotenv');
// const path = require('path');
// const fs = require('fs');

// const app = express();

// // Load environment variables
// require('dotenv').config();

// // ==================== DATABASE ====================
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://syamsai455_db_user:ElxSqlS2uls0g5ZF@cluster0.dxd60hg.mongodb.net/crm_db?retryWrites=true&w=majority';

// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('✅ MongoDB connected successfully'))
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// const BASE_URL = process.env.BASE_URL || 'https://crmbackend-oprd.onrender.com';
// console.log(`🌐 Base URL: ${BASE_URL}`);

// // ==================== MIDDLEWARE ====================

// // Security
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// // CORS
// app.use(cors({
//   origin: ['https://crmbackend-oprd.onrender.com', 'http://localhost:3000', 'http://localhost:3001'],
//   credentials: true
// }));

// // Body parsers
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Logging
// app.use(morgan('dev'));


// // ==================== STATIC FILES ====================
// const uploadsPath = path.join(__dirname, 'uploads');
// console.log('📁 Uploads directory:', uploadsPath);
// console.log('📁 Uploads exists:', fs.existsSync(uploadsPath));

// // Ensure upload directories exist
// const uploadDirs = [
//   path.join(__dirname, 'uploads/staff/profile'),
//   path.join(__dirname, 'uploads/staff/idcards'),
//   path.join(__dirname, 'uploads/staff/documents'),
//   path.join(__dirname, 'uploads/temp'),
//   path.join(__dirname, 'uploads/fingerprints')
// ];

// uploadDirs.forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`✅ Created directory: ${dir}`);
//   }
// });

// app.use('/uploads', express.static(uploadsPath, {
//   setHeaders: (res, filePath) => {
//     if (filePath.endsWith('.pdf')) {
//       res.setHeader('Content-Type', 'application/pdf');
//     }
//   }
// }));

// // ==================== ENSURE UPLOAD DIRECTORIES EXIST ====================
// const ensureDirectories = () => {
//   const dirs = [
//     path.join(__dirname, 'uploads'),
//     path.join(__dirname, 'uploads/staff'),
//     path.join(__dirname, 'uploads/staff/profile'),
//     path.join(__dirname, 'uploads/staff/idcards'),
//     path.join(__dirname, 'uploads/staff/documents'),
//     path.join(__dirname, 'uploads/temp'),
//     path.join(__dirname, 'uploads/fingerprints')
//   ];
  
//   dirs.forEach(dir => {
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//       console.log(`✅ Created directory: ${dir}`);
//     }
//   });
// };

// ensureDirectories();

// // ==================== ROUTES ====================
// const authRoutes = require('./routes/auth.routes');
// const projectRoutes = require('./routes/project.routes');
// const staffRoutes = require('./routes/staff.routes');
// const worksheetRoutes = require('./routes/worksheet.routes');
// const attendanceRoutes = require('./routes/attendance.routes');
// const dashboardRoutes = require('./routes/dashboard.routes');
// const fingerprintRoutes = require('./routes/fingerprint.routes');
// const workSessionRoutes = require('./routes/WorkSession.routes');

// // Mount API routes
// app.use('/api/auth', authRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/staff', staffRoutes);
// app.use('/api/worksheets', worksheetRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/fingerprint', fingerprintRoutes);
// app.use('/api/work-session', workSessionRoutes);

// // ==================== HEALTH CHECK ====================
// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'OK', 
//     timestamp: new Date(),
//     environment: process.env.NODE_ENV || 'production',
//     baseUrl: BASE_URL,
//     uploadsPath,
//     uploadsExists: fs.existsSync(uploadsPath)
//   });
// });

// // ==================== DEBUG ENDPOINTS ====================
// // Debug: Check upload directory
// app.get('/debug-uploads', (req, res) => {
//   const profilePath = path.join(__dirname, 'uploads/staff/profile');
//   const files = fs.existsSync(profilePath) ? fs.readdirSync(profilePath) : [];
  
//   res.json({
//     uploadPath: profilePath,
//     exists: fs.existsSync(profilePath),
//     fileCount: files.length,
//     recentFiles: files.slice(-10)
//   });
// });

// // Debug: List files for an employee
// app.get('/debug-files/:employeeId', (req, res) => {
//   const dir = path.join(__dirname, 'uploads/staff/documents', req.params.employeeId);
  
//   if (fs.existsSync(dir)) {
//     const files = fs.readdirSync(dir);
//     res.json({
//       success: true,
//       directory: dir,
//       exists: true,
//       fileCount: files.length,
//       files: files
//     });
//   } else {
//     res.json({
//       success: false,
//       directory: dir,
//       exists: false,
//       message: 'Directory not found'
//     });
//   }
// });

// // ==================== ERROR HANDLING ====================
// app.use((err, req, res, next) => {
//   console.error('Error:', err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // 404 handler for API routes
// app.use('/api/*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `API Route not found: ${req.originalUrl}`
//   });
// });

// // Catch-all for other routes
// app.use((req, res) => {
//   if (req.path.startsWith('/uploads/')) {
//     return res.status(404).json({ 
//       success: false, 
//       message: 'File not found',
//       path: req.path
//     });
//   }
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   });
// });

// // ==================== START SERVER ====================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`🌐 Base URL: ${BASE_URL}`);
//   console.log(`📁 Uploads path: ${uploadsPath}`);
// });


const express = require('express');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const app = express();

// Load environment variables
require('dotenv').config();

// ==================== DATABASE ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://syamsai455_db_user:ElxSqlS2uls0g5ZF@cluster0.dxd60hg.mongodb.net/crm_db?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const BASE_URL = process.env.BASE_URL || 'https://crmbackend-oprd.onrender.com';
console.log(`🌐 Base URL: ${BASE_URL}`);

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: ['https://crmbackend-oprd.onrender.com', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('dev'));

// ==================== STATIC FILES ====================
const uploadsPath = path.join(__dirname, 'uploads');
console.log('📁 Uploads directory:', uploadsPath);
console.log('📁 Uploads exists:', fs.existsSync(uploadsPath));

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/staff'),
  path.join(__dirname, 'uploads/staff/profile'),
  path.join(__dirname, 'uploads/staff/idcards'),
  path.join(__dirname, 'uploads/staff/documents'),
  path.join(__dirname, 'uploads/temp'),
  path.join(__dirname, 'uploads/fingerprints')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// ✅ FIXED: Serve static files with proper logging
app.use('/uploads', (req, res, next) => {
  const fullPath = path.join(uploadsPath, req.path);
  console.log(`📁 Static file request: ${req.path}`);
  console.log(`📁 Looking for: ${fullPath}`);
  console.log(`📁 File exists: ${fs.existsSync(fullPath)}`);
  next();
}, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log(`📁 Serving file: ${filePath}`);
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// ==================== DEBUG ENDPOINTS ====================

// Debug: Check specific file
app.get('/debug-file/:type/:employeeId/:filename', (req, res) => {
  const { type, employeeId, filename } = req.params;
  let filePath;
  
  if (type === 'profile') {
    filePath = path.join(__dirname, 'uploads/staff/profile', filename);
  } else if (type === 'idcard') {
    filePath = path.join(__dirname, 'uploads/staff/idcards', filename);
  } else {
    filePath = path.join(__dirname, 'uploads/staff/documents', employeeId, filename);
  }
  
  console.log('🔍 Debug file request:', {
    type,
    employeeId,
    filename,
    filePath,
    exists: fs.existsSync(filePath)
  });
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    res.json({
      success: true,
      filePath,
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      url: `${BASE_URL}/uploads/staff/${type === 'profile' ? 'profile' : (type === 'idcard' ? 'idcards' : 'documents')}/${filename}`
    });
  } else {
    // List directory contents
    const dir = type === 'profile' ? path.join(__dirname, 'uploads/staff/profile') : 
                (type === 'idcard' ? path.join(__dirname, 'uploads/staff/idcards') : 
                path.join(__dirname, 'uploads/staff/documents', employeeId));
    
    let files = [];
    if (fs.existsSync(dir)) {
      files = fs.readdirSync(dir);
    }
    
    res.status(404).json({
      success: false,
      filePath,
      exists: false,
      directory: dir,
      directoryExists: fs.existsSync(dir),
      availableFiles: files,
      message: 'File not found'
    });
  }
});

// Debug: List all profile images
app.get('/debug-profile-images', (req, res) => {
  const profileDir = path.join(__dirname, 'uploads/staff/profile');
  
  if (fs.existsSync(profileDir)) {
    const files = fs.readdirSync(profileDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(profileDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        modified: stats.mtime,
        url: `${BASE_URL}/uploads/staff/profile/${file}`
      };
    });
    
    res.json({
      success: true,
      directory: profileDir,
      fileCount: files.length,
      files: fileDetails
    });
  } else {
    res.json({
      success: false,
      directory: profileDir,
      exists: false,
      message: 'Profile directory does not exist'
    });
  }
});

// Debug: List all ID card images
app.get('/debug-idcard-images', (req, res) => {
  const idcardDir = path.join(__dirname, 'uploads/staff/idcards');
  
  if (fs.existsSync(idcardDir)) {
    const files = fs.readdirSync(idcardDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(idcardDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        modified: stats.mtime,
        url: `${BASE_URL}/uploads/staff/idcards/${file}`
      };
    });
    
    res.json({
      success: true,
      directory: idcardDir,
      fileCount: files.length,
      files: fileDetails
    });
  } else {
    res.json({
      success: false,
      directory: idcardDir,
      exists: false,
      message: 'ID card directory does not exist'
    });
  }
});

// ==================== ROUTES ====================
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const staffRoutes = require('./routes/staff.routes');
const worksheetRoutes = require('./routes/worksheet.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const fingerprintRoutes = require('./routes/fingerprint.routes');
const workSessionRoutes = require('./routes/WorkSession.routes');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/worksheets', worksheetRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fingerprint', fingerprintRoutes);
app.use('/api/work-session', workSessionRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  const profileDir = path.join(__dirname, 'uploads/staff/profile');
  const profileFiles = fs.existsSync(profileDir) ? fs.readdirSync(profileDir) : [];
  
  res.json({
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'production',
    baseUrl: BASE_URL,
    uploadsPath,
    uploadsExists: fs.existsSync(uploadsPath),
    profileImagesCount: profileFiles.length,
    sampleProfileImage: profileFiles.length > 0 ? `${BASE_URL}/uploads/staff/profile/${profileFiles[0]}` : null
  });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Catch-all for other routes
app.use((req, res) => {
  if (req.path.startsWith('/uploads/')) {
    const fullPath = path.join(uploadsPath, req.path.replace('/uploads/', ''));
    return res.status(404).json({ 
      success: false, 
      message: 'File not found',
      requestedPath: req.path,
      fullPath: fullPath,
      exists: fs.existsSync(fullPath)
    });
  }
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Uploads path: ${uploadsPath}`);
  console.log(`📁 Uploads exists: ${fs.existsSync(uploadsPath)}`);
  
  // List existing profile images on startup
  const profileDir = path.join(__dirname, 'uploads/staff/profile');
  if (fs.existsSync(profileDir)) {
    const files = fs.readdirSync(profileDir);
    console.log(`📸 Profile images found: ${files.length}`);
    if (files.length > 0) {
      console.log(`📸 Sample: ${BASE_URL}/uploads/staff/profile/${files[0]}`);
    }
  } else {
    console.log('⚠️ Profile directory does not exist');
  }
});  