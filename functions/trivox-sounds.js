import * as Tone from 'tone';

let bgLoop = null;
let ready = false;

export async function initAudio() {
  if (!ready) {
    await Tone.start();
    ready = true;
  }
}

export function startBgLoop() {
  if (bgLoop) return; // already playing

  const bass = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.5 }
  }).toDestination();
  bass.volume.value = -14;

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.3, decay: 0.5, sustain: 0.6, release: 1.5 }
  }).toDestination();
  pad.volume.value = -20;

  const kick = new Tone.MembraneSynth({ pitchDecay: 0.08, octaves: 6 }).toDestination();
  kick.volume.value = -10;

  const hats = new Tone.MetalSynth({
    frequency: 400, envelope: { attack: 0.001, decay: 0.05 },
    harmonicity: 5.1, modulationIndex: 16
  }).toDestination();
  hats.volume.value = -22;

  const bassSeq = new Tone.Sequence((t, n) => {
    bass.triggerAttackRelease(n, '8n', t);
  }, ['C2', 'F2', 'G2', 'Bb2', 'C2', null, 'Eb2', null], '8n');

  const padSeq = new Tone.Sequence((t, n) => {
    pad.triggerAttackRelease([n], '2n', t);
  }, ['C4', 'Eb4', 'F4', 'G4'], '2n');

  const kickSeq = new Tone.Sequence((t, v) => {
    if (v) kick.triggerAttackRelease('C1', '8n', t);
  }, [1, 0, 1, 0, 1, 1, 1, 0], '8n');

  const hatSeq = new Tone.Sequence((t) => {
    hats.triggerAttackRelease('16n', t);
  }, [1, null, 1, 1, null, 1, null, 1], '8n');

  Tone.Transport.bpm.value = 82;
  bassSeq.start(0); padSeq.start(0);
  kickSeq.start(0); hatSeq.start(0);
  Tone.Transport.start();

  bgLoop = [bassSeq, padSeq, kickSeq, hatSeq, bass, pad, kick, hats];
}

export function stopBgLoop() {
  if (!bgLoop) return;
  bgLoop.forEach(p => p.dispose());
  Tone.Transport.stop();
  bgLoop = null;
}

export function cardFlip() {
  const s = new Tone.MetalSynth({ frequency: 600, envelope: { attack: 0.001, decay: 0.08 }, harmonicity: 5.1, modulationIndex: 16 }).toDestination();
  s.triggerAttackRelease('C5', '16n');
  setTimeout(() => s.dispose(), 500);
}

export function buttonClick() {
  const s = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 } }).toDestination();
  s.volume.value = -8;
  s.triggerAttackRelease('G5', '32n');
  setTimeout(() => s.dispose(), 200);
}

export function matchSuccess() {
  const s = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.4 } }).toDestination();
  const rev = new Tone.Reverb({ decay: 1, wet: 0.3 }).toDestination();
  s.connect(rev);
  const now = Tone.now();
  ['C5','E5','G5','C6'].forEach((n, i) => s.triggerAttackRelease(n, '8n', now + i * 0.1));
  setTimeout(() => { s.dispose(); rev.dispose(); }, 1500);
}

export function wrongMatch() {
  const s = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.1 } }).toDestination();
  const lpf = new Tone.Filter(600, 'lowpass').toDestination();
  s.connect(lpf);
  const now = Tone.now();
  s.triggerAttackRelease('G3', '8n', now);
  s.triggerAttackRelease('Eb3', '8n', now + 0.16);
  setTimeout(() => { s.dispose(); lpf.dispose(); }, 800);
}

export function findDifference() {
  const s = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.8 } }).toDestination();
  const rev = new Tone.Reverb({ decay: 1.5, wet: 0.5 }).toDestination();
  s.connect(rev);
  const now = Tone.now();
  s.triggerAttackRelease('A5', '8n', now);
  s.triggerAttackRelease('E6', '4n', now + 0.12);
  setTimeout(() => { s.dispose(); rev.dispose(); }, 1200);
}

export function levelComplete() {
  const s = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 } }).toDestination();
  s.volume.value = -10;
  const notes = ['C4','E4','G4','C5','E5','G5','C6'];
  const now = Tone.now();
  notes.forEach((n, i) => s.triggerAttackRelease(n, '8n', now + i * 0.09));
  setTimeout(() => s.dispose(), 2000);
}

export function gameOver() {
  const s = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5 } }).toDestination();
  s.volume.value = -10;
  ['G4','Eb4','C4','G3'].forEach((n, i) =>
    s.triggerAttackRelease(n, '4n', Tone.now() + i * 0.24)
  );
  setTimeout(() => s.dispose(), 2500);
}

export function countdownTick() {
  const s = new Tone.MetalSynth({ frequency: 400, envelope: { attack: 0.001, decay: 0.05 }, harmonicity: 3.1, modulationIndex: 8 }).toDestination();
  s.triggerAttackRelease('C4', '32n');
  setTimeout(() => s.dispose(), 300);
}

export function dragSound(start = true) {
  if (start) {
    window._dragSynth = new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.1, sustain: 1, release: 0.3 } }).toDestination();
    window._dragSynth.volume.value = -18;
    const lpf = new Tone.Filter(400, 'lowpass').toDestination();
    window._dragSynth.connect(lpf);
    window._dragSynth.triggerAttack('C3');
    window._dragLpf = lpf;
  } else {
    window._dragSynth?.triggerRelease();
    setTimeout(() => {
      window._dragSynth?.dispose();
      window._dragLpf?.dispose();
    }, 500);
  }
}