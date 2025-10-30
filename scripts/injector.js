(function(){
  // Определяем уровень вложенности папки относительно root
  const depth = window.location.pathname.split('/').length - 2;
  const basePath = depth > 1 ? '../'.repeat(depth - 1) : '';
  
  const fragments = {
    '.header': `${basePath}fragments/header.html`,
    '.sidebar': `${basePath}fragments/sidebar.html`,
    '.footer': `${basePath}fragments/footer.html`,
  };

  for (const [selector, src] of Object.entries(fragments)) {
    document.querySelectorAll(selector).forEach(el => {
      fetch(src)
        .then(r => r.text())
        .then(html => {
          el.innerHTML = html;
          el.querySelectorAll('script:not([src])').forEach(s => {
            const ns = document.createElement('script');
            ns.textContent = s.textContent;
            s.replaceWith(ns);
          });
        })
        .catch(err => console.error(`Ошибка загрузки ${src}:`, err));
    });
  }
})();
