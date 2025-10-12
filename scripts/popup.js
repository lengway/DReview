document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('open-subscribe');
    const overlay = document.getElementById('popup-overlay');
    const popup = overlay?.querySelector('.popup');
    const closeBtn = overlay?.querySelector('.popup-close');
    const cancelBtn = overlay?.querySelector('.popup-cancel');
    const form = document.getElementById('popup-form');
    const emailInput = document.getElementById('popup-email');
    const emailError = document.getElementById('popup-email-error');

    if (!openBtn || !overlay || !popup) return;

    function getFocusable(el) {
        return [...el.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])')]
            .filter(node => !node.disabled && node.getAttribute('aria-hidden') !== 'true');
    }

    let lastActive = null;

    function openPopup() {
        lastActive = document.activeElement;
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const first = popup.querySelector('input,button,select,textarea');
        (first || popup).focus();


        const focusables = getFocusable(popup);
        function trap(e) {
            const idx = focusables.indexOf(document.activeElement);
            if (e.key === 'Tab') {
                if (e.shiftKey && idx === 0) {
                    e.preventDefault();
                    focusables[focusables.length - 1].focus();
                } else if (!e.shiftKey && idx === focusables.length - 1) {
                    e.preventDefault();
                    focusables[0].focus();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closePopup();
            }
        }
        popup.__trap = trap;
        document.addEventListener('keydown', trap);
    }

    function closePopup() {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (popup.__trap) document.removeEventListener('keydown', popup.__trap);
        if (lastActive && typeof lastActive.focus === 'function') lastActive.focus();
        emailError.textContent = '';
        form.reset();
    }

    openBtn.addEventListener('click', openPopup);
    closeBtn?.addEventListener('click', closePopup);
    cancelBtn?.addEventListener('click', closePopup);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        emailError.textContent = '';

        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email';
            emailInput.classList.add('invalid');
            emailInput.focus();
            return;
        }

        showLocalToast('🎉 Subscribed! Check your email — confirmation sent.', 'success');

        setTimeout(() => closePopup(), 900);
    });

    // тост в углу с уведомлением о подписке на рассылку
    function showLocalToast(msg, type = 'info') {
        if (typeof showToast === 'function') { showToast(msg, type); return; }

        const t = document.createElement('div');
        t.textContent = msg;
        t.style.position = 'fixed';
        t.style.right = '20px';
        t.style.top = '20px';
        t.style.padding = '10px 14px';
        t.style.background = 'var(--card)';
        t.style.border = '1px solid var(--overlay-3)';
        t.style.borderLeft = '4px solid var(--accent)';
        t.style.color = 'var(--text)';
        t.style.borderRadius = '10px';
        t.style.boxShadow = 'var(--shadow)';
        t.style.zIndex = 9999;
        document.body.appendChild(t);
        setTimeout(() => {
            t.style.transition = 'opacity .3s ease, transform .3s ease';
            t.style.opacity = '0';
            t.style.transform = 'translateX(20px)';
            setTimeout(() => t.remove(), 400);
        }, 2000);
    }
});
