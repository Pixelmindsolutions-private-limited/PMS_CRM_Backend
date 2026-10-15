// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const dotenv = require('dotenv');
// const path = require('path');
// const dns = require('dns');

// // Force IPv4
// dns.setDefaultResultOrder('ipv4first');

// // Load environment variables
// dotenv.config();

// // Define Admin Schema directly (in case model import fails)
// const adminSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   name: {
//     type: String,
//     default: 'Admin'
//   },
//   role: {
//     type: String,
//     default: 'admin'
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   lastLogin: Date
// }, { timestamps: true });

// // Hash password before saving
// adminSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Compare password method
// adminSchema.methods.comparePassword = async function(candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// const Admin = mongoose.model('Admin', adminSchema);

// async function createAdmin() {
//   console.log('='.repeat(50));
//   console.log('ADMIN CREATION SCRIPT');
//   console.log('='.repeat(50));
  
//   try {
//     // Connect to MongoDB
//     console.log('\n📡 Connecting to MongoDB...');
//     console.log('Connection string:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
//     await mongoose.connect(process.env.MONGODB_URI, {
//       serverSelectionTimeoutMS: 10000,
//       family: 4
//     });
    
//     console.log('✅ Connected to MongoDB');
//     console.log('Database:', mongoose.connection.db.databaseName);

//     // Admin details
//     const adminData = {
//       email: 'admin@pixelmind.com',
//       password: 'Admin@123',
//       name: 'Super Admin',
//       role: 'super_admin'
//     };

//     // Check if admin already exists
//     console.log('\n🔍 Checking for existing admin...');
//     const existingAdmin = await Admin.findOne({ email: adminData.email });
    
//     if (existingAdmin) {
//       console.log('⚠️ Admin already exists with email:', adminData.email);
//       console.log('\n📋 Existing Admin Details:');
//       console.log('ID:', existingAdmin._id);
//       console.log('Email:', existingAdmin.email);
//       console.log('Name:', existingAdmin.name);
//       console.log('Role:', existingAdmin.role);
//       console.log('Active:', existingAdmin.isActive);
//       console.log('Created:', existingAdmin.createdAt);
      
//       // Ask if user wants to update
//       console.log('\n❓ Do you want to update this admin? (y/n)');
//       // Note: This is for informational purposes, script will continue
      
//       const updateChoice = 'y'; // Change this if you want to skip update
      
//       if (updateChoice.toLowerCase() === 'y') {
//         // Update existing admin
//         existingAdmin.name = adminData.name;
//         existingAdmin.role = adminData.role;
//         existingAdmin.password = adminData.password; // Will be hashed by pre-save
//         await existingAdmin.save();
        
//         console.log('✅ Admin updated successfully!');
//       } else {
//         console.log('❌ Admin creation cancelled');
//         process.exit(0);
//       }
//     } else {
//       // Create new admin
//       console.log('👤 Creating new admin...');
      
//       const admin = new Admin(adminData);
//       await admin.save();
      
//       console.log('✅ Admin created successfully!');
//       console.log('\n📋 New Admin Details:');
//       console.log('ID:', admin._id);
//       console.log('Email:', admin.email);
//       console.log('Name:', admin.name);
//       console.log('Role:', admin.role);
//     }

//     // Verify the admin was saved
//     const verifyAdmin = await Admin.findOne({ email: adminData.email }).select('-password');
    
//     console.log('\n✅ Verification:');
//     console.log('Admin exists in database:', !!verifyAdmin);
    
//     if (verifyAdmin) {
//       console.log('Admin ID:', verifyAdmin._id);
//       console.log('Admin Email:', verifyAdmin.email);
//       console.log('Admin Name:', verifyAdmin.name);
//     }

//     // List all admins
//     const allAdmins = await Admin.find().select('-password');
//     console.log('\n📋 All Admins in Database:');
//     if (allAdmins.length === 0) {
//       console.log('No admins found');
//     } else {
//       allAdmins.forEach((admin, index) => {
//         console.log(`${index + 1}. ${admin.email} (${admin.name}) - ${admin.role}`);
//       });
//     }

//     console.log('\n✅ Admin creation completed!');
//     console.log('='.repeat(50));
//     console.log('You can now login with:');
//     console.log('Email: admin@pixelmind.com');
//     console.log('Password: Admin@123');
//     console.log('='.repeat(50));

//   } catch (error) {
//     console.error('\n❌ Error creating admin:', error.message);
//     if (error.code === 11000) {
//       console.error('Duplicate key error - email already exists');
//     }
//   } finally {
//     await mongoose.disconnect();
//     console.log('\n👋 Disconnected from MongoDB');
//     process.exit(0);
//   }
// }

// // Run the function
// createAdmin();

// controllers/adminAuthController.js (CommonJS Version)
const Admin = require('../models/Admin.js');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// ==================== EMAIL CONFIGURATION (Inside Controller) ====================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'pms226803@gmail.com',
    pass: process.env.MAIL_PASS || 'nrasbifqxsxzurrm',
  },
  tls: { rejectUnauthorized: false }
});

// Verify email connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email transporter ready to send emails');
  }
});

// ==================== JWT CONFIGURATION (Inside Controller) ====================
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// ==================== SEND EMAIL FUNCTION ====================
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'pms226803@gmail.com',
      to,
      subject,
      html,
      text: text || ''
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// ==================== SEND OTP EMAIL ====================
const sendOTPEmail = async (email, name, otp, type = 'login') => {
  const subject = type === 'login' ? 'Admin Login OTP' : 
                  type === 'verification' ? 'Admin Verification OTP' : 
                  'Admin Password Reset OTP';
  
  const title = type === 'login' ? 'Login OTP' : 
                type === 'verification' ? 'Email Verification OTP' : 
                'Password Reset OTP';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">${title}</h2>
      <p style="color: #555; font-size: 16px;">Hello ${name || 'Admin'},</p>
      <p style="color: #555; font-size: 16px;">Use the OTP below to ${type === 'login' ? 'login to your admin account' : type === 'verification' ? 'verify your email address' : 'reset your password'}.</p>
      <div style="text-align: center; padding: 20px; margin: 20px 0; background-color: #f5f5f5; border-radius: 8px;">
        <h1 style="color: #4CAF50; font-size: 40px; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #555; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
      <p style="color: #777; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Your App. All rights reserved.</p>
    </div>
  `;
  
  const text = `Your ${type} OTP is: ${otp}\nValid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
  
  return await sendEmail({ to: email, subject, html, text });
};

// ==================== CONTROLLERS ====================

// 1. CREATE ADMIN
const createAdmin = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists"
      });
    }

    const admin = new Admin({
      email: email.toLowerCase(),
      password,
      name: name || 'Admin',
      role: role || 'admin'
    });

    await admin.save();

    const otp = admin.generateOTP();
    await admin.save();

    await sendOTPEmail(admin.email, admin.name, otp, 'verification');

    return res.status(201).json({
      success: true,
      message: "Admin created successfully. OTP sent to email for verification.",
      data: {
        adminId: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isActive: admin.isActive,
        isEmailVerified: admin.isEmailVerified
      }
    });

  } catch (error) {
    console.error("❌ createAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. SEND LOGIN OTP
const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found with this email"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive. Please contact support."
      });
    }

    const otp = admin.generateOTP();
    console.log(`Generated OTP for ${admin.email}: ${otp} (valid for 10 minutes)`);
    await admin.save();

    await sendOTPEmail(admin.email, admin.name, otp, 'login');

    console.log(`✅ Login OTP sent to admin email: ${admin.email}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      data: {
        adminId: admin._id,
        email: admin.email,
        expiresIn: "10 minutes"
      }
    });

  } catch (error) {
    console.error("❌ sendLoginOTP error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. VERIFY OTP AND LOGIN
const verifyOTPAndLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    if (!admin.isOTPValid(otp)) {
      return res.status(400).json({
        success: false,
        message: admin.otp ? "Invalid OTP" : "No OTP found. Please request a new OTP."
      });
    }

    admin.clearOTP();
    admin.isEmailVerified = true;
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken({
      id: admin._id.toString(),
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      type: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. Login successful.",
      data: {
        adminId: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        token: token
      }
    });

  } catch (error) {
    console.error("❌ verifyOTPAndLogin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. LOGIN WITH PASSWORD
const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken({
      id: admin._id.toString(),
      adminId: admin._id.toString(),
      email: admin.email,
      role: admin.role,
      type: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        adminId: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        token: token
      }
    });

  } catch (error) {
    console.error("❌ loginWithPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 5. RESEND OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    const otp = admin.generateOTP();
    await admin.save();

    await sendOTPEmail(admin.email, admin.name, otp, 'login');

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
      data: {
        adminId: admin._id,
        email: admin.email,
        expiresIn: "10 minutes"
      }
    });

  } catch (error) {
    console.error("❌ resendOTP error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 6. FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found with this email"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    const otp = admin.generateOTP();
    await admin.save();

    await sendOTPEmail(admin.email, admin.name, otp, 'password_reset');

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email for password reset",
      data: {
        adminId: admin._id,
        email: admin.email,
        expiresIn: "10 minutes"
      }
    });

  } catch (error) {
    console.error("❌ forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 7. RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiresAt');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "Admin account is inactive"
      });
    }

    if (!admin.isOTPValid(otp)) {
      return res.status(400).json({
        success: false,
        message: admin.otp ? "Invalid OTP" : "No OTP found. Please request a new OTP."
      });
    }

    admin.password = newPassword;
    admin.clearOTP();
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("❌ resetPassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 8. CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("❌ changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 9. GET ADMIN PROFILE
const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId).select('-password -otp -otpExpiresAt');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error("❌ getAdminProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 10. GET ALL ADMINS
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password -otp -otpExpiresAt').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });

  } catch (error) {
    console.error("❌ getAllAdmins error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 11. UPDATE ADMIN
const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, role, phone, profileImage, isActive } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    if (name) admin.name = name;
    if (role) admin.role = role;
    if (phone) admin.phone = phone;
    if (profileImage) admin.profileImage = profileImage;
    if (isActive !== undefined) admin.isActive = isActive;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin
    });

  } catch (error) {
    console.error("❌ updateAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 12. DELETE ADMIN
const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findByIdAndDelete(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });

  } catch (error) {
    console.error("❌ deleteAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== EXPORT ====================
module.exports = {
  createAdmin,
  sendLoginOTP,
  verifyOTPAndLogin,
  loginWithPassword,
  resendOTP,
  forgotPassword,
  resetPassword,
  changePassword,
  getAdminProfile,
  getAllAdmins,
  updateAdmin,
  deleteAdmin
};