const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Logged in users (Patients, Admins, Receptionists) can access appointment routes
router.get('/', authenticateToken, appointmentController.getAllAppointments);
router.get('/:id', authenticateToken, appointmentController.getAppointmentById);
router.post('/', authenticateToken, appointmentController.createAppointment);
router.put('/:id/status', authenticateToken, requireRole(['Admin', 'Receptionist']), appointmentController.updateAppointmentStatus);
router.put('/:id/cancel', authenticateToken, appointmentController.cancelAppointment);
router.put('/:id/reschedule', authenticateToken, requireRole(['Admin', 'Receptionist', 'Patient']), appointmentController.rescheduleAppointment);

module.exports = router;
