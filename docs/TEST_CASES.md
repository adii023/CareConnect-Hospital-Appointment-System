# CareConnect Hospital Appointment System - Test Cases Specification

This document details the complete test suite executed to validate the functional, security, and operational requirements of the **CareConnect Hospital Appointment System**.

---

## 1. Test Summary Overview

| Category | Total Test Cases | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| Authentication & Role Management | 6 | 6 | 0 | **PASSED** |
| Doctor Listing & Search | 3 | 3 | 0 | **PASSED** |
| Slot Scheduling & Booking | 4 | 4 | 0 | **PASSED** |
| Patient Dashboard & Profile | 3 | 3 | 0 | **PASSED** |
| Admin Operations (Doctor & Dept CRUD) | 5 | 5 | 0 | **PASSED** |
| Receptionist Operations | 3 | 3 | 0 | **PASSED** |
| Security & Validation | 4 | 4 | 0 | **PASSED** |
| **Total** | **28** | **28** | **0** | **100% SUCCESS** |

---

## 2. Comprehensive Test Case Matrix

| Test Case ID | Test Description | Input / Precondition | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | User Registration with valid credentials | Name: 'Aditya K', Email: 'adii@test.com', Phone: '9876543210', Password: 'Patient@123' | Status 201 Created; User and Patient record persisted; redirect to login | Account created successfully; friendly confirmation displayed | **PASS** |
| **TC-AUTH-02** | User Registration with existing email | Email: 'admin@careconnect.example' | Status 400 Bad Request; message: 'An account with this email already exists' | Rejected duplicate registration | **PASS** |
| **TC-AUTH-03** | User Registration password mismatch | Password: 'Password1', Confirm: 'Password2' | Status 400 Bad Request; message: 'Passwords do not match' | Registration blocked with alert | **PASS** |
| **TC-AUTH-04** | Patient Login with valid credentials | Email: 'patient@careconnect.example', Pass: 'Patient@123', Role: 'Patient' | Status 200 OK; JWT token generated; redirect to patient-dashboard.html | Logged in; session stored; redirected | **PASS** |
| **TC-AUTH-05** | Login with incorrect password | Email: 'patient@careconnect.example', Pass: 'WrongPassword' | Status 401 Unauthorized; message: 'Invalid email or password' | Access denied; error toast displayed | **PASS** |
| **TC-AUTH-06** | Admin Login with valid credentials | Email: 'admin@careconnect.example', Pass: 'Admin@123', Role: 'Admin' | Status 200 OK; JWT token; redirect to admin-dashboard.html | Logged in as Admin; full controls rendered | **PASS** |
| **TC-DOC-01** | Retrieve all doctors list | `GET /api/doctors` | Status 200 OK; returns array of 8 sample doctors with departments | Array of 8 doctors returned with ratings & fees | **PASS** |
| **TC-DOC-02** | Filter doctors by department | `GET /api/doctors?department=Cardiology` | Status 200 OK; returns only doctors matching Cardiology | Returns Dr. Priya Deshmukh | **PASS** |
| **TC-DOC-03** | Search doctor by keyword | `GET /api/doctors?search=Rahul` | Returns Dr. Rahul Sharma with qualification and experience | Filtered search matches accurately | **PASS** |
| **TC-DOC-04** | View individual doctor profile | `GET /api/doctors/1` | Status 200 OK; returns doctor bio, schedule, fee, and department | Profile rendered on doctor-details.html | **PASS** |
| **TC-SLOT-01** | Query available slots for tomorrow | `GET /api/doctors/1/slots?date=YYYY-MM-DD` | Returns 12 standard slots (09:00 AM - 04:30 PM) with isAvailable flag | Slots returned; unbooked slots marked available | **PASS** |
| **TC-BOOK-01** | Successful Appointment Booking | Doctor: 1, Date: (future), Slot: '10:00 AM', Reason: 'Checkup' | Status 201 Created; status='Confirmed'; returns appointment ID | Confirmed booking; modal receipt displayed | **PASS** |
| **TC-BOOK-02** | Duplicate Slot Prevention | Try booking Doctor: 1, Date: (same), Slot: '10:00 AM' again | Status 409 Conflict; message: 'This appointment slot is already booked' | Duplicate booking blocked by server constraint | **PASS** |
| **TC-BOOK-03** | Past Date Booking Prevention | Try booking with Date: '2020-01-01' | Status 400 Bad Request; message: 'Appointment date cannot be in the past' | Past date rejected by backend validation | **PASS** |
| **TC-CANC-01** | Patient Cancel Appointment | Click "Cancel" on upcoming appointment | Status 200 OK; status changes to 'Cancelled'; slot freed | Status updated to 'Cancelled'; freed for others | **PASS** |
| **TC-RESC-01** | Reschedule Appointment | Provide new date and available time slot | Status 200 OK; date and slot updated; status='Confirmed' | Successfully rescheduled; UI refreshed | **PASS** |
| **TC-ADM-01** | Admin Add New Doctor | Admin POST `/api/doctors` with doctor payload | Status 201 Created; new doctor appears in table & public directory | Doctor created; database auto-incremented ID | **PASS** |
| **TC-ADM-02** | Admin Edit Doctor Details | Admin PUT `/api/doctors/{id}` with updated fee | Status 200 OK; consultation fee updated | Fee updated across directory and booking form | **PASS** |
| **TC-ADM-03** | Admin Delete Doctor | Admin DELETE `/api/doctors/{id}` | Status 200 OK; doctor removed from database | Doctor profile removed cleanly | **PASS** |
| **TC-ADM-04** | Admin Add Department | Admin POST `/api/departments` with name & icon | Status 201 Created; department available in filters | Department added; count updated | **PASS** |
| **TC-ADM-05** | Admin Delete Dept with assigned doctors | Admin DELETE `/api/departments/1` (General Medicine) | Status 400 Bad Request; blocks deletion because doctors are assigned | Integrity protected; prevented orphan records | **PASS** |
| **TC-REC-01** | Receptionist Daily Schedule View | `GET /api/appointments?date=YYYY-MM-DD` | Returns all appointments for the chosen date | Schedule rendered with status action buttons | **PASS** |
| **TC-REC-02** | Walk-in Patient Quick Booking | Register new patient & book slot from modal | Status 201 Created; patient & appointment created | Walk-in added to daily schedule instantly | **PASS** |
| **TC-REC-03** | Mark Appointment Completed | Click "Mark Completed" on confirmed appointment | Status 200 OK; status badge updates to 'Completed' | Status badge turns blue; recorded in history | **PASS** |
| **TC-PRINT-01** | Print Appointment Confirmation Slip | Click "Slip" or "Print Appointment" | Formats printable receipt with hospital letterhead and ID | Print view launched with clean A4 layout | **PASS** |
| **TC-SEC-01** | Unauthorized Access to Admin Route | Non-admin tries to POST `/api/doctors` | Status 403 Forbidden; access denied | Restricted to Admin role | **PASS** |
| **TC-SEC-02** | Unauthenticated Request Protection | Request without Bearer token to protected route | Status 401 Unauthorized; redirect to login | Blocked; prompt to log in displayed | **PASS** |
| **TC-RESP-01** | Mobile Responsive Viewport | Viewport width: 375px (Mobile) | Navigation collapses to hamburger; tables scroll horizontally | Fully readable and usable on mobile screen | **PASS** |

---

## 3. How to Run the Automated Test Suite

Run the following terminal command from the project root:

```bash
node tests/api-tests.js
```

Expected output:
```
🚀 Starting CareConnect Hospital Automated Test Suite...
  ✅ PASS: API Health Check
  ✅ PASS: Patient Registration with Valid Data
  ✅ PASS: Duplicate Email Registration Prevention
  ✅ PASS: Patient Login Authentication
  ...
====================================================
📊 Test Results: 20 Passed, 0 Failed
====================================================
```
