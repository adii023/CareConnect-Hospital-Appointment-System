// ===================================================================
// CARECONNECT HOSPITAL - DOCTOR PROFILE VIEW
// ===================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const doctorId = urlParams.get('id');

  if (!doctorId) {
    showToast('Doctor Not Found', 'No doctor selected.', 'error');
    setTimeout(() => window.location.href = 'doctors.html', 1500);
    return;
  }

  await loadDoctorProfile(doctorId);
});

async function loadDoctorProfile(id) {
  const container = document.getElementById('doctor-profile-container');
  if (!container) return;

  try {
    const res = await apiFetch(`/doctors/${id}`);
    if (res.success && res.data) {
      renderDoctorProfile(res.data);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fa-solid fa-user-xmark"></i></div>
        <h3>Doctor Not Found</h3>
        <p>${escapeHtml(error.message || 'Unable to retrieve doctor profile.')}</p>
        <a href="doctors.html" class="btn btn-primary btn-sm">Back to Doctors</a>
      </div>
    `;
  }
}

function renderDoctorProfile(doc) {
  const container = document.getElementById('doctor-profile-container');
  const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2);
  const avatarColor = doc.gender === 'Female' ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'linear-gradient(135deg, #0284c7, #2563eb)';

  container.innerHTML = `
    <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow-md);">
      
      <!-- Top Banner Profile -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 40px; display: flex; gap: 32px; align-items: center; flex-wrap: wrap;">
        <div style="width: 110px; height: 110px; border-radius: 24px; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; font-weight: 800; box-shadow: var(--shadow-lg);">
          ${initials}
        </div>
        <div style="flex: 1; min-width: 260px;">
          <span class="doc-dept-badge" style="font-size: 0.85rem; padding: 4px 12px; margin-bottom: 8px;">
            ${escapeHtml(doc.department_name)}
          </span>
          <h1 style="font-size: 2rem; font-weight: 800; color: var(--dark); margin-bottom: 6px;">
            ${escapeHtml(doc.name)}
          </h1>
          <p style="font-size: 1.05rem; font-weight: 600; color: var(--secondary); margin-bottom: 8px;">
            ${escapeHtml(doc.specialization)} &bull; ${escapeHtml(doc.qualification)}
          </p>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 0.9rem; color: var(--text-muted); flex-wrap: wrap;">
            <span><i class="fa-solid fa-award" style="color: var(--primary);"></i> ${doc.experience} Years Experience</span>
            <span><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${doc.rating || 4.8} Patient Rating</span>
            <span><i class="fa-solid fa-indian-rupee-sign" style="color: var(--secondary);"></i> ${formatCurrency(doc.consultation_fee)} Fee</span>
          </div>
        </div>
        <div>
          <a href="book-appointment.html?doctorId=${doc.id}" class="btn btn-primary btn-lg">
            <i class="fa-solid fa-calendar-check"></i> Book Appointment
          </a>
        </div>
      </div>

      <!-- Profile Body Details Grid -->
      <div style="padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px;">
        
        <!-- Left Column: Biography & About -->
        <div>
          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--dark); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-user-doctor" style="color: var(--primary);"></i> About ${escapeHtml(doc.name)}
            </h3>
            <p style="color: var(--text-muted); font-size: 0.98rem; line-height: 1.7;">
              ${escapeHtml(doc.description || 'Dr. ' + doc.name + ' is a respected medical professional committed to providing exceptional, patient-centered clinical care at CareConnect Hospital.')}
            </p>
          </div>

          <div style="margin-bottom: 32px;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--dark); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-stethoscope" style="color: var(--secondary);"></i> Department Details
            </h3>
            <div style="background: var(--bg-page); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--dark); margin-bottom: 6px;">
                Department of ${escapeHtml(doc.department_name)}
              </h4>
              <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6;">
                ${escapeHtml(doc.department_description || 'State-of-the-art facilities and dedicated clinical specialists for comprehensive diagnosis and treatment.')}
              </p>
            </div>
          </div>
        </div>

        <!-- Right Column: Clinic Schedule & Contact Card -->
        <div>
          <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 26px;">
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--dark); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-clock" style="color: var(--primary);"></i> Consultation Hours
            </h3>

            <div style="margin-bottom: 16px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Working Days</span>
              <p style="font-size: 0.98rem; font-weight: 600; color: var(--dark); margin-top: 4px;">
                <i class="fa-regular fa-calendar" style="color: var(--primary); margin-right: 6px;"></i> ${escapeHtml(doc.available_days)}
              </p>
            </div>

            <div style="margin-bottom: 20px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Visiting Hours</span>
              <p style="font-size: 0.98rem; font-weight: 600; color: var(--dark); margin-top: 4px;">
                <i class="fa-regular fa-clock" style="color: var(--secondary); margin-right: 6px;"></i> ${escapeHtml(doc.available_time)}
              </p>
            </div>

            <div style="margin-bottom: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Direct Desk Contact</span>
              <p style="font-size: 0.92rem; color: var(--text-main); margin-top: 6px;">
                <i class="fa-solid fa-phone" style="color: var(--primary); margin-right: 8px;"></i> ${escapeHtml(doc.phone || '+91 (020) 2450-8800')}
              </p>
              <p style="font-size: 0.92rem; color: var(--text-main); margin-top: 4px;">
                <i class="fa-solid fa-envelope" style="color: var(--primary); margin-right: 8px;"></i> ${escapeHtml(doc.email)}
              </p>
            </div>

            <a href="book-appointment.html?doctorId=${doc.id}" class="btn btn-primary" style="width: 100%;">
              Book Consultation Now
            </a>
          </div>
        </div>

      </div>
    </div>
  `;
}
