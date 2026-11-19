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
  let blocked = false;
  try {
    enabled = localStorage.getItem(preference) !== 'off';
  } catch { /* Keep the in-session setting when storage is unavailable. */ }

  function updateToggle() {
    toggle.textContent = blocked ? '♫ 효과음 다시 켜기' : enabled ? '♫ 효과음 켜짐' : '♪ 효과음 꺼짐';
    toggle.setAttribute('aria-pressed', String(enabled && !blocked));
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
    clip.play().then(() => {
      if (playing === clip && blocked) {
        blocked = false;
        updateToggle();
      }
    }).catch(error => {
      if (error.name === 'AbortError' || playing !== clip) return;
      blocked = true;
      updateToggle();
    });
  }
  updateToggle();
  toggle.addEventListener('click', () => {
    enabled = blocked || !enabled;
    blocked = false;
    updateToggle();
    try { localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch {}
    if (enabled) chime('step');
    else stop();
  });
  return (panel, cue) => {
    chime(cue);
    panel.classList.remove('turn-page');
    void panel.offsetWidth;
    panel.classList.add('turn-page');
  };
})();

const backgroundMusic = document.getElementById('background-music');
const firstChoices = document.getElementById('actions');
backgroundMusic.volume = 0.35;
function startBackgroundMusic(event) {
  if (!event.target.closest('button')) return;
  firstChoices.removeEventListener('click', startBackgroundMusic);
  backgroundMusic.play().catch(() => { /* The native play control remains available. */ });
}
firstChoices.addEventListener('click', startBackgroundMusic);
backgroundMusic.addEventListener('play', () => {
  firstChoices.removeEventListener('click', startBackgroundMusic);
}, { once: true });
