const API = window.GUESTBOOK_API || '/api/guestbook';
const form = document.querySelector('#guestbook-form');
const entries = document.querySelector('#entries');
const status = document.querySelector('#form-status');
if (form) {
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        })[c]
    );
  function render(items) {
    entries.innerHTML = items.length
      ? items
          .map(
            (e) =>
              `<article class="entry"><header><span class="who">${e.website ? `<a href="${esc(e.website)}" target="_blank" rel="nofollow noopener">${esc(e.name)}</a>` : esc(e.name)}</span><time>${new Date(e.created_at).toLocaleDateString()}</time></header><p>${esc(e.message)}</p></article>`
          )
          .join('')
      : '<p class="muted" style="padding:.9rem">no entries yet. be the first.</p>';
  }
  async function load() {
    const r = await fetch(API);
    if (!r.ok) throw 0;
    render((await r.json()).entries || []);
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    status.textContent = 'writing...';
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const d = await r.json();
    if (!r.ok) {
      status.textContent = d.error || 'something went wrong.';
      return;
    }
    form.reset();
    status.textContent = d.message || 'entry submitted for approval.';
    load();
  };
  load().catch(
    () =>
      (entries.innerHTML =
        '<p class="muted" style="padding:.9rem">guestbook API not connected yet.</p>')
  );
}
