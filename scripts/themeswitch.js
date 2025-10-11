function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return setTimeout(initThemeToggle, 1); // ждём появления кнопки

  const btn = document.getElementById('theme-toggle');
  const icon = btn.querySelector('.icon');

  // при загрузке страницы проверяем сохранённую тему
  const stored = localStorage.getItem('theme');
  const isLight = stored === 'light';

  // применяем тему при старте
  if (isLight) {
    document.body.classList.add('light');
    icon.src = '../images/blacktheme.svg';
    btn.setAttribute('aria-pressed', 'true');
  } else {
    document.body.classList.remove('light');
    icon.src = '../images/whitetheme.svg';
    btn.setAttribute('aria-pressed', 'false');
  }


  // helper to add a short-lived transition class so CSS variables animate
  function withThemeTransition(fn) {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    // next tick to ensure transition class is applied before theme change
    requestAnimationFrame(() => {
      fn();
      // remove the class after the transition duration (match CSS 280ms -> use 320ms)
      setTimeout(() => root.classList.remove('theme-transition'), 320);
    });
  }

btn.addEventListener('click', () => {
  withThemeTransition(() => {
    const isLight = document.body.classList.toggle('light');
    const icon = btn.querySelector('.icon');

    // Меняем иконку (поддержка <img> и inline SVG)
    if (icon) {
      if (icon.tagName === 'IMG') {
        icon.src = isLight ? '../images/blacktheme.svg' : '../images/whitetheme.svg';
      }
    }

    // Обновляем состояние кнопки и localStorage
    btn.setAttribute('aria-pressed', String(isLight));
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
});


//   btn.addEventListener('click', () => {
//   const lightMode = document.body.classList.toggle('light');
//   localStorage.setItem('theme', lightMode ? 'light' : 'dark');
//   icon.src = lightMode ? '../images/blacktheme.svg' : '../images/whitetheme.svg';
//   btn.setAttribute('aria-pressed', lightMode ? 'true' : 'false');
// });

}

initThemeToggle();