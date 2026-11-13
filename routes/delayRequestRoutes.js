const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');

const protect =
  auth.protect ||
  auth.authenticate ||
  ((req, res, next) => {
    return res
      .status(401)
      .json({ success: false, message: 'Auth middleware missing protect()' });
  });

const staffOnly =
  auth.staffOnly ||
  ((req, res, next) => {
    if (!req.user || req.user.type !== 'staff') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Staff only.' });
    }
    next();
  });

const adminOnly =
  auth.adminOnly ||
  ((req, res, next) => {
    if (!req.user || req.user.type !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Admin only.' });
    }
    next();
  });

const {
  createDelayRequest,
  reviewDelayRequest,
  getDelayRequests,
  getMyDelayRequests,
} = require('../controllers/delayRequestController');

router.post('/delay-request', protect, staffOnly, createDelayRequest);
router.patch('/delay-request/:id/review', protect, adminOnly, reviewDelayRequest);
router.get('/delay-request', protect, adminOnly, getDelayRequests);
router.get('/delay-request/my/:employeeId', protect, getMyDelayRequests);

module.exports = router;