import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const SUPABASE_URL = window.__ENV?.SUPABASE_URL
const SUPABASE_ANON_KEY = window.__ENV?.SUPABASE_ANON_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// элементы
const form = document.querySelector('.login-box')
const emailInput = document.querySelector('#email')
const passwordInput = document.querySelector('#password')

// элементы для ошибок
const emailError = document.querySelector('#emailError')
const passwordError = document.querySelector('#passwordError')

if (emailInput) {
  emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
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
}

if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    passwordError.textContent = ''
    passwordError.classList.remove('visible')
    passwordInput.classList.remove('invalid')
  })
}

if (form) {
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      // успешный вход — хранить токен в localStorage (или использовать сессионные куки на сервере)
      if (data?.session?.access_token) {
        localStorage.setItem('token', data.session.access_token)
      }
      window.location.href = './home.html'
    } catch (err) {
      console.error(err)
      const msg = (err && err.message) ? err.message : String(err)

      if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid')) {
        passwordError.textContent = 'Wrong email or password'
        passwordError.classList.add('visible')
        passwordInput.classList.add('invalid')
      } else if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('confirm')) {
        emailError.textContent = 'Confirm your email first'
        emailError.classList.add('visible')
        emailInput.classList.add('invalid')
      } else {
        passwordError.textContent = 'Login error: ' + msg
        passwordError.classList.add('visible')
      }
    }
  })
}
