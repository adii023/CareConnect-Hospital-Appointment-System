const db = require('../config/db');

// Get all departments with doctor count
function getAllDepartments(req, res) {
  try {
    const departments = db.prepare(`
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        d.icon, 
        d.created_at,
        COUNT(doc.id) AS doctor_count
      FROM departments d
      LEFT JOIN doctors doc ON doc.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    return res.status(200).json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
}

// Get department by ID
function getDepartmentById(req, res) {
  try {
    const { id } = req.params;
    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const doctors = db.prepare(`
      SELECT id, name, qualification, specialization, experience, consultation_fee, avatar, rating, available_days, available_time
      FROM doctors
      WHERE department_id = ?
    `).all(id);

    return res.status(200).json({
      success: true,
      data: {
        ...department,
        doctors
      }
    });
  } catch (error) {
    console.error('Error fetching department details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch department details.' });
  }
}

// Create new department (Admin)
function createDepartment(req, res) {
  try {
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    const existing = db.prepare('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A department with this name already exists.' });
    }

    const result = db.prepare(`
      INSERT INTO departments (name, description, icon)
      VALUES (?, ?, ?)
    `).run(name.trim(), description || '', icon || 'fa-hospital');

    return res.status(201).json({
      success: true,
      message: 'Department added successfully!',
      data: { id: Number(result.lastInsertRowid), name, description, icon }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    return res.status(500).json({ success: false, message: 'Failed to add department.' });
  }
}

// Update department (Admin)
function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    const existing = db.prepare('SELECT id FROM departments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    db.prepare(`
      UPDATE departments
      SET name = ?, description = ?, icon = ?
      WHERE id = ?
    `).run(name.trim(), description || '', icon || 'fa-hospital', id);

    return res.status(200).json({ success: true, message: 'Department updated successfully!' });
  } catch (error) {
    console.error('Error updating department:', error);
    return res.status(500).json({ success: false, message: 'Failed to update department.' });
  }
}

// Delete department (Admin)
function deleteDepartment(req, res) {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM departments WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Check if doctors are assigned
    const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors WHERE department_id = ?').get(id).count;
    if (doctorCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${doctorCount} doctor(s) are assigned to this department. Please reassign them first.`
      });
    }

    db.prepare('DELETE FROM departments WHERE id = ?').run(id);

    return res.status(200).json({ success: true, message: 'Department deleted successfully!' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete department.' });
  }
}

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
