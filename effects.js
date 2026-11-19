'use strict';

// Short original cues synthesized on demand, without audio file downloads.
const questTransition = (() => {
  const toggle = document.getElementById('sound');
  const preference = 'valley-post-effects';
  const tones = {
    step: [523.25, 659.25],
    open: [659.25, 783.99, 1046.5],
    seal: [523.25, 659.25, 783.99, 1046.5],
  };
  let enabled = true;
  let audio;
  try {
    enabled = localStorage.getItem(preference) !== 'off';
  } catch { /* Keep the in-session setting when storage is unavailable. */ }

  function updateToggle() {
    toggle.textContent = enabled ? '♫ 소리 켜짐' : '♪ 소리 꺼짐';
    toggle.setAttribute('aria-pressed', String(enabled));
  }
  async function chime(cue) {
    if (!enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio ??= new Audio();
      if (audio.state !== 'running') await audio.resume();
      if (!enabled || audio.state !== 'running') return;
      const start = audio.currentTime;
      tones[cue].forEach((frequency, index) => {
        const tick = start + index * 0.055;
        const oscillator = audio.createOscillator();
        const volume = audio.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;
        volume.gain.setValueAtTime(0, tick);
        volume.gain.linearRampToValueAtTime(0.065, tick + 0.008);
        volume.gain.exponentialRampToValueAtTime(0.0001, tick + 0.12);
        oscillator.connect(volume).connect(audio.destination);
        oscillator.start(tick);
        oscillator.stop(tick + 0.13);
        oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
      });
    } catch { /* Navigation still works if device audio is unavailable. */ }
  }
  updateToggle();
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    updateToggle();
    try { localStorage.setItem(preference, enabled ? 'on' : 'off'); } catch {}
    if (enabled) chime('step');
  });
  return (panel, cue) => {
    chime(cue);
    panel.classList.remove('turn-page');
    void panel.offsetWidth;
    panel.classList.add('turn-page');
  };
})();
