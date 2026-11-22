(() => {
  if (window.__amdkitsMusicInitialized) return;
  window.__amdkitsMusicInitialized = true;

  const player = document.querySelector('#music-player');
  if (!player) return;

  const audio = player.querySelector('#bg-audio');
  const title = player.querySelector('#music-title');
  const toggle = player.querySelector('#music-toggle');
  const prev = player.querySelector('#music-prev');
  const next = player.querySelector('#music-next');
  const mute = player.querySelector('#music-mute');
  const progress = player.querySelector('#music-progress');

  const list = JSON.parse(player.dataset.playlist || '[]');
  if (!list.length) return;

  const KEY = 'amdkits-music';

  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    saved = {};
  }

  let index = Number.isInteger(saved.index) ? saved.index : 0;

  if (index < 0 || index >= list.length) {
    index = 0;
  }

  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          index,
          position: audio.currentTime || 0,
          playing: !audio.paused,
          muted: audio.muted
        })
      );
    } catch {
      /* storage unavailable (private mode, blocked); playback still works */
    }
  }

  function updateButton() {
    toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
  }

  function updateMute() {
    mute.textContent = audio.muted ? '×' : '♪';
  }

  function updateProgress() {
    if (!audio.duration) {
      progress.value = 0;
      return;
    }

    progress.value = (audio.currentTime / audio.duration) * 100;
  }

  let pendingMeta = null; // loadedmetadata handler for the track being loaded
  let wantPlay = false; // should the current track start playing once ready
  let failures = 0; // consecutive tracks that failed to load

  function loadSong(songIndex, autoplay = false, position = 0) {
    index = (songIndex + list.length) % list.length;
    wantPlay = autoplay;

    const song = list[index];

    // Drop the previous track's handler so it can't fire for this one.
    if (pendingMeta) audio.removeEventListener('loadedmetadata', pendingMeta);

    audio.src = song.src;
    title.textContent = song.title;

    pendingMeta = () => {
      if (position > 0 && position < audio.duration) {
        audio.currentTime = position;
      }

      if (autoplay) {
        audio.play().catch(() => {});
      }

      updateProgress();
    };
    audio.addEventListener('loadedmetadata', pendingMeta, { once: true });

    updateButton();
  }

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  prev.addEventListener('click', () => {
    loadSong(index - 1, true);
  });

  next.addEventListener('click', () => {
    loadSong(index + 1, true);
  });

  mute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    updateMute();
    save();
  });

  progress.addEventListener('input', () => {
    if (!audio.duration) return;

    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  });

  audio.addEventListener('play', () => {
    updateButton();
    save();
  });

  audio.addEventListener('pause', () => {
    updateButton();
    save();
  });

  audio.addEventListener('timeupdate', updateProgress);

  audio.addEventListener('canplay', () => {
    failures = 0;
  });

  // Missing or unplayable file: say so, and move on if we were meant to be playing.
  audio.addEventListener('error', () => {
    title.textContent = `${list[index].title} (can't load)`;
    updateButton();
    failures += 1;
    if (wantPlay && failures < list.length) loadSong(index + 1, true);
  });

  audio.addEventListener('ended', () => {
    loadSong(index + 1, true);
  });

  // Remember position while listening.
  setInterval(save, 1000);

  // Remember state when navigating away.
  window.addEventListener('pagehide', save);

  audio.muted = Boolean(saved.muted);
  updateMute();

  loadSong(index, Boolean(saved.playing), Number(saved.position) || 0);
})();
