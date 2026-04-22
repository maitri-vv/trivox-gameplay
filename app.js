document.addEventListener("DOMContentLoaded", () => {

// ═══════════════════════════════════════════════════════════════════
//  AUDIO  (Tone.js — replaces the old Web Audio sfx* functions)
//  Add this to your index.html <head>:
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>
// ═══════════════════════════════════════════════════════════════════

let soundEnabled = localStorage.getItem('trivox_sound') === 'on';
let audioReady   = false;
let bgNodes      = [];   // holds Tone sequences for cleanup
let bgMusic      = null; // holds bg music player instance

async function ensureTone() {
  if (!audioReady) {
    await Tone.start();
    audioReady = true;
  }
}

// Called once on first user click — starts bg loop
// document.addEventListener('click', async () => {
//   await ensureTone();
//   if (soundEnabled) startAmbient();
// }, { once: true });

// ── SFX helpers ────────────────────────────────────────────────────

function sfxFlip() {
  if (!soundEnabled) return;
  // Card flip — retro metallic snap + soft sine tail
  const snap = new Tone.MetalSynth({
    frequency: 600,
    envelope: { attack: 0.001, decay: 0.08, release: 0.05 },
    harmonicity: 5.1,
    modulationIndex: 16,
    resonance: 3000,
  }).toDestination();
  snap.volume.value = -6;
  snap.triggerAttackRelease('C5', '16n');
  setTimeout(() => snap.dispose(), 500);
}

function sfxMatch() {
  if (!soundEnabled) return;
  // Match success — bright ascending triangle arp with reverb
  const synth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5 },
  }).toDestination();
  const rev = new Tone.Reverb({ decay: 1.2, wet: 0.35 }).toDestination();
  synth.connect(rev);
  synth.volume.value = -8;
  const now = Tone.now();
  ['C5', 'E5', 'G5', 'C6'].forEach((note, i) =>
    synth.triggerAttackRelease(note, '8n', now + i * 0.1)
  );
  setTimeout(() => { synth.dispose(); rev.dispose(); }, 1500);
}

function sfxMismatch() {
  if (!soundEnabled) return;
  // Wrong match — two-note descending sawtooth bloop
  const synth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.18, sustain: 0, release: 0.12 },
  }).toDestination();
  const lpf = new Tone.Filter(700, 'lowpass').toDestination();
  synth.connect(lpf);
  synth.volume.value = -10;
  const now = Tone.now();
  synth.triggerAttackRelease('G3', '8n', now);
  synth.triggerAttackRelease('Eb3', '8n', now + 0.17);
  setTimeout(() => { synth.dispose(); lpf.dispose(); }, 800);
}

function sfxWin() {
  if (!soundEnabled) return;
  // Level complete — full retro square fanfare
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.3 },
  }).toDestination();
  synth.volume.value = -10;
  const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'];
  const now = Tone.now();
  notes.forEach((note, i) =>
    synth.triggerAttackRelease(note, '8n', now + i * 0.09)
  );
  setTimeout(() => synth.dispose(), 2000);
}

function sfxNearWin() {
  if (!soundEnabled) return;
  // Near win — quick ascending shimmer
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
  }).toDestination();
  synth.volume.value = -12;
  const now = Tone.now();
  ['A5', 'E6', 'A6'].forEach((note, i) =>
    synth.triggerAttackRelease(note, '16n', now + i * 0.06)
  );
  setTimeout(() => synth.dispose(), 800);
}

function sfxButtonClick() {
  if (!soundEnabled) return;
  // Button click — punchy pixel tap
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
  }).toDestination();
  synth.volume.value = -8;
  synth.triggerAttackRelease('G5', '32n');
  setTimeout(() => synth.dispose(), 200);
}

function sfxCountdownTick() {
  if (!soundEnabled) return;
  const synth = new Tone.MetalSynth({
    frequency: 400,
    envelope: { attack: 0.001, decay: 0.05 },
    harmonicity: 3.1,
    modulationIndex: 8,
  }).toDestination();
  synth.volume.value = -10;
  synth.triggerAttackRelease('C4', '32n');
  setTimeout(() => synth.dispose(), 300);
}

function sfxFindDifference() {
  if (!soundEnabled) return;
  // Find difference — shimmer ping, distinct from match
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.1, release: 0.8 },
  }).toDestination();
  const rev = new Tone.Reverb({ decay: 1.8, wet: 0.55 }).toDestination();
  synth.connect(rev);
  synth.volume.value = -8;
  const now = Tone.now();
  synth.triggerAttackRelease('A5', '8n', now);
  synth.triggerAttackRelease('E6', '4n', now + 0.13);
  setTimeout(() => { synth.dispose(); rev.dispose(); }, 1200);
}

function sfxGameOver() {
  if (!soundEnabled) return;
  // Game over — descending melancholy square
  const synth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.3, release: 0.5 },
  }).toDestination();
  synth.volume.value = -10;
  ['G4', 'Eb4', 'C4', 'G3'].forEach((note, i) =>
    synth.triggerAttackRelease(note, '4n', Tone.now() + i * 0.24)
  );
  setTimeout(() => synth.dispose(), 2500);
}

async function startAmbient() {
  stopAmbient();
  if (!soundEnabled) return;

  bgMusic = new Tone.Player({
    url: "assets/audio/bg.wav",
    loop: true,
    autostart: false,
  }).toDestination();

  bgMusic.volume.value = -8;

  await Tone.loaded();   // wait until the file is actually loaded
  bgMusic.start();
}

function stopAmbient() {
  try {
    if (bgMusic) {
      bgMusic.stop();
      bgMusic.dispose();
      bgMusic = null;
    }
  } catch (e) {}

  bgNodes.forEach(n => {
    try {
      if (typeof n.stop === 'function') n.stop();
    } catch (e) {}
    try {
      if (typeof n.dispose === 'function') n.dispose();
    } catch (e) {}
  });

  try { Tone.Transport.stop(); } catch (e) {}
  try { Tone.Transport.cancel(); } catch (e) {}

}

// Attach button click sound to all buttons
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', sfxButtonClick);
});

// ═══════════════════════════════════════════════════════════════════
//
//  ✏️  EDIT THIS SECTION ONLY — add your GLB files here
//
//  Folder structure expected:
//  /
//  ├── index.html         ← this file
//  └── assets/
//      ├── Flamingo.glb
//      ├── Flamingo_orange_base.glb
//      ├── Parrot.glb
//      └── ... etc
//
//  Each model needs:
//    id     — unique string, no spaces
//    src    — path from index.html to the GLB file
//    label  — short name shown on the card
//    group  — which animal/species it belongs to
//             (each round randomly picks GROUPS_PER_ROUND groups)
//
// ═══════════════════════════════════════════════════════════════════


const ALL_MODELS = [

  // ── FLAMINGO ──────────────────────────────────────────────────────
  { id:'flamingo_base',     src:'assets/Flamingo.glb',                    label:'Flamingo',             group:'flamingo' },
  { id:'flamingo_orange',   src:'assets/Flamingo_orange_base.glb',        label:'Flamingo · Orange',    group:'flamingo' },
  { id:'flamingo_darkneck', src:'assets/Flamingo_orange_v4_dark_neck.glb',label:'Flamingo · Dark Neck', group:'flamingo' },
  { id:'flamingo_tealhead', src:'assets/Flamingo_pink_v3_teal_head.glb',  label:'Flamingo · Teal Head', group:'flamingo' },

  // ── PARROT ────────────────────────────────────────────────────────
  { id:'parrot_v1', src:'assets/Parrot_recolored.glb',    label:'Parrot',           group:'parrot' },
  { id:'parrot_v2', src:'assets/Parrot_blue.glb',         label:'Parrot · Blue',    group:'parrot' },
  { id:'parrot_v3', src:'assets/Parrot_red.glb',          label:'Parrot · Red',     group:'parrot' },
  { id:'parrot_v4', src:'assets/Parrot_green.glb',        label:'Parrot · Green',   group:'parrot' },

  // ── HORSE ─────────────────────────────────────────────────────────
  { id:'horse_black_base',               src:'assets/Horse_black_base.glb',                    label:'Horse · Black',                    group:'horse' },
  { id:'horse_black_v1_fast_gallop',     src:'assets/Horse_black_v1_fast_gallop.glb',          label:'Horse · Black Fast Gallop',        group:'horse' },
  { id:'horse_black_v2_mirrored',        src:'assets/Horse_black_v2_mirrored.glb',             label:'Horse · Black Mirrored',           group:'horse' },
  { id:'horse_black_v3_fat_body',        src:'assets/Horse_black_v3_fat_body.glb',             label:'Horse · Black Fat Body',           group:'horse' },
  { id:'horse_black_v4_big_head',        src:'assets/Horse_black_v4_big_head.glb',             label:'Horse · Black Big Head',           group:'horse' },

  { id:'horse_brown_v1_fast_gallop',     src:'assets/Horse_brown_v1_fast_gallop.glb',          label:'Horse · Brown Fast Gallop',        group:'horse' },
  { id:'horse_brown_v2_slow_trot',       src:'assets/Horse_brown_v2_slow_trot.glb',            label:'Horse · Brown Slow Trot',          group:'horse' },
  { id:'horse_brown_v3_mirrored',        src:'assets/Horse_brown_v3_mirrored.glb',             label:'Horse · Brown Mirrored',           group:'horse' },
  { id:'horse_brown_v4_big_head',        src:'assets/Horse_brown_v4_big_head.glb',             label:'Horse · Brown Big Head',           group:'horse' },
  { id:'horse_brown_v5_short_legs',      src:'assets/Horse_brown_v5_short_legs.glb',           label:'Horse · Brown Short Legs',         group:'horse' },
  { id:'horse_brown_v6_fat_body',        src:'assets/Horse_brown_v6_fat_body.glb',             label:'Horse · Brown Fat Body',           group:'horse' },
  { id:'horse_brown_v7_dark_mane',       src:'assets/Horse_brown_v7_dark_mane.glb',            label:'Horse · Brown Dark Mane',          group:'horse' },

  { id:'horse_golden_base',              src:'assets/Horse_golden_base.glb',                   label:'Horse · Golden',                   group:'horse' },
  { id:'horse_golden_v1_fast_gallop',    src:'assets/Horse_golden_v1_fast_gallop.glb',         label:'Horse · Golden Fast Gallop',       group:'horse' },
  { id:'horse_golden_v2_mirrored',       src:'assets/Horse_golden_v2_mirrored.glb',            label:'Horse · Golden Mirrored',          group:'horse' },
  { id:'horse_golden_v3_tall_legs',      src:'assets/Horse_golden_v3_tall_legs.glb',           label:'Horse · Golden Tall Legs',         group:'horse' },
  { id:'horse_golden_v4_dark_mane',      src:'assets/Horse_golden_v4_dark_mane.glb',           label:'Horse · Golden Dark Mane',         group:'horse' },

  { id:'horse_grey_base',                src:'assets/Horse_grey_base.glb',                     label:'Horse · Grey',                     group:'horse' },
  { id:'horse_grey_v2_big_head_slow',    src:'assets/Horse_grey_v2_big_head_slow.glb',         label:'Horse · Grey Big Head Slow',       group:'horse' },
  { id:'horse_grey_v3_short_legs_mirrored', src:'assets/Horse_grey_v3_short_legs_mirrored.glb',label:'Horse · Grey Short Legs Mirrored', group:'horse' },

  { id:'horse_white_base',               src:'assets/Horse_white_base.glb',                    label:'Horse · White',                    group:'horse' },
  { id:'horse_white_v1_fast_gallop',     src:'assets/Horse_white_v1_fast_gallop.glb',          label:'Horse · White Fast Gallop',        group:'horse' },
  { id:'horse_white_v2_mirrored',        src:'assets/Horse_white_v2_mirrored.glb',             label:'Horse · White Mirrored',           group:'horse' },
  { id:'horse_white_v3_big_head',        src:'assets/Horse_white_v3_big_head.glb',             label:'Horse · White Big Head',           group:'horse' },
  { id:'horse_white_v4_short_legs',      src:'assets/Horse_white_v4_short_legs.glb',           label:'Horse · White Short Legs',         group:'horse' },

 
  
  
  // ── LOLYPOLY ──────────────────────────────────────────────────────
  { id:'lolypoly_beach_1',  src:'assets/lolypoly/beach_pair_B1_tweaked.glb',               label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_beach_2',  src:'assets/lolypoly/beach_pair_B2_tweaked.glb',               label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_beach_3',  src:'assets/lolypoly/beach_pair_B3_tweaked.glb',               label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_beach_4',  src:'assets/lolypoly/beach_pair_B4_tweaked.glb',               label:'Lolypoly Scene', group:'lolypoly' },

  { id:'lolypoly_city_1',   src:'assets/lolypoly/city_pair_c1_tweaked.glb',                label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_city_2',   src:'assets/lolypoly/city_pair_c2_tweaked.glb',                label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_city_3',   src:'assets/lolypoly/city_pair_c3_tweaked.glb',                label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_city_4',   src:'assets/lolypoly/city_pair_c4_tweaked.glb',                label:'Lolypoly Scene', group:'lolypoly' },

  { id:'lolypoly_xmas_1',   src:'assets/lolypoly/christmas_Pair1_BASE.glb',                label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_xmas_2',   src:'assets/lolypoly/christmas_Pair2_TWEAKED_colors_table.glb',label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_xmas_3',   src:'assets/lolypoly/christmas_Pair2_BASE_colors.glb',         label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_xmas_4',   src:'assets/lolypoly/christmas_Pair1_TWEAKED_table.glb',       label:'Lolypoly Scene', group:'lolypoly' },

  { id:'lolypoly_room_1',   src:'assets/lolypoly/Room1_Bedroom_study.glb',                 label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_2',   src:'assets/lolypoly/Room1_Bedroom_tweaked.glb',               label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_3',   src:'assets/lolypoly/Room2_Study_Library.glb',                 label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_4',   src:'assets/lolypoly/Room3_Living_Room.glb',                   label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_5',   src:'assets/lolypoly/Room4_Kitchen.glb',                       label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_6',   src:'assets/lolypoly/Room5_Hotel_Bedroom.glb',                 label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_7',   src:'assets/lolypoly/Room6_Bathroom.glb',                      label:'Lolypoly Scene', group:'lolypoly' },
  { id:'lolypoly_room_8',   src:'assets/lolypoly/Room7_Gym.glb',                           label:'Lolypoly Scene', group:'lolypoly' },

  // ── ADD MORE GROUPS BELOW ─────────────────────────────────────────
  // { id:'lion_v1', src:'assets/Lion.glb', label:'Lion', group:'lion' },
];

function getRandomAnimalAmbient() {
  const pool = ALL_MODELS.filter(m => ['flamingo', 'parrot', 'horse'].includes(m.group));
  return pool[Math.floor(Math.random() * pool.length)];
}

const MODEL_SRC_OVERRIDES = {
  parrot_v1: { src:'assets/Parrot_recolored.glb', label:'Parrot' },
  parrot_v2: { src:'assets/Parrot_v1_beak_big.glb', label:'Parrot' },
  parrot_v3: { src:'assets/Parrot_v5_shiny.glb', label:'Parrot' },
  parrot_v4: { src:'assets/Parrot_v6_dark_body.glb', label:'Parrot' },
};

ALL_MODELS.forEach(model => {
  const override = MODEL_SRC_OVERRIDES[model.id];
  if (!override) return;
  model.src   = override.src;
  model.label = override.label;
});

const GROUP_LABELS = {
  flamingo:   'Flamingo',
  parrot:     'Parrot',
  horse:      'Horse',
  city:       'City',
  space_base: 'Space Base',
  restaurant: 'Prototype',
};

const CARD_HINTS = {
  flamingo:   { icon:'🦩', kind:'creature', type:'Creature',       tone:'#ff6a9e' },
  parrot:     { icon:'🦜', kind:'creature', type:'Creature',       tone:'#22c55e' },
  horse:      { icon:'♞',  kind:'creature', type:'Creature',       tone:'#b9783d' },
  city:       { icon:'▦',  kind:'scene',    type:'City Scene',     tone:'#38bdf8' },
  space_base: { icon:'✦',  kind:'scene',    type:'Space Scene',    tone:'#60a5fa' },
  restaurant: { icon:'▣',  kind:'scene',    type:'Prototype Scene',tone:'#facc15' },
};

function getModelCardLabel(model) {
  return GROUP_LABELS[model.group] || model.label || 'Scene';
}

function getCardHint(model) {
  return CARD_HINTS[model.group] || { icon:'◆', kind:'object', type:'Object', tone:'#FFE600' };
}

// ═══════════════════════════════════════════════════════════════════
//  GAME CONFIG
// ═══════════════════════════════════════════════════════════════════

const CARDS_PER_GROUP  = 4;
const GROUPS_PER_ROUND = 2;

// ═══════════════════════════════════════════════════════════════════
//  SHUFFLE + ROUND PICKER
// ═══════════════════════════════════════════════════════════════════

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRoundModels() {
  const groups = {};
  for (const m of ALL_MODELS) {
    if (!groups[m.group]) groups[m.group] = [];
    groups[m.group].push(m);
  }
  const playableGroupKeys = Object.keys(groups).filter(key => groups[key].length >= CARDS_PER_GROUP);
  const pickedGroupKeys   = shuffle(playableGroupKeys).slice(0, GROUPS_PER_ROUND);

  if (pickedGroupKeys.length < GROUPS_PER_ROUND) {
    console.warn('Not enough playable model groups to build a full round.');
  }

  const selected = [];
  for (const key of pickedGroupKeys) {
    const variants = shuffle(groups[key]).slice(0, CARDS_PER_GROUP);
    selected.push(...variants);
  }
  return shuffle([...selected, ...selected]);
}

// ═══════════════════════════════════════════════════════════════════
//  GAME STATE + TIMER
// ═══════════════════════════════════════════════════════════════════

let score = 0, totalPairs = 0, firstCard = null, secondCard = null;
let activeAnchorCard = null;
let boardLocked = false;
let comboCount = 0, timerInterval = null, elapsed = 0;

const GAME_MODES = {
  classic:      { label:'Classic',     caption:'Classic Mode',     countdown:false, limit:0,  players:['You'] },
  'vs-ai':      { label:'Vs AI',       caption:'Vs AI Mode',       countdown:false, limit:0,  players:['You', 'AI'] },
  'two-player': { label:'2 Player',    caption:'2 Player Mode',    countdown:false, limit:0,  players:[] },
  'time-attack':{ label:'Time Attack', caption:'Time Attack Mode', countdown:true,  limit:75, players:['You'] },
};

let selectedMode       = 'classic';
let currentPlayerIndex = 0;
let playerScores       = [0, 0];
let aiMemory           = new Map();
let pendingAiTurn      = null;
let aiActing           = false;

const LEADERBOARD_KEY = 'trivox_top10_v1';
let syncedViewers = [];
let animationSyncHandle = null;
let animationSyncStart  = 0;
const SHARED_ANIMATION_CYCLE = 2.4;

let motionFloatingFirst = null, motionFloatingSecond = null;
let motionPreviewMonitorAttached = false, motionPreviewWasInside = false;
let motionBusy = false;

const motionScreenGame  = document.getElementById('screen-game');
const motionBackdrop    = document.getElementById('motion-focus-backdrop');
const motionPreviewZone = document.getElementById('motion-preview-zone');
const motionFloatingLayer = document.getElementById('motion-floating-layer');

function motionWait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function getMotionStageRect() { return motionScreenGame.getBoundingClientRect(); }
function getMotionCardRect(card) {
  const rect = card.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}
function setMotionFocusMode(active) {
  motionScreenGame.classList.toggle('focus-mode', active);
  motionBackdrop.classList.toggle('active', active);
}
function createMotionClone(card) {
  const rect  = getMotionCardRect(card);
  const shell = document.createElement('div');
  shell.className  = 'motion-floating-card';
  shell.style.left = `${rect.left}px`;
  shell.style.top  = `${rect.top}px`;
  shell.style.width  = `${rect.width}px`;
  shell.style.height = `${rect.height}px`;
  const clone = card.cloneNode(true);
  clone.classList.remove('is-hidden-source','matched','reward-pop','mismatch-flash');
  shell.appendChild(clone);
  motionFloatingLayer.appendChild(shell);
  return shell;
}
async function animateMotionShell(shell, toRect, options = {}) {
  const { duration = 200, easing = 'cubic-bezier(.22,1,.36,1)', rotate = 0, opacity = 1, comparing = false } = options;
  shell.style.transition = `left ${duration}ms ${easing}, top ${duration}ms ${easing}, width ${duration}ms ${easing}, height ${duration}ms ${easing}, transform ${duration}ms ${easing}, opacity ${Math.min(duration,260)}ms ${easing}`;
  shell.style.left      = `${toRect.left}px`;
  shell.style.top       = `${toRect.top}px`;
  shell.style.width     = `${toRect.width}px`;
  shell.style.height    = `${toRect.height}px`;
  shell.style.transform = `translateZ(0) rotate(${rotate}deg)`;
  shell.style.opacity   = `${opacity}`;
  shell.classList.toggle('is-comparing', comparing);
  await motionWait(duration + 20);
}
function getMotionPreviewRects(baseRect) {
  const zoneRect  = motionPreviewZone.getBoundingClientRect();
  const centerX   = window.innerWidth  / 2;
  const centerY   = window.innerHeight / 2;
  const isSmallScreen = window.innerWidth < 640;
  const cardRatio = baseRect.width / baseRect.height;

  if (isSmallScreen) {
    const sidePadding  = 20, topPadding = 20, bottomPadding = 20, verticalGap = 14;
    const usableWidth  = zoneRect.width  - sidePadding * 2;
    const usableHeight = zoneRect.height - topPadding - bottomPadding;
    const stackedHeightLimit = (usableHeight - verticalGap) / 2;

    let pairHeight = Math.min(baseRect.height * 1.7, stackedHeightLimit);
    let pairWidth  = pairHeight * cardRatio;
    if (pairWidth > usableWidth) { pairWidth = usableWidth; pairHeight = pairWidth / cardRatio; }

    let singleHeight = Math.min(baseRect.height * 2.05, usableHeight);
    let singleWidth  = singleHeight * cardRatio;
    if (singleWidth > usableWidth) { singleWidth = usableWidth; singleHeight = singleWidth / cardRatio; }

    const totalStackHeight = pairHeight * 2 + verticalGap;
    const stackTop         = centerY - totalStackHeight / 2;
    return {
      single:     { left: centerX - singleWidth / 2,  top: centerY - singleHeight / 2, width: singleWidth,  height: singleHeight },
      firstPair:  { left: centerX - pairWidth / 2,    top: stackTop,                   width: pairWidth,    height: pairHeight },
      secondPair: { left: centerX - pairWidth / 2,    top: stackTop + pairHeight + verticalGap, width: pairWidth, height: pairHeight },
    };
  }

  const pairGap    = Math.max(26, Math.min(40, zoneRect.width * 0.03));
  const singleScale = window.innerWidth < 980 ? 2.1 : 2.8;
  const pairScale   = window.innerWidth < 980 ? 1.56 : 1.92;
  const singleW = baseRect.width  * singleScale, singleH = baseRect.height * singleScale;
  const pairW   = baseRect.width  * pairScale,   pairH   = baseRect.height * pairScale;
  return {
    single:     { left: centerX - singleW / 2,          top: centerY - singleH / 2, width: singleW, height: singleH },
    firstPair:  { left: centerX - pairW - pairGap / 2,  top: centerY - pairH / 2,   width: pairW,   height: pairH },
    secondPair: { left: centerX + pairGap / 2,           top: centerY - pairH / 2,   width: pairW,   height: pairH },
  };
}
function setMotionSourceHidden(card, hidden) {
  if (!card) return;
  card.classList.toggle('is-hidden-source', hidden);
}
let motionSingleCleanup = null;
function detachMotionSingleInteraction() {
  if (typeof motionSingleCleanup === 'function') motionSingleCleanup();
  motionSingleCleanup = null;
}
function attachMotionSingleInteraction(shell, sourceCard) {
  detachMotionSingleInteraction();
  if (!shell) return;
  const hoverTarget = shell.querySelector('.card') || shell;
  const viewers     = shell.querySelectorAll('model-viewer');
  const hint        = shell.querySelector('.gesture-hint');
  let interacting   = false;
  let leaveTimer    = null;
  const hideHint  = () => hint?.classList.add('is-hidden');
  const clearLeave = () => { if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; } };
  const onPointerDown = () => { interacting = true; hideHint(); };
  const onPointerUp   = () => { setTimeout(() => { interacting = false; }, 120); };
  const maybeClose = () => {
    if (motionBusy || boardLocked || secondCard || firstCard !== sourceCard) return;
    motionBusy = true;
    motionCloseSinglePreview().finally(() => { motionBusy = false; });
  };
  const onLeave = (event) => {
    if (shell.contains(event.relatedTarget)) return;
    clearLeave();
    leaveTimer = setTimeout(() => {
      if (!interacting && !shell.matches(':hover')) maybeClose();
    }, 90);
  };
  const onEnter = () => clearLeave();
  const onOutsidePointer = (event) => {
    if (shell.contains(event.target)) return;
    const targetCard = event.target.closest?.('.card');
    if (targetCard && targetCard !== sourceCard) return;
    if (targetCard === sourceCard) return;
    if (!interacting && firstCard === sourceCard && !secondCard) maybeClose();
  };
  hoverTarget.addEventListener('pointerleave', onLeave);
  hoverTarget.addEventListener('pointerenter', onEnter);
  hoverTarget.addEventListener('pointerdown', onPointerDown);
  hoverTarget.addEventListener('pointerup', onPointerUp);
  hoverTarget.addEventListener('pointercancel', onPointerUp);
  viewers.forEach(viewer => {
    viewer.addEventListener('pointerdown', onPointerDown);
    viewer.addEventListener('pointerup', onPointerUp);
    viewer.addEventListener('pointercancel', onPointerUp);
  });
  window.addEventListener('pointerdown', onOutsidePointer, true);
  motionSingleCleanup = () => {
    clearLeave();
    hoverTarget.removeEventListener('pointerleave', onLeave);
    hoverTarget.removeEventListener('pointerenter', onEnter);
    hoverTarget.removeEventListener('pointerdown', onPointerDown);
    hoverTarget.removeEventListener('pointerup', onPointerUp);
    hoverTarget.removeEventListener('pointercancel', onPointerUp);
    viewers.forEach(viewer => {
      viewer.removeEventListener('pointerdown', onPointerDown);
      viewer.removeEventListener('pointerup', onPointerUp);
      viewer.removeEventListener('pointercancel', onPointerUp);
    });
    window.removeEventListener('pointerdown', onOutsidePointer, true);
  };
}
async function motionCloseSinglePreview() {
  detachMotionSingleInteraction();
  if (!firstCard || !motionFloatingFirst) return;
  const source    = firstCard;
  const cloneCard = motionFloatingFirst.firstElementChild;
  if (cloneCard) cloneCard.classList.remove('flipped');
  await motionWait(170);
  await animateMotionShell(motionFloatingFirst, getMotionCardRect(source), { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' });
  motionFloatingFirst.remove();
  motionFloatingFirst = null;
  setMotionSourceHidden(source, false);
  source.classList.add('flipped');
  setMotionFocusMode(false);
}
async function ensureMotionFirstPreview(card) {
  setMotionFocusMode(true);
  setMotionSourceHidden(card, true);
  if (!motionFloatingFirst) motionFloatingFirst = createMotionClone(card);
  const cloneCard = motionFloatingFirst.firstElementChild;
  cloneCard.classList.remove('flipped');
  await motionWait(10);
  cloneCard.classList.add('flipped');
  await animateMotionShell(motionFloatingFirst, getMotionPreviewRects(getMotionCardRect(card)).single, { duration: 200, rotate: 0, comparing: true });
  attachMotionSingleInteraction(motionFloatingFirst, card);
}
async function ensureMotionPairPreview(first, second) {
  detachMotionSingleInteraction();
  setMotionFocusMode(true);
  if (!motionFloatingFirst) {
    setMotionSourceHidden(first, true);
    motionFloatingFirst = createMotionClone(first);
    motionFloatingFirst.firstElementChild.classList.add('flipped');
  }
  setMotionSourceHidden(second, true);
  if (!motionFloatingSecond) motionFloatingSecond = createMotionClone(second);
  const secondCloneCard = motionFloatingSecond.firstElementChild;
  secondCloneCard.classList.remove('flipped');
  const rects = getMotionPreviewRects(getMotionCardRect(first));
  await Promise.all([
    animateMotionShell(motionFloatingFirst, rects.firstPair, { duration: 150, rotate: -2.4, comparing: true }),
    (async () => {
      await motionWait(25);
      secondCloneCard.classList.add('flipped');
      await animateMotionShell(motionFloatingSecond, rects.secondPair, { duration: 200, rotate: 2.4, comparing: true });
    })(),
  ]);
}
async function waitForPointerToLeavePairPreview() {
  if (!motionFloatingFirst || !motionFloatingSecond) return;
  let lastX = -99999, lastY = -99999, seenMove = false;
  let hasEnteredPreview = motionFloatingFirst.matches(':hover') || motionFloatingSecond.matches(':hover');
  const onMove = (event) => { lastX = event.clientX; lastY = event.clientY; seenMove = true; };
  window.addEventListener('pointermove', onMove, true);
  try {
    while (motionFloatingFirst && motionFloatingSecond) {
      const a = motionFloatingFirst.getBoundingClientRect();
      const b = motionFloatingSecond.getBoundingClientRect();
      const left = Math.min(a.left, b.left), top = Math.min(a.top, b.top);
      const right = Math.max(a.right, b.right), bottom = Math.max(a.bottom, b.bottom);
      const insideHover       = motionFloatingFirst.matches(':hover') || motionFloatingSecond.matches(':hover');
      const insideCombinedArea = seenMove && lastX >= left && lastX <= right && lastY >= top && lastY <= bottom;
      if (insideHover || insideCombinedArea) hasEnteredPreview = true;
      if (hasEnteredPreview && !insideHover && seenMove && !insideCombinedArea) break;
      await motionWait(40);
    }
  } finally {
    window.removeEventListener('pointermove', onMove, true);
  }
}
async function motionResolveMatch(first, second) {
  if (!motionFloatingFirst || !motionFloatingSecond) return;
  motionFloatingFirst.classList.add('match-burst');
  motionFloatingSecond.classList.add('match-burst');
  await motionWait(520);
  await Promise.all([
    animateMotionShell(motionFloatingFirst,  getMotionCardRect(first),  { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' }),
    animateMotionShell(motionFloatingSecond, getMotionCardRect(second), { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)' }),
  ]);
  motionFloatingFirst.remove();  motionFloatingSecond.remove();
  motionFloatingFirst = null;    motionFloatingSecond = null;
  setMotionSourceHidden(first, false); setMotionSourceHidden(second, false);
  setMotionFocusMode(false);
}
async function motionResolveMismatch(first, second) {
  if (!motionFloatingFirst || !motionFloatingSecond) return;
  await waitForPointerToLeavePairPreview();
  if (!motionFloatingFirst || !motionFloatingSecond) return;
  motionFloatingFirst.firstElementChild.classList.remove('flipped');
  motionFloatingSecond.firstElementChild.classList.remove('flipped');
  await motionWait(180);
  await Promise.all([
    animateMotionShell(motionFloatingFirst,  getMotionCardRect(first),  { duration: 340, easing: 'cubic-bezier(.4,0,.2,1)' }),
    animateMotionShell(motionFloatingSecond, getMotionCardRect(second), { duration: 340, easing: 'cubic-bezier(.4,0,.2,1)' }),
  ]);
  motionFloatingFirst.remove();  motionFloatingSecond.remove();
  motionFloatingFirst = null;    motionFloatingSecond = null;
  setMotionSourceHidden(first, false); setMotionSourceHidden(second, false);
  setMotionFocusMode(false);
}
function resetMotionState() {
  detachMotionSingleInteraction();
  motionFloatingFirst?.remove();
  motionFloatingSecond?.remove();
  motionFloatingFirst  = null;
  motionFloatingSecond = null;
  motionBusy = false;
  setMotionFocusMode(false);
  document.querySelectorAll('.card.is-hidden-source').forEach(card => card.classList.remove('is-hidden-source'));
}
function repositionMotionOpenCards() {
  if (!firstCard) return;
  const rects = getMotionPreviewRects(getMotionCardRect(firstCard));
  if (motionFloatingFirst) {
    const target = secondCard && motionFloatingSecond ? rects.firstPair : rects.single;
    motionFloatingFirst.style.transition = 'none';
    motionFloatingFirst.style.left    = `${target.left}px`;
    motionFloatingFirst.style.top     = `${target.top}px`;
    motionFloatingFirst.style.width   = `${target.width}px`;
    motionFloatingFirst.style.height  = `${target.height}px`;
    motionFloatingFirst.style.transform = `translateZ(0) rotate(${secondCard && motionFloatingSecond ? -2.4 : 0}deg)`;
  }
  if (motionFloatingSecond) {
    motionFloatingSecond.style.transition = 'none';
    motionFloatingSecond.style.left    = `${rects.secondPair.left}px`;
    motionFloatingSecond.style.top     = `${rects.secondPair.top}px`;
    motionFloatingSecond.style.width   = `${rects.secondPair.width}px`;
    motionFloatingSecond.style.height  = `${rects.secondPair.height}px`;
    motionFloatingSecond.style.transform = 'translateZ(0) rotate(2.4deg)';
  }
  requestAnimationFrame(() => {
    if (motionFloatingFirst)  motionFloatingFirst.style.transition  = '';
    if (motionFloatingSecond) motionFloatingSecond.style.transition = '';
  });
}
window.addEventListener('resize', repositionMotionOpenCards);

function resetAnimationSync() {
  if (animationSyncHandle) cancelAnimationFrame(animationSyncHandle);
  animationSyncHandle = null;
  syncedViewers       = [];
  animationSyncStart  = performance.now();
}
function driveSharedAnimationPhase() {
  const elapsedSec    = (performance.now() - animationSyncStart) / 1000;
  const cycleProgress = (elapsedSec % SHARED_ANIMATION_CYCLE) / SHARED_ANIMATION_CYCLE;
  syncedViewers = syncedViewers.filter(viewer => viewer && viewer.isConnected);
  syncedViewers.forEach(viewer => {
    const duration = Number(viewer.dataset.animationDuration || 0);
    if (!duration) return;
    try { viewer.currentTime = cycleProgress * duration; } catch (e) {}
  });
  animationSyncHandle = requestAnimationFrame(driveSharedAnimationPhase);
}
function ensureAnimationSyncLoop() {
  if (animationSyncHandle) return;
  animationSyncStart  = performance.now();
  animationSyncHandle = requestAnimationFrame(driveSharedAnimationPhase);
}
function registerSyncedViewer(viewer) {
  const setupViewerAnimation = () => {
    const animations = Array.isArray(viewer.availableAnimations) ? viewer.availableAnimations : [];
    if (!animations.length) return;
    if (!viewer.animationName) viewer.animationName = animations[0];
    const duration = Number(viewer.duration || 0);
    if (!duration) return;
    viewer.pause();
    viewer.dataset.animationDuration = String(duration);
    if (!syncedViewers.includes(viewer)) syncedViewers.push(viewer);
    ensureAnimationSyncLoop();
  };
  viewer.addEventListener('load', setupViewerAnimation);
  if (viewer.loaded) setupViewerAnimation();
}

function getModeConfig() { return GAME_MODES[selectedMode] || GAME_MODES.classic; }

function resetAiTurn() {
  if (pendingAiTurn) clearTimeout(pendingAiTurn);
  pendingAiTurn = null;
  aiActing      = false;
}

function setSelectedMode(mode) {
  selectedMode = GAME_MODES[mode] ? mode : 'classic';
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('active', card.dataset.mode === selectedMode);
  });
  document.getElementById('mode-caption').textContent = getModeConfig().caption;
  const player2Field = document.getElementById('player2-field');
  if (player2Field) player2Field.style.display = selectedMode === 'two-player' ? 'flex' : 'none';
}

function getPlayerName() {
  const input = document.getElementById('username-input');
  const name  = (input?.value || '').trim();
  return name || 'Player1';
}

function getTwoPlayerNames() {
  const p1 = (document.getElementById('username-input')?.value   || '').trim() || 'Player1';
  const p2 = (document.getElementById('username-input-2')?.value || '').trim() || 'Player2';
  return [p1, p2];
}

function getCompletionSeconds() {
  const mode = getModeConfig();
  return mode.countdown ? Math.max(0, mode.limit - elapsed) : elapsed;
}

function loadLeaderboard() {
  try {
    const raw    = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function saveLeaderboard(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 10)));
}

function renderLeaderboard() {
  const list    = document.getElementById('leaderboard-list');
  const entries = loadLeaderboard();
  if (!entries.length) {
    list.innerHTML = `<div class="leaderboard-empty">No scores yet. Set a username and claim the first record.</div>`;
    return;
  }
  list.innerHTML = entries.map((entry, index) => `
    <div class="leaderboard-row">
      <div class="leaderboard-rank">#${index + 1}</div>
      <div>
        <div class="leaderboard-name">${entry.name}</div>
        <div class="leaderboard-mode">${entry.mode}</div>
      </div>
      <div class="leaderboard-sub">${entry.date}</div>
      <div class="leaderboard-time">${formatTime(entry.seconds)}</div>
    </div>
  `).join('');
}

function openLeaderboard() {
  renderLeaderboard();
  document.getElementById('leaderboard-overlay').classList.add('active');
}

function closeLeaderboard() {
  document.getElementById('leaderboard-overlay').classList.remove('active');
}

function maybeSaveLeaderboard() {
  if (selectedMode === 'two-player') return;
  if (selectedMode === 'vs-ai' && playerScores[0] <= playerScores[1]) return;
  const entries   = loadLeaderboard();
  const candidate = {
    name:    getPlayerName(),
    mode:    getModeConfig().label,
    seconds: getCompletionSeconds(),
    date:    new Date().toLocaleDateString(),
  };
  const merged = [...entries, candidate].sort((a, b) => a.seconds - b.seconds).slice(0, 10);
  saveLeaderboard(merged);
}

function renderHud() {
  const mode = getModeConfig();
  document.getElementById('mode-label').textContent = mode.label;
  let scoreText = `${score} / ${totalPairs}`;
  let turnText  = 'Solo Turn';
  if (selectedMode === 'two-player') {
    const [p1, p2] = getTwoPlayerNames();
    scoreText = `${p1} ${playerScores[0]} - ${p2} ${playerScores[1]}`;
    turnText  = `${[p1, p2][currentPlayerIndex]} Turn`;
  } else if (selectedMode === 'vs-ai') {
    scoreText = `You ${playerScores[0]} - AI ${playerScores[1]}`;
    turnText  = `${mode.players[currentPlayerIndex]} Turn`;
  } else if (selectedMode === 'time-attack') {
    turnText = 'Beat The Clock';
  }
  document.getElementById('score-label').textContent = scoreText;
  document.getElementById('turn-label').textContent  = turnText;
}

function startTimer() {
  const mode = getModeConfig();
  elapsed = mode.countdown ? mode.limit : 0;
  updateTimerLabel();
  timerInterval = setInterval(() => {
    elapsed = mode.countdown ? elapsed - 1 : elapsed + 1;
    updateTimerLabel();
    // Play countdown tick in time-attack mode
    if (mode.countdown && elapsed <= 12 && elapsed > 0) sfxCountdownTick();
    document.getElementById('timer-label').classList.toggle('urgent', mode.countdown ? elapsed <= 12 : elapsed >= 120);
    if (mode.countdown && elapsed <= 0) {
      elapsed = 0; updateTimerLabel(); stopTimer(); resetAiTurn();
      boardLocked = true; stopAmbient(); sfxGameOver();
      document.getElementById('win-title').textContent  = 'Time Up';
      document.getElementById('win-stat').textContent   = `Matched ${score} / ${totalPairs} pairs`;
      document.getElementById('win-overlay').classList.add('active');
    }
  }, 1000);
}

function stopTimer()  { clearInterval(timerInterval); timerInterval = null; }

function updateTimerLabel() {
  const safeElapsed = Math.max(0, elapsed);
  const m = Math.floor(safeElapsed / 60), s = safeElapsed % 60;
  document.getElementById('timer-label').textContent = `${m}:${s.toString().padStart(2,'0')}`;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function showCombo(txt) {
  const el = document.getElementById('combo-flash');
  el.textContent = txt; el.classList.remove('show');
  void el.offsetWidth; el.classList.add('show');
}

function pulseRewardCard(card) {
  card.classList.remove('reward-pop');
  void card.offsetWidth;
  card.classList.add('reward-pop');
}

function flashMismatchCards(a, b) {
  [a, b].forEach(card => {
    card.classList.remove('mismatch-flash');
    void card.offsetWidth;
    card.classList.add('mismatch-flash');
  });
}

// ═══════════════════════════════════════════════════════════════════
//  BUILD GRID
// ═══════════════════════════════════════════════════════════════════

function buildGrid() {
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';

  const bgViewer     = document.getElementById('bg-ambient-sphere');
  const randomModel  = getRandomAnimalAmbient();
  if (bgViewer && randomModel) bgViewer.src = randomModel.src;

  resetAnimationSync();
  resetAiTurn();
  resetMotionState();
  document.getElementById('win-overlay').classList.remove('active');
  document.getElementById('win-title').textContent = 'You Won!';
  document.getElementById('score-label').classList.remove('streak');
  stopTimer();

  score = 0; comboCount = 0; firstCard = null; secondCard = null;
  activeAnchorCard = null; boardLocked = false;
  currentPlayerIndex = 0; playerScores = [0, 0]; aiMemory = new Map();

  const cardData = pickRoundModels();
  totalPairs     = cardData.length / 2;
  renderHud();
  startTimer();

  cardData.forEach((model, idx) => {
    const card = document.createElement('div');
    card.className        = 'card card-shell';
    card.dataset.modelId  = model.id;
    card.dataset.matched  = 'false';
    card.dataset.pendingFlipBack = 'false';
    card.dataset.flipBackArmed   = 'false';
    card.dataset.role = 'idle';
    card.dataset.seen = 'false';
    card.style.animationDelay = `${idx * .025}s`;

    card.innerHTML = `
      <div class="card-shadow-red card-layer-red"></div>
      <div class="card-shadow-yellow card-layer-yellow"></div>
      <div class="card-front">
        <div class="seen-hint" hidden></div>
        <span class="card-number">${idx + 1}</span>
        <span class="card-label">Tap to flip</span>
      </div>
      <div class="card-back is-loading">
        <model-viewer
          src="${model.src}"
          alt="${model.label}"
          autoplay
          auto-rotate
          camera-controls
          interaction-prompt="none"
          environment-image="neutral"
          camera-orbit="0deg 75deg 1.6m"
          field-of-view="28deg"
          shadow-intensity="1"
          exposure="1">
        </model-viewer>
        <div class="gesture-hint" aria-hidden="true">
          <svg class="gesture-hint-svg" viewBox="0 0 32 32" aria-hidden="true">
            <path class="gesture-hand-fill" d="M16.2 5.1c1.3 0 2.3 1 2.3 2.3v8.5h1.2V9.6c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v7.1h1.1v-4.8c0-1.2 1-2.2 2.2-2.2s2.2 1 2.2 2.2v8.2c0 5-4 9-9 9h-3.2c-2.2 0-4.3-.9-5.8-2.4l-3.8-3.8c-.9-.9-.9-2.4 0-3.3.9-.9 2.4-.9 3.3 0l1.8 1.8V7.4c0-1.3 1-2.3 2.3-2.3Z"/>
            <path class="gesture-hand-accent" d="M18.5 16V9.8"/>
            <path class="gesture-hand-accent" d="M24.1 16.7v-4.2"/>
            <path class="gesture-hand-accent" d="M14 22.6l2.3 2.3"/>
          </svg>
        </div>
      </div>
      <div class="card-badge">${getModelCardLabel(model).toUpperCase()}</div>
      <div class="heartbeat-overlay"></div>
      <div class="card-match-tag locked-badge">LOCKED</div>`;

    card.addEventListener('click', () => onModeAwareCardClick(card, false));

    const cardBack = card.querySelector('.card-back');
    const viewer   = card.querySelector('model-viewer');
    registerSyncedViewer(viewer);
    viewer.addEventListener('load',  () => cardBack.classList.remove('is-loading', 'is-error'));
    viewer.addEventListener('pointerdown', () => card.querySelector('.gesture-hint')?.classList.add('is-hidden'));
    viewer.addEventListener('error', () => {
      cardBack.classList.remove('is-loading');
      cardBack.classList.add('is-error');
      console.warn(`Failed to load model: ${model.src}`);
    });

    grid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  CARD CLICK + GAME LOGIC  (unchanged from your original)
// ═══════════════════════════════════════════════════════════════════

function rememberSeenCard(card) {
  const id = card.dataset.modelId;
  if (!aiMemory.has(id)) aiMemory.set(id, new Set());
  aiMemory.get(id).add(card);
  card.dataset.seen = 'true';
  card.querySelector('.seen-hint')?.removeAttribute('hidden');
}

function hidePair(a, b) {
  [a, b].forEach(card => {
    card.classList.remove('flipped');
    card.dataset.pendingFlipBack = 'false';
    card.dataset.flipBackArmed   = 'false';
    card.dataset.role = 'idle';
  });
}

function finishRoundWithWin() {
  stopTimer(); stopAmbient(); sfxWin();
  maybeSaveLeaderboard();
  const [p1, p2] = getTwoPlayerNames();
  document.getElementById('win-title').textContent =
    selectedMode === 'vs-ai'
      ? (playerScores[0] > playerScores[1] ? 'You Won!' : playerScores[0] < playerScores[1] ? 'AI Won' : 'Draw Game')
      : selectedMode === 'two-player'
      ? (playerScores[0] === playerScores[1] ? 'Draw Game' : playerScores[0] > playerScores[1] ? `${p1} Wins` : `${p2} Wins`)
      : 'You Won!';
  document.getElementById('win-stat').textContent =
    selectedMode === 'vs-ai'       ? `You ${playerScores[0]} - AI ${playerScores[1]}`
    : selectedMode === 'two-player' ? `${p1} ${playerScores[0]} - ${p2} ${playerScores[1]}`
    : getModeConfig().countdown     ? `${totalPairs} pairs · ${formatTime(elapsed)} left`
    : `${totalPairs} pairs · ${formatTime(elapsed)}`;
  document.getElementById('win-overlay').classList.add('active');
}

async function handleSuccessfulMatch(a, b) {
  sfxMatch(); score++; comboCount++;
  playerScores[currentPlayerIndex]++;
  a.dataset.matched = 'true'; b.dataset.matched = 'true';
  a.classList.add('matched');  b.classList.add('matched');
  a.dataset.role = 'matched';  b.dataset.role = 'matched';
  const sl = document.getElementById('score-label');
  sl.classList.add('pop'); setTimeout(() => sl.classList.remove('pop'), 300);
  sl.classList.toggle('streak', comboCount >= 2);
  if (comboCount === 2)      showCombo('Nice! 🎯');
  else if (comboCount === 3) showCombo('On fire! 🔥');
  else if (comboCount >= 4)  showCombo(`${comboCount}× Combo! ⚡`);
  if (score === totalPairs - 1) sfxNearWin();
  rememberSeenCard(a); rememberSeenCard(b);
  await motionResolveMatch(a, b);
  pulseRewardCard(a); pulseRewardCard(b);
  firstCard = null; secondCard = null;
  boardLocked = false; motionBusy = false;
  renderHud();
  if (score === totalPairs) return setTimeout(() => finishRoundWithWin(), 260);
  if (selectedMode === 'vs-ai' && currentPlayerIndex === 1)
    pendingAiTurn = setTimeout(() => runAiTurn(), 220);
}

async function handleMismatch(a, b) {
  sfxMismatch(); comboCount = 0;
  document.getElementById('score-label').classList.remove('streak');
  rememberSeenCard(a); rememberSeenCard(b);
  await motionResolveMismatch(a, b);
  hidePair(a, b); flashMismatchCards(a, b);
  firstCard = null; secondCard = null;
  boardLocked = false; motionBusy = false;
  if (selectedMode === 'two-player' || selectedMode === 'vs-ai')
    currentPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
  renderHud();
  if (selectedMode === 'vs-ai' && currentPlayerIndex === 1)
    pendingAiTurn = setTimeout(() => runAiTurn(), 260);
}

function runAiTurn() {
  if (selectedMode !== 'vs-ai' || currentPlayerIndex !== 1 || boardLocked || score === totalPairs) return;
  const hiddenCards = [...document.querySelectorAll('.card')].filter(
    card => card.dataset.matched !== 'true' && !card.classList.contains('flipped')
  );
  if (hiddenCards.length < 2) return;

  let firstPick = null, secondPick = null;
  for (const [, cards] of aiMemory.entries()) {
    const available = [...cards].filter(
      card => card.isConnected && card.dataset.matched !== 'true' && !card.classList.contains('flipped')
    );
    if (available.length >= 2) { [firstPick, secondPick] = available; break; }
  }
  if (!firstPick) {
    firstPick = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
    const knownMatch = [...(aiMemory.get(firstPick.dataset.modelId) || [])].find(
      card => card !== firstPick && card.isConnected && card.dataset.matched !== 'true' && !card.classList.contains('flipped')
    );
    const otherChoices = hiddenCards.filter(card => card !== firstPick);
    secondPick = knownMatch || otherChoices[Math.floor(Math.random() * otherChoices.length)];
  }
  aiActing = true;
  onModeAwareCardClick(firstPick, true);
  pendingAiTurn = setTimeout(() => {
    onModeAwareCardClick(secondPick, true);
    aiActing = false;
  }, 560);
}

async function onModeAwareCardClick(card, fromAI = false) {
  if (boardLocked || motionBusy) return;
  if (selectedMode === 'vs-ai' && currentPlayerIndex === 1 && !fromAI) return;
  if (card.dataset.matched === 'true') return;
  if (card.classList.contains('flipped'))  return;

  if (!firstCard) {
    motionBusy = true;
    sfxFlip();
    firstCard = card;
    card.classList.add('flipped');
    card.dataset.role = 'anchor';
    rememberSeenCard(card);
    await ensureMotionFirstPreview(card);
    motionBusy = false;
    return;
  }

  motionBusy = true;
  sfxFlip();
  secondCard = card;
  card.classList.add('flipped');
  card.dataset.role = 'candidate';
  boardLocked = true;
  rememberSeenCard(card);
  await ensureMotionPairPreview(firstCard, secondCard);

  if (firstCard.dataset.modelId === secondCard.dataset.modelId)
    await handleSuccessfulMatch(firstCard, secondCard);
  else
    await handleMismatch(firstCard, secondCard);
}

// ═══════════════════════════════════════════════════════════════════
//  UI WIRING
// ═══════════════════════════════════════════════════════════════════

document.querySelectorAll('.mode-card').forEach(card => {
  card.addEventListener('click', () => setSelectedMode(card.dataset.mode));
});
setSelectedMode('classic');

const bgViewer           = document.getElementById('bg-ambient-sphere');
const initialAmbientModel = getRandomAnimalAmbient();
if (bgViewer && initialAmbientModel) bgViewer.src = initialAmbientModel.src;

renderHud();
renderLeaderboard();

document.getElementById('btn-play').addEventListener('click', async () => {
  await ensureTone();

  soundEnabled = true;

  const pill = document.getElementById('pill-sound');
  if (pill) {
    const span = pill.querySelector('span');
    if (span) span.textContent = '🔊 Sound On';
  }

  document.getElementById('screen-menu').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');

  await startAmbient();
  buildGrid();
});

document.getElementById('btn-back').addEventListener('click', () => {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-menu').classList.add('active');
  stopTimer(); stopAmbient();
  resetAnimationSync(); resetMotionState();
  document.getElementById('win-overlay').classList.remove('active');
});

document.getElementById('btn-replay').addEventListener('click', () => {
  document.getElementById('win-overlay').classList.remove('active');
  resetMotionState();
  startAmbient(); buildGrid();
});

document.getElementById('pill-leaderboard').addEventListener('click', openLeaderboard);
document.getElementById('btn-close-leaderboard').addEventListener('click', closeLeaderboard);
document.getElementById('leaderboard-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'leaderboard-overlay') closeLeaderboard();
});

// ── Sound toggle pill ──────────────────────────────────────────────
const soundPill = document.getElementById('pill-sound');
if (soundPill) {
  soundPill.addEventListener('click', async () => {
    await ensureTone();
    soundEnabled = !soundEnabled;

    const span = soundPill.querySelector('span');
    if (span) span.textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';

    if (soundEnabled) {
      await startAmbient();
    } else {
      stopAmbient();
    }
  });
}

// ── Mute button (if separate) ─────────────────────────────────────
const muteBtn  = document.getElementById('btn-mute');
const muteIcon = document.getElementById('mute-icon');
if (muteBtn && muteIcon) {
  muteBtn.addEventListener('click', async () => {
    await ensureTone();
    soundEnabled = !soundEnabled;
    localStorage.setItem('trivox_sound', soundEnabled ? 'on' : 'off');
    muteIcon.textContent = soundEnabled ? '🔊' : '🔇';
    soundEnabled ? startAmbient() : stopAmbient();
  });
}

// ── Spotify dock ──────────────────────────────────────────────────
const spotifyDock   = document.getElementById('spotify-dock');
const spotifyToggle = document.getElementById('spotify-toggle');
const spotifyPanel  = document.getElementById('spotify-panel');
const spotifyClose  = document.getElementById('spotify-close');

function openSpotifyPanel() {
  if (!spotifyDock || !spotifyToggle || !spotifyPanel) return;
  spotifyDock.classList.add('is-open');
  spotifyToggle.setAttribute('aria-expanded', 'true');
  spotifyPanel.setAttribute('aria-hidden', 'false');
}
function closeSpotifyPanel() {
  if (!spotifyDock || !spotifyToggle || !spotifyPanel) return;
  spotifyDock.classList.remove('is-open');
  spotifyToggle.setAttribute('aria-expanded', 'false');
  spotifyPanel.setAttribute('aria-hidden', 'true');
}
if (spotifyToggle) {
  spotifyToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    spotifyDock?.classList.contains('is-open') ? closeSpotifyPanel() : openSpotifyPanel();
  });
}
if (spotifyClose) {
  spotifyClose.addEventListener('click', (event) => {
    event.stopPropagation();
    closeSpotifyPanel();
  });
}
document.addEventListener('click', (event) => {
  if (!spotifyDock || !spotifyToggle) return;
  if (spotifyDock.contains(event.target) || spotifyToggle.contains(event.target)) return;
  closeSpotifyPanel();
});

}); // end DOMContentLoaded
