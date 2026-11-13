// routes/delayRequestRoutes.js   (mounted at /api/work-session)
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');

const protect =
  auth.protect ||
  auth.authenticate ||
  ((req, res) =>
    res
      .status(401)
      .json({ success: false, message: 'Auth middleware missing protect()' }));

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
  createDelayRequests,
  getSessionDelayRequests,
  getMyDelayRequests,
  getDelayRequests,
  getDelayRequestById,
  updateDelayRequest,
  deleteDelayRequest,
  reviewDelayRequest,
  reviewManyDelayRequests,
} = require('../controllers/delayRequestController');

// fixed paths first, "/:id" routes last
router.post('/delay-request', protect, staffOnly, createDelayRequests);
router.get('/delay-request', protect, adminOnly, getDelayRequests);

router.patch('/delay-request/review-many', protect, adminOnly, reviewManyDelayRequests);
router.get('/delay-request/my/:employeeId', protect, getMyDelayRequests);
router.get('/delay-request/session/:sessionId', protect, getSessionDelayRequests);

router.get('/delay-request/:id', protect, getDelayRequestById);
router.put('/delay-request/:id', protect, staffOnly, updateDelayRequest);
router.delete('/delay-request/:id', protect, deleteDelayRequest);
router.patch('/delay-request/:id/review', protect, adminOnly, reviewDelayRequest);

module.exports = router;