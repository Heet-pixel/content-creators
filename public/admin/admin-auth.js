(function () {
  'use strict';

  // If already logged in, skip straight to the dashboard
  if (localStorage.getItem('cc_admin_token')) {
    window.location.href = '/admin/dashboard';
    return;
  }

  var views = {
    login: document.getElementById('viewLogin'),
    forgotRequest: document.getElementById('viewForgotRequest'),
    forgotReset: document.getElementById('viewForgotReset')
  };

  function showView(name) {
    Object.keys(views).forEach(function (k) {
      views[k].classList.toggle('active', k === name);
    });
  }

  document.getElementById('goForgot').addEventListener('click', function () { showView('forgotRequest'); });
  document.getElementById('backToLogin1').addEventListener('click', function () { showView('login'); });
  document.getElementById('backToLogin2').addEventListener('click', function () { showView('login'); });

  function setError(el, msg) {
    el.textContent = msg;
    el.classList.toggle('active', !!msg);
  }

  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('active');
    setTimeout(function () { toast.classList.remove('active'); }, 3000);
  }

  /* ---------------- LOGIN ---------------- */
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var loginSubmit = document.getElementById('loginSubmit');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setError(loginError, '');
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Signing in…';

    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Login failed.');
        localStorage.setItem('cc_admin_token', res.data.token);
        localStorage.setItem('cc_admin_email', res.data.email);
        window.location.href = '/admin/dashboard';
      })
      .catch(function (err) {
        setError(loginError, err.message || 'Could not log in. Please try again.');
      })
      .finally(function () {
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Log In';
      });
  });

  /* ---------------- FORGOT PASSWORD: REQUEST OTP ---------------- */
  var forgotRequestForm = document.getElementById('forgotRequestForm');
  var forgotError = document.getElementById('forgotError');
  var forgotSuccess = document.getElementById('forgotSuccess');
  var forgotSubmit = document.getElementById('forgotSubmit');
  var lastForgotEmail = '';

  forgotRequestForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setError(forgotError, '');
    forgotSuccess.classList.remove('active');
    var email = document.getElementById('forgotEmail').value.trim();
    lastForgotEmail = email;

    forgotSubmit.disabled = true;
    forgotSubmit.textContent = 'Sending…';

    fetch('/api/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Could not send OTP.');
        showView('forgotReset');
        showToast('If that account exists, a code has been sent.');
      })
      .catch(function (err) {
        setError(forgotError, err.message || 'Could not send OTP.');
      })
      .finally(function () {
        forgotSubmit.disabled = false;
        forgotSubmit.textContent = 'Send OTP';
      });
  });

  /* ---------------- FORGOT PASSWORD: VERIFY OTP + RESET ---------------- */
  var forgotResetForm = document.getElementById('forgotResetForm');
  var resetError = document.getElementById('resetError');
  var resetSubmit = document.getElementById('resetSubmit');

  forgotResetForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setError(resetError, '');
    var otp = document.getElementById('otpCode').value.trim();
    var newPassword = document.getElementById('newPassword').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      setError(resetError, 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError(resetError, 'Password must be at least 8 characters.');
      return;
    }

    resetSubmit.disabled = true;
    resetSubmit.textContent = 'Resetting…';

    fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lastForgotEmail, otp: otp, newPassword: newPassword })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Could not reset password.');
        showView('login');
        showToast('Password updated — you can log in now.');
      })
      .catch(function (err) {
        setError(resetError, err.message || 'Could not reset password.');
      })
      .finally(function () {
        resetSubmit.disabled = false;
        resetSubmit.textContent = 'Reset Password';
      });
  });
})();
