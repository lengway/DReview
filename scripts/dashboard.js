// Пример исправленного скрипта (клиентская часть)
// Убедись, что подключаешь @supabase/supabase-js корректно в production.
// Для локалки SUPABASE_URL может быть http://127.0.0.1:54321

import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// const SUPABASE_URL = 'http://127.0.0.1:54321'
// const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const SUPABASE_URL = "https://zqdqbvcppkwurakulier.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I" // твой anon key


if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase config.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// --- DOM элементы (без падений если элемент не найден) ---
const loading = document.getElementById('loading')
const app = document.getElementById('app')
const userEmailEl = document.getElementById('user-email')
const avatarEl = document.getElementById('avatar')
const profileForm = document.getElementById('profile-form')
const fullname = document.getElementById('full_name')
const fullNameDisplay = document.getElementById('full_name_display')
const fullNameInput = document.getElementById('full_name_input')
const bioDisplay = document.getElementById('bio_display')
const bioInput = document.getElementById('bio')
const logoutBtn = document.getElementById('logoutBtn')
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn')
const removeAvatarBtn = document.getElementById('removeAvatarBtn')
const fileInput = document.getElementById('avatarInput')

const DEFAULT_AVATAR = 'avatar-default.svg' // файл в корне бакета avatars
const BUCKET = 'avatars'

// --- helper: получить текущего пользователя (с обработкой ошибок) ---
async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
        console.error('supabase.auth.getUser error', error)
        return { user: null, error }
    }
    return { user: data?.user ?? null, error: null }
}

// --- Инициализация профиля и UI ---
async function init() {
    try {
        const { user, error } = await getCurrentUser()
        if (error || !user) {
            console.warn('No user, redirect to login')
            redirectToLogin()
            return
        }

        if (userEmailEl) userEmailEl.textContent = user.email || user.id

        // Берём профиль (если есть)
        const { data: profile, error: pErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (pErr && pErr.code !== 'PGRST116') { // PGRST116 - нет строки
            console.error('Profile fetch error', pErr)
        }

        if (profile) {
            if (fullname) fullname.textContent = profile.full_name || 'No name'
            if (fullNameDisplay) fullNameDisplay.textContent = profile.full_name || 'No name'
            if (fullNameInput) fullNameInput.value = profile.full_name || ''
            if (bioDisplay) bioDisplay.textContent = profile.bio || 'No bio'
            if (bioInput) bioInput.value = profile.bio || ''

            // Если в профиле есть avatar_url — используем его,
            // иначе подставляем дефолтный из storage
            if (profile.avatar_url && avatarEl) {
                avatarEl.src = profile.avatar_url
            } else if (avatarEl) {
                const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(DEFAULT_AVATAR)
                avatarEl.src = publicData?.publicUrl || ''
            }
        } else {
            // no profile -> дефолтный аватар
            if (avatarEl) {
                const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(DEFAULT_AVATAR)
                avatarEl.src = publicData?.publicUrl || ''
            }
        }

        // показываем UI (если у тебя скрыт по умолчанию)
        if (loading) loading.classList?.add('hidden')
        if (app) app.classList?.remove('hidden')
    } catch (err) {
        console.error('init error', err)
    }
}

// --- Обработка отправки формы профиля (upsert) ---
profileForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { user } = await getCurrentUser()
    if (!user) return redirectToLogin()

    const payload = {
        id: user.id,
        full_name: fullNameInput?.value.trim() || null,
        bio: bioInput?.value.trim() || null
        // avatar_path и avatar_url обновляем отдельно при загрузке аватара
    }

    const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(payload, { returning: 'representation' })

    if (upsertErr) {
        console.error('Profile upsert error', upsertErr)
        alert('Ошибка при сохранении профиля')
        return
    }

    if (fullname) fullname.textContent = payload.full_name || 'No name'
    alert('Профиль сохранён')
})

// --- Logout ---
logoutBtn?.addEventListener('click', async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('token')
    redirectToLogin()
})

function redirectToLogin() {
    window.location.href = '/pages/signin.html'
}

// --- Avatar upload ---
uploadAvatarBtn?.addEventListener('click', () => fileInput?.click())

fileInput?.addEventListener('change', async (e) => {
    try {
        const file = e.target.files?.[0]
        if (!file) return

        const { user } = await getCurrentUser()
        if (!user) return redirectToLogin()

        // Генерируем path внутри бакета: userId/filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // без "avatars/", потому что bucket уже avatars

        // 1️⃣ Загружаем в bucket avatars
        const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }

        // 2️⃣ Получаем публичный URL из того же bucket
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3️⃣ Обновляем профиль
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 4️⃣ Обновляем аватар на сайте
        avatarEl.src = publicUrl;

    } catch (err) {
        console.error('Error uploading avatar:', err)
        alert('Failed to upload avatar')
    } finally {
        // очистим input чтобы можно было загрузить тот же файл снова если нужно
        if (fileInput) fileInput.value = ''
    }
})

// --- Удаление аватара ---
removeAvatarBtn?.addEventListener('click', async () => {
    try {
        const { user } = await getCurrentUser()
        if (!user) return redirectToLogin()

        // Берём profile и avatar_path
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()

        if (profileErr) {
            console.error('Error fetching profile before delete', profileErr)
            alert('Ошибка')
            return
        }

        const avatarPath = profile?.avatar_url

        // Удаляем файл, если есть путь
        if (avatarPath) {
            const { error: removeErr } = await supabase.storage.from(BUCKET).remove([avatarPath])
            if (removeErr) {
                console.error('Error removing file from storage', removeErr)
                // продолжаем — даже если файл не удалился, обновим профиль чтобы не указывать старый url
            }
        }

        // Получаем дефолтный public URL
        const { data: defaultData } = supabase.storage.from(BUCKET).getPublicUrl(DEFAULT_AVATAR)
        const defaultUrl = defaultData?.publicUrl ?? ''

        // Обновляем профиль: убираем avatar_path, ставим default avatar_url
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ avatar_url: defaultUrl, avatar_url: null })
            .eq('id', user.id)

        if (updateErr) {
            console.error('Error updating profile after removing avatar', updateErr)
            alert('Ошибка при обновлении профиля')
            return
        }

        if (avatarEl) avatarEl.src = defaultUrl
    } catch (err) {
        console.error('Error removing avatar:', err)
        alert('Failed to remove avatar')
    }
})

// --- Прочие функции (твою логику с фаворитами/поиском я не трогал) ---
// Тебе нужно только вызвать init/загрузку статистики как раньше

async function loadUserStats() {
    // Оставил как есть, можно улучшить по тем же принципам проверки ошибок
    try {
        const { user } = await getCurrentUser()
        if (!user) return

        // Пример: count reviews
        const { count } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        const reviewsCount = document.getElementById('reviews_count')
        if (reviewsCount) reviewsCount.textContent = String(count ?? '0')

        // Load favorites (пример)
        const { data: profile } = await supabase
            .from('profiles')
            .select(`favorite_game (id, title, img_url, short_description, slug), favorite_movie (id, title, img_url, short_description, slug)`)
            .eq('id', user.id)
            .single()

        if (profile?.favorite_game) updateFavoriteDisplay('game', profile.favorite_game)
        if (profile?.favorite_movie) updateFavoriteDisplay('movie', profile.favorite_movie)
    } catch (err) {
        console.error('loadUserStats error', err)
    }
}

function updateFavoriteDisplay(type, item) {
    // Твоя реализация — оставил как есть
    const container = type === 'game' ? document.getElementById('favorite_game') : document.getElementById('favorite_movie')
    if (!container) return
    container.innerHTML = `
    <a href="/pages/reviews/${type}.html?slug=${encodeURIComponent(item.slug)}">
    <div class="favorite-item has-favorite">
      <img src="${item.img_url}" alt="${item.title}">
      <div class="content">
        <h4>${item.title}</h4>
        <p>${item.short_description}</p>
      </div>
      <button class="choose-btn" data-type="${type}">Change</button>
    </div>
    </a>
  `
    container.querySelector('.choose-btn')?.addEventListener('click', (e) => {
        const currentType = e.target.dataset.type
        openChoosePopup(currentType)
    })
}

// debounce и поиск/рендер — оставил как у тебя
function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// Твоё открытие попапа / поиск — не трогал, только пример вызова
async function openChoosePopup(type) {
    popupTitle.textContent = `Choose Favorite ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    chooseFavoritePopup.hidden = false;
    searchInput.value = '';
    await handleSearch();
}
// Инициализация
async function initializeDashboard() {
    await init()
    await loadUserStats()
}

initializeDashboard()
