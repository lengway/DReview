(function(){
  const fragments = {
    '.header': 'fragments/header.html',
    '.sidebar': 'fragments/sidebar.html',
    '.footer': 'fragments/footer.html',
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
