import { playSound } from "./sound.js";

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
        if (!form) return;
        emailError.textContent = '';

        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email';
            emailInput.classList.add('invalid');
            emailInput.focus();
            return;
        }

        // --- Spinner + disable UI ---
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) {
            // fallback: если нет кнопки — просто выполнить логику
            showLocalToast('🎉 Subscribed! Check your email — confirmation sent.', 'success');
            playSound();
            setTimeout(() => closePopup(), 900);
            return;
        }

        // если уже отправляют — ничего не делаем
        if (submitBtn.disabled) return;

        // Сохраним оригинальный HTML/text чтобы вернуть позже
        const origHTML = submitBtn.innerHTML;
        const origDisabledState = submitBtn.disabled;

        // Блокируем поля и кнопку
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        form.querySelectorAll('input,button,select,textarea').forEach(i => i.disabled = true);

        // Показ спиннера и текста
        submitBtn.innerHTML = '<span class="btn-spinner"><span class="spinner" aria-hidden="true"></span><span class="spinner-text">Please wait…</span></span>';

        // Симуляция запроса — через ~1700ms показываем тост и звук, затем закрываем попап
        const SIM_DELAY = 1700;
        setTimeout(() => {
            // Тост и звук
            showLocalToast('🎉 Subscribed! Check your email — confirmation sent.', 'success');
            try { playSound(); } catch (err) { /* если sound.js не загрузился, молча продолжаем */ }

            // Закрыть попап чуть позже, чтобы тост успел показаться
            setTimeout(() => {
                // Восстанавливаем состояние (на случай, если попап не закроется)
                if (submitBtn) {
                    submitBtn.innerHTML = origHTML;
                    submitBtn.disabled = origDisabledState;
                    submitBtn.removeAttribute('aria-busy');
                }
                form.querySelectorAll('input,button,select,textarea').forEach(i => i.disabled = false);

                closePopup();
            }, 900);
        }, SIM_DELAY);
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
