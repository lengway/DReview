document.addEventListener('DOMContentLoaded', () => {
  const faqCards = document.querySelectorAll('.faq-card');

  const accordion = false;

  faqCards.forEach((card, idx) => {
    const content = card.querySelector('.faq-card-content');
    const toggle = card.querySelector('.faq-toggle');

    if (!content || !toggle) return;

    if (!content.id) {
      content.id = `faq-${Date.now()}-${idx}`;
    }

    toggle.setAttribute('aria-controls', content.id);
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-toggle');
    if (!btn) return;

    const card = btn.closest('.faq-card');
    if (!card) return;

    const content = card.querySelector('.faq-card-content');
    if (!content) return;

    const expanded = btn.getAttribute('aria-expanded') === 'true';

    if (accordion && !expanded) {
      document.querySelectorAll('.faq-card-content.open').forEach((other) => {
        if (other === content) return;
        const otherBtn = other.closest('.faq-card')?.querySelector('.faq-toggle');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        other.setAttribute('aria-hidden', 'true');
        collapseHeight(other);
        other.classList.remove('open');
      });
    }

    if (!expanded) {
      openFaq(content, btn);
    } else {
      closeFaq(content, btn);
    }
  });

  function openFaq(contentEl, toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'true');
    contentEl.setAttribute('aria-hidden', 'false');

    const inner = contentEl.querySelector('.faq-card-content-inner') || contentEl;
    const fullHeight = inner.scrollHeight;

    contentEl.style.height = fullHeight + 'px';
    contentEl.classList.add('open');

    const onEnd = (ev) => {
      if (ev.propertyName !== 'height') return;
      contentEl.style.height = 'auto';
      contentEl.removeEventListener('transitionend', onEnd);
    };
    contentEl.addEventListener('transitionend', onEnd);
  }

  function closeFaq(contentEl, toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    contentEl.setAttribute('aria-hidden', 'true');

    const currentHeight = contentEl.scrollHeight;
    contentEl.style.height = currentHeight + 'px';

    contentEl.offsetHeight;

    contentEl.style.height = '0px';
    contentEl.classList.remove('open');

    const onEnd = (ev) => {
      if (ev.propertyName !== 'height') return;
      contentEl.style.height = '';
      contentEl.removeEventListener('transitionend', onEnd);
    };
    contentEl.addEventListener('transitionend', onEnd);
  }
});

(function () {
  function localToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.position = 'fixed';
    t.style.right = '20px';
    t.style.top = '20px';
    t.style.padding = '10px 14px';
    t.style.background = 'var(--card)';
    t.style.border = '1px solid rgba(0,0,0,0.06)';
    t.style.borderLeft = '4px solid var(--accent, #ff6600)';
    t.style.color = 'var(--text, #111)';
    t.style.borderRadius = '10px';
    t.style.boxShadow = '0 8px 22px rgba(0,0,0,0.08)';
    t.style.zIndex = 9999;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .28s ease, transform .28s ease';
      t.style.opacity = '0';
      t.style.transform = 'translateX(20px)';
      setTimeout(() => t.remove(), 400);
    }, 1400);
  }

  document.querySelectorAll('.faq-card-content').forEach((content) => {
    if (content.querySelector('.faq-copy')) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'faq-copy-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.textContent = 'Copied!';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'faq-copy';
    btn.setAttribute('aria-label', 'Copy answer to clipboard');
    btn.innerHTML = '<span class="text">Copy</span>';
    btn.title = 'Copy answer';

    content.style.position = content.style.position || 'relative';
    content.appendChild(tooltip);
    content.appendChild(btn);

    const inner = content.querySelector('.faq-card-content-inner') || content;

    let timeoutId = null;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      // grab text
      const text = inner.innerText.trim();
      if (!text) {
        localToast('Nothing to copy');
        return;
      }

      btn.disabled = true;

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }

        btn.classList.add('success');
        btn.querySelector('.text').textContent = 'Copied';

        tooltip.classList.add('show');
        tooltip.setAttribute('aria-hidden', 'false');

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          tooltip.classList.remove('show');
          tooltip.setAttribute('aria-hidden', 'true');
        }, 1200);

        setTimeout(() => {
          btn.classList.remove('success');
          if (btn.querySelector('.icon')) btn.querySelector('.icon').textContent = '📋';
          if (btn.querySelector('.text')) btn.querySelector('.text').textContent = 'Copy';
          btn.disabled = false;
        }, 1400);

      } catch (err) {
        console.error('Copy failed', err);
        localToast('Unable to copy');
        btn.disabled = false;
      }
    });
  });
})();

