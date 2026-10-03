// ===================================================================
// CARECONNECT HOSPITAL - AUTOMATED COMPREHENSIVE TEST SUITE
// ===================================================================

const http = require('http');
const { app, server } = require('../server.js');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

let patientToken = '';
let adminToken = '';
let receptionistToken = '';
let testDoctorId = null;
let testDeptId = null;
let testAppointmentId = null;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}


async function runTests() {
  console.log('🚀 Starting CareConnect Hospital Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await assertTest('API Health Check', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200 || res.body.status !== 'OK') throw new Error('Health check failed');
  });

  // 2. User Registration
  const testEmail = `test.patient.${Date.now()}@example.com`;
  await assertTest('Patient Registration with Valid Data', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Aditya Kulkarni',
      email: testEmail,
      phone: '9876543210',
      date_of_birth: '2003-04-12',
      gender: 'Male',
      address: 'Kothrud, Pune',
      password: 'Patient@123',
      confirmPassword: 'Patient@123'
    });
    if (res.status !== 201 || !res.body.success) throw new Error(res.body.message || 'Registration failed');
  });

  // 3. Duplicate Email Prevention
  await assertTest('Duplicate Email Registration Prevention', async () => {
    const res = await request('POST', '/auth/register', {
      name: 'Duplicate Aditya',
      email: testEmail,
      phone: '9876543210',
      password: 'Patient@123',
      confirmPassword: 'Patient@123'
    });
    if (res.status !== 400) throw new Error(`Expected 400 but got ${res.status}`);
  });

  // 4. Patient Login
  await assertTest('Patient Login Authentication', async () => {
    const res = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'Patient@123',
      role: 'Patient'
    });
    if (res.status !== 200 || !res.body.token) throw new Error('Login failed');
    patientToken = res.body.token;
  });

  // 5. Invalid Login Prevention
  await assertTest('Invalid Password Rejection', async () => {
    const res = await request('POST', '/auth/login', {
      email: testEmail,
      password: 'WrongPassword123'
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  // 6. Admin Login
  await assertTest('Admin Login Authentication', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'admin@careconnect.example',
      password: 'Admin@123',
      role: 'Admin'
    });
    if (res.status !== 200 || !res.body.token) throw new Error('Admin login failed');
    adminToken = res.body.token;
  });

  // 7. Receptionist Login
  await assertTest('Receptionist Login Authentication', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'receptionist@careconnect.example',
      password: 'Reception@123',
      role: 'Receptionist'
    });
    if (res.status !== 200 || !res.body.token) throw new Error('Receptionist login failed');
    receptionistToken = res.body.token;
  });

  // 8. Doctor Listing & Search
  await assertTest('Get All Doctors and Filter by Department', async () => {
    const res = await request('GET', '/doctors?department=Cardiology');
    if (res.status !== 200 || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('Doctor query returned empty');
    }
  });

  // 9. Doctor Slot Availability & Booked Status
  await assertTest('Doctor Slots Query with Date', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request('GET', `/doctors/1/slots?date=${dateStr}`);
    if (res.status !== 200 || !Array.isArray(res.body.slots)) throw new Error('Slots query failed');
  });

  // 10. Appointment Booking
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 4);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  await assertTest('Patient Appointment Booking', async () => {
    const res = await request('POST', '/appointments', {
      doctor_id: 1,
      appointment_date: futureDateStr,
      appointment_time: '11:00 AM',
      reason: 'General wellness checkup and blood pressure reading'
    }, patientToken);

    if (res.status !== 201 || !res.body.success) throw new Error(res.body.message || 'Booking failed');
    testAppointmentId = res.body.data.appointment_id;
  });

  // 11. Duplicate Slot Prevention
  await assertTest('Duplicate Slot Booking Prevention (HTTP 409 Conflict)', async () => {
    const res = await request('POST', '/appointments', {
      doctor_id: 1,
      appointment_date: futureDateStr,
      appointment_time: '11:00 AM',
      reason: 'Trying to book duplicate slot'
    }, patientToken);

    if (res.status !== 409) throw new Error(`Expected 409 Conflict, received ${res.status}`);
  });

  // 12. Past Date Prevention
  await assertTest('Past Date Booking Prevention', async () => {
    const res = await request('POST', '/appointments', {
      doctor_id: 1,
      appointment_date: '2020-01-01',
      appointment_time: '10:00 AM',
      reason: 'Past date attempt'
    }, patientToken);

    if (res.status !== 400) throw new Error(`Expected 400 Bad Request, received ${res.status}`);
  });

  // 13. Reschedule Appointment
  await assertTest('Reschedule Appointment', async () => {
    const res = await request('PUT', `/appointments/${testAppointmentId}/reschedule`, {
      appointment_date: futureDateStr,
      appointment_time: '02:30 PM'
    }, patientToken);

    if (res.status !== 200 || !res.body.success) throw new Error('Reschedule failed');
  });

  // 14. Appointment Cancellation
  await assertTest('Cancel Appointment', async () => {
    const res = await request('PUT', `/appointments/${testAppointmentId}/cancel`, {}, patientToken);
    if (res.status !== 200 || !res.body.success) throw new Error('Cancellation failed');
  });

  // 15. Admin CRUD: Add Department
  await assertTest('Admin Add Department', async () => {
    const res = await request('POST', '/departments', {
      name: `Nephrology_${Date.now()}`,
      description: 'Diagnosis and care of kidney conditions',
      icon: 'fa-kidneys'
    }, adminToken);

    if (res.status !== 201 || !res.body.data.id) throw new Error('Add department failed');
    testDeptId = res.body.data.id;
  });

  // 16. Admin CRUD: Add Doctor
  await assertTest('Admin Add Doctor', async () => {
    const res = await request('POST', '/doctors', {
      name: 'Dr. Test Consultant',
      email: `dr.test.${Date.now()}@careconnect.example`,
      phone: '+91 99999 88888',
      qualification: 'MBBS, MD',
      specialization: 'Kidney Care',
      department_id: testDeptId,
      experience: 6,
      consultation_fee: 750,
      gender: 'Male',
      available_days: 'Mon - Fri',
      available_time: '10:00 AM - 02:00 PM',
      description: 'Expert nephrologist'
    }, adminToken);

    if (res.status !== 201 || !res.body.doctorId) throw new Error('Add doctor failed');
    testDoctorId = res.body.doctorId;
  });

  // 17. Admin CRUD: Edit Doctor
  await assertTest('Admin Edit Doctor', async () => {
    const res = await request('PUT', `/doctors/${testDoctorId}`, {
      consultation_fee: 850
    }, adminToken);
    if (res.status !== 200 || !res.body.success) throw new Error('Edit doctor failed');
  });

  // 18. Admin CRUD: Delete Doctor
  await assertTest('Admin Delete Doctor', async () => {
    const res = await request('DELETE', `/doctors/${testDoctorId}`, null, adminToken);
    if (res.status !== 200 || !res.body.success) throw new Error('Delete doctor failed');
  });

  // 19. Admin CRUD: Delete Department
  await assertTest('Admin Delete Department', async () => {
    const res = await request('DELETE', `/departments/${testDeptId}`, null, adminToken);
    if (res.status !== 200 || !res.body.success) throw new Error('Delete department failed');
  });

  // 20. Dashboard Analytics
  await assertTest('Admin Dashboard Statistics & Chart Data', async () => {
    const res = await request('GET', '/stats/dashboard', null, adminToken);
    if (res.status !== 200 || !res.body.data.totalDoctors || !res.body.data.deptDistribution) {
      throw new Error('Stats endpoint returned incomplete data');
    }
  });

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  if (server) server.close();
  process.exit(1);
});
