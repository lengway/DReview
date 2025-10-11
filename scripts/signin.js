import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://zqdqbvcppkwurakulier.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I'
const supabase = createClient(supabaseUrl, supabaseKey)

// элементы
const form = document.querySelector('.login-box')
const emailInput = document.querySelector('#email')
const passwordInput = document.querySelector('#password')

// элементы для ошибок (добавь их в html)
const emailError = document.querySelector('#emailError')
const passwordError = document.querySelector('#passwordError')

// Валидация email при вводе
emailInput.addEventListener('input', () => {
  const email = emailInput.value.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (email === '') {
    emailError.textContent = ''
    emailError.classList.remove('visible')
    emailInput.classList.remove('invalid')
  } else if (!emailRegex.test(email)) {
    emailError.textContent = 'Wrong email format'
    emailError.classList.add('visible')
    emailInput.classList.add('invalid')
  } else {
    emailError.textContent = ''
    emailError.classList.remove('visible')
    emailInput.classList.remove('invalid')
  }
})

// Очистка ошибок при вводе пароля
passwordInput.addEventListener('input', () => {
  passwordError.textContent = ''
  passwordError.classList.remove('visible')
  passwordInput.classList.remove('invalid')
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  // базовая проверка
  if (!email || !password) {
    if (!email) {
      emailError.textContent = 'Enter email'
      emailError.classList.add('visible')
      emailInput.classList.add('invalid')
    }
    if (!password) {
      passwordError.textContent = 'Enter password'
      passwordError.classList.add('visible')
      passwordInput.classList.add('invalid')
    }
    return
  }

  // попытка входа
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error(error)

    // проверяем тип ошибки
    if (error.message.includes('Invalid login credentials')) {
      passwordError.textContent = 'Wrond email or password'
      passwordError.classList.add('visible')
      passwordInput.classList.add('invalid')
    } else if (error.message.includes('Email not confirmed')) {
      emailError.textContent = 'Confirm your email first'
      emailError.classList.add('visible')
      emailInput.classList.add('invalid')
    } else {
      passwordError.textContent = 'Login error:' + error.message
      passwordError.classList.add('visible')
    }
    return
  }

  // успешный вход
  localStorage.setItem('token', data.session.access_token)
  window.location.href = './home.html'
})
