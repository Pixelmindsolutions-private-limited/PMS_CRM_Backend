const Fingerprint = require('../models/Fingerprint');
const Staff = require('../models/Staff');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Mock fingerprint SDK (replace with actual SDK like SecuGen, Futronic, Neurotechnology, etc.)
const fingerprintSDK = {
  extractTemplate: async (imageBuffer) => {
    // In production, this would call your actual fingerprint SDK
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock template (in production, this comes from SDK)
    const mockTemplate = crypto.randomBytes(512).toString('base64');
    const mockQuality = Math.floor(Math.random() * 20) + 75; // 75-95
    
    return {
      template: mockTemplate,
      quality: mockQuality,
      format: 'ISO_19794-2',
      minutiae: 45, // Number of minutiae points found
      imageWidth: 256,
      imageHeight: 256
    };
  },
  
  matchTemplates: async (template1, template2) => {
    // In production, this would perform actual matching
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock matching score (in production, this comes from SDK)
    return Math.floor(Math.random() * 30) + 70; // 70-100
  },
  
  checkQuality: async (imageBuffer) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const quality = Math.floor(Math.random() * 20) + 75;
    const issues = [];
    
    if (quality < 70) issues.push('Low contrast');
    if (quality < 60) issues.push('Partial fingerprint');
    if (quality < 50) issues.push('Blurry image');
    
    return {
      quality,
      isAcceptable: quality >= 70,
      issues,
      recommendations: quality >= 70 ? 'Good quality' : 'Please scan again with clean finger'
    };
  }
};

// Session storage (in production, use Redis)
const enrollmentSessions = new Map();

/**
 * Start enrollment session for multiple fingers
 */
exports.startEnrollmentSession = async (req, res) => {
  try {
    const { staffId, fingers, deviceInfo } = req.body;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Validate finger positions
    const validPositions = [
      'RIGHT_THUMB', 'RIGHT_INDEX', 'RIGHT_MIDDLE', 'RIGHT_RING', 'RIGHT_LITTLE',
      'LEFT_THUMB', 'LEFT_INDEX', 'LEFT_MIDDLE', 'LEFT_RING', 'LEFT_LITTLE'
    ];

    for (const finger of fingers) {
      if (!validPositions.includes(finger)) {
        return res.status(400).json({
          success: false,
          message: `Invalid finger position: ${finger}`
        });
      }
    }

    // Check for already enrolled fingers
    const existingFingerprints = await Fingerprint.findOne({ staffId });
    if (existingFingerprints) {
      const enrolledFingers = existingFingerprints.fingers.map(f => f.fingerPosition);
      const alreadyEnrolled = fingers.filter(f => enrolledFingers.includes(f));
      
      if (alreadyEnrolled.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Fingers already enrolled: ${alreadyEnrolled.join(', ')}`
        });
      }
    }

    // Create session
    const sessionId = `fp_sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    enrollmentSessions.set(sessionId, {
      staffId,
      fingers,
      currentIndex: 0,
      deviceInfo,
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Auto cleanup after 5 minutes
    setTimeout(() => {
      enrollmentSessions.delete(sessionId);
    }, 5 * 60 * 1000);

    res.json({
      success: true,
      data: {
        sessionId,
        staffId,
        staffName: staff.employeeName,
        fingers,
        currentFingerIndex: 0,
        currentFinger: fingers[0],
        expiresIn: 300,
        status: 'in_progress'
      }
    });

  } catch (error) {
    console.error('Start enrollment session error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Enroll single fingerprint
 */
exports. enrollFingerprint = async (req, res) => {
  try {
    const { staffId, fingerPosition, sessionId, deviceInfo } = req.body;
    const fingerprintImage = req.file;

    if (!fingerprintImage) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint image required'
      });
    }

    // Validate session if provided
    if (sessionId) {
      const session = enrollmentSessions.get(sessionId);
      if (!session) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired session'
        });
      }
      
      if (session.staffId !== staffId) {
        return res.status(400).json({
          success: false,
          message: 'Session staff mismatch'
        });
      }
    }

    // Read image file
    const imageBuffer = fs.readFileSync(fingerprintImage.path);

    // Extract template using SDK
    const { template, quality, format, minutiae } = await fingerprintSDK.extractTemplate(imageBuffer);

    // Check quality threshold
    if (quality < 70) {
      // Clean up uploaded file
      fs.unlinkSync(fingerprintImage.path);
      
      return res.status(400).json({
        success: false,
        message: 'Fingerprint quality too low. Please try again.',
        data: { quality, threshold: 70 }
      });
    }

    // Find or create fingerprint document
    let fingerprint = await Fingerprint.findOne({ staffId });
    
    if (!fingerprint) {
      fingerprint = new Fingerprint({
        staffId,
        fingers: [],
        enrolledBy: req.user.id,
        deviceInfo: deviceInfo || {}
      });
    }

    // Check if finger already enrolled
    const existingFinger = fingerprint.fingers.find(
      f => f.fingerPosition === fingerPosition && f.isActive
    );

    if (existingFinger) {
      // Clean up uploaded file
      fs.unlinkSync(fingerprintImage.path);
      
      return res.status(400).json({
        success: false,
        message: `This finger (${fingerPosition}) is already enrolled`
      });
    }

    // Encrypt template (in production, use proper encryption)
    const encryptedTemplate = template; // Placeholder - implement actual encryption

    // Add finger
    fingerprint.fingers.push({
      fingerPosition,
      template: encryptedTemplate,
      templateFormat: format,
      quality,
      minutiae,
      enrolledAt: new Date(),
      isActive: true
    });

    fingerprint.updatedAt = new Date();
    await fingerprint.save();

    // Clean up uploaded file
    fs.unlinkSync(fingerprintImage.path);

    // Calculate enrollment progress if part of session
    let remainingFingers = [];
    let progress = null;

    if (sessionId) {
      const session = enrollmentSessions.get(sessionId);
      if (session) {
        const currentIndex = session.currentIndex;
        const totalFingers = session.fingers.length;
        
        if (currentIndex + 1 < totalFingers) {
          session.currentIndex++;
          enrollmentSessions.set(sessionId, session);
          remainingFingers = session.fingers.slice(currentIndex + 1);
          progress = `${Math.round(((currentIndex + 1) / totalFingers) * 100)}%`;
        } else {
          // Session complete
          enrollmentSessions.delete(sessionId);
          progress = '100%';
        }
      }
    }

    // Get staff details for response
    const staff = await Staff.findById(staffId).select('employeeName');

    res.status(201).json({
      success: true,
      message: 'Fingerprint enrolled successfully',
      data: {
        fingerprintId: fingerprint.fingers[fingerprint.fingers.length - 1]._id,
        staffId,
        staffName: staff?.employeeName || '',
        fingerPosition,
        quality,
        templateFormat: format,
        minutiae,
        enrolledAt: new Date(),
        remainingFingers,
        enrollmentProgress: progress,
        totalEnrolled: fingerprint.fingers.length
      }
    });

  } catch (error) {
    console.error('Enroll fingerprint error:', error);
    
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Enroll multiple fingerprints in batch
 */
exports.enrollMultipleFingers = async (req, res) => {
  try {
    const { staffId, deviceInfo } = req.body;
    const files = req.files; // Using multer for multiple file upload

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one fingerprint image required'
      });
    }

    // Parse fingers data from request
    let fingers = [];
    try {
      fingers = typeof req.body.fingers === 'string' 
        ? JSON.parse(req.body.fingers) 
        : req.body.fingers;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fingers data format'
      });
    }

    if (fingers.length !== files.length) {
      return res.status(400).json({
        success: false,
        message: 'Number of files must match number of finger positions'
      });
    }

    // Check staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      // Clean up uploaded files
      files.forEach(file => fs.unlinkSync(file.path));
      
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Get existing fingerprints
    let fingerprint = await Fingerprint.findOne({ staffId });
    
    if (!fingerprint) {
      fingerprint = new Fingerprint({
        staffId,
        fingers: [],
        enrolledBy: req.user.id,
        deviceInfo: deviceInfo || {}
      });
    }

    const enrolled = [];
    const failed = [];

    // Process each finger
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fingerData = fingers[i];
      
      try {
        // Check if finger already enrolled
        const existingFinger = fingerprint.fingers.find(
          f => f.fingerPosition === fingerData.position && f.isActive
        );

        if (existingFinger) {
          failed.push({
            fingerPosition: fingerData.position,
            reason: 'Already enrolled',
            status: 'failed'
          });
          continue;
        }

        // Extract template
        const imageBuffer = fs.readFileSync(file.path);
        const { template, quality, format, minutiae } = await fingerprintSDK.extractTemplate(imageBuffer);

        if (quality < 70) {
          failed.push({
            fingerPosition: fingerData.position,
            quality,
            reason: 'Low quality',
            status: 'failed'
          });
          continue;
        }

        // Add finger
        fingerprint.fingers.push({
          fingerPosition: fingerData.position,
          template,
          templateFormat: format,
          quality,
          minutiae,
          enrolledAt: new Date(),
          isActive: true
        });

        enrolled.push({
          fingerPosition: fingerData.position,
          quality,
          status: 'success'
        });

      } catch (err) {
        failed.push({
          fingerPosition: fingerData.position,
          reason: err.message,
          status: 'failed'
        });
      } finally {
        // Clean up file
        fs.unlinkSync(file.path);
      }
    }

    // Save if any successful enrollments
    if (enrolled.length > 0) {
      fingerprint.updatedAt = new Date();
      await fingerprint.save();
    }

    res.json({
      success: true,
      message: `${enrolled.length} fingerprints enrolled, ${failed.length} failed`,
      data: {
        staffId,
        staffName: staff.employeeName,
        enrolled,
        failed,
        totalEnrolled: fingerprint.fingers.length
      }
    });

  } catch (error) {
    console.error('Batch enroll error:', error);
    
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Verify fingerprint (1:1 verification)
 */
exports.verifyFingerprint = async (req, res) => {
  try {
    const { staffId, fingerPosition } = req.body;
    const fingerprintImage = req.file;

    if (!fingerprintImage || !staffId || !fingerPosition) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, finger position and fingerprint required'
      });
    }

    // Get stored fingerprint
    const stored = await Fingerprint.findOne({ 
      staffId,
      'fingers.fingerPosition': fingerPosition,
      'fingers.isActive': true
    });

    if (!stored) {
      // Clean up uploaded file
      fs.unlinkSync(fingerprintImage.path);
      
      return res.status(404).json({
        success: false,
        message: 'No enrolled fingerprint found for this staff and finger'
      });
    }

    // Get the specific finger
    const finger = stored.fingers.find(f => f.fingerPosition === fingerPosition);

    // Extract template from new scan
    const imageBuffer = fs.readFileSync(fingerprintImage.path);
    const { template: newTemplate } = await fingerprintSDK.extractTemplate(imageBuffer);

    // Compare templates
    const matchScore = await fingerprintSDK.matchTemplates(
      finger.template,
      newTemplate
    );

    // Update last used
    finger.lastUsed = new Date();
    await stored.save();

    // Clean up uploaded file
    fs.unlinkSync(fingerprintImage.path);

    // Threshold for match (usually 75)
    const threshold = 75;
    const isMatch = matchScore >= threshold;

    // Get staff details
    const staff = await Staff.findById(staffId).select('employeeName');

    res.json({
      success: isMatch,
      message: isMatch ? 'Fingerprint verified successfully' : 'Fingerprint does not match',
      data: {
        verified: isMatch,
        confidence: matchScore,
        threshold,
        staffId,
        staffName: staff?.employeeName,
        fingerPosition,
        matchTime: 0.32,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Identify staff from fingerprint (1:N identification)
 */
exports.identifyStaff = async (req, res) => {
  try {
    const { limit = 5, confidenceThreshold = 75 } = req.query;
    const fingerprintImage = req.file;

    if (!fingerprintImage) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint required'
      });
    }

    // Extract template from scan
    const imageBuffer = fs.readFileSync(fingerprintImage.path);
    const { template: newTemplate } = await fingerprintSDK.extractTemplate(imageBuffer);

    // Get all active fingerprints
    const allFingerprints = await Fingerprint.find({ 
      'fingers.isActive': true 
    }).populate('staffId', 'employeeName');

    const matches = [];

    // Compare against all stored templates
    for (const fp of allFingerprints) {
      for (const finger of fp.fingers) {
        if (!finger.isActive) continue;

        const matchScore = await fingerprintSDK.matchTemplates(
          finger.template,
          newTemplate
        );

        if (matchScore >= confidenceThreshold) {
          matches.push({
            staffId: fp.staffId._id,
            staffName: fp.staffId.employeeName,
            confidence: matchScore,
            fingerPosition: finger.fingerPosition
          });

          // Update last used
          finger.lastUsed = new Date();
          await fp.save();
        }
      }
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);

    // Clean up uploaded file
    fs.unlinkSync(fingerprintImage.path);

    res.json({
      success: matches.length > 0,
      data: {
        matches: matches.slice(0, limit),
        totalMatches: matches.length,
        bestMatch: matches.length > 0 ? {
          staffId: matches[0].staffId,
          confidence: matches[0].confidence
        } : null,
        searchTime: 0.45,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Identification error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all fingerprints for a staff
 */
exports.getStaffFingerprints = async (req, res) => {
  try {
    const { staffId } = req.params;

    const fingerprint = await Fingerprint.findOne({ staffId })
      .populate('staffId', 'employeeName employeeId');

    if (!fingerprint) {
      return res.json({
        success: true,
        data: {
          staffId,
          fingerprints: [],
          totalEnrolled: 0
        }
      });
    }

    // Get staff details
    const staff = await Staff.findById(staffId).select('employeeName employeeId');

    const fingerprints = fingerprint.fingers.map(f => ({
      id: f._id,
      fingerPosition: f.fingerPosition,
      quality: f.quality,
      enrolledAt: f.enrolledAt,
      lastUsed: f.lastUsed,
      isActive: f.isActive,
      templateFormat: f.templateFormat,
      minutiae: f.minutiae
    }));

    res.json({
      success: true,
      data: {
        staffId,
        staffName: staff?.employeeName,
        employeeId: staff?.employeeId,
        fingerprints,
        totalEnrolled: fingerprints.length
      }
    });

  } catch (error) {
    console.error('Get staff fingerprints error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete fingerprint
 */
exports.deleteFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.params;

    // Find fingerprint document containing this finger
    const fingerprint = await Fingerprint.findOne({
      'fingers._id': fingerprintId
    });

    if (!fingerprint) {
      return res.status(404).json({
        success: false,
        message: 'Fingerprint not found'
      });
    }

    // Remove the finger
    fingerprint.fingers = fingerprint.fingers.filter(
      f => f._id.toString() !== fingerprintId
    );

    fingerprint.updatedAt = new Date();
    await fingerprint.save();

    // Get the deleted finger details
    const deletedFinger = fingerprint.fingers.find(
      f => f._id.toString() === fingerprintId
    );

    res.json({
      success: true,
      message: 'Fingerprint deleted successfully',
      data: {
        fingerprintId,
        staffId: fingerprint.staffId,
        fingerPosition: deletedFinger?.fingerPosition
      }
    });

  } catch (error) {
    console.error('Delete fingerprint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update fingerprint status (activate/deactivate)
 */
exports.updateFingerprintStatus = async (req, res) => {
  try {
    const { fingerprintId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isActive field required'
      });
    }

    // Find fingerprint document containing this finger
    const fingerprint = await Fingerprint.findOne({
      'fingers._id': fingerprintId
    });

    if (!fingerprint) {
      return res.status(404).json({
        success: false,
        message: 'Fingerprint not found'
      });
    }

    // Update the finger's status
    const finger = fingerprint.fingers.id(fingerprintId);
    finger.isActive = isActive;
    fingerprint.updatedAt = new Date();

    await fingerprint.save();

    res.json({
      success: true,
      message: `Fingerprint ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        fingerprintId,
        staffId: fingerprint.staffId,
        fingerPosition: finger.fingerPosition,
        isActive
      }
    });

  } catch (error) {
    console.error('Update fingerprint status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Check fingerprint quality
 */
exports.checkFingerprintQuality = async (req, res) => {
  try {
    const fingerprintImage = req.file;

    if (!fingerprintImage) {
      return res.status(400).json({
        success: false,
        message: 'Fingerprint image required'
      });
    }

    // Read image file
    const imageBuffer = fs.readFileSync(fingerprintImage.path);

    // Check quality using SDK
    const qualityResult = await fingerprintSDK.checkQuality(imageBuffer);

    // Clean up uploaded file
    fs.unlinkSync(fingerprintImage.path);

    res.json({
      success: true,
      data: qualityResult
    });

  } catch (error) {
    console.error('Check quality error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get fingerprint statistics
 */
exports.getFingerprintStats = async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments({ isActive: true });
    
    const staffWithFingerprints = await Fingerprint.countDocuments();
    
    const fingerprintStats = await Fingerprint.aggregate([
      { $unwind: '$fingers' },
      { $match: { 'fingers.isActive': true } },
      {
        $group: {
          _id: '$fingers.fingerPosition',
          count: { $sum: 1 },
          avgQuality: { $avg: '$fingers.quality' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const fingerDistribution = {};
    fingerprintStats.forEach(stat => {
      fingerDistribution[stat._id] = stat.count;
    });

    const totalFingerprints = await Fingerprint.aggregate([
      { $unwind: '$fingers' },
      { $match: { 'fingers.isActive': true } },
      { $count: 'total' }
    ]);

    const enrollmentRate = totalStaff > 0 
      ? ((staffWithFingerprints / totalStaff) * 100).toFixed(1) 
      : '0';

    res.json({
      success: true,
      data: {
        totalStaff,
        staffWithFingerprints,
        totalFingerprints: totalFingerprints[0]?.total || 0,
        averagePerStaff: staffWithFingerprints > 0 
          ? (totalFingerprints[0]?.total / staffWithFingerprints).toFixed(1) 
          : 0,
        fingerDistribution,
        fingerStats: fingerprintStats,
        enrollmentRate: `${enrollmentRate}%`
      }
    });

  } catch (error) {
    console.error('Get fingerprint stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};