(function () {
  try {
    const PRE_STYLE_ID = 'initial-hide-style';
    if (!document.getElementById(PRE_STYLE_ID)) {
      const s = document.createElement('style');
      s.id = PRE_STYLE_ID;
      s.textContent = `
        /* hide all page content except loader while app-loading is present */
        html.app-loading body > *:not(#site-loader) { visibility: hidden !important; }
        /* basic loader styling */
        #site-loader { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--bg, #0b1020); z-index: 99999; transition: opacity .28s ease; }
        #site-loader.hidden { opacity: 0; pointer-events: none; }
        .site-loader-spinner { width: 48px; height: 48px; border-radius: 50%; border: 4px solid var(--site-loader-spinner-border); border-top-color: var(--site-loader-spinner-border-to); animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `;
      document.head && document.head.appendChild(s);
    }
    document.documentElement.classList.add('app-loading');
  } catch (e) {
    // ignore
  }
  // --- Scroll progress ---
  if (window.jQuery) {
    $(document).ready(function () {
      $(window).on("scroll", function () {
        const scrollTop = $(window).scrollTop();
        const docHeight = $(document).height();
        const winHeight = $(window).height();
        const scrollPercent = (scrollTop / (docHeight - winHeight || 1)) * 100;

        $("#scroll-progress").css("width", scrollPercent + "%");
      });
    });
  } else {
    window.addEventListener('scroll', function () {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const winHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollPercent = (scrollTop / (docHeight - winHeight || 1)) * 100;
      const el = document.getElementById('scroll-progress');
      if (el) el.style.width = scrollPercent + '%';
    }, { passive: true });
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function ensureLoader() {
    if (document.getElementById('site-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'site-loader';
    loader.setAttribute('aria-hidden', 'true');
    loader.innerHTML = '<div class="site-loader-spinner" aria-hidden="true"></div>';
    if (document.body.firstChild) document.body.insertBefore(loader, document.body.firstChild);
    else document.body.appendChild(loader);
  }

  function removeLoader() {
    const loader = document.getElementById('site-loader');
    if (!loader) {
      document.documentElement.classList.remove('app-loading');
      return;
    }
    loader.classList.add('hidden');
    setTimeout(() => {
      loader.remove();
      document.documentElement.classList.remove('app-loading');
      const s = document.getElementById('initial-hide-style');
      if (s) s.remove();
    }, 320);
  }

  // --- Theme handling ---
  function applyStoredThemeImmediate() {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light') document.body.classList.add('light');
      else document.body.classList.remove('light');
    } catch (e) { /* ignore */ }
  }

  // --- Theme switcher ---
  function initThemeToggle() {
    if (window.__themeToggleInitialized) return;

    const btn = document.getElementById('theme-toggle');
    if (!btn) {
      console.warn('Theme toggle button not found in DOM');
      return setTimeout(initThemeToggle, 100);
    }
    window.__themeToggleInitialized = true;
    const icon = btn.querySelector('.icon');

    // checking local stored theme
    const stored = localStorage.getItem('theme');
    const isLightStored = stored === 'light';

    if (isLightStored) {
      document.body.classList.add('light');
      if (icon) icon.textContent = '☀️';
      btn.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.remove('light');
      if (icon) icon.textContent = '🌙';
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
        const ic = btn.querySelector('.icon');
        if (ic) ic.textContent = isLight ? '☀️' : '🌙';
        btn.setAttribute('aria-pressed', String(isLight));
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
      });
    });
  }

  // --- Keyboard navigation ---
  function initKeyboardNavigation() {
    if (window.__keyboardNavigationInitialized) return;
    window.__keyboardNavigationInitialized = true;

    document.addEventListener('keydown', function (event) {
      const currentElement = document.activeElement;
      let nextElement;

      if (event.key === 'ArrowRight') {
        nextElement = currentElement && currentElement.nextElementSibling;
        if (nextElement) {
          nextElement.focus();
          event.preventDefault();
        }
      } else if (event.key === 'ArrowLeft') {
        nextElement = currentElement && currentElement.previousElementSibling;
        if (nextElement) {
          nextElement.focus();
          event.preventDefault();
        }
      }
    });
  }

  // --- Injector ---
  function initInjector() {
    if (window.__injectorInitialized) return Promise.resolve([]);
    window.__injectorInitialized = true;

    const depth = window.location.pathname.split('/').length - 2;
    const basePath = depth > 1 ? '../'.repeat(depth - 1) : '';

    const fragments = {
      '.header': `${basePath}fragments/header.html`,
      '.sidebar': `${basePath}fragments/sidebar.html`,
      '.footer': `${basePath}fragments/footer.html`,
    };

    const jobs = [];
    for (const [selector, src] of Object.entries(fragments)) {
      document.querySelectorAll(selector).forEach(el => {
        const job = fetch(src)
          .then(r => {
            if (!r.ok) throw new Error('Network');
            return r.text();
          })
          .then(html => {
            el.innerHTML = html;
            el.querySelectorAll('script:not([src])').forEach(s => {
              const ns = document.createElement('script');
              ns.textContent = s.textContent;
              s.replaceWith(ns);
            });
            return src;
          })
          .catch(err => {
            console.error(`Ошибка загрузки ${src}:`, err);
            return src;
          });
        jobs.push(job);
      });
    }

    return Promise.all(jobs);
  }

  // initialize
  onReady(() => {
    ensureLoader();

    applyStoredThemeImmediate();

    const stylesPromise = (window.loadStyles ? window.loadStyles(window.STYLES) : Promise.resolve([]));

    const injectorPromise = initInjector();

    initThemeToggle();
    initKeyboardNavigation();

    Promise.all([stylesPromise, injectorPromise]).then(() => {
      setTimeout(removeLoader, 120);
    }).catch(() => {
      setTimeout(removeLoader, 400);
    });
  });

})();
