'use strict';

// Play a short original cue directly from the gesture that advances the quest.
const questTransition = (() => {
  const toggle = document.getElementById('sound');
  const preference = 'valley-post-effects';
  const clips = Object.fromEntries(['step', 'open', 'seal'].map(cue => {
    const clip = new Audio('assets/audio/' + cue + '.wav');
    clip.preload = 'auto';
    return [cue, clip];
  }));
  let enabled = true;
  let playing;
  const music = document.getElementById('background-music');
  music.volume = 0.35;
  try {
    enabled = localStorage.getItem(preference) !== 'off';
  } catch { /* Keep the in-session setting when storage is unavailable. */ }

  function updateToggle() {
    const on = enabled && !music.paused;
    toggle.textContent = on ? '♫ 음악 켜짐' : '♪ 음악 꺼짐';
    toggle.setAttribute('aria-pressed', String(on));
  }
  function playMusic() {
    if (enabled && music.paused) music.play().catch(updateToggle);
  }
  function resumeOnGesture(event) {
    if (!toggle.contains(event.target)) playMusic();
  }
  function stop() {
    if (!playing) return;
    playing.pause();
    playing = undefined;
  }
  function chime(cue) {
    if (!enabled) return;
    stop();
    const clip = clips[cue];
    clip.currentTime = 0;
    playing = clip;
    clip.play().catch(() => { /* A cue can be interrupted by the next action. */ });
  }

  music.addEventListener('playing', updateToggle);
  music.addEventListener('pause', updateToggle);
  document.addEventListener('click', resumeOnGesture, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') resumeOnGesture(event);
  }, true);

  toggle.addEventListener('click', () => {
    enabled = !enabled || music.paused;
    try { localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch {}
    if (enabled) {
      playMusic();
      chime('step');
    } else {
      music.pause();
      stop();
    }
    updateToggle();
  });
  updateToggle();
  playMusic();
  return (panel, cue) => {
    chime(cue);
    panel.classList.remove('turn-page');
    void panel.offsetWidth;
    panel.classList.add('turn-page');
  };
})();
