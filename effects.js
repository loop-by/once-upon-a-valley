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
  const prompt = document.getElementById('music-prompt');
  const musicOn = document.getElementById('music-on');
  const musicOff = document.getElementById('music-off');
  let enabled = false;
  let playing;
  const music = document.getElementById('background-music');
  music.volume = 0.35;
  try {
    if (localStorage.getItem(preference) === 'off') musicOff.autofocus = true;
  } catch { /* Keep the in-session setting when storage is unavailable. */ }

  function updateToggle() {
    const on = enabled && !music.paused;
    toggle.textContent = on ? '♫ 음악 켜짐' : '♪ 음악 꺼짐';
    toggle.setAttribute('aria-pressed', String(on));
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

  function setSound(on) {
    enabled = on;
    try { localStorage.setItem(preference, on ? 'on' : 'off'); } catch {}
    if (on) {
      music.play().catch(error => {
        if (error.name !== 'AbortError' && music.paused) {
          enabled = false;
          updateToggle();
        }
      });
    } else {
      music.pause();
      stop();
    }
    updateToggle();
  }
  toggle.addEventListener('click', () => setSound(!enabled || music.paused));
  function dismissMusicPrompt(withSound) {
    setSound(withSound);
    prompt.close();
    // Paint the first screen before starting the button cue.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById('keepsake').classList.add('welcome-bounce');
      });
    });
  }
  musicOn.addEventListener('click', () => dismissMusicPrompt(true));
  musicOff.addEventListener('click', () => dismissMusicPrompt(false));
  prompt.addEventListener('cancel', event => {
    event.preventDefault();
    dismissMusicPrompt(false);
  });
  prompt.addEventListener('close', () => toggle.focus({preventScroll: true}));
  prompt.showModal();
  return (panel, cue) => {
    chime(cue);
    panel.classList.remove('turn-page');
    void panel.offsetWidth;
    panel.classList.add('turn-page');
  };
})();
