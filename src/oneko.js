(function oneko() {
  const isReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  if (isReducedMotion) return;

  const storageKey = 'amdkits-oneko-position';
  let nekoPosX = 32;
  let nekoPosY = 32;

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      nekoPosX = saved.x;
      nekoPosY = saved.y;
    }
  } catch (_) {
    // Ignore unavailable/corrupt localStorage.
  }
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  const nekoSpeed = 10;

  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [
      [-5, 0],
      [-6, 0],
      [-7, 0]
    ],
    scratchWallN: [
      [0, 0],
      [0, -1]
    ],
    scratchWallS: [
      [-7, -1],
      [-6, -2]
    ],
    scratchWallE: [
      [-2, -2],
      [-2, -3]
    ],
    scratchWallW: [
      [-4, 0],
      [-4, -1]
    ],
    tired: [[-3, -2]],
    sleeping: [
      [-2, 0],
      [-2, -1]
    ],
    N: [
      [-1, -2],
      [-1, -3]
    ],
    NE: [
      [0, -2],
      [0, -3]
    ],
    E: [
      [-3, 0],
      [-3, -1]
    ],
    SE: [
      [-5, -1],
      [-5, -2]
    ],
    S: [
      [-6, -3],
      [-7, -2]
    ],
    SW: [
      [-5, -3],
      [-6, -1]
    ],
    W: [
      [-4, -2],
      [-4, -3]
    ],
    NW: [
      [-1, 0],
      [-1, -1]
    ]
  };

  function savePosition() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          x: Math.round(nekoPosX),
          y: Math.round(nekoPosY)
        })
      );
    } catch (_) {
      // Ignore unavailable localStorage.
    }
  }

  function clampPosition() {
    nekoPosX = Math.min(
      Math.max(16, nekoPosX),
      Math.max(16, window.innerWidth - 16)
    );
    nekoPosY = Math.min(
      Math.max(16, nekoPosY),
      Math.max(16, window.innerHeight - 16)
    );
  }

  function init() {
    const nekoEl = document.getElementById('oneko');
    if (!nekoEl) return;

    nekoEl.ariaHidden = true;
    nekoEl.style.width = '32px';
    nekoEl.style.height = '32px';
    nekoEl.style.position = 'fixed';
    nekoEl.style.pointerEvents = 'none';
    nekoEl.style.imageRendering = 'pixelated';
    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
    nekoEl.style.zIndex = 2147483647;
    clampPosition();
    nekoEl.style.backgroundImage = "url('/oneko.gif')";

    document.addEventListener('mousemove', (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  function onAnimationFrame(timestamp) {
    const nekoEl = document.getElementById('oneko');
    if (!nekoEl || !nekoEl.isConnected) return;
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  function setSprite(name, frame) {
    const nekoEl = document.getElementById('oneko');
    if (!nekoEl) return;
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation === null
    ) {
      idleAnimation = ['sleeping', 'scratchSelf'][
        Math.floor(Math.random() * 2)
      ];
    }
    switch (idleAnimation) {
      case 'sleeping':
        if (idleAnimationFrame < 8) {
          setSprite('tired', 0);
          break;
        }
        setSprite('sleeping', Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case 'scratchSelf':
        setSprite('scratchSelf', idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite('idle', 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    const nekoEl = document.getElementById('oneko');
    if (!nekoEl) return;
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite('alert', 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction =
      (diffY / distance > 0.5 ? 'N' : '') +
      (diffY / distance < -0.5 ? 'S' : '') +
      (diffX / distance > 0.5 ? 'W' : '') +
      (diffX / distance < -0.5 ? 'E' : '');
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;
    clampPosition();
    savePosition();

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  window.addEventListener('resize', () => {
    clampPosition();
    savePosition();
    const nekoEl = document.getElementById('oneko');
    if (nekoEl) {
      nekoEl.style.left = `${nekoPosX - 16}px`;
      nekoEl.style.top = `${nekoPosY - 16}px`;
    }
  });

  window.addEventListener('beforeunload', savePosition);

  // Initial load
  init();

  // Re-run on Astro navigation
  document.addEventListener('astro:page-load', () => {
    init();
  });
})();
