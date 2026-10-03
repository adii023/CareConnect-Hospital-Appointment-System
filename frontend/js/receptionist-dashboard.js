// ===================================================================
// CARECONNECT HOSPITAL - RECEPTIONIST DASHBOARD LOGIC
// Daily Appointments, Walk-in Patient Booking, Rescheduling & Status Updates
// ===================================================================

let allReceptionDoctors = [];
let allReceptionPatients = [];
let selectedRescheduleApptId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuthGuard(['Receptionist', 'Admin']);
  if (!user) return;

  const greeting = document.getElementById('reception-greeting');
  if (greeting) greeting.textContent = `Reception Desk &bull; Welcome, ${user.name}`;

  // Default date filter to today
  const todayStr = new Date().toISOString().split('T')[0];
  const datePicker = document.getElementById('schedule-date-picker');
  if (datePicker) {
    datePicker.value = todayStr;
    datePicker.addEventListener('change', loadDailyAppointments);
  }

  await loadDailyAppointments();
  await loadReceptionDoctors();
  await loadReceptionPatients();

  // Listeners
  const searchInput = document.getElementById('reception-search');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(loadDailyAppointments, 300);
    });
  }

  const newPatientForm = document.getElementById('walkin-patient-form');
  if (newPatientForm) {
    newPatientForm.addEventListener('submit', handleWalkinPatientRegister);
  }

  const rescheduleForm = document.getElementById('reschedule-form');
  if (rescheduleForm) {
    rescheduleForm.addEventListener('submit', handleRescheduleSubmit);
  }
});

// Load appointments for selected date
async function loadDailyAppointments() {
  const tbody = document.getElementById('daily-schedule-tbody');
  if (!tbody) return;

  const datePicker = document.getElementById('schedule-date-picker');
  const searchInput = document.getElementById('reception-search');

  const selectedDate = datePicker ? datePicker.value : '';
  const search = searchInput ? searchInput.value.trim() : '';

  let endpoint = '/appointments?';
  if (selectedDate) endpoint += `date=${encodeURIComponent(selectedDate)}&`;
  if (search) endpoint += `search=${encodeURIComponent(search)}&`;

  try {
    const res = await apiFetch(endpoint);
    if (res.success && res.data) {
      renderDailyAppointmentsTable(res.data);
      // Update quick badge count
      const countBadge = document.getElementById('today-count-badge');
      if (countBadge) countBadge.textContent = `${res.data.length} Appointments`;
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #ef4444; padding: 20px;">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderDailyAppointmentsTable(appointments) {
  const tbody = document.getElementById('daily-schedule-tbody');
  if (!tbody) return;

  if (appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">No appointments found for this date.</td></tr>`;
    return;
  }

  tbody.innerHTML = appointments.map(a => {
    const statusClass = `status-${a.status.toLowerCase()}`;
    return `
      <tr>
        <td><strong>#CC-${String(a.appointment_id).padStart(5, '0')}</strong></td>
        <td><strong>${escapeHtml(a.appointment_time)}</strong></td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(a.patient_name)}</div>
          <small style="color: var(--text-muted);"><i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${escapeHtml(a.patient_phone || 'N/A')}</small>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(a.doctor_name)}</div>
          <small style="color: var(--secondary);">${escapeHtml(a.department_name)}</small>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${a.status}</span>
        </td>
        <td>
          <div class="actions-cell">
            ${a.status !== 'Confirmed' ? `
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Confirm" onclick="updateReceptionStatus(${a.appointment_id}, 'Confirmed')">
                <i class="fa-solid fa-check"></i>
              </button>` : ''
            }
            ${a.status !== 'Completed' ? `
              <button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Mark Completed" onclick="updateReceptionStatus(${a.appointment_id}, 'Completed')">
                <i class="fa-solid fa-circle-check"></i>
              </button>` : ''
            }
            <button class="btn btn-outline-dark btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Reschedule" onclick="openRescheduleModal(${a.appointment_id}, '${a.appointment_date}', '${a.appointment_time}')">
              <i class="fa-regular fa-calendar-days"></i>
            </button>
            ${a.status !== 'Cancelled' ? `
              <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Cancel" onclick="updateReceptionStatus(${a.appointment_id}, 'Cancelled')">
                <i class="fa-solid fa-ban"></i>
              </button>` : ''
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateReceptionStatus(id, newStatus) {
  try {
    const res = await apiFetch(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      showToast('Status Updated', `Appointment marked as ${newStatus}.`, 'success');
      await loadDailyAppointments();
    }
  } catch (error) {
    showToast('Failed', error.message || 'Unable to update appointment status.', 'error');
  }
}

// Reschedule Modal
function openRescheduleModal(appointmentId, currentDate, currentTime) {
  selectedRescheduleApptId = appointmentId;
  const modal = document.getElementById('reschedule-modal');
  const dateInput = document.getElementById('reschedule-date');
  const timeSelect = document.getElementById('reschedule-time');

  dateInput.min = new Date().toISOString().split('T')[0];
  dateInput.value = currentDate;
  timeSelect.value = currentTime;

  modal.classList.add('active');
}

function closeRescheduleModal() {
  const modal = document.getElementById('reschedule-modal');
  if (modal) modal.classList.remove('active');
}

async function handleRescheduleSubmit(e) {
  e.preventDefault();
  if (!selectedRescheduleApptId) return;

  const date = document.getElementById('reschedule-date').value;
  const time = document.getElementById('reschedule-time').value;

  try {
    const res = await apiFetch(`/appointments/${selectedRescheduleApptId}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ appointment_date: date, appointment_time: time })
    });
    if (res.success) {
      showToast('Rescheduled', 'Appointment rescheduled successfully.', 'success');
      closeRescheduleModal();
      await loadDailyAppointments();
    }
  } catch (error) {
    showToast('Reschedule Failed', error.message || 'Slot already booked or invalid.', 'error');
  }
}

// Load Doctor & Patient lists for booking modal
async function loadReceptionDoctors() {
  try {
    const res = await apiFetch('/doctors');
    if (res.success && res.data) {
      allReceptionDoctors = res.data;
      const select = document.getElementById('walkin-doctor-select');
      if (select) {
        select.innerHTML = '<option value="">-- Choose Doctor --</option>';
        allReceptionDoctors.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = `${d.name} (${d.specialization} - ${d.department_name})`;
          select.appendChild(opt);
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadReceptionPatients() {
  try {
    const res = await apiFetch('/patients');
    if (res.success && res.data) {
      allReceptionPatients = res.data;
      const select = document.getElementById('walkin-patient-select');
      if (select) {
        select.innerHTML = '<option value="">-- Select Registered Patient --</option>';
        allReceptionPatients.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.patient_id;
          opt.textContent = `${p.name} (${p.phone || p.email})`;
          select.appendChild(opt);
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// Walk-in Patient Registration & Instant Booking
function openWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  modal.classList.add('active');
  const dateInput = document.getElementById('walkin-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

function closeWalkinModal() {
  const modal = document.getElementById('walkin-modal');
  if (modal) modal.classList.remove('active');
}

async function handleWalkinPatientRegister(e) {
  e.preventDefault();

  let patientId = document.getElementById('walkin-patient-select').value;
  const isNewPatient = document.getElementById('walkin-is-new').checked;

  try {
    // If registering a new patient on the fly
    if (isNewPatient) {
      const name = document.getElementById('walkin-name').value.trim();
      const email = document.getElementById('walkin-email').value.trim();
      const phone = document.getElementById('walkin-phone').value.trim();
      const gender = document.getElementById('walkin-gender').value;

      if (!name || !email || !phone) {
        showToast('Missing Fields', 'Please fill in patient name, email, and phone.', 'warning');
        return;
      }

      const regRes = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, gender })
      });

      if (regRes.success && regRes.data) {
        patientId = regRes.data.patientId;
        await loadReceptionPatients();
      }
    }

    if (!patientId) {
      showToast('Select Patient', 'Please select or register a patient.', 'warning');
      return;
    }

    const doctor_id = document.getElementById('walkin-doctor-select').value;
    const appointment_date = document.getElementById('walkin-date').value;
    const appointment_time = document.getElementById('walkin-time').value;
    const reason = document.getElementById('walkin-reason').value.trim();

    if (!doctor_id || !appointment_date || !appointment_time || !reason) {
      showToast('Missing Fields', 'Please select doctor, date, time slot, and reason.', 'warning');
      return;
    }

    const apptRes = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: Number(patientId),
        doctor_id: Number(doctor_id),
        appointment_date,
        appointment_time,
        reason,
        notes: 'Booked at Reception Counter'
      })
    });

    if (apptRes.success) {
      showToast('Appointment Booked', 'Walk-in appointment booked successfully!', 'success');
      closeWalkinModal();
      await loadDailyAppointments();
    }
  } catch (error) {
    showToast('Booking Failed', error.message || 'Unable to book appointment.', 'error');
  }
}
