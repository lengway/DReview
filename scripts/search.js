// search.js
document.addEventListener("DOMContentLoaded", async () => {
  const searchBar = document.getElementById("search-bar");
  const resultsContainer = document.getElementById("results");

  // ⚙️ Настройка Supabase
  const SUPABASE_URL = "https://zqdqbvcppkwurakulier.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZHFidmNwcGt3dXJha3VsaWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDc3NTAsImV4cCI6MjA3NTI4Mzc1MH0.jp0RmoPLurjNVdQNxsLdVtwrm0yWnMW3_dRi3slSd7I";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let data = [];

  // Определяем, какая страница открыта (movies или games)
  const isMovies = window.location.pathname.includes("movies");
  const table = isMovies ? "movies" : "games";

  // Загружаем данные
  async function loadData() {
    const { data: rows, error } = await supabase
      .from(table)
      .select("*");
    if (error) {
      console.error("Ошибка Supabase:", error);
      resultsContainer.innerHTML = "<p>Ошибка загрузки данных</p>";
      return;
    }
    data = rows;
    renderResults(data);
  }

  await loadData();

  // 🔍 Поиск по названию и описанию
  searchBar.addEventListener("input", () => {
    const query = searchBar.value.toLowerCase();
    const filtered = data.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
    renderResults(filtered);
  });

  // 🧩 Отрисовка карточек
  function renderResults(items) {
    resultsContainer.innerHTML = "";

    if (items.length === 0) {
      resultsContainer.innerHTML = "<p>No results found</p>";
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img class="card-img" src="${item.image}" alt="${item.title}">
        <div class="card-body">
          <h3 class="card-title">${item.title}</h3>
          <p class="card-text">${item.description}</p>
          <a href="${item.link}" class="btn">Read more</a>
        </div>
      `;
      resultsContainer.appendChild(card);
    });
  }
});
