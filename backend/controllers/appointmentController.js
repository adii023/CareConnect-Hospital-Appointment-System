const db = require('../config/db');

// Get all appointments with rich filters
function getAllAppointments(req, res) {
  try {
    const { status, date, doctor_id, department_id, patient_id, search, upcoming } = req.query;

    let query = `
      SELECT 
        a.id AS appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.notes,
        a.status,
        a.created_at,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        p.gender AS patient_gender,
        p.date_of_birth AS patient_dob,
        d.name AS doctor_name,
        d.qualification AS doctor_qualification,
        d.specialization AS doctor_specialization,
        d.consultation_fee,
        d.avatar AS doctor_avatar,
        dept.id AS department_id,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = a.doctor_id
      JOIN departments dept ON dept.id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    // Role-based security: Patients can only see their own appointments
    if (req.user && req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query += ` AND a.patient_id = ?`;
      params.push(patient.id);
    } else if (patient_id) {
      query += ` AND a.patient_id = ?`;
      params.push(Number(patient_id));
    }

    if (status && status !== 'all') {
      query += ` AND LOWER(a.status) = LOWER(?)`;
      params.push(status.trim());
    }

    if (date) {
      query += ` AND a.appointment_date = ?`;
      params.push(date.trim());
    }

    if (doctor_id) {
      query += ` AND a.doctor_id = ?`;
      params.push(Number(doctor_id));
    }

    if (department_id) {
      query += ` AND dept.id = ?`;
      params.push(Number(department_id));
    }

    if (search) {
      query += ` AND (LOWER(u.name) LIKE ? OR LOWER(d.name) LIKE ? OR a.id = ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      const searchNum = !isNaN(search) ? Number(search) : -1;
      params.push(term, term, searchNum);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (upcoming === 'true') {
      query += ` AND a.appointment_date >= ? AND a.status IN ('Confirmed', 'Pending')`;
      params.push(todayStr);
      query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;
    } else {
      query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    }

    const appointments = db.prepare(query).all(...params);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
  }
}

// Get appointment by ID
function getAppointmentById(req, res) {
  try {
    const { id } = req.params;

    const appointment = db.prepare(`
      SELECT 
        a.id AS appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.appointment_time,
        a.reason,
        a.notes,
        a.status,
        a.created_at,
        u.name AS patient_name,
        u.email AS patient_email,
        u.phone AS patient_phone,
        p.gender AS patient_gender,
        p.date_of_birth AS patient_dob,
        p.address AS patient_address,
        d.name AS doctor_name,
        d.qualification AS doctor_qualification,
        d.specialization AS doctor_specialization,
        d.consultation_fee,
        d.phone AS doctor_phone,
        dept.id AS department_id,
        dept.name AS department_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = a.doctor_id
      JOIN departments dept ON dept.id = d.department_id
      WHERE a.id = ?
    `).get(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Role security check for patients
    if (req.user && req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient || patient.id !== appointment.patient_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this appointment.' });
      }
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch appointment details.' });
  }
}

// Book a new appointment
function createAppointment(req, res) {
  try {
    let { patient_id, doctor_id, appointment_date, appointment_time, reason, notes } = req.body;

    // If patient is booking, infer their patient_id
    if (req.user && req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient) {
        return res.status(400).json({ success: false, message: 'Patient profile not found. Please complete profile.' });
      }
      patient_id = patient.id;
    }

    if (!patient_id || !doctor_id || !appointment_date || !appointment_time || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide all required appointment fields.' });
    }

    // 1. Validation: Appointment date cannot be in the past
    const todayStr = new Date().toISOString().split('T')[0];
    if (appointment_date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past. Please select today or a future date.'
      });
    }

    // 2. Validation: Doctor exists
    const doctor = db.prepare(`
      SELECT d.*, dept.name AS department_name 
      FROM doctors d 
      JOIN departments dept ON dept.id = d.department_id 
      WHERE d.id = ?
    `).get(doctor_id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    // 3. Validation: Patient exists
    const patient = db.prepare(`
      SELECT p.*, u.name AS patient_name, u.email AS patient_email, u.phone AS patient_phone 
      FROM patients p 
      JOIN users u ON u.id = p.user_id 
      WHERE p.id = ?
    `).get(patient_id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // 4. Duplicate slot prevention (Same doctor, same date, same time, status not cancelled)
    const existingBooking = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? 
        AND appointment_date = ? 
        AND appointment_time = ? 
        AND status != 'Cancelled'
    `).get(doctor_id, appointment_date, appointment_time);

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: 'This appointment slot is already booked. Please select another time.'
      });
    }

    // Insert appointment
    const insertStmt = db.prepare(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')
    `);

    const result = insertStmt.run(
      Number(patient_id),
      Number(doctor_id),
      appointment_date,
      appointment_time,
      reason.trim(),
      notes ? notes.trim() : ''
    );

    const newAppointmentId = Number(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Appointment Booked Successfully',
      data: {
        appointment_id: newAppointmentId,
        patient_name: patient.patient_name,
        patient_email: patient.patient_email,
        patient_phone: patient.patient_phone,
        doctor_name: doctor.name,
        doctor_specialization: doctor.specialization,
        department_name: doctor.department_name,
        appointment_date,
        appointment_time,
        reason,
        notes,
        consultation_fee: doctor.consultation_fee,
        status: 'Confirmed'
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ success: false, message: 'Failed to book appointment.' });
  }
}

// Update appointment status (Confirm, Mark Completed, Cancel)
function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // If patient is cancelling, check that they own the appointment
    if (req.user && req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient || patient.id !== appointment.patient_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to modify this appointment.' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Patients can only cancel their appointments.' });
      }
    }

    db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id);

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update appointment status.' });
  }
}

// Cancel appointment
function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    // Role check for patient
    if (req.user && req.user.role === 'Patient') {
      const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
      if (!patient || patient.id !== appointment.patient_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this appointment.' });
      }
    }

    db.prepare("UPDATE appointments SET status = 'Cancelled' WHERE id = ?").run(id);

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully. The time slot is now available.'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment.' });
  }
}

// Reschedule appointment
function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ success: false, message: 'New date and time are required.' });
    }

    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (appointment_date < todayStr) {
      return res.status(400).json({ success: false, message: 'Appointment date cannot be in the past.' });
    }

    // Check slot collision
    const collision = db.prepare(`
      SELECT id FROM appointments 
      WHERE doctor_id = ? 
        AND appointment_date = ? 
        AND appointment_time = ? 
        AND status != 'Cancelled' 
        AND id != ?
    `).get(appointment.doctor_id, appointment_date, appointment_time, id);

    if (collision) {
      return res.status(409).json({
        success: false,
        message: 'This appointment slot is already booked. Please select another time.'
      });
    }

    db.prepare(`
      UPDATE appointments 
      SET appointment_date = ?, appointment_time = ?, status = 'Confirmed'
      WHERE id = ?
    `).run(appointment_date, appointment_time, id);

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully!'
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return res.status(500).json({ success: false, message: 'Failed to reschedule appointment.' });
  }
}

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment
};
