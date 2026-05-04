const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config();

// Define Admin Schema directly (in case model import fails)
const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Admin'
  },
  role: {
    type: String,
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  console.log('='.repeat(50));
  console.log('ADMIN CREATION SCRIPT');
  console.log('='.repeat(50));
  
  try {
    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    console.log('Connection string:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);

    // Admin details
    const adminData = {
      email: 'admin@pixelmind.com',
      password: 'Admin@123',
      name: 'Super Admin',
      role: 'super_admin'
    };

    // Check if admin already exists
    console.log('\n🔍 Checking for existing admin...');
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️ Admin already exists with email:', adminData.email);
      console.log('\n📋 Existing Admin Details:');
      console.log('ID:', existingAdmin._id);
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      console.log('Active:', existingAdmin.isActive);
      console.log('Created:', existingAdmin.createdAt);
      
      // Ask if user wants to update
      console.log('\n❓ Do you want to update this admin? (y/n)');
      // Note: This is for informational purposes, script will continue
      
      const updateChoice = 'y'; // Change this if you want to skip update
      
      if (updateChoice.toLowerCase() === 'y') {
        // Update existing admin
        existingAdmin.name = adminData.name;
        existingAdmin.role = adminData.role;
        existingAdmin.password = adminData.password; // Will be hashed by pre-save
        await existingAdmin.save();
        
        console.log('✅ Admin updated successfully!');
      } else {
        console.log('❌ Admin creation cancelled');
        process.exit(0);
      }
    } else {
      // Create new admin
      console.log('👤 Creating new admin...');
      
      const admin = new Admin(adminData);
      await admin.save();
      
      console.log('✅ Admin created successfully!');
      console.log('\n📋 New Admin Details:');
      console.log('ID:', admin._id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
    }

    // Verify the admin was saved
    const verifyAdmin = await Admin.findOne({ email: adminData.email }).select('-password');
    
    console.log('\n✅ Verification:');
    console.log('Admin exists in database:', !!verifyAdmin);
    
    if (verifyAdmin) {
      console.log('Admin ID:', verifyAdmin._id);
      console.log('Admin Email:', verifyAdmin.email);
      console.log('Admin Name:', verifyAdmin.name);
    }

    // List all admins
    const allAdmins = await Admin.find().select('-password');
    console.log('\n📋 All Admins in Database:');
    if (allAdmins.length === 0) {
      console.log('No admins found');
    } else {
      allAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.name}) - ${admin.role}`);
      });
    }

    console.log('\n✅ Admin creation completed!');
    console.log('='.repeat(50));
    console.log('You can now login with:');
    console.log('Email: admin@pixelmind.com');
    console.log('Password: Admin@123');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - email already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function
createAdmin();