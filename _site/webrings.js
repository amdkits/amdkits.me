(() => {
  const r = window.amdRings;
  if (!r) return;
  let i = 0;
  const label = document.querySelector('#ring-label'),
    badge = document.querySelector('#ring-badge'),
    home = document.querySelector('#ring-home'),
    prev = document.querySelector('#ring-prev-link'),
    next = document.querySelector('#ring-next-link'),
    help = document.querySelector('#ring-help');
  function draw() {
    const x = r[i];
    label.textContent = x.name;
    badge.src = x.badge;
    badge.alt = x.alt;
    home.href = x.home;
    prev.href = x.prev;
    next.href = x.next;
    help.textContent = x.help;
  }
  document.querySelector('#ring-prev').onclick = () => {
    i = (i - 1 + r.length) % r.length;
    draw();
  };
  document.querySelector('#ring-next').onclick = () => {
    i = (i + 1) % r.length;
    draw();
  };
  draw();
})();
