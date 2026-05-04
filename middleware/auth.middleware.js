const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');
    
    // Get user
    req.user = await Admin.findById(decoded.id).select('-password');
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};