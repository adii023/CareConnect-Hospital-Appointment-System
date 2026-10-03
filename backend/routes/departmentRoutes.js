const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public endpoints
router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Admin-only endpoints
router.post('/', authenticateToken, requireRole(['Admin']), departmentController.createDepartment);
router.put('/:id', authenticateToken, requireRole(['Admin']), departmentController.updateDepartment);
router.delete('/:id', authenticateToken, requireRole(['Admin']), departmentController.deleteDepartment);

module.exports = router;
