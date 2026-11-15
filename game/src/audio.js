// Synthesised sound, no audio files: a few oscillator voices through one master
// gain. Everything is created on the first user gesture, so browsers allow it, and
// M toggles the master gain. Nothing here is needed for the game to play.

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context !== null) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.22;
      master.connect(context.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, seconds, type, volume, slideTo) {
    if (!ensure() || muted) return;
    try {
      if (context.state === 'suspended') void context.resume();
      const now = context.currentTime;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + seconds);
    } catch {
      // Sound is decoration: a failure here must never stop the game.
    }
  }

  /** A bright pluck when a mote is gathered. */
  function playCollect() {
    tone(880, 0.14, 'sine', 0.5, 1320);
  }

  /** A low thud when the harbour loses a heart. */
  function playHit() {
    tone(140, 0.3, 'triangle', 0.7, 60);
  }

  /** A two-note horn when a ship is guided safely home. */
  function playRescue() {
    tone(392, 0.18, 'sine', 0.5);
    window.setTimeout(() => tone(523, 0.3, 'sine', 0.5), 120);
  }

  /** A deep swell when the pulse blast fires. */
  function playPulse() {
    tone(220, 0.45, 'sawtooth', 0.35, 55);
  }

  /** A short fog-horn when a new wave rolls in. */
  function playWave() {
    tone(196, 0.5, 'sine', 0.4, 185);
  }

  /** A soft click for menu actions. */
  function playClick() {
    tone(660, 0.07, 'square', 0.25);
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.22;
    return muted;
  }

  return {
    ensure,
    playCollect,
    playHit,
    playRescue,
    playPulse,
    playWave,
    playClick,
    toggleMute,
    isMuted: () => muted,
  };
}
