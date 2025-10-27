$(document).ready(function () {

  const PLACEHOLDER_THUMB = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1 transparent
  const MAX_SUGGESTIONS = 8;

  const $search = $('#search-bar');
  if ($search.length === 0) return;

  if (!$search.parent().hasClass('search-wrap')) {
    $search.wrap($('<div class="search-wrap" style="position:relative;display:block;max-width:760px;margin:0 auto;"></div>'));
  }
  let $suggest = $search.siblings('.search-suggestions');
  if ($suggest.length === 0) {
    $suggest = $(`
      <div class="search-suggestions" role="listbox" aria-label="Search suggestions" aria-hidden="true">
        <ul></ul>
      </div>
    `);
    $search.after($suggest);
  }
  const $slist = $suggest.find('ul');

  const $cards = $('.card');
  const items = []; // { title, text, thumb, href, $card }

  $cards.each(function () {
    const $card = $(this);
    const $a = $card.find('a').first();
    const href = $a.attr('href') || '#';
    const title = $card.find('.card-title').text().trim();
    const text = $card.find('.card-text').text().trim();
    const $img = $card.find('img.card-img').first();
    const thumb = ($img.attr('data-src') || $img.attr('src') || '').trim();
    items.push({ title, text, thumb, href, $card });
  });

  const titles = [...new Set(items.map(i => i.title))];

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function highlightTerm(text, term) {
    if (!term) return text;
    const re = new RegExp('(' + esc(term) + ')', 'ig');
    return text.replace(re, '<mark class="search-highlight">$1</mark>');
  }

  function filterCards(query) {
    const q = (query || '').trim().toLowerCase();

    if (!q) {
      $cards.show();
      items.forEach(it => {
        it.$card.find('.card-title').html(it.title);
        it.$card.find('.card-text').html(it.text);
      });
      $('.no-results').remove();
      return;
    }

    let visibleCount = 0;
    items.forEach(item => {
      const match = item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q);
      item.$card.toggle(match);
      if (match) visibleCount++;
      item.$card.find('.card-title').html(highlightTerm(item.title, q));
      item.$card.find('.card-text').html(highlightTerm(item.text, q));
    });

    $('.no-results').remove();
    if (visibleCount === 0) {
      const $no = $('<div class="no-results">No results found</div>');
      $('.grid-2').after($no);
    }
  }

  function renderSuggestions(rawQuery) {
    $slist.empty();
    $suggest.removeClass('open').attr('aria-hidden', 'true');

    if (!rawQuery || rawQuery.trim().length === 0) return;
    const q = rawQuery.trim().toLowerCase();

    const matches = items
      .map(it => {
        const score = (it.title.toLowerCase().includes(q) ? 20 : 0) + (it.text.toLowerCase().includes(q) ? 6 : 0);
        return { ...it, score };
      })
      .filter(it => it.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS);

    if (matches.length === 0) {
      $slist.append('<li class="empty">No matches</li>');
      $suggest.addClass('open').attr('aria-hidden', 'false');
      return;
    }

    matches.forEach((m) => {
      const titleHtml = highlightTerm(m.title, q);

      let snippet = m.text || '';
      const lower = snippet.toLowerCase();
      const pos = lower.indexOf(q);
      if (pos >= 0) {
        const start = Math.max(0, pos - 20);
        snippet = snippet.substring(start, Math.min(snippet.length, pos + q.length + 30));
        if (start > 0) snippet = '…' + snippet;
        if (pos + q.length + 30 < m.text.length) snippet = snippet + '…';
      } else {
        snippet = snippet.length > 70 ? snippet.substring(0, 70) + '…' : snippet;
      }
      const snippetHtml = highlightTerm(snippet, q);

      const thumbSrc = m.thumb && m.thumb.length ? m.thumb : PLACEHOLDER_THUMB;
      const $li = $(`
        <li role="option" tabindex="-1" class="suggestion-item" data-href="${m.href}" data-title="${m.title}">
          <img class="thumb" src="${thumbSrc}" alt="${m.title} thumbnail" loading="lazy" />
          <div class="meta">
            <div class="t">${titleHtml}</div>
            <div class="s">${snippetHtml}</div>
          </div>
          <div class="go" aria-hidden="true">↗</div>
        </li>
      `);

      $li.on('click', function (e) {
        e.preventDefault();
        const title = $(this).data('title') || '';
        $search.val(title);
        $suggest.removeClass('open').attr('aria-hidden', 'true');
        filterCards(title);
        $search.focus();
      });

      $slist.append($li);
    });

    $suggest.addClass('open').attr('aria-hidden', 'false');
  }

  let activeIndex = -1;
  function resetActive() { activeIndex = -1; $slist.find('li').removeClass('active'); }

  $search.on('keydown', function (e) {
    const $items = $slist.find('li').not('.empty');
    if ($items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, $items.length - 1);
      $items.removeClass('active').eq(activeIndex).addClass('active').focus();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      $items.removeClass('active').eq(activeIndex).addClass('active').focus();
      return;
    }
    if (e.key === 'Enter') {
      const $active = $slist.find('li.active').first();
      if ($active.length) {
        e.preventDefault();
        $active.trigger('click');
      } else {
        const val = $search.val();
        if (typeof filterCards === 'function') filterCards(val);
      }
      $suggest.removeClass('open').attr('aria-hidden', 'true');
      resetActive();
      return;
    }
    if (e.key === 'Escape') {
      $suggest.removeClass('open').attr('aria-hidden', 'true');
      resetActive();
      return;
    }
  });

  let inputTimer = null;
  $search.on('input', function () {
    const q = $(this).val();
    clearTimeout(inputTimer);
    activeIndex = -1;
    inputTimer = setTimeout(() => {
      renderSuggestions(q);
      filterCards(q);
    }, 120);
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('.search-wrap').length) {
      $suggest.removeClass('open').attr('aria-hidden', 'true');
      resetActive();
    }
  });

  $(window).on('resize', function () {
    $suggest.removeClass('open').attr('aria-hidden', 'true');
    resetActive();
  });

  filterCards('');

});
