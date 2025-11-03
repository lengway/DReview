(function () {
    const logoutBtn = document.querySelector("#logout-btn");
    (function () {
        function updateAuthUI() {
            const isLoggedIn = !!localStorage.getItem("token");

            const signInBtn = document.querySelector("#sign-in-btn");
            const logoutBtn = document.querySelector("#logout-btn");
            const profileSection = document.querySelector("#profile-section");

            if (!signInBtn || !logoutBtn || !profileSection) return false;

            if (isLoggedIn) {
                signInBtn.classList.add("hidden");
                logoutBtn.classList.remove("hidden");
                profileSection.classList.remove("hidden");
            } else {
                signInBtn.classList.remove("hidden");
                logoutBtn.classList.add("hidden");
                profileSection.classList.add("hidden");
            }
            return true;
        }

        // ждём пока появится sidebar (или нужные элементы)
        function waitForElements() {
            const ok = updateAuthUI();
            if (!ok) setTimeout(waitForElements, 100);
        }

        document.addEventListener("DOMContentLoaded", waitForElements);
    })();

    logoutBtn?.addEventListener('click', async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('token')
        location.reload();
    })

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
        window.__themeToggleInitialized = true;

        // helper: ищем элементы на странице (могут появиться асинхронно)
        const getBtn = () => document.getElementById('theme-toggle');
        const getSidebarBtn = () => document.getElementById('sidebar-theme-toggle');

        // apply initial state from storage
        const stored = localStorage.getItem('theme');
        const isLightStored = stored === 'light';
        if (isLightStored) document.body.classList.add('light');
        else document.body.classList.remove('light');

        function updateButtons(isLight) {
            const btn = getBtn();
            const sidebarBtn = getSidebarBtn();
            const icon = btn && btn.querySelector('.icon');
            const sidebarIcon = sidebarBtn && sidebarBtn.querySelector('.icon');

            if (icon) icon.textContent = isLight ? '☀️' : '🌙';
            if (sidebarIcon) sidebarIcon.textContent = isLight ? '☀️' : '🌙';

            if (btn) btn.setAttribute('aria-pressed', String(isLight));
            if (sidebarBtn) sidebarBtn.setAttribute('aria-pressed', String(isLight));
        }

        // init UI immediately
        updateButtons(isLightStored);

        function withThemeTransition(fn) {
            const root = document.documentElement;
            root.classList.add('theme-transition');
            requestAnimationFrame(() => {
                fn();
                setTimeout(() => root.classList.remove('theme-transition'), 320);
            });
        }

        function toggleTheme() {
            withThemeTransition(() => {
                const isLight = document.body.classList.toggle('light');
                // sync icons and aria on both buttons
                updateButtons(isLight);
                localStorage.setItem('theme', isLight ? 'light' : 'dark');
            });
        }

        // attach listeners when buttons exist; если их нет — наблюдаем за DOM изменениям
        function attachIfReady() {
            const btn = getBtn();
            const sidebarBtn = getSidebarBtn();

            if (btn) {
                // удалить старые слушатели (на случай повторной инициализации)
                btn.replaceWith(btn.cloneNode(true));
            }
            if (sidebarBtn) {
                sidebarBtn.replaceWith(sidebarBtn.cloneNode(true));
            }

            const freshBtn = getBtn();
            const freshSidebarBtn = getSidebarBtn();

            if (freshBtn) freshBtn.addEventListener('click', toggleTheme);
            if (freshSidebarBtn) freshSidebarBtn.addEventListener('click', toggleTheme);

            // если хотя бы одна кнопка присоединилась — всё ок, иначе ждем появления
            if (!freshBtn && !freshSidebarBtn) return false;
            return true;
        }

        if (!attachIfReady()) {
            // наблюдатель DOM, чтобы поймать появление фрагментов (fragments)
            const observer = new MutationObserver(() => {
                if (attachIfReady()) observer.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // safety timeout: перестать наблюдать через 5s
            setTimeout(() => observer.disconnect(), 5000);
        }
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

        // Убираем прежний прямой вызов initThemeToggle() здесь
        initKeyboardNavigation();

        Promise.all([stylesPromise, injectorPromise]).then(() => {
            // ГАРАНТИРОВАННО: фрагменты загружены — можно инициализировать переключатель
            initThemeToggle();
            setTimeout(removeLoader, 120);
        }).catch(() => {
            initThemeToggle(); // на всякий случай
            setTimeout(removeLoader, 400);
        });
    });

})();
