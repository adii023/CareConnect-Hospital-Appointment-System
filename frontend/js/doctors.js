// ===================================================================
// CARECONNECT HOSPITAL - DOCTORS SEARCH & LISTING
// ===================================================================

let allDoctors = [];
let allDepartments = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadDepartmentsDropdown();
  await loadDoctors();
  setupFilterListeners();
});

// Load departments into the filter dropdown
async function loadDepartmentsDropdown() {
  const deptSelect = document.getElementById('filter-department');
  if (!deptSelect) return;

  try {
    const res = await apiFetch('/departments');
    if (res.success && res.data) {
      allDepartments = res.data;
      res.data.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.id;
        opt.textContent = dept.name;
        deptSelect.appendChild(opt);
      });

      // Check URL query for dept preselection
      const urlParams = new URLSearchParams(window.location.search);
      const preselectedDept = urlParams.get('department');
      if (preselectedDept) {
        deptSelect.value = preselectedDept;
      }
    }
  } catch (error) {
    console.error('Failed to load departments for filter:', error);
  }
}

// Fetch and render doctors based on active filters
async function loadDoctors() {
  const container = document.getElementById('doctors-grid');
  if (!container) return;

  container.innerHTML = `
    <div class="spinner-wrapper" style="grid-column: 1 / -1;">
      <div class="spinner"></div>
      <p>Loading doctors...</p>
    </div>
  `;

  const searchInput = document.getElementById('search-doctor');
  const deptSelect = document.getElementById('filter-department');
  const genderSelect = document.getElementById('filter-gender');

  // Check URL query parameters initially
  const urlParams = new URLSearchParams(window.location.search);
  const searchVal = searchInput ? searchInput.value.trim() : (urlParams.get('search') || '');
  const deptVal = deptSelect ? deptSelect.value : (urlParams.get('department') || '');
  const genderVal = genderSelect ? genderSelect.value : '';

  let endpoint = '/doctors?';
  if (searchVal) endpoint += `search=${encodeURIComponent(searchVal)}&`;
  if (deptVal) endpoint += `department=${encodeURIComponent(deptVal)}&`;
  if (genderVal) endpoint += `gender=${encodeURIComponent(genderVal)}&`;

  try {
    const res = await apiFetch(endpoint);
    if (res.success) {
      allDoctors = res.data;
      renderDoctorCards(allDoctors);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h3>Failed to Load Doctors</h3>
        <p>${escapeHtml(error.message || 'Something went wrong while fetching doctors.')}</p>
        <button class="btn btn-primary btn-sm" onclick="loadDoctors()">Try Again</button>
      </div>
    `;
  }
}

// Render Doctor Cards
function renderDoctorCards(doctors) {
  const container = document.getElementById('doctors-grid');
  const countLabel = document.getElementById('doctors-count-label');

  if (countLabel) {
    countLabel.textContent = `Showing ${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`;
  }

  if (!doctors || doctors.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="fa-solid fa-user-doctor"></i></div>
        <h3>No Doctors Found</h3>
        <p>We couldn't find any doctors matching your search filters. Try adjusting your search keywords or clearing filters.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = doctors.map(doc => {
    const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2);
    const avatarColor = doc.gender === 'Female' ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'linear-gradient(135deg, #0284c7, #2563eb)';

    return `
      <div class="doctor-card">
        <div class="doc-card-top">
          <div class="doc-avatar" style="background: ${avatarColor};">
            ${initials}
          </div>
          <div class="doc-header-info">
            <span class="doc-dept-badge">${escapeHtml(doc.department_name)}</span>
            <h3 class="doc-name">${escapeHtml(doc.name)}</h3>
            <p class="doc-specialty">${escapeHtml(doc.specialization)}</p>
            <div class="doc-rating">
              <i class="fa-solid fa-star"></i>
              <span>${doc.rating || 4.8} / 5.0</span>
            </div>
          </div>
        </div>

        <div class="doc-card-body">
          <div class="doc-detail-row">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>${escapeHtml(doc.qualification)}</span>
          </div>
          <div class="doc-detail-row">
            <i class="fa-solid fa-award"></i>
            <span>${doc.experience} Years of Clinical Experience</span>
          </div>
          <div class="doc-detail-row">
            <i class="fa-solid fa-calendar-days"></i>
            <span>${escapeHtml(doc.available_days)}</span>
          </div>
          <div class="doc-detail-row">
            <i class="fa-solid fa-clock"></i>
            <span>${escapeHtml(doc.available_time)}</span>
          </div>

          <div class="doc-fee-badge">
            <span>Consultation Fee</span>
            <strong>${formatCurrency(doc.consultation_fee)}</strong>
          </div>
        </div>

        <div class="doc-card-footer">
          <a href="doctor-details.html?id=${doc.id}" class="btn btn-outline-dark btn-sm">
            View Profile
          </a>
          <a href="book-appointment.html?doctorId=${doc.id}" class="btn btn-primary btn-sm">
            Book Visit
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Setup Event Listeners for Filters
function setupFilterListeners() {
  const searchInput = document.getElementById('search-doctor');
  const deptSelect = document.getElementById('filter-department');
  const genderSelect = document.getElementById('filter-gender');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadDoctors, 300);
    });
  }

  if (deptSelect) {
    deptSelect.addEventListener('change', loadDoctors);
  }

  if (genderSelect) {
    genderSelect.addEventListener('change', loadDoctors);
  }
}

function resetFilters() {
  const searchInput = document.getElementById('search-doctor');
  const deptSelect = document.getElementById('filter-department');
  const genderSelect = document.getElementById('filter-gender');

  if (searchInput) searchInput.value = '';
  if (deptSelect) deptSelect.value = '';
  if (genderSelect) genderSelect.value = '';

  loadDoctors();
}
