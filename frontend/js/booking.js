// ===================================================================
// CARECONNECT HOSPITAL - APPOINTMENT BOOKING LOGIC
// ===================================================================

let selectedDoctor = null;
let selectedSlot = null;
let currentDoctorList = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure date input has minimum of today
  const dateInput = document.getElementById('appointment-date');
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.min = todayStr;
    // Default to tomorrow for user convenience
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // Pre-fill user data if logged in
  const currentUser = getCurrentUser();
  const patientNameInput = document.getElementById('patient-name');
  if (currentUser && patientNameInput) {
    patientNameInput.value = currentUser.name;
    patientNameInput.readOnly = true;
  }

  await initializeDoctorsDropdown();

  // Listeners
  if (dateInput) {
    dateInput.addEventListener('change', fetchAndRenderSlots);
  }

  const doctorSelect = document.getElementById('doctor-select');
  if (doctorSelect) {
    doctorSelect.addEventListener('change', async (e) => {
      const docId = e.target.value;
      if (docId) {
        await selectDoctor(docId);
      }
    });
  }

  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }
});

// Load doctors into dropdown
async function initializeDoctorsDropdown() {
  const doctorSelect = document.getElementById('doctor-select');
  if (!doctorSelect) return;

  try {
    const res = await apiFetch('/doctors');
    if (res.success && res.data) {
      currentDoctorList = res.data;
      doctorSelect.innerHTML = '<option value="">-- Choose a Doctor --</option>';
      
      currentDoctorList.forEach(doc => {
        const opt = document.createElement('option');
        opt.value = doc.id;
        opt.textContent = `${doc.name} (${doc.specialization} - ${doc.department_name})`;
        doctorSelect.appendChild(opt);
      });

      // Check URL query param for doctorId
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedDocId = urlParams.get('doctorId');
      if (preselectedDocId) {
        doctorSelect.value = preselectedDocId;
        await selectDoctor(preselectedDocId);
      } else if (currentDoctorList.length > 0) {
        doctorSelect.value = currentDoctorList[0].id;
        await selectDoctor(currentDoctorList[0].id);
      }
    }
  } catch (error) {
    console.error('Failed to load doctors dropdown:', error);
  }
}

// Select Doctor & update preview summary
async function selectDoctor(docId) {
  try {
    const res = await apiFetch(`/doctors/${docId}`);
    if (res.success && res.data) {
      selectedDoctor = res.data;
      renderDoctorSummary(selectedDoctor);
      await fetchAndRenderSlots();
    }
  } catch (error) {
    console.error('Failed to fetch doctor summary:', error);
  }
}

function renderDoctorSummary(doc) {
  const summaryBox = document.getElementById('doctor-summary-card');
  if (!summaryBox) return;

  const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2);
  const avatarColor = doc.gender === 'Female' ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'linear-gradient(135deg, #0284c7, #2563eb)';

  summaryBox.innerHTML = `
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
      <div style="width: 56px; height: 56px; border-radius: 14px; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700;">
        ${initials}
      </div>
      <div>
        <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--dark);">${escapeHtml(doc.name)}</h4>
        <p style="font-size: 0.88rem; color: var(--secondary); font-weight: 600;">${escapeHtml(doc.specialization)}</p>
      </div>
    </div>
    <div style="font-size: 0.88rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px;">
      <div><i class="fa-solid fa-hospital" style="color: var(--primary); width: 20px;"></i> Department: <strong>${escapeHtml(doc.department_name)}</strong></div>
      <div><i class="fa-solid fa-calendar-days" style="color: var(--primary); width: 20px;"></i> Days: <strong>${escapeHtml(doc.available_days)}</strong></div>
      <div><i class="fa-solid fa-clock" style="color: var(--primary); width: 20px;"></i> Timings: <strong>${escapeHtml(doc.available_time)}</strong></div>
      <div style="margin-top: 8px; padding-top: 10px; border-top: 1px dashed var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <span>Consultation Fee:</span>
        <strong style="color: var(--dark); font-size: 1.1rem;">${formatCurrency(doc.consultation_fee)}</strong>
      </div>
    </div>
  `;
}

// Fetch Slots for selected doctor and date
async function fetchAndRenderSlots() {
  const slotsContainer = document.getElementById('time-slots-grid');
  const dateInput = document.getElementById('appointment-date');
  if (!slotsContainer || !dateInput || !selectedDoctor) return;

  const date = dateInput.value;
  if (!date) return;

  slotsContainer.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-muted);">
      <div class="spinner" style="width: 28px; height: 28px; margin: 0 auto 10px;"></div>
      Checking slot availability...
    </div>
  `;

  try {
    const res = await apiFetch(`/doctors/${selectedDoctor.id}/slots?date=${date}`);
    if (res.success && res.data || res.slots) {
      const slots = res.slots || [];
      renderSlotButtons(slots);
    }
  } catch (error) {
    slotsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; color: #ef4444; font-size: 0.9rem;">
        Failed to load slots: ${escapeHtml(error.message)}
      </div>
    `;
  }
}

// Render slot grid buttons with booked/available state
function renderSlotButtons(slots) {
  const slotsContainer = document.getElementById('time-slots-grid');
  if (!slotsContainer) return;

  selectedSlot = null;
  const slotInput = document.getElementById('selected-time-slot');
  if (slotInput) slotInput.value = '';

  if (slots.length === 0) {
    slotsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No slots available for this date.</p>';
    return;
  }

  slotsContainer.innerHTML = slots.map(slot => {
    if (slot.isBooked) {
      return `
        <button type="button" class="btn-slot booked" disabled title="Already Booked by another patient">
          <i class="fa-solid fa-lock" style="font-size: 0.75rem;"></i>
          ${slot.time}
          <span style="font-size: 0.7rem; display: block; opacity: 0.8;">Booked</span>
        </button>
      `;
    } else if (slot.isPast) {
      return `
        <button type="button" class="btn-slot booked" disabled title="Past date/time">
          ${slot.time}
          <span style="font-size: 0.7rem; display: block;">Past</span>
        </button>
      `;
    } else {
      return `
        <button type="button" class="btn-slot available" onclick="chooseSlot('${slot.time}', this)">
          ${slot.time}
          <span style="font-size: 0.7rem; display: block; color: #15803d;">Available</span>
        </button>
      `;
    }
  }).join('');
}

// Choose time slot
function chooseSlot(time, element) {
  selectedSlot = time;
  const slotInput = document.getElementById('selected-time-slot');
  if (slotInput) slotInput.value = time;

  // Visual selection styling
  document.querySelectorAll('.btn-slot.available').forEach(btn => {
    btn.classList.remove('selected');
  });
  element.classList.add('selected');
}

// Handle Form Submission
async function handleBookingSubmit(e) {
  e.preventDefault();

  const user = getCurrentUser();
  if (!user) {
    showToast('Login Required', 'You must be logged in to book an appointment.', 'warning');
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }, 1200);
    return;
  }

  const doctorSelect = document.getElementById('doctor-select');
  const dateInput = document.getElementById('appointment-date');
  const reasonInput = document.getElementById('appointment-reason');
  const notesInput = document.getElementById('appointment-notes');
  const submitBtn = document.getElementById('submit-booking-btn');

  const doctor_id = doctorSelect.value;
  const appointment_date = dateInput.value;
  const appointment_time = selectedSlot;
  const reason = reasonInput.value.trim();
  const notes = notesInput ? notesInput.value.trim() : '';

  if (!doctor_id) {
    showToast('Missing Doctor', 'Please select a doctor.', 'warning');
    return;
  }
  if (!appointment_date) {
    showToast('Missing Date', 'Please select an appointment date.', 'warning');
    return;
  }
  if (!appointment_time) {
    showToast('Missing Slot', 'Please click on an available time slot.', 'warning');
    return;
  }
  if (!reason) {
    showToast('Missing Reason', 'Please provide a brief reason for your visit.', 'warning');
    return;
  }

  // Prevent past dates
  const todayStr = new Date().toISOString().split('T')[0];
  if (appointment_date < todayStr) {
    showToast('Invalid Date', 'Appointment date cannot be in the past.', 'error');
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirming Booking...';
    }

    const payload = {
      doctor_id: Number(doctor_id),
      appointment_date,
      appointment_time,
      reason,
      notes
    };

    // If booking as receptionist or admin, patient_id might be provided
    const patientIdSelect = document.getElementById('patient-id-override');
    if (patientIdSelect && patientIdSelect.value) {
      payload.patient_id = Number(patientIdSelect.value);
    }

    const res = await apiFetch('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success && res.data) {
      showBookingConfirmation(res.data);
    }
  } catch (error) {
    if (error.status === 409) {
      showToast('Slot Taken', 'This appointment slot is already booked. Please select another time.', 'error');
      // Refresh slots
      await fetchAndRenderSlots();
    } else {
      showToast('Booking Failed', error.message || 'Unable to book appointment.', 'error');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Confirm & Book Appointment';
    }
  }
}

// Display Confirmation Modal & Printable Voucher
function showBookingConfirmation(appt) {
  const confirmationOverlay = document.getElementById('confirmation-modal');
  if (!confirmationOverlay) return;

  document.getElementById('conf-appt-id').textContent = `#CC-${String(appt.appointment_id).padStart(5, '0')}`;
  document.getElementById('conf-patient-name').textContent = appt.patient_name;
  document.getElementById('conf-doctor-name').textContent = appt.doctor_name;
  document.getElementById('conf-dept-name').textContent = appt.department_name;
  document.getElementById('conf-date').textContent = formatDate(appt.appointment_date);
  document.getElementById('conf-time').textContent = appt.appointment_time;
  document.getElementById('conf-fee').textContent = formatCurrency(appt.consultation_fee);
  document.getElementById('conf-reason').textContent = appt.reason;
  document.getElementById('conf-status').textContent = appt.status || 'Confirmed';

  confirmationOverlay.classList.add('active');
}

function printConfirmation() {
  window.print();
}

function closeConfirmationModal() {
  const confirmationOverlay = document.getElementById('confirmation-modal');
  if (confirmationOverlay) {
    confirmationOverlay.classList.remove('active');
  }
  const user = getCurrentUser();
  if (user && user.role === 'Patient') {
    window.location.href = 'patient-dashboard.html';
  } else if (user && user.role === 'Receptionist') {
    window.location.href = 'receptionist-dashboard.html';
  } else {
    window.location.href = 'admin-dashboard.html';
  }
}
