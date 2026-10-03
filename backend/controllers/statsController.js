const db = require('../config/db');

// Get overall system statistics for Admin & Receptionist dashboards
function getDashboardStats(req, res) {
  try {
    const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?').get(todayStr).count;

    // Status breakdown
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `).all();

    // Department breakdown
    const deptDistribution = db.prepare(`
      SELECT dept.name, COUNT(a.id) as count
      FROM departments dept
      LEFT JOIN doctors d ON d.department_id = dept.id
      LEFT JOIN appointments a ON a.doctor_id = d.id
      GROUP BY dept.id
      ORDER BY count DESC
    `).all();

    // Monthly appointment trends (last 6 months)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', appointment_date) as month,
        COUNT(*) as count
      FROM appointments
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `).all();

    return res.status(200).json({
      success: true,
      data: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments,
        statusCounts,
        deptDistribution,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics.' });
  }
}

// Get patient-specific stats for patient dashboard
function getPatientStats(req, res) {
  try {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(req.user.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const upcoming = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ? AND appointment_date >= ? AND status IN ('Confirmed', 'Pending')
    `).get(patient.id, todayStr).count;

    const completed = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ? AND status = 'Completed'
    `).get(patient.id).count;

    const cancelled = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ? AND status = 'Cancelled'
    `).get(patient.id).count;

    const total = db.prepare(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ?
    `).get(patient.id).count;

    return res.status(200).json({
      success: true,
      data: {
        upcoming,
        completed,
        cancelled,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient statistics.' });
  }
}

module.exports = {
  getDashboardStats,
  getPatientStats
};
