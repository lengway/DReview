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

    if (content.classList.contains('open')) {
      toggle.setAttribute('aria-expanded', 'true');
      content.setAttribute('aria-hidden', 'false');
      content.style.height = 'auto';
    } else {
      toggle.setAttribute('aria-expanded', 'false');
      content.setAttribute('aria-hidden', 'true');
      content.style.height = '0px';
    }
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

  function collapseHeight(el) {
    const cur = el.scrollHeight;
    el.style.height = cur + 'px';
    el.offsetHeight;
    el.style.height = '0px';
  }
});
