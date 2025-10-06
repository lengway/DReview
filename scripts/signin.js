import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zqdqbvcppkwurakulier.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I'
const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.querySelector('.login-box')
const usernameInput = document.querySelector('#username')
const passwordInput = document.querySelector('#password')

form.addEventListener('submit', async (e) => {
  e.preventDefault() // предотвращаем перезагрузку страницы

  const email = usernameInput.value.trim()
  const password = passwordInput.value.trim()

  if (!email || !password) {
    alert('Введите email и пароль')
    return
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    alert('Ошибка входа: ' + error.message)
    console.error(error)
    return
  }

  alert('Добро пожаловать, ' + data.user.email)
  localStorage.setItem('token', data.session.access_token)

  window.location.href = './home.html'
})
