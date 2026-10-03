const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Staff endpoints (Admin and Receptionist can view and register patients)
router.get('/', authenticateToken, requireRole(['Admin', 'Receptionist']), patientController.getAllPatients);
router.get('/:id', authenticateToken, patientController.getPatientById);
router.post('/', authenticateToken, requireRole(['Admin', 'Receptionist']), patientController.createPatient);

module.exports = router;
