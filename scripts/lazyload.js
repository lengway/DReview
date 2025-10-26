// ../scripts/auto-lazy.js
// Автоматическая подготовка <img> и ленивый загрузчик.
// Поместить в <script src="../scripts/auto-lazy.js" defer></script>

(function () {
  'use strict';

  // tiny 1x1 transparent GIF
  const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // селектор картинок, которые будем обрабатывать (можно расширить)
  const IMG_SELECTOR = 'img';

  // не трогать элементы с этим атрибутом/классом
  const SKIP_ATTR = 'data-no-lazy';
  const SKIP_CLASS = 'no-lazy';

  // класс, который помечает, что скрипт уже обработал элемент
  const PROCESSED_ATTR = 'data-lazy-processed';
  const LAZY_CLASS = 'lazy';
  const LOADED_CLASS = 'loaded';

  // helper: установить data-src из src (и аналогично для srcset)
  function prepareImg(img) {
    if (!img || img.getAttribute(PROCESSED_ATTR)) return;
    if (img.hasAttribute(SKIP_ATTR) || img.classList.contains(SKIP_CLASS)) return;

    const src = img.getAttribute('src') || '';
    // пропускаем если уже data-uri или пустой src
    if (!src || src.startsWith('data:')) {
      // Но если img уже имеет data-src, можно пометить processed
      if (img.getAttribute('data-src')) {
        img.setAttribute(PROCESSED_ATTR, '1');
      }
      return;
    }

    // сохраняем оригинал в data-src / data-srcset
    if (!img.getAttribute('data-src')) img.setAttribute('data-src', src);
    if (img.getAttribute('srcset') && !img.getAttribute('data-srcset')) {
      img.setAttribute('data-srcset', img.getAttribute('srcset'));
    }

    // поставить плейсхолдер и атрибуты ленивой загрузки
    img.setAttribute('src', PLACEHOLDER);
    img.removeAttribute('srcset'); // чтобы браузер не пытался загружать srcset вместо src
    img.setAttribute('loading', 'lazy');
    img.classList.add(LAZY_CLASS);
    img.setAttribute(PROCESSED_ATTR, '1');

    // optional: низкий приоритет для accessibility, сохраняем alt untouched
  }

  // загрузка одного img из data-src -> src (с поддержкой srcset)
  function loadImg(img) {
    const dataSrc = img.getAttribute('data-src');
    if (!dataSrc) return Promise.resolve(img);

    return new Promise((resolve, reject) => {
      const tmp = new Image();
      // if srcset present - set srcset on tmp too so browser picks correct density
      const dataSrcset = img.getAttribute('data-srcset') || null;
      if (dataSrcset) tmp.srcset = dataSrcset;
      tmp.onload = function () {
        if (dataSrcset) img.setAttribute('srcset', dataSrcset);
        img.setAttribute('src', dataSrc);
        img.classList.add(LOADED_CLASS);
        // clean optional attributes
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        resolve(img);
      };
      tmp.onerror = function (err) {
        // попытка всё же подставить src — пусть браузер покажет ошибку
        img.setAttribute('src', dataSrc);
        if (dataSrcset) img.setAttribute('srcset', dataSrcset);
        img.classList.add(LOADED_CLASS);
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        // Reject is optional; resolve to continue gracefully
        resolve(img);
      };
      tmp.src = dataSrc;
    });
  }

  // Инициализация: подготовить все img на странице
  function prepareAll() {
    const imgs = document.querySelectorAll(IMG_SELECTOR);
    imgs.forEach(img => prepareImg(img));
  }

  // IntersectionObserver lazy loader
  function initObserver() {
    if (!('IntersectionObserver' in window)) return false;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          const img = entry.target;
          obs.unobserve(img);
          loadImg(img).catch(() => {});
        }
      });
    }, {
      root: null,
      rootMargin: '300px 0px 300px 0px', // подгружаем заранее
      threshold: 0.01
    });

    document.querySelectorAll('img.' + LAZY_CLASS).forEach(img => observer.observe(img));
    return true;
  }

  // Fallback: scroll/resize handler
  function initScrollHandler() {
    let ticking = false;
    function check() {
      document.querySelectorAll('img.' + LAZY_CLASS).forEach(img => {
        const rect = img.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const vw = window.innerWidth || document.documentElement.clientWidth;
        if (rect.top <= vh + 300 && rect.bottom >= -300 && rect.left <= vw + 300 && rect.right >= -300) {
          loadImg(img).catch(()=>{});
        }
      });
    }
    function handler() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { check(); ticking = false; });
    }
    ['scroll','resize','orientationchange','load'].forEach(ev =>
      window.addEventListener(ev, handler, { passive: true })
    );
    handler(); // initial
  }

  // Public initializer
  function initAutoLazy() {
    prepareAll();
    const ok = initObserver();
    if (!ok) initScrollHandler();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoLazy);
  } else {
    initAutoLazy();
  }

  // expose for debugging
  window.__autoLazyInit = initAutoLazy;

})();
