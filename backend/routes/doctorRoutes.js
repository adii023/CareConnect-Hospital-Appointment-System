const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/slots', doctorController.getDoctorSlots);

// Admin-only endpoints
router.post('/', authenticateToken, requireRole(['Admin']), doctorController.createDoctor);
router.put('/:id', authenticateToken, requireRole(['Admin']), doctorController.updateDoctor);
router.delete('/:id', authenticateToken, requireRole(['Admin']), doctorController.deleteDoctor);

module.exports = router;
