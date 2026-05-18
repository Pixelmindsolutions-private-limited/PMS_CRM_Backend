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
// const MONGODB_URI = 'mongodb+srv://syamsai455_db_user:ElxSqlS2uls0g5ZF@cluster0.dxd60hg.mongodb.net/crm_db?retryWrites=true&w=majority';

// mongoose.connect(MONGODB_URI)
//   .then(() => console.log('✅ MongoDB connected successfully'))
//   .catch(err => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
// console.log(`🌐 Base URL: ${BASE_URL}`);
// // ==================== MIDDLEWARE ====================

// // Security
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" }
// }));

// // CORS
// app.use(cors());

// // Body parsers (JSON and URL-encoded)
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // Logging
// app.use(morgan('dev'));

// // ✅ Static files - with debug logging
// const uploadsPath = path.join(__dirname, 'uploads');
// console.log('📁 Uploads directory:', uploadsPath);
// console.log('📁 Uploads exists:', fs.existsSync(uploadsPath));

// app.use('/uploads', express.static(uploadsPath, {
//   setHeaders: (res, filePath) => {
//     if (filePath.endsWith('.pdf')) {
//       res.setHeader('Content-Type', 'application/pdf');
//     }
//   }
// }));

// // ==================== ROUTES ====================

// // Import routes
// const authRoutes = require('./routes/auth.routes');
// const projectRoutes = require('./routes/project.routes');
// const staffRoutes = require('./routes/staff.routes');
// const worksheetRoutes = require('./routes/worksheet.routes');
// const attendanceRoutes = require('./routes/attendance.routes');
// const dashboardRoutes = require('./routes/dashboard.routes');
// const fingerprintRoutes = require('./routes/fingerprint.routes');
// const workSessionRoutes = require('./routes/WorkSession.routes');

// console.log('staffRoutes type:', typeof staffRoutes);
// console.log('workSessionRoutes type:', typeof workSessionRoutes);

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
//     environment: process.env.NODE_ENV,
//     uploadsPath,
//     uploadsExists: fs.existsSync(uploadsPath)
//   });
// });

// // ==================== DEBUG: Test file access ====================
// app.get('/test-file/:filename', (req, res) => {
//   const filePath = path.join(uploadsPath, 'staff', 'documents', 'EMP26040001', req.params.filename);
//   console.log('Checking file:', filePath);
  
//   if (fs.existsSync(filePath)) {
//     res.sendFile(filePath);
//   } else {
//     res.status(404).json({ 
//       success: false, 
//       message: 'File not found',
//       requestedPath: filePath 
//     });
//   }
// });

// // Debug: List all files for an employee
// app.get('/debug-files/:employeeId', (req, res) => {
//   const dir = path.join(uploadsPath, 'staff', 'documents', req.params.employeeId);
  
//   console.log('Checking directory:', dir);
  
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
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || 'Internal server error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// });

// // ✅ FIXED: 404 handler - only for API routes, NOT static files
// app.use('/api/*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'API Route not found'
//   });
// });

// // ✅ Only catch non-API, non-file routes
// app.use((req, res) => {
//   // Skip if it looks like a file request
//   if (req.path.startsWith('/uploads/')) {
//     return res.status(404).json({ success: false, message: 'File not found' });
//   }
//   res.status(404).json({ success: false, message: 'Route not found' });
// });

// // ==================== START SERVER ====================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
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

const BASE_URL = process.env.BASE_URL || 'https://pmsbackend.pixelmindsolutions.com';
console.log(`🌐 Base URL: ${BASE_URL}`);

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
app.use(cors({
  origin: ['https://pmsbackend.pixelmindsolutions.com', 'http://localhost:3000', 'http://localhost:3001'],
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

app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// ==================== ENSURE UPLOAD DIRECTORIES EXIST ====================
const ensureDirectories = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/staff'),
    path.join(__dirname, 'uploads/staff/profile'),
    path.join(__dirname, 'uploads/staff/idcards'),
    path.join(__dirname, 'uploads/staff/documents'),
    path.join(__dirname, 'uploads/temp'),
    path.join(__dirname, 'uploads/fingerprints')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

ensureDirectories();

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
  res.json({
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'production',
    baseUrl: BASE_URL,
    uploadsPath,
    uploadsExists: fs.existsSync(uploadsPath)
  });
});

// ==================== DEBUG ENDPOINTS ====================
// Debug: Check upload directory
app.get('/debug-uploads', (req, res) => {
  const profilePath = path.join(__dirname, 'uploads/staff/profile');
  const files = fs.existsSync(profilePath) ? fs.readdirSync(profilePath) : [];
  
  res.json({
    uploadPath: profilePath,
    exists: fs.existsSync(profilePath),
    fileCount: files.length,
    recentFiles: files.slice(-10)
  });
});

// Debug: List files for an employee
app.get('/debug-files/:employeeId', (req, res) => {
  const dir = path.join(__dirname, 'uploads/staff/documents', req.params.employeeId);
  
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    res.json({
      success: true,
      directory: dir,
      exists: true,
      fileCount: files.length,
      files: files
    });
  } else {
    res.json({
      success: false,
      directory: dir,
      exists: false,
      message: 'Directory not found'
    });
  }
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
    return res.status(404).json({ 
      success: false, 
      message: 'File not found',
      path: req.path
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
});