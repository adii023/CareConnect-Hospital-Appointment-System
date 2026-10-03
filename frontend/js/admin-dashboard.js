// ===================================================================
// CARECONNECT HOSPITAL - ADMIN DASHBOARD LOGIC
// Doctor CRUD, Department CRUD, Patients, Appointments & Real-Data Charts
// ===================================================================

let allAdminDoctors = [];
let allAdminDepartments = [];
let allAdminAppointments = [];
let allAdminPatients = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = checkAuthGuard(['Admin']);
  if (!user) return;

  setupAdminSidebar();
  await loadOverviewStats();
  await loadDoctorsSection();
  await loadDepartmentsSection();
  await loadPatientsSection();
  await loadAppointmentsSection();
});

// Setup sidebar navigation between panels
function setupAdminSidebar() {
  const links = document.querySelectorAll('.admin-nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));

      link.classList.add('active');
      const targetSecId = link.getAttribute('data-section');
      const targetSec = document.getElementById(targetSecId);
      if (targetSec) {
        targetSec.classList.add('active');
      }
    });
  });
}

// -------------------------------------------------------------------
// 1. OVERVIEW & CHARTS
// -------------------------------------------------------------------
async function loadOverviewStats() {
  try {
    const res = await apiFetch('/stats/dashboard');
    if (res.success && res.data) {
      const {
        totalDoctors,
        totalPatients,
        totalAppointments,
        todayAppointments,
        statusCounts,
        deptDistribution
      } = res.data;

      // Update Cards
      document.getElementById('stat-total-doctors').textContent = totalDoctors;
      document.getElementById('stat-total-patients').textContent = totalPatients;
      document.getElementById('stat-total-appointments').textContent = totalAppointments;
      document.getElementById('stat-today-appointments').textContent = todayAppointments;

      // Render Department Chart (CSS Bar visualization)
      renderDeptChart(deptDistribution, totalAppointments);

      // Render Status Distribution Chart
      renderStatusChart(statusCounts, totalAppointments);
    }
  } catch (error) {
    console.error('Failed to load overview stats:', error);
  }
}

function renderDeptChart(distribution, total) {
  const container = document.getElementById('chart-dept-bars');
  if (!container) return;

  if (!distribution || distribution.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No department appointment data.</p>';
    return;
  }

  const maxVal = Math.max(...distribution.map(d => d.count), 1);

  container.innerHTML = distribution.map(d => {
    const percentage = Math.round((d.count / maxVal) * 100);
    return `
      <div class="chart-bar-item">
        <div class="chart-bar-label">
          <span>${escapeHtml(d.name)}</span>
          <strong>${d.count} booking${d.count === 1 ? '' : 's'}</strong>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderStatusChart(statusCounts, total) {
  const container = document.getElementById('chart-status-bars');
  if (!container) return;

  const statusMap = {
    Confirmed: { color: 'var(--status-confirmed-bg)', fill: '#15803d', count: 0 },
    Pending: { color: 'var(--status-pending-bg)', fill: '#b45309', count: 0 },
    Completed: { color: 'var(--status-completed-bg)', fill: '#1d4ed8', count: 0 },
    Cancelled: { color: 'var(--status-cancelled-bg)', fill: '#b91c1c', count: 0 }
  };

  (statusCounts || []).forEach(sc => {
    if (statusMap[sc.status]) {
      statusMap[sc.status].count = sc.count;
    }
  });

  const totalEffective = Math.max(total, 1);

  container.innerHTML = Object.entries(statusMap).map(([status, info]) => {
    const pct = Math.round((info.count / totalEffective) * 100);
    return `
      <div class="chart-bar-item">
        <div class="chart-bar-label">
          <span>${status}</span>
          <strong>${info.count} (${pct}%)</strong>
        </div>
        <div class="chart-bar-track" style="background: #f1f5f9;">
          <div class="chart-bar-fill" style="width: ${pct}%; background: ${info.fill};"></div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------------
// 2. DOCTOR MANAGEMENT (CRUD)
// -------------------------------------------------------------------
async function loadDoctorsSection() {
  const tbody = document.getElementById('admin-doctors-table-body');
  if (!tbody) return;

  try {
    const res = await apiFetch('/doctors');
    if (res.success && res.data) {
      allAdminDoctors = res.data;
      renderAdminDoctorsTable(allAdminDoctors);
      populateDoctorDeptSelect();
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #ef4444; padding: 20px;">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderAdminDoctorsTable(doctors) {
  const tbody = document.getElementById('admin-doctors-table-body');
  if (!tbody) return;

  if (doctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No doctors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = doctors.map(doc => `
    <tr>
      <td>#DOC-${doc.id}</td>
      <td>
        <div style="font-weight: 700;">${escapeHtml(doc.name)}</div>
        <small style="color: var(--text-muted);">${escapeHtml(doc.qualification)}</small>
      </td>
      <td>
        <span class="doc-dept-badge">${escapeHtml(doc.department_name)}</span><br>
        <small style="color: var(--secondary); font-weight: 600;">${escapeHtml(doc.specialization)}</small>
      </td>
      <td>${doc.experience} yrs</td>
      <td><strong>${formatCurrency(doc.consultation_fee)}</strong></td>
      <td>
        <small>${escapeHtml(doc.available_days)}</small><br>
        <small style="color: var(--text-muted);">${escapeHtml(doc.available_time)}</small>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon-action" title="Edit Doctor" onclick="openEditDoctorModal(${doc.id})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon-action delete" title="Delete Doctor" onclick="confirmDeleteDoctor(${doc.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function populateDoctorDeptSelect() {
  const select = document.getElementById('doc-form-dept');
  if (!select) return;
  select.innerHTML = '<option value="">-- Select Department --</option>';
  allAdminDepartments.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
}

function openAddDoctorModal() {
  const modal = document.getElementById('doctor-modal');
  document.getElementById('doctor-modal-title').textContent = 'Add New Doctor';
  document.getElementById('doctor-form').reset();
  document.getElementById('doc-form-id').value = '';
  populateDoctorDeptSelect();
  modal.classList.add('active');
}

function openEditDoctorModal(doctorId) {
  const doc = allAdminDoctors.find(d => d.id === doctorId);
  if (!doc) return;

  const modal = document.getElementById('doctor-modal');
  document.getElementById('doctor-modal-title').textContent = 'Edit Doctor Profile';
  populateDoctorDeptSelect();

  document.getElementById('doc-form-id').value = doc.id;
  document.getElementById('doc-form-name').value = doc.name;
  document.getElementById('doc-form-email').value = doc.email;
  document.getElementById('doc-form-phone').value = doc.phone || '';
  document.getElementById('doc-form-qual').value = doc.qualification;
  document.getElementById('doc-form-spec').value = doc.specialization;
  document.getElementById('doc-form-dept').value = doc.department_id;
  document.getElementById('doc-form-exp').value = doc.experience;
  document.getElementById('doc-form-fee').value = doc.consultation_fee;
  document.getElementById('doc-form-gender').value = doc.gender;
  document.getElementById('doc-form-days').value = doc.available_days;
  document.getElementById('doc-form-time').value = doc.available_time;
  document.getElementById('doc-form-desc').value = doc.description || '';

  modal.classList.add('active');
}

function closeDoctorModal() {
  const modal = document.getElementById('doctor-modal');
  if (modal) modal.classList.remove('active');
}

async function handleDoctorFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('doc-form-id').value;

  const payload = {
    name: document.getElementById('doc-form-name').value.trim(),
    email: document.getElementById('doc-form-email').value.trim(),
    phone: document.getElementById('doc-form-phone').value.trim(),
    qualification: document.getElementById('doc-form-qual').value.trim(),
    specialization: document.getElementById('doc-form-spec').value.trim(),
    department_id: Number(document.getElementById('doc-form-dept').value),
    experience: Number(document.getElementById('doc-form-exp').value),
    consultation_fee: Number(document.getElementById('doc-form-fee').value),
    gender: document.getElementById('doc-form-gender').value,
    available_days: document.getElementById('doc-form-days').value.trim(),
    available_time: document.getElementById('doc-form-time').value.trim(),
    description: document.getElementById('doc-form-desc').value.trim()
  };

  try {
    if (id) {
      // Update
      const res = await apiFetch(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Doctor Updated', 'Doctor details updated successfully.', 'success');
      }
    } else {
      // Create
      const res = await apiFetch('/doctors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        showToast('Doctor Added', 'New doctor added successfully.', 'success');
      }
    }

    closeDoctorModal();
    await loadDoctorsSection();
    await loadOverviewStats();
  } catch (error) {
    showToast('Error', error.message || 'Failed to save doctor.', 'error');
  }
}

function confirmDeleteDoctor(doctorId) {
  const doc = allAdminDoctors.find(d => d.id === doctorId);
  const docName = doc ? doc.name : 'this doctor';

  showConfirmDialog({
    title: 'Delete Doctor',
    message: `Are you sure you want to delete ${docName}? This will permanently remove their profile and unassign their upcoming slots.`,
    confirmText: 'Yes, Delete Doctor',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const res = await apiFetch(`/doctors/${doctorId}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Doctor Removed', 'Doctor deleted successfully.', 'success');
          await loadDoctorsSection();
          await loadOverviewStats();
        }
      } catch (error) {
        showToast('Delete Failed', error.message || 'Unable to delete doctor.', 'error');
      }
    }
  });
}

// -------------------------------------------------------------------
// 3. DEPARTMENT MANAGEMENT (CRUD)
// -------------------------------------------------------------------
async function loadDepartmentsSection() {
  const tbody = document.getElementById('admin-departments-table-body');
  if (!tbody) return;

  try {
    const res = await apiFetch('/departments');
    if (res.success && res.data) {
      allAdminDepartments = res.data;
      renderAdminDepartmentsTable(allAdminDepartments);
      populateDoctorDeptSelect();
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: #ef4444; padding: 20px;">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderAdminDepartmentsTable(depts) {
  const tbody = document.getElementById('admin-departments-table-body');
  if (!tbody) return;

  tbody.innerHTML = depts.map(d => `
    <tr>
      <td>#DEPT-${d.id}</td>
      <td>
        <div style="font-weight: 700; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid ${escapeHtml(d.icon || 'fa-hospital')}" style="color: var(--primary);"></i>
          ${escapeHtml(d.name)}
        </div>
      </td>
      <td style="max-width: 320px; color: var(--text-muted); font-size: 0.85rem;">
        ${escapeHtml(d.description)}
      </td>
      <td>
        <span class="user-badge-role">${d.doctor_count || 0} Doctors</span>
      </td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon-action" title="Edit Department" onclick="openEditDepartmentModal(${d.id})">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon-action delete" title="Delete Department" onclick="confirmDeleteDepartment(${d.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddDepartmentModal() {
  const modal = document.getElementById('department-modal');
  document.getElementById('dept-modal-title').textContent = 'Add New Department';
  document.getElementById('department-form').reset();
  document.getElementById('dept-form-id').value = '';
  modal.classList.add('active');
}

function openEditDepartmentModal(deptId) {
  const dept = allAdminDepartments.find(d => d.id === deptId);
  if (!dept) return;

  const modal = document.getElementById('department-modal');
  document.getElementById('dept-modal-title').textContent = 'Edit Department';
  document.getElementById('dept-form-id').value = dept.id;
  document.getElementById('dept-form-name').value = dept.name;
  document.getElementById('dept-form-icon').value = dept.icon || 'fa-hospital';
  document.getElementById('dept-form-desc').value = dept.description || '';
  modal.classList.add('active');
}

function closeDepartmentModal() {
  const modal = document.getElementById('department-modal');
  if (modal) modal.classList.remove('active');
}

async function handleDepartmentFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('dept-form-id').value;
  const name = document.getElementById('dept-form-name').value.trim();
  const icon = document.getElementById('dept-form-icon').value.trim();
  const description = document.getElementById('dept-form-desc').value.trim();

  try {
    if (id) {
      const res = await apiFetch(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, icon, description })
      });
      if (res.success) {
        showToast('Department Updated', 'Department details saved.', 'success');
      }
    } else {
      const res = await apiFetch('/departments', {
        method: 'POST',
        body: JSON.stringify({ name, icon, description })
      });
      if (res.success) {
        showToast('Department Created', 'New department created.', 'success');
      }
    }

    closeDepartmentModal();
    await loadDepartmentsSection();
    await loadOverviewStats();
  } catch (error) {
    showToast('Error', error.message || 'Failed to save department.', 'error');
  }
}

function confirmDeleteDepartment(deptId) {
  showConfirmDialog({
    title: 'Delete Department',
    message: 'Are you sure you want to delete this department? You cannot delete a department if doctors are currently assigned to it.',
    confirmText: 'Yes, Delete',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const res = await apiFetch(`/departments/${deptId}`, { method: 'DELETE' });
        if (res.success) {
          showToast('Department Deleted', 'Department removed successfully.', 'success');
          await loadDepartmentsSection();
          await loadOverviewStats();
        }
      } catch (error) {
        showToast('Delete Failed', error.message || 'Unable to delete department.', 'error');
      }
    }
  });
}

// -------------------------------------------------------------------
// 4. PATIENT MANAGEMENT
// -------------------------------------------------------------------
async function loadPatientsSection() {
  const tbody = document.getElementById('admin-patients-table-body');
  if (!tbody) return;

  try {
    const res = await apiFetch('/patients');
    if (res.success && res.data) {
      allAdminPatients = res.data;
      renderAdminPatientsTable(allAdminPatients);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: #ef4444; padding: 20px;">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderAdminPatientsTable(patients) {
  const tbody = document.getElementById('admin-patients-table-body');
  if (!tbody) return;

  if (patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">No patients found.</td></tr>`;
    return;
  }

  tbody.innerHTML = patients.map(p => `
    <tr>
      <td>#PAT-${p.patient_id}</td>
      <td>
        <div style="font-weight: 700;">${escapeHtml(p.name)}</div>
        <small style="color: var(--text-muted);">${escapeHtml(p.address || 'Address on file')}</small>
      </td>
      <td>${escapeHtml(p.email)}</td>
      <td>${escapeHtml(p.phone || 'N/A')}</td>
      <td>${escapeHtml(p.gender)}</td>
      <td>${formatDate(p.date_of_birth)}</td>
      <td>
        <span class="user-badge-role">${p.appointment_count || 0} Bookings</span>
      </td>
    </tr>
  `).join('');
}

// -------------------------------------------------------------------
// 5. APPOINTMENT MANAGEMENT
// -------------------------------------------------------------------
async function loadAppointmentsSection() {
  const tbody = document.getElementById('admin-appointments-table-body');
  if (!tbody) return;

  const statusFilter = document.getElementById('admin-filter-status');
  const dateFilter = document.getElementById('admin-filter-date');
  const searchInput = document.getElementById('admin-search-appointment');

  let endpoint = '/appointments?';
  if (statusFilter && statusFilter.value) endpoint += `status=${encodeURIComponent(statusFilter.value)}&`;
  if (dateFilter && dateFilter.value) endpoint += `date=${encodeURIComponent(dateFilter.value)}&`;
  if (searchInput && searchInput.value) endpoint += `search=${encodeURIComponent(searchInput.value)}&`;

  try {
    const res = await apiFetch(endpoint);
    if (res.success && res.data) {
      allAdminAppointments = res.data;
      renderAdminAppointmentsTable(allAdminAppointments);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: #ef4444; padding: 20px;">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderAdminAppointmentsTable(appointments) {
  const tbody = document.getElementById('admin-appointments-table-body');
  if (!tbody) return;

  if (appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No appointments found.</td></tr>`;
    return;
  }

  tbody.innerHTML = appointments.map(a => {
    const statusClass = `status-${a.status.toLowerCase()}`;
    return `
      <tr>
        <td>#CC-${String(a.appointment_id).padStart(5, '0')}</td>
        <td>
          <div style="font-weight: 700;">${escapeHtml(a.patient_name)}</div>
          <small style="color: var(--text-muted);">${escapeHtml(a.patient_phone || a.patient_email)}</small>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(a.doctor_name)}</div>
          <small style="color: var(--secondary);">${escapeHtml(a.department_name)}</small>
        </td>
        <td>${formatDate(a.appointment_date)}</td>
        <td><strong>${escapeHtml(a.appointment_time)}</strong></td>
        <td>
          <span class="status-badge ${statusClass}">${a.status}</span>
        </td>
        <td>
          <div class="actions-cell">
            ${a.status !== 'Confirmed' ? `
              <button class="btn btn-outline btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Confirm" onclick="updateAdminAppointmentStatus(${a.appointment_id}, 'Confirmed')">
                <i class="fa-solid fa-check"></i>
              </button>` : ''
            }
            ${a.status !== 'Completed' ? `
              <button class="btn btn-primary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Mark Completed" onclick="updateAdminAppointmentStatus(${a.appointment_id}, 'Completed')">
                <i class="fa-solid fa-circle-check"></i>
              </button>` : ''
            }
            ${a.status !== 'Cancelled' ? `
              <button class="btn btn-danger btn-sm" style="padding: 4px 8px; font-size: 0.75rem;" title="Cancel" onclick="updateAdminAppointmentStatus(${a.appointment_id}, 'Cancelled')">
                <i class="fa-solid fa-ban"></i>
              </button>` : ''
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateAdminAppointmentStatus(id, newStatus) {
  try {
    const res = await apiFetch(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    if (res.success) {
      showToast('Status Updated', `Appointment marked as ${newStatus}.`, 'success');
      await loadAppointmentsSection();
      await loadOverviewStats();
    }
  } catch (error) {
    showToast('Update Failed', error.message || 'Unable to update status.', 'error');
  }
}
