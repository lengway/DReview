(function () {
    const DEFAULT_STYLES = [
        '/css/style.css',
        '/css/fragments.css',
        '/css/search.css',
        '/css/review-page.css'
    ];

    function isStylesheetPresent(href) {
        // check by exact href or by filename suffix
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.some(l => {
            const h = l.getAttribute('href') || '';
            try {
                // compare endsWith for absolute vs relative
                return h === href || h.endsWith(href.replace(/^\//, ''));
            } catch (e) {
                return h === href;
            }
        });
    }

    function attachStyle(href) {
        if (!href) return null;
        // avoid duplicate insertion
        if (isStylesheetPresent(href)) return Promise.resolve(href);
        return new Promise((resolve) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.crossOrigin = 'anonymous';
            link.onload = () => resolve(href);
            link.onerror = () => resolve(href); // resolve on error to not hang
            document.head.appendChild(link);
        });
    }

    function loadStyles(styles) {
        if (!styles || !Array.isArray(styles)) return Promise.resolve([]);
        const promises = styles.map(s => attachStyle(s));
        // attachStyle may return null for falsy entries
        return Promise.all(promises).then(arr => arr.filter(Boolean));
    }

    // expose helper that returns a promise
    window.loadStyles = loadStyles;

    // pick styles from window.STYLES if provided, otherwise use defaults
    const list = (window.STYLES && Array.isArray(window.STYLES) && window.STYLES.length) ? window.STYLES : DEFAULT_STYLES;

    // run on DOM ready to ensure head exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => loadStyles(list));
    } else {
        // run immediately
        loadStyles(list);
    }
})();
