const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Get all patients with search & stats
function getAllPatients(req, res) {
  try {
    const { search, gender } = req.query;

    let query = `
      SELECT 
        p.id AS patient_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        p.gender,
        p.date_of_birth,
        p.address,
        u.created_at AS registration_date,
        COUNT(a.id) AS appointment_count
      FROM patients p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN appointments a ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (gender) {
      query += ` AND LOWER(p.gender) = LOWER(?)`;
      params.push(gender.trim());
    }

    query += ` GROUP BY p.id ORDER BY u.created_at DESC`;

    const patients = db.prepare(query).all(...params);
    return res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch patients list.' });
  }
}

// Get patient by ID with appointment history
function getPatientById(req, res) {
  try {
    const { id } = req.params;

    const patient = db.prepare(`
      SELECT 
        p.id AS patient_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        p.gender,
        p.date_of_birth,
        p.address,
        u.created_at AS registration_date
      FROM patients p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Fetch patient appointments
    const appointments = db.prepare(`
      SELECT 
        a.*,
        d.name AS doctor_name,
        d.specialization,
        d.consultation_fee,
        dept.name AS department_name
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      JOIN departments dept ON dept.id = d.department_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `).all(id);

    return res.status(200).json({
      success: true,
      data: {
        ...patient,
        appointments
      }
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient details.' });
  }
}

// Admin / Receptionist can register a new walk-in patient
function createPatient(req, res) {
  try {
    const { name, email, phone, date_of_birth, gender, address } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Patient name, email, and phone are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    // Default password for walk-in patient
    const hashedPassword = bcrypt.hashSync('Patient@123', 10);

    const userResult = db.prepare(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, 'Patient', ?)
    `).run(name.trim(), email.trim().toLowerCase(), hashedPassword, phone.trim());

    const userId = Number(userResult.lastInsertRowid);

    const patientResult = db.prepare(`
      INSERT INTO patients (user_id, date_of_birth, gender, address)
      VALUES (?, ?, ?, ?)
    `).run(userId, date_of_birth || null, gender || 'Male', address || '');

    const patientId = Number(patientResult.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully!',
      data: {
        patientId,
        userId,
        name,
        email,
        phone
      }
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    return res.status(500).json({ success: false, message: 'Failed to register patient.' });
  }
}

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient
};
