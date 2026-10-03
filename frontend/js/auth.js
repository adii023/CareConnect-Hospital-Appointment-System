// ===================================================================
// CARECONNECT HOSPITAL - AUTHENTICATION LOGIC (Login & Register)
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// Quick 1-Click Demo Credentials Filler
function fillDemoCredentials(role) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleSelect = document.getElementById('role');

  if (role === 'Admin') {
    if (emailInput) emailInput.value = 'admin@careconnect.example';
    if (passwordInput) passwordInput.value = 'Admin@123';
    if (roleSelect) roleSelect.value = 'Admin';
    showToast('Admin Credentials', 'Loaded Admin demo credentials.', 'info');
  } else if (role === 'Receptionist') {
    if (emailInput) emailInput.value = 'receptionist@careconnect.example';
    if (passwordInput) passwordInput.value = 'Reception@123';
    if (roleSelect) roleSelect.value = 'Receptionist';
    showToast('Receptionist Credentials', 'Loaded Receptionist demo credentials.', 'info');
  } else if (role === 'Patient') {
    if (emailInput) emailInput.value = 'patient@careconnect.example';
    if (passwordInput) passwordInput.value = 'Patient@123';
    if (roleSelect) roleSelect.value = 'Patient';
    showToast('Patient Credentials', 'Loaded Patient demo credentials.', 'info');
  }
}

// Handle Login Submission
async function handleLogin(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('login-btn');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role') ? document.getElementById('role').value : null;

  if (!email || !password) {
    showToast('Missing Fields', 'Please enter both email and password.', 'warning');
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
    }

    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });

    if (res.success) {
      setAuthToken(res.token);
      setCurrentUser(res.user);
      showToast('Welcome Back!', `Logged in successfully as ${res.user.name}.`, 'success');

      // Check URL redirect param
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      setTimeout(() => {
        if (redirect && !redirect.includes('login.html')) {
          window.location.href = redirect;
        } else if (res.user.role === 'Admin') {
          window.location.href = 'admin-dashboard.html';
        } else if (res.user.role === 'Receptionist') {
          window.location.href = 'receptionist-dashboard.html';
        } else {
          window.location.href = 'patient-dashboard.html';
        }
      }, 800);
    }
  } catch (error) {
    showToast('Login Failed', error.message || 'Invalid email or password.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
    }
  }
}

// Handle Patient Registration
async function handleRegister(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('register-btn');

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const date_of_birth = document.getElementById('date_of_birth').value;
  const gender = document.getElementById('gender').value;
  const address = document.getElementById('address').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation Checks
  if (!name || !email || !phone || !password || !confirmPassword) {
    showToast('Missing Fields', 'Please fill in all required fields.', 'warning');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Invalid Email', 'Please enter a valid email address.', 'warning');
    return;
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    showToast('Invalid Mobile', 'Please enter a valid 10-digit mobile number.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Weak Password', 'Password must be at least 6 characters long.', 'warning');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Mismatch', 'Passwords do not match.', 'warning');
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
    }

    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        phone,
        date_of_birth,
        gender,
        address,
        password,
        confirmPassword
      })
    });

    if (res.success) {
      showToast('Registration Successful', 'Account created! Please login with your credentials.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    }
  } catch (error) {
    showToast('Registration Failed', error.message || 'Registration failed. Please try again.', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Register';
    }
  }
}
