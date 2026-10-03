const db = require('../config/db');

// Standard daily appointment slots
const STANDARD_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM'
];

// Get all doctors with filters & search
function getAllDoctors(req, res) {
  try {
    const { search, department, specialization, gender } = req.query;

    let query = `
      SELECT 
        d.id, 
        d.name, 
        d.email, 
        d.phone, 
        d.qualification, 
        d.specialization, 
        d.department_id, 
        dept.name AS department_name, 
        d.experience, 
        d.consultation_fee, 
        d.gender, 
        d.available_days, 
        d.available_time, 
        d.description, 
        d.avatar, 
        d.rating,
        d.created_at
      FROM doctors d
      JOIN departments dept ON dept.id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (LOWER(d.name) LIKE ? OR LOWER(d.specialization) LIKE ? OR LOWER(d.qualification) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (department) {
      // Can be department_id or department name
      if (!isNaN(department)) {
        query += ` AND d.department_id = ?`;
        params.push(Number(department));
      } else {
        query += ` AND LOWER(dept.name) = LOWER(?)`;
        params.push(department.trim());
      }
    }

    if (specialization) {
      query += ` AND LOWER(d.specialization) LIKE ?`;
      params.push(`%${specialization.trim().toLowerCase()}%`);
    }

    if (gender) {
      query += ` AND LOWER(d.gender) = LOWER(?)`;
      params.push(gender.trim());
    }

    query += ` ORDER BY d.name ASC`;

    const doctors = db.prepare(query).all(...params);
    return res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctors.' });
  }
}

// Get doctor by ID
function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const doctor = db.prepare(`
      SELECT 
        d.*, 
        dept.name AS department_name,
        dept.description AS department_description
      FROM doctors d
      JOIN departments dept ON dept.id = d.department_id
      WHERE d.id = ?
    `).get(id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    console.error('Error fetching doctor details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor details.' });
  }
}

// Get available slots for doctor on a given date
function getDoctorSlots(req, res) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
    }

    // Verify doctor exists
    const doctor = db.prepare('SELECT id, name, available_days, available_time FROM doctors WHERE id = ?').get(id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Check if date is in the past
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = date < todayStr;

    // Get all existing active bookings for this doctor on the date
    const bookedAppointments = db.prepare(`
      SELECT appointment_time 
      FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND status != 'Cancelled'
    `).all(id, date);

    const bookedSlotTimes = new Set(bookedAppointments.map(a => a.appointment_time));

    // Construct slot status
    const slots = STANDARD_SLOTS.map(slotTime => {
      const isBooked = bookedSlotTimes.has(slotTime);
      return {
        time: slotTime,
        isAvailable: !isPast && !isBooked,
        isBooked: isBooked,
        isPast: isPast
      };
    });

    return res.status(200).json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        available_days: doctor.available_days,
        available_time: doctor.available_time
      },
      date,
      isPast,
      slots
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor availability slots.' });
  }
}

// Create new doctor (Admin)
function createDoctor(req, res) {
  try {
    const {
      name,
      email,
      phone,
      qualification,
      specialization,
      department_id,
      experience,
      consultation_fee,
      gender,
      available_days,
      available_time,
      description,
      avatar,
      rating
    } = req.body;

    if (!name || !email || !qualification || !specialization || !department_id) {
      return res.status(400).json({ success: false, message: 'Please provide all required doctor fields.' });
    }

    // Email check
    const existing = db.prepare('SELECT id FROM doctors WHERE LOWER(email) = LOWER(?)').get(email.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'A doctor with this email already exists.' });
    }

    // Verify department exists
    const dept = db.prepare('SELECT id FROM departments WHERE id = ?').get(department_id);
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Invalid department selected.' });
    }

    const defaultAvatar = gender === 'Female' ? 'doctor_f1.png' : 'doctor_m1.png';

    const result = db.prepare(`
      INSERT INTO doctors (
        name, email, phone, qualification, specialization, department_id,
        experience, consultation_fee, gender, available_days, available_time,
        description, avatar, rating
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      email.trim(),
      phone || '',
      qualification.trim(),
      specialization.trim(),
      Number(department_id),
      Number(experience) || 1,
      Number(consultation_fee) || 500.0,
      gender || 'Male',
      available_days || 'Monday - Friday',
      available_time || '09:00 AM - 05:00 PM',
      description || '',
      avatar || defaultAvatar,
      Number(rating) || 4.8
    );

    return res.status(201).json({
      success: true,
      message: 'Doctor added successfully!',
      doctorId: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return res.status(500).json({ success: false, message: 'Failed to add doctor.' });
  }
}

// Update doctor (Admin)
function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      qualification,
      specialization,
      department_id,
      experience,
      consultation_fee,
      gender,
      available_days,
      available_time,
      description,
      avatar,
      rating
    } = req.body;

    const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // Validate department
    if (department_id) {
      const dept = db.prepare('SELECT id FROM departments WHERE id = ?').get(department_id);
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Invalid department selected.' });
      }
    }

    db.prepare(`
      UPDATE doctors SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        qualification = COALESCE(?, qualification),
        specialization = COALESCE(?, specialization),
        department_id = COALESCE(?, department_id),
        experience = COALESCE(?, experience),
        consultation_fee = COALESCE(?, consultation_fee),
        gender = COALESCE(?, gender),
        available_days = COALESCE(?, available_days),
        available_time = COALESCE(?, available_time),
        description = COALESCE(?, description),
        avatar = COALESCE(?, avatar),
        rating = COALESCE(?, rating)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      email ? email.trim() : null,
      phone || null,
      qualification ? qualification.trim() : null,
      specialization ? specialization.trim() : null,
      department_id ? Number(department_id) : null,
      experience ? Number(experience) : null,
      consultation_fee ? Number(consultation_fee) : null,
      gender || null,
      available_days || null,
      available_time || null,
      description || null,
      avatar || null,
      rating ? Number(rating) : null,
      id
    );

    return res.status(200).json({ success: true, message: 'Doctor details updated successfully!' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({ success: false, message: 'Failed to update doctor.' });
  }
}

// Delete doctor (Admin)
function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM doctors WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
    return res.status(200).json({ success: true, message: 'Doctor removed successfully!' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete doctor.' });
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
