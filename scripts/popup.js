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

        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) {
            showLocalToast('🎉 Subscribed! Check your email — confirmation sent.', 'success');
            playSound();
            setTimeout(() => closePopup(), 900);
            return;
        }

        if (submitBtn.disabled) return;

        const origHTML = submitBtn.innerHTML;
        const origDisabledState = submitBtn.disabled;

        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        form.querySelectorAll('input,button,select,textarea').forEach(i => i.disabled = true);

        submitBtn.innerHTML = '<span class="btn-spinner"><span class="spinner" aria-hidden="true"></span><span class="spinner-text">Please wait…</span></span>';

        const SIM_DELAY = 1700;
        setTimeout(() => {
            showLocalToast('🎉 Subscribed! Check your email — confirmation sent.', 'success');
            try { playSound(); } catch (err) { /* если sound.js не загрузился, молча продолжаем */ }

            setTimeout(() => {
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
});

export function showLocalToast(msg, type = 'info') {
        $('.local-toast').remove();

        const $t = $('<div></div>')
            .addClass('local-toast')
            .text(msg)
            .css({
                position: 'fixed',
                right: '20px',
                top: '20px',
                padding: '10px 14px',
                background: 'var(--card)',
                border: '1px solid var(--overlay-3)',
                'border-left': '4px solid var(--accent)',
                color: 'var(--text)',
                'border-radius': '10px',
                'box-shadow': 'var(--shadow)',
                'z-index': 9999,
                opacity: 0,
                transform: 'translateX(20px)'
            })
            .appendTo('body');

        $t.animate({ opacity: 1, transform: 'translateX(0)' }, {
            duration: 200,
            step: function (now, fx) {
                if (fx.prop === 'transform') $(this).css('transform', `translateX(${20 - now * 20}px)`);
            }
        });

        setTimeout(() => {
            $t.animate({ opacity: 0, transform: 'translateX(20px)' }, {
                duration: 300,
                step: function (now, fx) {
                    if (fx.prop === 'transform') $(this).css('transform', `translateX(${now * 20}px)`);
                },
                complete: () => $t.remove()
            });
        }, 2000);
    }
