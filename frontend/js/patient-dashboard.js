// ===================================================================
// CARECONNECT HOSPITAL - PATIENT DASHBOARD LOGIC
// ===================================================================

let currentPatientAppointments = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuthGuard(['Patient']);
  if (!user) return;

  // Set greeting
  const greetingEl = document.getElementById('patient-greeting');
  if (greetingEl) {
    greetingEl.textContent = `Welcome, ${user.name}`;
  }

  setupDashboardTabs();
  await loadPatientStats();
  await loadPatientAppointments();
  await loadPatientProfileForm();
});

// Setup tab navigation
function setupDashboardTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(tabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// Load patient statistics cards
async function loadPatientStats() {
  try {
    const res = await apiFetch('/stats/patient');
    if (res.success && res.data) {
      document.getElementById('stat-upcoming').textContent = res.data.upcoming || 0;
      document.getElementById('stat-completed').textContent = res.data.completed || 0;
      document.getElementById('stat-cancelled').textContent = res.data.cancelled || 0;
      document.getElementById('stat-total').textContent = res.data.total || 0;
    }
  } catch (error) {
    console.error('Failed to load patient stats:', error);
  }
}

// Load all patient appointments
async function loadPatientAppointments() {
  const upcomingContainer = document.getElementById('upcoming-appointments-list');
  const historyTableBody = document.getElementById('history-table-body');

  if (upcomingContainer) {
    upcomingContainer.innerHTML = '<div class="spinner-wrapper"><div class="spinner"></div><p>Loading appointments...</p></div>';
  }

  try {
    const res = await apiFetch('/appointments');
    if (res.success && res.data) {
      currentPatientAppointments = res.data;
      renderUpcomingAppointments(currentPatientAppointments);
      renderAppointmentHistory(currentPatientAppointments);
    }
  } catch (error) {
    if (upcomingContainer) {
      upcomingContainer.innerHTML = `<div class="empty-state"><p style="color: #ef4444;">${escapeHtml(error.message)}</p></div>`;
    }
  }
}

// Render Upcoming Appointments Cards
function renderUpcomingAppointments(appointments) {
  const container = document.getElementById('upcoming-appointments-list');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => (a.status === 'Confirmed' || a.status === 'Pending') && a.appointment_date >= todayStr);

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-regular fa-calendar-check"></i></div>
        <h3>No Upcoming Appointments</h3>
        <p>You have no scheduled appointments at the moment. Need to see a specialist?</p>
        <a href="doctors.html" class="btn btn-primary btn-sm">Find a Doctor & Book</a>
      </div>
    `;
    return;
  }

  container.innerHTML = upcoming.map(appt => {
    const statusClass = `status-${appt.status.toLowerCase()}`;
    return `
      <div class="appt-card">
        <div class="appt-card-header">
          <div class="appt-doc-details">
            <span class="doc-dept-badge">${escapeHtml(appt.department_name)}</span>
            <h4>${escapeHtml(appt.doctor_name)}</h4>
            <span>${escapeHtml(appt.doctor_specialization)}</span>
          </div>
          <span class="status-badge ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i> ${appt.status}
          </span>
        </div>

        <div class="appt-datetime-badge">
          <div><i class="fa-regular fa-calendar" style="color: var(--primary); margin-right: 6px;"></i> ${formatDate(appt.appointment_date)}</div>
          <div><i class="fa-regular fa-clock" style="color: var(--secondary); margin-right: 6px;"></i> ${escapeHtml(appt.appointment_time)}</div>
        </div>

        <div class="appt-reason-box">
          <strong>Reason:</strong> ${escapeHtml(appt.reason)}
          ${appt.notes ? `<br><small style="color: var(--text-light);">Notes: ${escapeHtml(appt.notes)}</small>` : ''}
        </div>

        <div class="appt-actions">
          <button class="btn btn-outline-dark btn-sm" onclick="openPrintModal(${appt.appointment_id})">
            <i class="fa-solid fa-print"></i> Slip
          </button>
          <button class="btn btn-danger btn-sm" onclick="confirmCancelAppointment(${appt.appointment_id})">
            <i class="fa-solid fa-xmark"></i> Cancel
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Appointment History Table
function renderAppointmentHistory(appointments) {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;

  if (appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No appointment records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = appointments.map(appt => {
    const statusClass = `status-${appt.status.toLowerCase()}`;
    return `
      <tr>
        <td><strong>#CC-${String(appt.appointment_id).padStart(5, '0')}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(appt.doctor_name)}</div>
          <small style="color: var(--text-muted);">${escapeHtml(appt.department_name)}</small>
        </td>
        <td>${formatDate(appt.appointment_date)}</td>
        <td>${escapeHtml(appt.appointment_time)}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(appt.reason)}
        </td>
        <td>
          <span class="status-badge ${statusClass}">${appt.status}</span>
        </td>
        <td>
          <button class="btn-icon-action" title="Print Appointment Confirmation" onclick="openPrintModal(${appt.appointment_id})">
            <i class="fa-solid fa-print"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Confirm and execute cancellation
function confirmCancelAppointment(appointmentId) {
  showConfirmDialog({
    title: 'Cancel Appointment',
    message: 'Are you sure you want to cancel this appointment? The selected time slot will be made available for other patients.',
    confirmText: 'Yes, Cancel',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const res = await apiFetch(`/appointments/${appointmentId}/cancel`, {
          method: 'PUT'
        });
        if (res.success) {
          showToast('Appointment Cancelled', 'Your appointment has been cancelled successfully.', 'success');
          await loadPatientStats();
          await loadPatientAppointments();
        }
      } catch (error) {
        showToast('Cancellation Failed', error.message || 'Unable to cancel appointment.', 'error');
      }
    }
  });
}

// Open Printable Appointment Confirmation
async function openPrintModal(appointmentId) {
  try {
    const res = await apiFetch(`/appointments/${appointmentId}`);
    if (res.success && res.data) {
      const appt = res.data;
      const modal = document.getElementById('printable-receipt-modal');
      const container = document.getElementById('printable-slip-content');

      container.innerHTML = `
        <div class="printable-slip">
          <div class="slip-header">
            <h2 class="slip-hospital-title">CARECONNECT HOSPITAL</h2>
            <div class="slip-subtitle">Official Appointment Confirmation</div>
            <div class="slip-hospital-contact">
              FC Road Healthcare Enclave, Shivaji Nagar, Pune - 411005, Maharashtra<br>
              Emergency Helpline: +91 98765 43210 | Email: appointments@careconnect.example
            </div>
          </div>

          <div class="slip-id-bar">
            <span>Appointment ID: #CC-${String(appt.appointment_id).padStart(5, '0')}</span>
            <span style="color: ${appt.status === 'Cancelled' ? '#b91c1c' : '#15803d'};">Status: ${appt.status}</span>
          </div>

          <div class="slip-grid">
            <div class="slip-row">
              <span class="slip-label">Patient Full Name</span>
              <span class="slip-value">${escapeHtml(appt.patient_name)}</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Contact Mobile</span>
              <span class="slip-value">${escapeHtml(appt.patient_phone || 'N/A')}</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Consulting Doctor</span>
              <span class="slip-value">${escapeHtml(appt.doctor_name)}</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Specialization / Dept</span>
              <span class="slip-value">${escapeHtml(appt.doctor_specialization)} (${escapeHtml(appt.department_name)})</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Appointment Date</span>
              <span class="slip-value">${formatDate(appt.appointment_date)}</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Allocated Time Slot</span>
              <span class="slip-value">${escapeHtml(appt.appointment_time)}</span>
            </div>
            <div class="slip-row" style="grid-column: 1 / -1;">
              <span class="slip-label">Clinical Reason for Visit</span>
              <span class="slip-value">${escapeHtml(appt.reason)}</span>
            </div>
            <div class="slip-row">
              <span class="slip-label">Consultation Fee</span>
              <span class="slip-value" style="color: var(--primary); font-size: 1.15rem;">${formatCurrency(appt.consultation_fee)}</span>
            </div>
          </div>

          <div class="slip-footer">
            <div class="slip-instructions">
              <strong>Instructions for Patient:</strong><br>
              &bull; Please report to the OP Reception 15 minutes before your time slot.<br>
              &bull; Carry previous clinical investigations, prescriptions, and identity proof.
            </div>
            <div class="slip-signature-box">
              <div class="slip-sig-line"></div>
              <span>Authorized Signature / Stamp</span>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');
    }
  } catch (error) {
    showToast('Print Error', error.message || 'Unable to generate print slip.', 'error');
  }
}

function closePrintModal() {
  const modal = document.getElementById('printable-receipt-modal');
  if (modal) modal.classList.remove('active');
}

// Load patient profile form
async function loadPatientProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  try {
    const res = await apiFetch('/auth/me');
    if (res.success && res.user) {
      const u = res.user;
      document.getElementById('profile-name').value = u.name || '';
      document.getElementById('profile-email').value = u.email || '';
      document.getElementById('profile-phone').value = u.phone || '';
      
      if (u.patient) {
        document.getElementById('profile-dob').value = u.patient.date_of_birth || '';
        document.getElementById('profile-gender').value = u.patient.gender || 'Male';
        document.getElementById('profile-address').value = u.patient.address || '';
      }
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const date_of_birth = document.getElementById('profile-dob').value;
    const gender = document.getElementById('profile-gender').value;
    const address = document.getElementById('profile-address').value.trim();

    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone, date_of_birth, gender, address })
      });
      if (res.success) {
        showToast('Profile Updated', 'Your profile details have been saved.', 'success');
        // Update cached user in storage
        const cur = getCurrentUser();
        if (cur) {
          cur.name = name;
          cur.phone = phone;
          setCurrentUser(cur);
          initNavbarAuth();
        }
      }
    } catch (error) {
      showToast('Update Failed', error.message || 'Unable to update profile.', 'error');
    }
  });
}
