(() => {
  const player = document.querySelector('#music-player');

  if (!player) return;

  const audio = player.querySelector('#bg-audio');
  const title = player.querySelector('#music-title');
  const toggle = player.querySelector('#music-toggle');
  const prev = player.querySelector('#music-prev');
  const next = player.querySelector('#music-next');
  const mute = player.querySelector('#music-mute');
  const progress = player.querySelector('#music-progress');
  const volume = player.querySelector('#music-volume');

  const list = JSON.parse(player.dataset.playlist || '[]');

  if (!list.length) return;

  const STORAGE_KEY = 'amdkits-music';

  let state;

  try {
    state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    state = {};
  }

  let current = Number.isInteger(state.track) ? state.track : 0;

  if (current < 0 || current >= list.length) {
    current = 0;
  }

  function saveState() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        track: current,
        position: audio.currentTime || 0,
        playing: !audio.paused,
        muted: audio.muted,
        volume: audio.volume
      })
    );
  }

  function updatePlayButton() {
    toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
    toggle.setAttribute(
      'aria-label',
      audio.paused ? 'Play music' : 'Pause music'
    );
  }

  function updateMuteButton() {
    mute.textContent = audio.muted || audio.volume === 0 ? '×' : '♪';
    mute.setAttribute(
      'aria-label',
      audio.muted ? 'Unmute music' : 'Mute music'
    );
  }

  function updateProgress() {
    if (!audio.duration) {
      progress.value = 0;
      return;
    }

    progress.value = (audio.currentTime / audio.duration) * 100;
  }

  function load(index, shouldPlay = false, position = 0) {
    current = (index + list.length) % list.length;

    audio.src = list[current].src;
    title.textContent = list[current].title;

    audio.addEventListener(
      'loadedmetadata',
      () => {
        if (position > 0 && position < audio.duration) {
          audio.currentTime = position;
        }

        if (shouldPlay) {
          audio.play().catch(() => {
            updatePlayButton();
          });
        }
      },
      { once: true }
    );

    updatePlayButton();
  }

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    saveState();
  });

  prev.addEventListener('click', () => {
    load(current - 1, true);
    saveState();
  });

  next.addEventListener('click', () => {
    load(current + 1, true);
    saveState();
  });

  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateMuteButton();
    saveState();
  });

  progress.addEventListener('input', () => {
    if (!audio.duration) return;

    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    audio.muted = audio.volume === 0;

    updateMuteButton();
    saveState();
  });

  audio.addEventListener('play', () => {
    updatePlayButton();
    saveState();
  });

  audio.addEventListener('pause', () => {
    updatePlayButton();
    saveState();
  });

  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('ended', () => {
    load(current + 1, true);
  });

  // Save playback position periodically.
  setInterval(saveState, 2000);

  // Save before leaving the page.
  window.addEventListener('beforeunload', saveState);

  // Restore volume.
  if (typeof state.volume === 'number') {
    audio.volume = Math.max(0, Math.min(1, state.volume));
    volume.value = audio.volume;
  } else {
    audio.volume = 0.7;
    volume.value = 0.7;
  }

  audio.muted = Boolean(state.muted);

  updateMuteButton();

  // Restore the previous song and position.
  load(current, Boolean(state.playing), Number(state.position) || 0);
})();
