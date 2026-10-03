-- ===================================================================
-- CARECONNECT HOSPITAL APPOINTMENT SYSTEM - SAMPLE DATA
-- Target Database: MySQL (careconnect_hospital)
-- Note: Passwords here are bcrypt hashes of 'Admin@123', 'Reception@123', 'Patient@123'
-- Hash for 'Admin@123': $2a$10$wO082w6cE4p1kO7f0U9w.uK6x4BvF2N.n9bY5o7J6j5t4r3q2w1mO (or dynamically hashed)
-- ===================================================================

USE careconnect_hospital;

-- INSERT USERS
-- 1: Admin, 2: Receptionist, 3-7: Patients
INSERT INTO users (id, name, email, password, role, phone) VALUES
(1, 'Admin Officer', 'admin@careconnect.example', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Admin', '+91 9876543210'),
(2, 'Reception Desk', 'receptionist@careconnect.example', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Receptionist', '+91 9876543211'),
(3, 'Rohan Sharma', 'patient@careconnect.example', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Patient', '+91 9822012345'),
(4, 'Ananya Deshmukh', 'ananya@example.com', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Patient', '+91 9822012346'),
(5, 'Vikram Joshi', 'vikram@example.com', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Patient', '+91 9822012347'),
(6, 'Pooja Mehta', 'pooja@example.com', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Patient', '+91 9822012348'),
(7, 'Suresh Patil', 'suresh@example.com', '$2a$10$i02bF00a0tE4QhB76wF7p.4Y4z7KzG8vG8p2Y6vL6b9p1mO0q1w2e', 'Patient', '+91 9822012349');

-- INSERT PATIENTS
INSERT INTO patients (id, user_id, date_of_birth, gender, address) VALUES
(1, 3, '1995-05-15', 'Male', 'Flat 402, Sunshine Heights, FC Road, Pune'),
(2, 4, '1998-11-20', 'Female', 'B-12 Green Valley, Kothrud, Pune'),
(3, 5, '1988-03-08', 'Male', 'Plot 15, Nilgiri Park, Baner, Pune'),
(4, 6, '1992-09-25', 'Female', '304 Silver Crest, Viman Nagar, Pune'),
(5, 7, '1975-01-30', 'Male', 'House 56, Shivaji Colony, Camp, Pune');

-- INSERT DEPARTMENTS
INSERT INTO departments (id, name, description, icon) VALUES
(1, 'General Medicine', 'Comprehensive primary health care, diagnostic consultations, lifestyle management, and routine wellness screenings.', 'fa-stethoscope'),
(2, 'Cardiology', 'Advanced clinical and interventional diagnosis and treatment of cardiovascular diseases, hypertension, and heart disorders.', 'fa-heart-pulse'),
(3, 'Dermatology', 'Specialized skin, hair, and nail health care, clinical dermatologic therapies, and cosmetic dermatology.', 'fa-hand-dots'),
(4, 'Pediatrics', 'Comprehensive healthcare, preventive vaccinations, infant care, and pediatric growth management for children.', 'fa-baby'),
(5, 'Orthopedics', 'Treatment for bone fractures, joint problems, sports injuries, arthritis, and orthopedic reconstructive procedures.', 'fa-bone'),
(6, 'Gynecology', 'Comprehensive women healthcare, pregnancy care, reproductive health, and obstetric wellness guidance.', 'fa-person-dress'),
(7, 'Neurology', 'Diagnosis, therapy, and neuro-rehabilitation for brain, spine, nerve, and neuromuscular conditions.', 'fa-brain'),
(8, 'ENT (Otolaryngology)', 'Medical and surgical care for disorders of the ear, nose, throat, sinuses, and larynx.', 'fa-head-side-cough');

-- INSERT DOCTORS
INSERT INTO doctors (id, name, email, phone, qualification, specialization, department_id, experience, consultation_fee, gender, available_days, available_time, description, avatar, rating) VALUES
(1, 'Dr. Rahul Sharma', 'dr.rahul@careconnect.example', '+91 9123456701', 'MBBS, MD (Internal Medicine)', 'General Physician', 1, 10, 500.00, 'Male', 'Mon - Sat', '09:00 AM - 02:00 PM', 'Experienced physician specialized in managing acute viral conditions, hypertension, diabetes mellitus, and chronic preventive healthcare.', 'doctor_m1.png', 4.9),
(2, 'Dr. Priya Deshmukh', 'dr.priya@careconnect.example', '+91 9123456702', 'MBBS, MD, DM (Cardiology)', 'Senior Cardiologist', 2, 12, 1000.00, 'Female', 'Mon - Fri', '10:00 AM - 04:00 PM', 'Consultant interventional cardiologist with extensive expertise in echocardiography, cardiac preventative scans, and coronary artery disease management.', 'doctor_f1.png', 5.0),
(3, 'Dr. Amit Patil', 'dr.amit@careconnect.example', '+91 9123456703', 'MBBS, MS (Orthopedics)', 'Orthopedic Specialist', 5, 8, 800.00, 'Male', 'Mon, Wed, Fri', '09:30 AM - 03:30 PM', 'Specialist in sports injury rehabilitation, arthroscopy, joint replacement guidance, and degenerative spinal conditions.', 'doctor_m2.png', 4.8),
(4, 'Dr. Sneha Kulkarni', 'dr.sneha@careconnect.example', '+91 9123456704', 'MBBS, MD (Dermatology)', 'Consultant Dermatologist', 3, 7, 700.00, 'Female', 'Tue, Thu, Sat', '11:00 AM - 05:00 PM', 'Dermatologist offering advanced treatment for clinical eczema, acne vulgaris, hair loss, and cosmetic laser therapies.', 'doctor_f2.png', 4.9),
(5, 'Dr. Rajesh Nair', 'dr.rajesh@careconnect.example', '+91 9123456705', 'MBBS, DCH, MD (Pediatrics)', 'Pediatric Specialist', 4, 11, 600.00, 'Male', 'Mon - Sat', '09:00 AM - 01:30 PM', 'Dedicated child specialist dedicated to infant growth assessments, childhood allergies, nutrition, and comprehensive immunization plans.', 'doctor_m3.png', 4.8),
(6, 'Dr. Sunita Verma', 'dr.sunita@careconnect.example', '+91 9123456706', 'MBBS, MS, DGO', 'Gynecologist & Obstetrician', 6, 14, 900.00, 'Female', 'Mon - Fri', '10:30 AM - 04:30 PM', 'Expert in maternal care, prenatal monitoring, reproductive endocrinology, and minimally invasive gynecologic therapies.', 'doctor_f3.png', 4.9),
(7, 'Dr. Vikram Mehta', 'dr.vikram@careconnect.example', '+91 9123456707', 'MBBS, MD, DM (Neurology)', 'Senior Neurologist', 7, 15, 1200.00, 'Male', 'Mon, Wed, Fri', '01:00 PM - 06:00 PM', 'Renowned neurologist specialized in migraines, neurovascular stroke prevention, epilepsy, and peripheral neuropathy disorders.', 'doctor_m4.png', 4.9),
(8, 'Dr. Kavita Iyer', 'dr.kavita@careconnect.example', '+91 9123456708', 'MBBS, MS (ENT)', 'ENT Surgeon & Specialist', 8, 9, 650.00, 'Female', 'Tue - Sat', '09:30 AM - 03:00 PM', 'Ear, Nose & Throat specialist focusing on sinusitis treatments, hearing disorders, allergic rhinitis, and micro-laryngeal surgeries.', 'doctor_f4.png', 4.7);

-- INSERT SAMPLE APPOINTMENTS
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, notes, status) VALUES
(1, 1, 1, '2026-10-10', '10:00 AM', 'Seasonal flu symptoms and persistent dry cough', 'Follow up after 5 days if fever persists', 'Confirmed'),
(2, 1, 2, '2026-10-15', '11:30 AM', 'Annual cardiac wellness review & ECG consultation', 'Please carry previous lipid profile reports', 'Confirmed'),
(3, 2, 4, '2026-10-12', '02:00 PM', 'Persistent skin allergy and redness on forearms', 'Patch test requested', 'Pending'),
(4, 3, 3, '2026-10-08', '10:30 AM', 'Right knee pain after sports workout', 'Brought X-Ray report from diagnostic centre', 'Confirmed'),
(5, 4, 6, '2026-09-20', '11:00 AM', 'Routine wellness checkup and consultation', 'Patient reported feeling completely well', 'Completed'),
(6, 5, 7, '2026-09-18', '02:30 PM', 'Severe recurrent morning migraines', 'Prescribed prophylactic medicine and headache diary', 'Completed'),
(7, 1, 5, '2026-09-10', '09:30 AM', 'General health consultation', 'Cancelled due to patient personal travel', 'Cancelled');
