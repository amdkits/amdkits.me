(() => {
  const p = document.querySelector('#music-player');
  if (!p) return;
  const a = p.querySelector('#bg-audio'),
    t = p.querySelector('#music-title'),
    toggle = p.querySelector('#music-toggle');
  const list = JSON.parse(p.dataset.playlist || '[]');
  let i = 0;
  if (!list.length) return;
  function load(n, play) {
    i = (n + list.length) % list.length;
    a.src = list[i].src;
    t.textContent = list[i].title;
    if (play) a.play().catch(() => {});
  }
  load(0, false);
  toggle.onclick = () => (a.paused ? a.play() : a.pause());
  a.onplay = () => (toggle.textContent = '❚❚');
  a.onpause = () => (toggle.textContent = '▶');
  p.querySelector('#music-prev').onclick = () => load(i - 1, true);
  p.querySelector('#music-next').onclick = () => load(i + 1, true);
  p.querySelector('#music-mute').onclick = () => (a.muted = !a.muted);
  a.onended = () => load(i + 1, true);
})();
