const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database & tables
require('./backend/config/db');

// Import route modules
const authRoutes = require('./backend/routes/authRoutes');
const doctorRoutes = require('./backend/routes/doctorRoutes');
const departmentRoutes = require('./backend/routes/departmentRoutes');
const patientRoutes = require('./backend/routes/patientRoutes');
const appointmentRoutes = require('./backend/routes/appointmentRoutes');
const statsRoutes = require('./backend/routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets & pages
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'CareConnect Hospital Appointment System API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Contact Form Endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide your name, email, and message.' });
  }
  return res.status(200).json({
    success: true,
    message: 'Thank you for reaching out! Your message has been received. Our hospital care coordinator will contact you shortly.'
  });
});

// Firebase Firestore Status Endpoint
app.get('/api/firebase/status', async (req, res) => {
  try {
    const { getFirestore } = require('./backend/config/firebase');
    const firestore = getFirestore();
    if (!firestore) {
      return res.status(200).json({
        connected: false,
        message: 'Firebase credentials not active on this environment.'
      });
    }
    const [doctorsSnap, deptsSnap, apptsSnap] = await Promise.all([
      firestore.collection('doctors').get(),
      firestore.collection('departments').get(),
      firestore.collection('appointments').get()
    ]);
    return res.status(200).json({
      connected: true,
      projectId: 'careconnect-hospital-bd2d0',
      database: 'Cloud Firestore',
      stats: {
        doctorsCount: doctorsSnap.size,
        departmentsCount: deptsSnap.size,
        appointmentsCount: apptsSnap.size
      }
    });
  } catch (err) {
    return res.status(500).json({ connected: false, error: err.message });
  }
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler for any unmatched /api route
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// Fallback to index.html for direct client-side navigation
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  next();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred. Please try again.'
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🏥 CareConnect Hospital System running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log('----------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Admin:        admin@careconnect.example / Admin@123');
  console.log('  Receptionist: receptionist@careconnect.example / Reception@123');
  console.log('  Patient:      patient@careconnect.example / Patient@123');
  console.log('====================================================');
});

module.exports = { app, server };
