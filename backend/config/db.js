const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database file path inside database/ folder
const dbDir = path.join(__dirname, '..', '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'careconnect.db');

// Initialize SQLite database instance
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for high performance and relational integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Create tables if they do not exist
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Patient',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date_of_birth TEXT,
      gender TEXT DEFAULT 'Male',
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'fa-hospital',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      qualification TEXT NOT NULL,
      specialization TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      experience INTEGER NOT NULL DEFAULT 1,
      consultation_fee REAL NOT NULL DEFAULT 500.0,
      gender TEXT DEFAULT 'Male',
      available_days TEXT NOT NULL DEFAULT 'Monday - Friday',
      available_time TEXT NOT NULL DEFAULT '09:00 AM - 05:00 PM',
      description TEXT,
      avatar TEXT,
      rating REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
    );
  `);

  // Seed sample data if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('[Database] Seeding initial sample data...');
    seedDatabase();
    console.log('[Database] Seed completed successfully!');
  }
}

function seedDatabase() {
  const adminPassword = bcrypt.hashSync('Admin@123', 10);
  const receptionistPassword = bcrypt.hashSync('Reception@123', 10);
  const patientPassword = bcrypt.hashSync('Patient@123', 10);

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('Admin Officer', 'admin@careconnect.example', adminPassword, 'Admin', '+91 9876543210');
  insertUser.run('Reception Desk', 'receptionist@careconnect.example', receptionistPassword, 'Receptionist', '+91 9876543211');
  insertUser.run('Rohan Sharma', 'patient@careconnect.example', patientPassword, 'Patient', '+91 9822012345');
  insertUser.run('Ananya Deshmukh', 'ananya@example.com', patientPassword, 'Patient', '+91 9822012346');
  insertUser.run('Vikram Joshi', 'vikram@example.com', patientPassword, 'Patient', '+91 9822012347');
  insertUser.run('Pooja Mehta', 'pooja@example.com', patientPassword, 'Patient', '+91 9822012348');
  insertUser.run('Suresh Patil', 'suresh@example.com', patientPassword, 'Patient', '+91 9822012349');

  // 2. Seed Patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (user_id, date_of_birth, gender, address)
    VALUES (?, ?, ?, ?)
  `);
  insertPatient.run(3, '1995-05-15', 'Male', 'Flat 402, Sunshine Heights, FC Road, Pune');
  insertPatient.run(4, '1998-11-20', 'Female', 'B-12 Green Valley, Kothrud, Pune');
  insertPatient.run(5, '1988-03-08', 'Male', 'Plot 15, Nilgiri Park, Baner, Pune');
  insertPatient.run(6, '1992-09-25', 'Female', '304 Silver Crest, Viman Nagar, Pune');
  insertPatient.run(7, '1975-01-30', 'Male', 'House 56, Shivaji Colony, Camp, Pune');

  // 3. Seed Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (name, description, icon)
    VALUES (?, ?, ?)
  `);
  insertDept.run('General Medicine', 'Comprehensive primary health care, diagnostic consultations, lifestyle management, and routine wellness screenings.', 'fa-stethoscope');
  insertDept.run('Cardiology', 'Advanced clinical and interventional diagnosis and treatment of cardiovascular diseases, hypertension, and heart disorders.', 'fa-heart-pulse');
  insertDept.run('Dermatology', 'Specialized skin, hair, and nail health care, clinical dermatologic therapies, and cosmetic dermatology.', 'fa-hand-dots');
  insertDept.run('Pediatrics', 'Comprehensive healthcare, preventive vaccinations, infant care, and pediatric growth management for children.', 'fa-baby');
  insertDept.run('Orthopedics', 'Treatment for bone fractures, joint problems, sports injuries, arthritis, and orthopedic reconstructive procedures.', 'fa-bone');
  insertDept.run('Gynecology', 'Comprehensive women healthcare, pregnancy care, reproductive health, and obstetric wellness guidance.', 'fa-person-dress');
  insertDept.run('Neurology', 'Diagnosis, therapy, and neuro-rehabilitation for brain, spine, nerve, and neuromuscular conditions.', 'fa-brain');
  insertDept.run('ENT (Otolaryngology)', 'Medical and surgical care for disorders of the ear, nose, throat, sinuses, and larynx.', 'fa-head-side-cough');

  // 4. Seed Doctors
  const insertDoctor = db.prepare(`
    INSERT INTO doctors (name, email, phone, qualification, specialization, department_id, experience, consultation_fee, gender, available_days, available_time, description, avatar, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDoctor.run('Dr. Rahul Sharma', 'dr.rahul@careconnect.example', '+91 9123456701', 'MBBS, MD (Internal Medicine)', 'General Physician', 1, 10, 500.0, 'Male', 'Mon - Sat', '09:00 AM - 02:00 PM', 'Experienced physician specialized in managing acute viral conditions, hypertension, diabetes mellitus, and chronic preventive healthcare.', 'doctor_m1.png', 4.9);
  insertDoctor.run('Dr. Priya Deshmukh', 'dr.priya@careconnect.example', '+91 9123456702', 'MBBS, MD, DM (Cardiology)', 'Senior Cardiologist', 2, 12, 1000.0, 'Female', 'Mon - Fri', '10:00 AM - 04:00 PM', 'Consultant interventional cardiologist with extensive expertise in echocardiography, cardiac preventative scans, and coronary artery disease management.', 'doctor_f1.png', 5.0);
  insertDoctor.run('Dr. Amit Patil', 'dr.amit@careconnect.example', '+91 9123456703', 'MBBS, MS (Orthopedics)', 'Orthopedic Specialist', 5, 8, 800.0, 'Male', 'Mon, Wed, Fri', '09:30 AM - 03:30 PM', 'Specialist in sports injury rehabilitation, arthroscopy, joint replacement guidance, and degenerative spinal conditions.', 'doctor_m2.png', 4.8);
  insertDoctor.run('Dr. Sneha Kulkarni', 'dr.sneha@careconnect.example', '+91 9123456704', 'MBBS, MD (Dermatology)', 'Consultant Dermatologist', 3, 7, 700.0, 'Female', 'Tue, Thu, Sat', '11:00 AM - 05:00 PM', 'Dermatologist offering advanced treatment for clinical eczema, acne vulgaris, hair loss, and cosmetic laser therapies.', 'doctor_f2.png', 4.9);
  insertDoctor.run('Dr. Rajesh Nair', 'dr.rajesh@careconnect.example', '+91 9123456705', 'MBBS, DCH, MD (Pediatrics)', 'Pediatric Specialist', 4, 11, 600.0, 'Male', 'Mon - Sat', '09:00 AM - 01:30 PM', 'Dedicated child specialist dedicated to infant growth assessments, childhood allergies, nutrition, and comprehensive immunization plans.', 'doctor_m3.png', 4.8);
  insertDoctor.run('Dr. Sunita Verma', 'dr.sunita@careconnect.example', '+91 9123456706', 'MBBS, MS, DGO', 'Gynecologist & Obstetrician', 6, 14, 900.0, 'Female', 'Mon - Fri', '10:30 AM - 04:30 PM', 'Expert in maternal care, prenatal monitoring, reproductive endocrinology, and minimally invasive gynecologic therapies.', 'doctor_f3.png', 4.9);
  insertDoctor.run('Dr. Vikram Mehta', 'dr.vikram@careconnect.example', '+91 9123456707', 'MBBS, MD, DM (Neurology)', 'Senior Neurologist', 7, 15, 1200.0, 'Male', 'Mon, Wed, Fri', '01:00 PM - 06:00 PM', 'Renowned neurologist specialized in migraines, neurovascular stroke prevention, epilepsy, and peripheral neuropathy disorders.', 'doctor_m4.png', 4.9);
  insertDoctor.run('Dr. Kavita Iyer', 'dr.kavita@careconnect.example', '+91 9123456708', 'MBBS, MS (ENT)', 'ENT Surgeon & Specialist', 8, 9, 650.0, 'Female', 'Tue - Sat', '09:30 AM - 03:00 PM', 'Ear, Nose & Throat specialist focusing on sinusitis treatments, hearing disorders, allergic rhinitis, and micro-laryngeal surgeries.', 'doctor_f4.png', 4.7);

  // 5. Seed Appointments
  const insertAppointment = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  // Generate a dynamic date for tomorrow/next week so upcoming appointments look fresh and active
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() + 3);
  const d2 = new Date(today); d2.setDate(today.getDate() + 7);
  const d3 = new Date(today); d3.setDate(today.getDate() + 5);
  const d4 = new Date(today); d4.setDate(today.getDate() + 2);
  const dPast1 = new Date(today); dPast1.setDate(today.getDate() - 10);
  const dPast2 = new Date(today); dPast2.setDate(today.getDate() - 15);
  const dPast3 = new Date(today); dPast3.setDate(today.getDate() - 25);

  const fmt = (d) => d.toISOString().split('T')[0];

  insertAppointment.run(1, 1, fmt(d1), '10:00 AM', 'Seasonal flu symptoms and persistent dry cough', 'Follow up after 5 days if fever persists', 'Confirmed');
  insertAppointment.run(1, 2, fmt(d2), '11:30 AM', 'Annual cardiac wellness review & ECG consultation', 'Please carry previous lipid profile reports', 'Confirmed');
  insertAppointment.run(2, 4, fmt(d3), '02:00 PM', 'Persistent skin allergy and redness on forearms', 'Patch test requested', 'Pending');
  insertAppointment.run(3, 3, fmt(d4), '10:30 AM', 'Right knee pain after sports workout', 'Brought X-Ray report from diagnostic centre', 'Confirmed');
  insertAppointment.run(4, 6, fmt(dPast1), '11:00 AM', 'Routine wellness checkup and consultation', 'Patient reported feeling completely well', 'Completed');
  insertAppointment.run(5, 7, fmt(dPast2), '02:30 PM', 'Severe recurrent morning migraines', 'Prescribed prophylactic medicine and headache diary', 'Completed');
  insertAppointment.run(1, 5, fmt(dPast3), '09:30 AM', 'General health consultation', 'Cancelled due to patient personal travel', 'Cancelled');
}

// Initialize database schema and data
initDatabase();

module.exports = db;
