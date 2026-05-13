// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');

// exports.protect = async (req, res, next) => {
//   try {
//     let token;

//     // Get token from header
//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: 'Not authorized'
//       });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
    
//     // Get user
//     req.user = await Admin.findById(decoded.id).select('-password');
    
//     next();
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       message: 'Not authorized'
//     });
//   }
// };



const jwt = require('jsonwebtoken');
const { Staff } = require('../Models/Staff');
const Admin = require('../models/Admin');

// Protect routes - works for both Admin and Staff
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
    
    // Check user type and fetch appropriate user
    if (decoded.type === 'staff') {
      const staff = await Staff.findById(decoded.id).select('-password');
      if (!staff) {
        return res.status(401).json({
          success: false,
          message: 'Staff not found'
        });
      }
      req.user = {
        id: staff._id,
        employeeId: staff.employeeId,
        name: staff.employeeName,
        email: staff.email,
        role: staff.role,
        type: 'staff'
      };
    } else if (decoded.type === 'admin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found'
        });
      }
      req.user = {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        type: 'admin'
      };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid user type'
      });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Staff only middleware
const staffOnly = (req, res, next) => {
  if (req.user.type !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff only.'
    });
  }
  next();
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

module.exports = { protect, staffOnly, adminOnly };