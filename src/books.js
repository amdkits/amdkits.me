// Renders /library/books/ from /api/goodreads (see functions/api/goodreads.js).
(() => {
  const root = document.querySelector('#bookshelf');
  if (!root) return;

  const API = window.GOODREADS_API || '/api/goodreads';
  const INITIAL = 20; // books shown per shelf before "show all"

  const statusEl = root.querySelector('#shelf-status');
  const summaryEl = root.querySelector('#shelf-summary');
  const shelvesEl = root.querySelector('#shelves');

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const safeUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  function cover(book) {
    const src = safeUrl(book.cover);
    // Goodreads serves a generic "no cover" image with this marker in the path.
    if (!src || src.includes('nophoto')) return el('span', 'book-cover is-empty', '?');
    const img = el('img', 'book-cover');
    img.src = src;
    img.alt = '';
    img.width = 44;
    img.height = 66;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.replaceWith(el('span', 'book-cover is-empty', '?')));
    return img;
  }

  function bookItem(book, key) {
    const li = el('li', 'book');
    li.append(cover(book));

    const info = el('div', 'book-info');
    const href = safeUrl(book.url);
    if (href) {
      const a = el('a', 'book-title', book.title);
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      info.append(a);
    } else {
      info.append(el('span', 'book-title', book.title));
    }
    if (book.author) info.append(el('span', 'book-author', book.author));

    const meta = el('span', 'book-meta');
    if (key === 'read') {
      if (book.rating) meta.append(el('span', 'stars', stars(book.rating)), ' ');
      const when = book.dateRead || book.dateAdded;
      if (when) meta.append(`finished ${when}`);
    } else if (book.dateAdded) {
      meta.append(`added ${book.dateAdded}`);
    }
    if (meta.childNodes.length) info.append(meta);

    li.append(info);
    return li;
  }

  const sortKey = (book, key) =>
    (key === 'read' ? book.dateRead || book.dateAdded : book.dateAdded) || '';

  function fillShelf(section, books, key) {
    const list = section.querySelector('.book-list');
    const count = section.querySelector('small');
    const sorted = [...books].sort((a, b) => sortKey(b, key).localeCompare(sortKey(a, key)));
    count.textContent = String(sorted.length);
    list.replaceChildren();

    if (!sorted.length) {
      section.querySelector('.shelf-empty')?.remove();
      section.append(el('p', 'shelf-empty', 'nothing here yet.'));
      return;
    }

    const render = (limit) => {
      list.replaceChildren(...sorted.slice(0, limit).map((b) => bookItem(b, key)));
    };
    render(INITIAL);

    if (sorted.length > INITIAL) {
      const more = el('button', 'shelf-more', `show all ${sorted.length}`);
      more.type = 'button';
      more.addEventListener('click', () => {
        render(sorted.length);
        more.remove();
      });
      section.append(more);
    }
  }

  async function load() {
    const res = await fetch(API, { headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { code: data.error });

    for (const key of ['reading', 'toRead', 'read']) {
      fillShelf(shelvesEl.querySelector(`[data-shelf="${key}"]`), data[key] || [], key);
    }

    const year = String(new Date().getFullYear());
    const thisYear = (data.read || []).filter((b) => (b.dateRead || '').startsWith(year)).length;
    summaryEl.replaceChildren(
      ...[
        [data.read?.length ?? 0, 'read'],
        [data.reading?.length ?? 0, 'reading'],
        [data.toRead?.length ?? 0, 'to read'],
        [thisYear, `finished in ${year}`]
      ].map(([n, label]) => {
        const span = el('span');
        span.append(el('b', '', String(n)), ` ${label}`);
        return span;
      })
    );

    summaryEl.hidden = false;
    shelvesEl.hidden = false;
    statusEl.textContent = data.errors?.length
      ? 'some shelves could not be loaded from goodreads; showing what I have.'
      : '';
    statusEl.hidden = !statusEl.textContent;
  }

  load().catch((err) => {
    statusEl.textContent =
      err.code === 'not_configured'
        ? 'bookshelf not connected yet.'
        : "couldn't reach goodreads right now. try again in a bit.";
  });
})();
