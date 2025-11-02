// products.js (исправленный)
// ждём DOM, валидируем элементы, затем запускаем логику
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// const SUPABASE_URL = 'http://127.0.0.1:54321'
// const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const SUPABASE_URL = "https://zqdqbvcppkwurakulier.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I" // твой anon key


if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase config. Make sure env.js is loaded and contains SUPABASE_URL and SUPABASE_ANON_KEY.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// main entry — выполняем когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
  const CONTAINER = document.getElementById('products')
  const LOAD_BTN = document.getElementById('loadMore')
  const EMPTY = document.getElementById('empty')
  const PAGE_TITLE = document.getElementById('page-title')
  const COUNTS = document.getElementById('counts')

  // базовая валидация — если контейнера нет, ничего не делаем
  if (!CONTAINER) {
    console.error('products.js: container with id="products" not found. Make sure your HTML contains <div id="products" data-product-type="movie|game">')
    return
  }

  const productType = CONTAINER.dataset.productType === 'game' ? 'game' : 'movie'
  const tableName = productType === 'game' ? 'games' : 'movies'
  if (PAGE_TITLE) PAGE_TITLE.textContent = productType === 'game' ? 'Games' : 'Movies'

  let pageSize = 12
  let lastCreatedAt = null
  let loading = false
  let allLoaded = false

  // если кнопка загрузки есть — подпишемся, иначе скроем/пропустим
  if (LOAD_BTN) {
    LOAD_BTN.addEventListener('click', () => loadNext())
  }

  // если кнопки нет, но хотим автозагрузку первой страницы — просто вызываем loadNext()
  // initial load
  loadNext()

  async function loadNext() {
    if (loading || allLoaded) return
    loading = true
    if (LOAD_BTN) LOAD_BTN.textContent = 'Loading...'

    try {
      let query = supabase
        .from(tableName)
        .select('id, title, short_description, img_url, reviews_amount, created_at, slug')
        .order('created_at', { ascending: false })
        .limit(pageSize)

      if (lastCreatedAt) query = query.lt('created_at', lastCreatedAt)

      const { data, error } = await query

      if (error) throw error
      if (!data || data.length === 0) {
        if (!lastCreatedAt && EMPTY) {
          EMPTY.style.display = 'block'
        }
        allLoaded = true
        if (LOAD_BTN) LOAD_BTN.style.display = 'none'
        return
      }

      for (const item of data) {
        renderCard(item)
      }

      lastCreatedAt = data[data.length - 1].created_at
      updateCounts()

      if (data.length < pageSize) {
        allLoaded = true
        if (LOAD_BTN) LOAD_BTN.style.display = 'none'
      } else {
        if (LOAD_BTN) {
          LOAD_BTN.style.display = 'block'
          LOAD_BTN.textContent = 'Загрузить ещё'
        }
      }
    } catch (err) {
      console.error('Load products error', err)
      if (LOAD_BTN) LOAD_BTN.textContent = 'Ошибка, повторить'
    } finally {
      loading = false
    }
  }

  /**
   * renderCard
   * Рендерит карточку в твоём стиле (article.card > a > img + .card-body)
   */
  function renderCard(product) {
    // const section = document.createElement('section')
    // section.className = 'section'


    const article = document.createElement('article')
    article.className = 'card'

    const link = document.createElement('a')
    const slug = product.slug ? product.slug : product.id
    // делаем ссылку на универсальную страницу, передаём slug как параметр
    link.href = `/pages/reviews/${productType}.html?slug=${encodeURIComponent(slug)}`


    const img = document.createElement('img')
    img.className = 'card-img'
    img.src = product.img_url || '../images/placeholder.png'
    img.alt = product.title || ''

    const body = document.createElement('div')
    body.className = 'card-body'

    const h3 = document.createElement('h3')
    h3.className = 'card-title'
    h3.textContent = product.title || 'Без названия'

    const p = document.createElement('p')
    p.className = 'card-text'
    p.textContent = product.short_description || ''

    body.appendChild(h3)
    body.appendChild(p)

    link.appendChild(img)
    link.appendChild(body)
    article.appendChild(link)
    // section.appendChild(article)
    CONTAINER.appendChild(article)


    // асинхронно подгружаем средний рейтинг (если он у тебя есть через RPC)
    fetchAvgRating(product.id).then(avg => {
      if (avg) {
        const ratingEl = document.createElement('div')
        ratingEl.className = 'card-rating'
        ratingEl.style.marginTop = '6px'
        ratingEl.textContent = `⭐ ${avg}`
        body.appendChild(ratingEl)
      }
    }).catch(() => { })
  }

  async function fetchAvgRating(productId) {
    try {
      const { data, error } = await supabase.rpc('get_product_review_stats', { p_type: productType, p_id: productId })
      if (error) return null
      if (data && data.length) {
        const row = data[0]
        return row.avg_rating ? Number(row.avg_rating).toFixed(2) : null
      }
      return null
    } catch (e) {
      return null
    }
  }

  async function updateCounts() {
    if (!COUNTS) return
    try {
      const { count } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true })
      COUNTS.textContent = `Всего: ${count ?? '-'}`
    } catch (e) {
      // ignore
    }
  }
})
