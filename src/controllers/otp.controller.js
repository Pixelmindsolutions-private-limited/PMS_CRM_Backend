const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Send OTP (static 123456)
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // For demo, always return 123456
    console.log(`📧 OTP requested for ${email}: 123456`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        // In production, don't send OTP in response
        // This is just for demo/testing
        otp: '123456',
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Check if OTP is 123456 (static for demo)
    if (otp !== '123456') {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find or create admin
    let admin = await Admin.findOne({ email });
    
    if (!admin) {
      // Create new admin if doesn't exist
      admin = await Admin.create({
        email,
        name: email.split('@')[0],
        password: 'Demo@123', // Will be hashed by pre-save
        role: 'admin',
        isActive: true
      });
      console.log(`👤 New admin created: ${email}`);
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
        role: admin.role,
        token
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Resend OTP (still 123456)
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    console.log(`📧 OTP resent for ${email}: 123456`);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        otp: '123456', // Only for demo
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};