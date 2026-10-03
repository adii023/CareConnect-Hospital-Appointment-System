const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/dashboard', authenticateToken, requireRole(['Admin', 'Receptionist']), statsController.getDashboardStats);
router.get('/patient', authenticateToken, requireRole(['Patient']), statsController.getPatientStats);

module.exports = router;
