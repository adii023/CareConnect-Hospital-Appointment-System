// ===================================================================
// CARECONNECT HOSPITAL - MAIN COMMON SCRIPTS
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavbarAuth();
  initMobileMenu();
  highlightActiveNavLink();
});

// Render user badge or Login/Register buttons in navbar
function initNavbarAuth() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = getCurrentUser();

  if (user) {
    let dashboardLink = 'patient-dashboard.html';
    if (user.role === 'Admin') dashboardLink = 'admin-dashboard.html';
    if (user.role === 'Receptionist') dashboardLink = 'receptionist-dashboard.html';

    navActions.innerHTML = `
      <div class="nav-user-menu">
        <a href="${dashboardLink}" class="user-badge" title="Go to Dashboard">
          <div class="user-avatar-tiny">${escapeHtml(user.name.charAt(0))}</div>
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--dark);">${escapeHtml(user.name.split(' ')[0])}</span>
          <span class="user-badge-role">${escapeHtml(user.role)}</span>
        </a>
      </div>
      <a href="${dashboardLink}" class="btn btn-outline btn-sm">
        <i class="fa-solid fa-chart-line"></i> Dashboard
      </a>
      <button onclick="logout()" class="btn btn-outline-dark btn-sm" title="Log out">
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
      </button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-outline-dark btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// Toggle mobile navbar menu
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }
}

// Highlight current page link
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}
