import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = 'https://zqdqbvcppkwurakulier.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I';
const supabase = createClient(supabaseUrl, supabaseKey);

const form = document.querySelector('.login-box');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const confirmPasswordInput = document.querySelector('#confirm-password'); // ✅ исправлено!

const emailError = document.querySelector('#emailError');
const passwordError = document.querySelector('#passwordError');
const confirmPasswordError = document.querySelector('#confirmPasswordError');

// === EMAIL VALIDATION ===
emailInput.addEventListener('input', () => {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    emailError.textContent = '';
    emailError.classList.remove('visible');
    emailInput.classList.remove('invalid');
  } else if (!emailRegex.test(email)) {
    emailError.textContent = 'Invalid email format';
    emailError.classList.add('visible');
    emailInput.classList.add('invalid');
  } else {
    emailError.textContent = '';
    emailError.classList.remove('visible');
    emailInput.classList.remove('invalid');
  }
});

// === PASSWORD VALIDATION ===
passwordInput.addEventListener('input', () => {
  passwordError.textContent = '';
  passwordError.classList.remove('visible');
  passwordInput.classList.remove('invalid');
});

// === CONFIRM PASSWORD VALIDATION ===
confirmPasswordInput.addEventListener('input', () => {
  confirmPasswordError.textContent = '';
  confirmPasswordError.classList.remove('visible');
  confirmPasswordInput.classList.remove('invalid');
});

// === FORM SUBMIT ===
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  let hasError = false;

  if (!email) {
    emailError.textContent = 'Enter email';
    emailError.classList.add('visible');
    emailInput.classList.add('invalid');
    hasError = true;
  }
  if (!password) {
    passwordError.textContent = 'Enter password';
    passwordError.classList.add('visible');
    passwordInput.classList.add('invalid');
    hasError = true;
  }
  if (!confirmPassword) {
    confirmPasswordError.textContent = 'Confirm your password';
    confirmPasswordError.classList.add('visible');
    confirmPasswordInput.classList.add('invalid');
    hasError = true;
  } else if (password !== confirmPassword) {
    confirmPasswordError.textContent = 'Passwords do not match';
    confirmPasswordError.classList.add('visible');
    confirmPasswordInput.classList.add('invalid');
    hasError = true;
  }

  if (hasError) return;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error(error);
    passwordError.textContent = 'Sign up error: ' + error.message;
    passwordError.classList.add('visible');
    passwordInput.classList.add('invalid');
    return;
  }

  alert('Check your email for the confirmation link.');
  window.location.href = 'signin.html';
});
