function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return setTimeout(initThemeToggle, 1);

  const btn = document.getElementById('theme-toggle');
  const icon = btn.querySelector('.icon');

  // checking local stored theme
  const stored = localStorage.getItem('theme');
  const isLight = stored === 'light';

  // changing on local stored theme
  if (isLight) {
    document.body.classList.add('light');
    icon.textContent = '☀️';
    btn.setAttribute('aria-pressed', 'true');
  } else {
    document.body.classList.remove('light');
    icon.textContent = '🌙';
    btn.setAttribute('aria-pressed', 'false');
  }


  function withThemeTransition(fn) {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    requestAnimationFrame(() => {
      fn();
      setTimeout(() => root.classList.remove('theme-transition'), 320);
    });
  }

btn.addEventListener('click', () => {
  withThemeTransition(() => {
    const isLight = document.body.classList.toggle('light');
    const icon = btn.querySelector('.icon');

    if (icon) {
      icon.textContent = isLight ? '☀️' : '🌙';
    }

    btn.setAttribute('aria-pressed', String(isLight));
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
});
}

initThemeToggle();