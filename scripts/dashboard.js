import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const SUPABASE_URL = window.__ENV?.SUPABASE_URL
const SUPABASE_ANON_KEY = window.__ENV?.SUPABASE_ANON_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const loading = document.getElementById('loading')
const app = document.getElementById('app')
const userEmailEl = document.getElementById('user-email')
const avatarEl = document.getElementById('avatar')
const profileForm = document.getElementById('profile-form')
const fullname = document.getElementById('full_name')
const fullNameDisplay = document.getElementById('full_name_display')
const fullNameInput = document.getElementById('full_name_input')
const avatarInput = document.getElementById('avatar_url')
const bioDisplay = document.getElementById('bio_display')
const bioInput = document.getElementById('bio')
const logoutBtn = document.getElementById('logoutBtn')

async function init() {
  // Берём текущую сессию/пользователя
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Auth getUser error', error)
    redirectToLogin()
    return
  }
  if (!user) {
    // возможно, токен нет или просрочен
    redirectToLogin()
    return
  }

  // Показываем базовую инфу
  userEmailEl.textContent = user.email || user.id

  // Загружаем профиль из таблицы
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (pErr && pErr.code !== 'PGRST116') { // PGRST116 = no rows? но лучше логировать
    console.error('Profile fetch error', pErr)
  }

  // заполняем форму
  if (profile) {
    fullname.textContent = profile.full_name || 'No name'
    fullNameDisplay.textContent = profile.full_name || 'No name'
    fullNameInput.value = profile.full_name || ''
    avatarInput.value = profile.avatar_url || ''
    bioDisplay.textContent = profile.bio || 'No bio'
    bioInput.value = profile.bio || ''
    avatarEl.src = profile.avatar_url || ''
  } else {
    avatarEl.src = '' // placeholder
  }

  // UI — показать приложение
  loading.classList.add('hidden')
  app.classList.remove('hidden')
}

// отправка формы: апдейт профиля (upsert)
profileForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  // получаем user заново (чтобы быть уверенным)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return redirectToLogin()

  const payload = {
    id: user.id,
    full_name: fullNameInput.value.trim() || null,
    avatar_url: avatarInput.value.trim() || null,
    bio: bioInput.value.trim() || null
  }

  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert(payload, { returning: 'representation' }) // representation вернёт строку
  if (upsertErr) {
    console.error('Profile upsert error', upsertErr)
    alert('Ошибка при сохранении профиля')
    return
  }
  avatarEl.src = payload.avatar_url || ''
  alert('Профиль сохранён')
})

// logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut()
  // очистим localStorage token если хранил
  localStorage.removeItem('token')
  redirectToLogin()
})

function redirectToLogin() {
  window.location.href = '/signin.html' // подставь свой путь
}

// запускаем
init()
