const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mysecretkey', {
    expiresIn: '7d'
  });
};

// 1. CREATE ADMIN - Only for Postman (one-time use)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin
    const admin = await Admin.create({
      email,
      password: password || 'Admin@123',
      name: name || email.split('@')[0]
    });

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        token
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. SEND OTP - For frontend (always returns 123456)
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if admin exists (optional - you can decide)
    const admin = await Admin.findOne({ email });
    
    console.log(`📧 OTP sent to ${email}: 123456`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        otp: '123456', // Static OTP for demo
        expiresIn: '10 minutes',
        isExistingUser: !!admin // Let frontend know if user exists
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. VERIFY OTP - For frontend (checks 123456 and logs in)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Check OTP (static for demo)
    if (otp !== '123456') {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find admin (must exist - created via Postman first)
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found. Please create admin first.'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Logout
exports.logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};