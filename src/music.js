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
    localStorage.setItem(
      KEY,
      JSON.stringify({
        index,
        position: audio.currentTime || 0,
        playing: !audio.paused,
        muted: audio.muted
      })
    );
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

  function loadSong(songIndex, autoplay = false, position = 0) {
    index = (songIndex + list.length) % list.length;

    const song = list[index];

    audio.src = song.src;
    title.textContent = song.title;

    audio.addEventListener(
      'loadedmetadata',
      () => {
        if (position > 0 && position < audio.duration) {
          audio.currentTime = position;
        }

        if (autoplay) {
          audio.play().catch(() => {});
        }

        updateProgress();
      },
      { once: true }
    );

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
