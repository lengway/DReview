(function () {
  'use strict';

  // tiny 1x1 transparent GIF
  const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  const IMG_SELECTOR = 'img';

  const SKIP_ATTR = 'data-no-lazy';
  const SKIP_CLASS = 'no-lazy';

  const PROCESSED_ATTR = 'data-lazy-processed';
  const LAZY_CLASS = 'lazy';
  const LOADED_CLASS = 'loaded';

  function prepareImg(img) {
    if (!img || img.getAttribute(PROCESSED_ATTR)) return;
    if (img.hasAttribute(SKIP_ATTR) || img.classList.contains(SKIP_CLASS)) return;

    const src = img.getAttribute('src') || '';
    if (!src || src.startsWith('data:')) {
      if (img.getAttribute('data-src')) {
        img.setAttribute(PROCESSED_ATTR, '1');
      }
      return;
    }

    if (!img.getAttribute('data-src')) img.setAttribute('data-src', src);
    if (img.getAttribute('srcset') && !img.getAttribute('data-srcset')) {
      img.setAttribute('data-srcset', img.getAttribute('srcset'));
    }

    img.setAttribute('src', PLACEHOLDER);
    img.removeAttribute('srcset');
    img.setAttribute('loading', 'lazy');
    img.classList.add(LAZY_CLASS);
    img.setAttribute(PROCESSED_ATTR, '1');
  }

  function loadImg(img) {
    const dataSrc = img.getAttribute('data-src');
    if (!dataSrc) return Promise.resolve(img);

    return new Promise((resolve, reject) => {
      const tmp = new Image();
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
        img.setAttribute('src', dataSrc);
        if (dataSrcset) img.setAttribute('srcset', dataSrcset);
        img.classList.add(LOADED_CLASS);
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
        resolve(img);
      };
      tmp.src = dataSrc;
    });
  }

  function prepareAll() {
    const imgs = document.querySelectorAll(IMG_SELECTOR);
    imgs.forEach(img => prepareImg(img));
  }

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
    handler();
  }

  function initAutoLazy() {
    prepareAll();
    const ok = initObserver();
    if (!ok) initScrollHandler();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoLazy);
  } else {
    initAutoLazy();
  }

  window.__autoLazyInit = initAutoLazy;

})();
