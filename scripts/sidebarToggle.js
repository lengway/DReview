function initSidebarToggle(){
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  // find layout by id or class for robustness across pages
  const layout = document.getElementById("layout") || document.querySelector('.layout');
  if (!toggleBtn || !sidebar || !layout) {
    setTimeout(initSidebarToggle, 100);
    return;
  }

  // restore saved state if present
  try {
    const saved = localStorage.getItem('sidebar-hidden');
    if (saved === 'true') {
      sidebar.classList.add('hidden');
      layout.classList.add('sidebar-hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      toggleBtn.setAttribute('aria-expanded', String(!sidebar.classList.contains('hidden')));
    }
  } catch (e) { /* ignore storage errors */ }

  toggleBtn.addEventListener("click", () => {
    // toggle both visual state and layout class — CSS will animate grid columns
    const hiddenNow = sidebar.classList.toggle("hidden");
    layout.classList.toggle("sidebar-hidden");
    // update aria
    toggleBtn.setAttribute('aria-expanded', String(!hiddenNow));
    try { localStorage.setItem('sidebar-hidden', String(hiddenNow)); } catch (e) {}
  });
}

document.addEventListener("DOMContentLoaded", initSidebarToggle);
