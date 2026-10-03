# 🏥 CareConnect Hospital Appointment System
> **A Complete, Modern, Full-Stack Web Application for TY Computer Science Projects & Viva Voce Evaluations**

![Project Status](https://img.shields.io/badge/Status-Complete%20%26%20Fully%20Functional-10b981?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20SQLite%20%26%20MySQL-0284c7?style=for-the-badge)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20Vanilla%20CSS3%20%7C%20ES6%20JS-0d9488?style=for-the-badge)
![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt%20Hashing-f59e0b?style=for-the-badge)

---

## 📋 Table of Contents
1. [Project Overview & Objective](#-project-overview--objective)
2. [Key Features](#-key-features)
3. [Technology Stack](#-technology-stack)
4. [Demo Login Credentials](#-demo-login-credentials)
5. [Quick Start & Installation Guide](#-quick-start--installation-guide)
6. [Database Setup (SQLite & MySQL)](#-database-setup-sqlite--mysql)
7. [Project Directory Structure](#-project-directory-structure)
8. [Complete REST API Reference](#-complete-rest-api-reference)
9. [Step-by-Step Viva Voce Demonstration Walkthrough](#-step-by-step-viva-voce-demonstration-walkthrough)
10. [Automated Testing](#-automated-testing)
11. [Future Scope](#-future-scope)

---

## 🌟 Project Overview & Objective

**CareConnect Hospital** is a digital hospital appointment management system designed for outpatient healthcare facilities. It solves the critical problem of long physical hospital queues, doctor overbooking, and uncoordinated appointment scheduling by providing:
- **Instant Online Booking:** Patients browse specialists across 8 clinical departments, check visiting hours and consultation fees, and select available time slots with zero scheduling collisions.
- **Role-Based Portals:** Dedicated, authenticated interfaces for **Patients**, **Hospital Administrators**, and **Reception Desk Staff**.
- **Real-Time Data Persistence:** Built on a relational database architecture with prepared SQL queries, foreign key constraints, and collision validation.
- **Academic Readiness:** Easy to run locally with **one command (`npm start`)**, zero setup hurdles, and 1-click credential buttons for effortless viva demonstrations.

---

## ⚡ Key Features

### 👤 1. Patient Portal
- **Registration & Login:** Full input validation (email format, 10-digit mobile, minimum 6-character password, password match).
- **Specialist Discovery:** Search doctors by name, filter by department (Cardiology, Neurology, Pediatrics, etc.), gender, and view consultation fees in Indian Rupees (₹).
- **Doctor Profiles:** Detailed clinical experience, qualifications (MBBS, MD, MS, DM), visiting days, and hospital hours.
- **Smart Slot Booking:** Prevents booking already-taken slots and blocks past dates (`HTTP 409 Conflict` & `HTTP 400 Bad Request` handling).
- **Appointment Management:** Review upcoming consultations, review past visits, and cancel bookings with instant slot release.
- **Printable Slip:** Clean A4 print layout with hospital letterhead, unique appointment ID (`#CC-00001`), patient details, doctor details, and fees.
- **Profile Management:** Update personal contact details and residential address.

### 🛡️ 2. Admin Dashboard
- **Executive KPIs:** Live counters for Total Doctors, Total Patients, Total Bookings, and Today's Consultations.
- **Interactive Analytics:** CSS-powered bar charts visualizing **Appointments by Department** and **Booking Status Distribution**.
- **Doctor CRUD:** Modal forms to Add New Doctor, Edit Profile/Fees/Schedule, and Delete Doctors.
- **Department CRUD:** Manage hospital departments with deletion safeguards (prevents deletion if doctors are currently assigned).
- **Patient Records:** Search and view patient demographic records and consultation histories.
- **Appointment Supervision:** Master list of all bookings with date, doctor, and status filters; actions to **Confirm**, **Mark Completed**, or **Cancel**.

### 💼 3. Receptionist Desk
- **Daily OPD Schedule:** Date picker and real-time search for managing the day's consultation queue.
- **Walk-in Booking:** Rapid booking wizard to register walk-in patients on the fly and assign slots.
- **Rescheduling Engine:** Modify appointment date and time while verifying slot availability.
- **Status Updates:** Update statuses to Confirmed, Completed, or Cancelled.

---

## 💻 Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5, Modern CSS3, JavaScript ES6 | Clean, responsive healthcare design without heavy frontend build tools. |
| **Icons & Fonts** | FontAwesome 6 CDN, Google Plus Jakarta Sans | Modern typography and crisp vector medical iconography. |
| **Backend API** | Node.js (v18+) with Express.js | Transparent RESTful routing, modular controllers, and fast execution. |
| **Security & Auth** | JSON Web Tokens (JWT) + `bcryptjs` | Industry-standard password hashing and role-based route protection. |
| **Default Database** | Node.js Built-in SQLite (`node:sqlite`) | Runs out of the box with **zero configuration** and automatic data seeding. |
| **MySQL Compatibility**| MySQL 5.7+ / 8.0+ scripts | Includes full `schema.sql` and `sample-data.sql` for MySQL submission. |

---

## 🔑 Demo Login Credentials

For quick viva demonstration, the **Login Page (`login.html`)** includes **1-Click Demo Credential Buttons** that automatically populate these credentials:

| Role | Email Address | Password | Accessible Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@careconnect.example` | `Admin@123` | `admin-dashboard.html` |
| **Receptionist** | `receptionist@careconnect.example` | `Reception@123` | `receptionist-dashboard.html` |
| **Patient** | `patient@careconnect.example` | `Patient@123` | `patient-dashboard.html` |

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- Node.js (v18.x, v20.x, v22.x, or v24.x) installed on your system.

### Steps to Run:
1. **Open Terminal / Command Prompt** in the project directory:
   ```bash
   cd "c:\Users\Admin\Desktop\Adii TYCS"
   ```

2. **Install Dependencies** (only needed once):
   ```bash
   npm install
   ```

3. **Start the Application:**
   ```bash
   npm start
   ```

4. **Access the System:**
   Open your web browser and navigate to:
   👉 **`http://localhost:5000`**

The server will automatically create `database/careconnect.db` and seed all 8 departments, 8 doctors, 5 sample patients, and realistic appointments with hashed passwords!

---

## 🗄️ Database Setup (SQLite & MySQL)

### Option A: Out-of-the-Box SQLite (Recommended for Viva)
- Requires **zero configuration**.
- Node.js handles table creation and seeding automatically on first launch via `backend/config/db.js`.

### Option B: MySQL Setup (For College Lab Submissions)
If your examiner asks for MySQL:
1. Open **MySQL Workbench** or **phpMyAdmin**.
2. Run the schema creation script:
   ```sql
   source database/schema.sql;
   ```
3. Run the sample data insertion script:
   ```sql
   source database/sample-data.sql;
   ```
4. All tables (`users`, `patients`, `departments`, `doctors`, `appointments`) with foreign keys and unique constraints will be populated.

---

## 📂 Project Directory Structure

```
CareConnect-Hospital/
│
├── package.json                   # Dependencies, project metadata & scripts
├── server.js                      # Express server entry point & static file hosting
│
├── backend/                       # Backend Application Tier
│   ├── config/
│   │   └── db.js                  # Database connection, tables initialization & auto-seeding
│   ├── controllers/
│   │   ├── authController.js      # Register, login, profile view & update logic
│   │   ├── doctorController.js    # Doctor search, filters, slot calculation & CRUD
│   │   ├── departmentController.js# Department listing, stats & CRUD
│   │   ├── patientController.js   # Patient directory & walk-in registration
│   │   ├── appointmentController.js# Booking, duplicate check, reschedule & cancel
│   │   └── statsController.js     # Admin & patient dashboard KPI calculations
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT authentication & requireRole checks
│   └── routes/
│       ├── authRoutes.js          # /api/auth
│       ├── doctorRoutes.js        # /api/doctors
│       ├── departmentRoutes.js    # /api/departments
│       ├── patientRoutes.js       # /api/patients
│       ├── appointmentRoutes.js   # /api/appointments
│       └── statsRoutes.js         # /api/stats
│
├── database/                      # Database Tier
│   ├── schema.sql                 # MySQL DDL table creation script
│   ├── sample-data.sql            # MySQL DML sample records
│   └── careconnect.db             # Auto-generated SQLite database
│
├── frontend/                      # Presentation Tier (Client Web Pages)
│   ├── index.html                 # Landing page with hero, services & departments
│   ├── doctors.html               # Doctor catalog with live search & department filters
│   ├── doctor-details.html        # Detailed doctor profile & clinical bio
│   ├── book-appointment.html     # Interactive slot picker & confirmation modal
│   ├── patient-dashboard.html     # Patient portal: upcoming visits, history & profile
│   ├── admin-dashboard.html       # Admin portal: KPIs, charts, Doctor & Dept CRUD
│   ├── receptionist-dashboard.html# Reception portal: daily queue & walk-in booking
│   ├── login.html                 # Modern sign-in with 1-click demo buttons
│   ├── register.html              # Patient registration with validation
│   ├── about.html                 # Platform background, mission & statistics
│   ├── contact.html               # Enquiry form with validation & hospital info
│   ├── css/
│   │   ├── style.css              # Core design system tokens, hero, cards, badges
│   │   ├── dashboard.css          # Sidebar, tables, chart bars, action buttons
│   │   └── print.css              # Official A4 appointment slip print styling
│   └── js/
│       ├── api.js                 # Centralized API fetcher, toast alerts & modals
│       ├── auth.js                # Login, registration & demo credential handler
│       ├── main.js                # Navbar state, active links & mobile menu toggle
│       ├── doctors.js             # Doctor search and filter logic
│       ├── doctor-details.js      # Doctor bio rendering
│       ├── booking.js             # Slot verification and appointment booking
│       ├── patient-dashboard.js   # Patient stats, cancellations & slip generation
│       ├── admin-dashboard.js     # Admin operations, chart rendering & CRUD
│       └── receptionist-dashboard.js# Daily queue, walk-in booking & reschedule
│
├── docs/                          # Academic Documentation
│   ├── PROJECT_DOCUMENTATION.md   # Comprehensive project report for viva
│   └── TEST_CASES.md              # 28 formal test cases with status
│
└── tests/
    └── api-tests.js               # Automated 20-test API validation suite
```

---

## 📡 Complete REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new patient account |
| `POST` | `/api/auth/login` | Public | Authenticate user, return JWT token & role |
| `GET` | `/api/auth/me` | Logged In | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Logged In | Update user name, phone, DOB, address |

### Doctors (`/api/doctors`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors` | Public | List all doctors (supports `?search`, `?department`, `?gender`) |
| `GET` | `/api/doctors/:id` | Public | Get single doctor details and bio |
| `GET` | `/api/doctors/:id/slots?date=YYYY-MM-DD` | Public | Get 12 daily slots with booked/available status |
| `POST` | `/api/doctors` | Admin Only | Add new doctor |
| `PUT` | `/api/doctors/:id` | Admin Only | Edit doctor information |
| `DELETE`| `/api/doctors/:id` | Admin Only | Remove doctor profile |

### Departments (`/api/departments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/departments` | Public | List all departments with doctor counts |
| `GET` | `/api/departments/:id` | Public | Get department details and assigned doctors |
| `POST` | `/api/departments` | Admin Only | Create new department |
| `PUT` | `/api/departments/:id` | Admin Only | Update department details |
| `DELETE`| `/api/departments/:id` | Admin Only | Delete department (guarded against active doctors) |

### Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments` | Logged In | View appointments (Patient sees own; Admin/Receptionist sees all) |
| `GET` | `/api/appointments/:id` | Logged In | View detailed appointment confirmation |
| `POST` | `/api/appointments` | Logged In | Book appointment with duplicate & past date validation |
| `PUT` | `/api/appointments/:id/status` | Staff Only | Update status (`Confirmed`, `Completed`, `Cancelled`) |
| `PUT` | `/api/appointments/:id/cancel` | Patient/Staff| Cancel appointment & free up the slot |
| `PUT` | `/api/appointments/:id/reschedule`| Patient/Staff| Reschedule appointment to new date & slot |

### Statistics & Public Enquiries
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/stats/dashboard` | Admin/Reception| High-level KPIs and chart distribution data |
| `GET` | `/api/stats/patient` | Patient Only | Patient-specific metrics (upcoming, completed, cancelled) |
| `POST` | `/api/contact` | Public | Hospital enquiry submission endpoint |
| `GET` | `/api/health` | Public | Service health & uptime probe |

---

## 🎯 Step-by-Step Viva Voce Demonstration Walkthrough

When presenting this project to your external examiners:

### 1. Show the Public Landing Page (`index.html`)
- Explain the modern healthcare color scheme (Medical blue `#0284c7`, teal `#0d9488`, clean white `#ffffff`).
- Point out the custom SVG/CSS medical logo (Cross + Heart symbol).
- Highlight the **Quick Services** and **Clinical Departments** sections.

### 2. Demonstrate Doctor Search & Filtering (`doctors.html`)
- Type `"Rahul"` in the search box to demonstrate real-time name search.
- Select `"Cardiology"` from the department dropdown to filter specialists.
- Click **"View Profile"** to show Dr. Priya Deshmukh's full bio, consultation fees (₹1,000), and visiting hours.

### 3. Demonstrate Live Appointment Booking (`book-appointment.html`)
- Click **"Book Visit"**.
- Change the date: show how the **Time Slots Grid** updates dynamically.
- Pick an available slot (e.g. `10:00 AM`), enter a reason, and click **"Confirm & Book"**.
- Show the **Official Appointment Confirmation Slip Modal**.
- Click **"Print Appointment"** to demonstrate the clean print-ready CSS layout.

### 4. Demonstrate Slot Collision Prevention
- Try booking the exact same doctor on the exact same date and time slot.
- Point out the server response: **`HTTP 409 Conflict`** with the alert: *"This appointment slot is already booked. Please select another time."*

### 5. Demonstrate Patient Dashboard (`patient-dashboard.html`)
- Login as Patient (`patient@careconnect.example` / `Patient@123`).
- Show the KPI cards: Upcoming Appointments, Completed Visits, Cancelled Bookings.
- Click **"Cancel"** on an appointment: show the confirmation dialog.
- Show how the slot is immediately released and stats update in real-time.

### 6. Demonstrate Admin Dashboard (`admin-dashboard.html`)
- Login as Admin (`admin@careconnect.example` / `Admin@123`).
- Point out the real-time **Department Appointment Distribution** and **Status Breakdown** bar charts.
- Open **"Doctor Management"** & click **"Add New Doctor"** to show full modal CRUD.
- Open **"All Appointments"** to filter bookings and change status to **Completed**.

### 7. Demonstrate Receptionist Desk (`receptionist-dashboard.html`)
- Login as Receptionist (`receptionist@careconnect.example` / `Reception@123`).
- Show the daily schedule queue.
- Click **"Walk-in Patient Booking"** to register a walk-in patient and book a consultation in one step.

---

## 🧪 Automated Testing

The project includes an automated end-to-end integration test suite that tests all 20 API endpoints and business rules:

```bash
node tests/api-tests.js
```

**Results:**
```
  ✅ PASS: API Health Check
  ✅ PASS: Patient Registration with Valid Data
  ✅ PASS: Duplicate Email Registration Prevention
  ✅ PASS: Patient Login Authentication
  ✅ PASS: Invalid Password Rejection
  ✅ PASS: Admin Login Authentication
  ✅ PASS: Receptionist Login Authentication
  ✅ PASS: Get All Doctors and Filter by Department
  ✅ PASS: Doctor Slots Query with Date
  ✅ PASS: Patient Appointment Booking
  ✅ PASS: Duplicate Slot Booking Prevention (HTTP 409 Conflict)
  ✅ PASS: Past Date Booking Prevention
  ✅ PASS: Reschedule Appointment
  ✅ PASS: Cancel Appointment
  ✅ PASS: Admin Add Department
  ✅ PASS: Admin Add Doctor
  ✅ PASS: Admin Edit Doctor
  ✅ PASS: Admin Delete Doctor
  ✅ PASS: Admin Delete Department
  ✅ PASS: Admin Dashboard Statistics & Chart Data
====================================================
📊 Test Results: 20 Passed, 0 Failed (100% Success)
====================================================
```

---

## 🚀 Future Scope
1. **SMS/WhatsApp Notifications:** Integrate Twilio or Gupshup for automated consultation reminders.
2. **Telemedicine Consultations:** Add WebRTC video consultation rooms for virtual doctor visits.
3. **Payment Gateway Integration:** Incorporate Razorpay/Stripe for online UPI and credit card consultation fee collection.
4. **Prescription Management:** Allow doctors to attach digital prescriptions and diagnostic lab reports.

---

**Developed for TY Computer Science Project & Examination.**
CareConnect Hospital — *"Your Health, Our Priority"*.
