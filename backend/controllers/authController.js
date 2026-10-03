const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// User Registration (Patients)
function register(req, res) {
  try {
    const { name, email, phone, date_of_birth, gender, address, password, confirmPassword } = req.body;

    // Field Validations
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password, role, phone)
      VALUES (?, ?, ?, 'Patient', ?)
    `);
    const userResult = insertUser.run(name.trim(), email.trim().toLowerCase(), hashedPassword, phone.trim());
    const userId = Number(userResult.lastInsertRowid);

    // Insert patient profile
    const insertPatient = db.prepare(`
      INSERT INTO patients (user_id, date_of_birth, gender, address)
      VALUES (?, ?, ?, ?)
    `);
    insertPatient.run(userId, date_of_birth || null, gender || 'Male', address || '');

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please login.'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Registration failed due to a server error. Please try again.' });
  }
}

// User Login
function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // Find user by email
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role check if provided
    if (role && user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: `Account found, but role mismatch. This account is registered as '${user.role}'.`
      });
    }

    // Password verification
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // If patient, fetch patient ID
    let patientId = null;
    let patientDetails = null;
    if (user.role === 'Patient') {
      const patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
      if (patient) {
        patientId = patient.id;
        patientDetails = patient;
      }
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: patientId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        patientId: patientId,
        details: patientDetails
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Login failed due to a server error. Please try again.' });
  }
}

// Get Current User Profile
function getProfile(req, res) {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let patient = null;
    if (user.role === 'Patient') {
      patient = db.prepare('SELECT * FROM patients WHERE user_id = ?').get(user.id);
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        patient
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch user profile.' });
  }
}

// Update Profile
function updateProfile(req, res) {
  try {
    const { name, phone, date_of_birth, gender, address } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name.trim(), phone || '', userId);

    if (req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(userId);
      if (patient) {
        db.prepare('UPDATE patients SET date_of_birth = ?, gender = ?, address = ? WHERE id = ?')
          .run(date_of_birth || null, gender || 'Male', address || '', patient.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!'
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
