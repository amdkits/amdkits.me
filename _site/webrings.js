(() => {
  const data = window.amdRings;
  if (!data?.webrings?.length) return;

  const rings = data.webrings;
  let i = 0;

  const label = document.querySelector('#ring-label');
  const badge = document.querySelector('#ring-badge');
  const home = document.querySelector('#ring-home');
  const prev = document.querySelector('#ring-prev-link');
  const next = document.querySelector('#ring-next-link');
  const help = document.querySelector('#ring-help');
  const prevButton = document.querySelector('#ring-prev');
  const nextButton = document.querySelector('#ring-next');

  function draw() {
    const ring = rings[i];

    label.textContent = ring.name;
    home.href = ring.home;
    prev.href = ring.prev;
    next.href = ring.next;

    if (ring.type === 'foxwells') {
      badge.src = 'https://foxwells.garden/img/foxwellsbadge.gif';
      badge.alt = 'Foxwells Garden';
      help.textContent = 'foxwells garden · prev / next';
    } else if (ring.type === 'kanring') {
      badge.src = 'https://ring.kan.sh/assets/kanring.svg';
      badge.alt = 'kanring';
      help.textContent = 'kanring · prev / next';
    } else {
      badge.removeAttribute('src');
      badge.alt = ring.name;
      help.textContent = `${ring.name} · prev / next`;
    }
  }

  prevButton.addEventListener('click', () => {
    i = (i - 1 + rings.length) % rings.length;
    draw();
  });

  nextButton.addEventListener('click', () => {
    i = (i + 1) % rings.length;
    draw();
  });

  draw();
})();
