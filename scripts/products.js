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
  const CONTAINER = document.getElementById('products');
  const LOAD_BTN = document.getElementById('loadMore');
  const EMPTY = document.getElementById('empty');
  const PAGE_TITLE = document.getElementById('page-title');
  const COUNTS = document.getElementById('counts');
  const SEARCH = document.getElementById('search-bar');
  

  if (!CONTAINER) return;

  const productType = CONTAINER.dataset.productType === 'game' ? 'game' : 'movie';
  const tableName = productType === 'game' ? 'games' : 'movies';
  if (PAGE_TITLE) PAGE_TITLE.textContent = productType === 'game' ? 'Games' : 'Movies';

  let pageSize = 12;
  let lastCreatedAt = null;
  let loading = false;
  let allLoaded = false;
  let currentQuery = ''; // текущая строка поиска

  if (LOAD_BTN) LOAD_BTN.addEventListener('click', () => loadNext());

  loadNext(); // первая загрузка

  //Поиск с debounce
  if (SEARCH) {
    let debounceTimer = null;
    SEARCH.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      debounceTimer = setTimeout(() => {
        currentQuery = query;
        CONTAINER.innerHTML = '';
        lastCreatedAt = null;
        allLoaded = false;
        loadNext(); // перезагрузка с фильтром
      }, 300);
    });
  }

  //Загрузка данных с учетом поиска
  async function loadNext() {
    if (loading || allLoaded) return;
    loading = true;
    if (LOAD_BTN) LOAD_BTN.textContent = 'Loading...';

    try {
      let query = supabase
        .from(tableName)
        .select('id, title, short_description, img_url, reviews_amount, created_at, slug')
        .order('created_at', { ascending: false })
        .limit(pageSize);

      // фильтр по поиску
      if (currentQuery) {
        query = query.or(
          `title.ilike.%${currentQuery}%,short_description.ilike.%${currentQuery}%`
        );
      }

      if (lastCreatedAt) query = query.lt('created_at', lastCreatedAt);

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        if (!lastCreatedAt && EMPTY) EMPTY.style.display = 'block';
        allLoaded = true;
        if (LOAD_BTN) LOAD_BTN.style.display = 'none';
        if (CONTAINER.innerHTML.trim() === '')
          CONTAINER.innerHTML = `<p class="no-results">Not Founded</p>`;
        return;
      }

      for (const item of data) {
        renderCard(item, currentQuery);
      }

      lastCreatedAt = data[data.length - 1].created_at;
      updateCounts();

      if (data.length < pageSize) {
        allLoaded = true;
        if (LOAD_BTN) LOAD_BTN.style.display = 'none';
      } else {
        if (LOAD_BTN) {
          LOAD_BTN.style.display = 'block';
          LOAD_BTN.textContent = 'load more';
        }
      }
    } catch (err) {
      console.error('Load products error', err);
      if (LOAD_BTN) LOAD_BTN.textContent = 'Error. Retry?';
    } finally {
      loading = false;
    }
  }

  //Рендер карточек 
  function renderCard(product, highlight = '') {
    const article = document.createElement('article');
    article.className = 'card';

    const link = document.createElement('a');
    const slug = product.slug ? product.slug : product.id;
    link.href = `/pages/reviews/${productType}.html?slug=${encodeURIComponent(slug)}`;

    const img = document.createElement('img');
    img.className = 'card-img';
    img.src = product.img_url || '../images/placeholder.png';
    img.alt = product.title || '';

    const body = document.createElement('div');
    body.className = 'card-body';

    const h3 = document.createElement('h3');
    h3.className = 'card-title';
    h3.innerHTML = highlightText(product.title || 'Without title', highlight);

    const p = document.createElement('p');
    p.className = 'card-text';
    p.innerHTML = highlightText(product.short_description || '', highlight);

    body.appendChild(h3);
    body.appendChild(p);
    link.appendChild(img);
    link.appendChild(body);
    article.appendChild(link);
    CONTAINER.appendChild(article);

    // рейтинг
    fetchAvgRating(product.id).then((avg) => {
      if (avg) {
        const ratingEl = document.createElement('div');
        ratingEl.className = 'card-rating';
        ratingEl.style.marginTop = '6px';
        ratingEl.textContent = `⭐ ${avg}`;
        body.appendChild(ratingEl);
      }
    });
  }

  // Подсветка совпадений
  function highlightText(text, term) {
    if (!term) return text;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  async function fetchAvgRating(productId) {
    try {
      const { data, error } = await supabase.rpc('get_product_review_stats', {
        p_type: productType,
        p_id: productId,
      });
      if (error) return null;
      if (data && data.length) {
        const row = data[0];
        return row.avg_rating ? Number(row.avg_rating).toFixed(2) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function updateCounts() {
    if (!COUNTS) return;
    try {
      const { count } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });
      COUNTS.textContent = `Всего: ${count ?? '-'}`;
    } catch {}
  }
// Очистка поиска при выходе со страницы
  window.addEventListener('beforeunload', () => {
  const searchInput = document.getElementById('search-bar');
  if (searchInput) {
    searchInput.value = '';
  }
});

});
