const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { protect } = require('../middleware/auth.middleware');

// All staff routes require authentication
router.use(protect);

// Staff routes matching your Flutter model
router.post('/', staffController.createStaff);              // Create staff
router.get('/options', staffController.getStaffOptions);    // For dropdowns
router.get('/', staffController.getAllStaff);                // Get all staff
router.get('/:id', staffController.getStaffById);            // Get single staff
router.put('/:id', staffController.updateStaff);             // Update staff
router.delete('/:id', staffController.deleteStaff);          // Delete staff
router.patch('/:id/toggle-status', staffController.toggleStatus); // Toggle active status

module.exports = router;