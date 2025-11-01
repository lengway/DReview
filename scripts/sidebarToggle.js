function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  const closeBtn = document.getElementById('sidebar-close');
  const overlay = document.getElementById('overlay');
  // find layout by id or class for robustness across pages
  const layout = document.getElementById("layout") || document.querySelector('.layout');
  if (!toggleBtn || !sidebar || !layout) {
    setTimeout(initSidebarToggle, 100);
    return;
  }

  // Установим начальное состояние для мобильной версии
  toggleBtn.setAttribute('aria-expanded', 'false');

  function openMobileSidebar() {
    document.body.classList.add('overlay-active');
    sidebar.classList.add('open');
    if (overlay) {
      overlay.style.display = 'block';
      // Форсируем reflow
      overlay.offsetHeight;
      overlay.classList.add('active');
    }
    toggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileSidebar() {
    document.body.classList.remove('overlay-active');
    sidebar.classList.remove('open');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  toggleBtn.addEventListener("click", () => {
    const opened = sidebar.classList.toggle('open');
    if (overlay) {
      if (opened) {
        overlay.style.display = 'block';
        // Форсируем reflow для плавной анимации
        overlay.offsetHeight;
        overlay.classList.add('active');
      } else {
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 300);
      }
    }
    toggleBtn.setAttribute('aria-expanded', opened ? 'true' : 'false');
  });

  // close button & overlay handlers
  if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);


}

document.addEventListener("DOMContentLoaded", initSidebarToggle);
