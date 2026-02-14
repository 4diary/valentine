/* =========================================================
   Valentine — app.js (FULL + Intro + MiniGame)
   - Heart puzzle 5 pieces -> riddles -> lock in order
   - SFX: click/wrong, BGM loop (doesn't stop on SFX)
   - After complete: 2s -> down.mp3, fade, then video bleh.mp4 center, then return
   - After video: final.jpg in #stage on white backing + title "Ты умничка, люблю!!!"
   - Final scene: lots of confetti/bursts/cats + spotlights (rays)
   - In the end music switches to fin.mp3 with crossfade
   - 10s after celebration starts -> dim + show muh.jpg overlay + play muh.mp3 & imp.mp3 once
   - Clicking "Продолжить?" -> intro sequence (ti.gif/ya.gif + typewriter + blinking arrow) with game.mp3,
     then fade-in mini flappy activity (same music continues)
   ========================================================= */

/* ---------------- DOM ---------------- */
const pieces = [...document.querySelectorAll(".piece")];
const hintEl = document.getElementById("hint");

const modal = document.getElementById("modal");
const riddleTitle = document.getElementById("riddleTitle");
const riddleText = document.getElementById("riddleText");
const answerInput = document.getElementById("answerInput");
const errorEl = document.getElementById("error");
const checkBtn = document.getElementById("checkBtn");
const closeBtn = document.getElementById("closeBtn");

const stageEl = document.getElementById("stage");
const heartBase = document.querySelector(".heartBase");
const heartSvg = document.getElementById("heart");
const finalImage = document.getElementById("finalImage");

const musicBtn = document.getElementById("musicBtn");

const fadeEl = document.getElementById("fade");
const cinemaEl = document.getElementById("cinema");
const videoEl = document.getElementById("blehVideo");
const cinemaHint = document.getElementById("cinemaHint");

const titleEl = document.querySelector(".title");

// FX layers
const fxLayer = document.getElementById("fxLayer");
const catLayer = document.getElementById("catLayer");
const lightsLayer = document.getElementById("lightsLayer");

// MUH overlay (must exist in HTML)
const muhOverlay = document.getElementById("muhOverlay");
const muhContinueBtn = document.getElementById("muhContinueBtn");

/* ---------------- Utils ---------------- */
function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function normalize(s){ return (s || "").trim().toLowerCase().replace(/[ё]/g, "е"); }
function setHint(text){ if (hintEl) hintEl.textContent = text; }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* =========================================================
   🎵 MUSIC (HTMLAudio)
   ========================================================= */
const bgmHtml = new Audio("sfx/back.mp3");
bgmHtml.loop = true;
bgmHtml.volume = 0.6;
bgmHtml.preload = "auto";

const finHtml = new Audio("sfx/fin.mp3");
finHtml.loop = true;
finHtml.volume = 0.0;
finHtml.preload = "auto";

// music for intro + game (starts on "Продолжить?")
const gameHtml = new Audio("sfx/game.mp3");
gameHtml.loop = true;
gameHtml.volume = 0.75;
gameHtml.preload = "auto";

let musicUnlocked = false;
let finSwitched = false;

async function ensureMusic() {
  if (musicUnlocked) return;
  try {
    await bgmHtml.play();
    musicUnlocked = true;
    musicBtn?.classList.add("hidden");
  } catch (e) {
    // Autoplay blocked — show button
    musicBtn?.classList.remove("hidden");
  }
}

if (musicBtn) {
  musicBtn.classList.remove("hidden");
  musicBtn.addEventListener("click", () => ensureMusic());
}
document.addEventListener("pointerdown", () => ensureMusic(), { once: true });

function pauseBgmForVideo() {
  try { bgmHtml.pause(); } catch {}
  try { finHtml.pause(); } catch {}
}

function resumeBgmAfterVideo() {
  if (!musicUnlocked) return;
  if (finSwitched) {
    finHtml.play().catch(()=>{});
  } else {
    bgmHtml.volume = 0.6;
    bgmHtml.play().catch(()=>{});
  }
}

function switchToFinalMusic() {
  if (finSwitched) return;
  finSwitched = true;

  finHtml.currentTime = 0;
  finHtml.volume = 0.0;
  finHtml.play().catch(()=>{});

  const duration = 1800;
  const steps = 45;
  const stepTime = duration / steps;

  let i = 0;
  const tmr = setInterval(() => {
    i++;
    const t = i / steps;

    bgmHtml.volume = 0.6 * (1 - t);
    finHtml.volume = 0.7 * t;

    if (i >= steps) {
      clearInterval(tmr);
      try { bgmHtml.pause(); } catch {}
      bgmHtml.currentTime = 0;
      finHtml.volume = 0.7;
    }
  }, stepTime);
}

function fadeOutMusic(ms = 700) {
  // если уже играет финальная — гасим её, иначе гасим обычную
  const a = finSwitched ? finHtml : bgmHtml;

  const startVol = a.volume;
  const steps = 28;
  const stepTime = ms / steps;

  let i = 0;
  const t = setInterval(() => {
    i++;
    const k = 1 - (i / steps);
    a.volume = Math.max(0, startVol * k);

    if (i >= steps) {
      clearInterval(t);
      try { a.pause(); } catch {}
      a.currentTime = 0;
      a.volume = startVol; // вернуть
    }
  }, stepTime);
}

/* =========================================================
   🔊 SFX
   ========================================================= */
const clickSfx = new Audio("sfx/click.wav");
const wrongSfx = new Audio("sfx/wrong.wav");
const downSfx  = new Audio("sfx/down.mp3");

clickSfx.preload = "auto";
wrongSfx.preload = "auto";
downSfx.preload  = "auto";

function playClick() {
  const s = clickSfx.cloneNode();
  s.volume = 0.8;
  s.play().catch(()=>{});
}

function playWrong() {
  const s = wrongSfx.cloneNode();
  s.volume = 0.8;
  s.play().catch(()=>{});
}

function playDown() {
  const s = downSfx.cloneNode();
  s.volume = 0.9;
  s.play().catch(()=>{});
}

/* MUH one-shot sounds */
const muhSfx = new Audio("sfx/muh.mp3");
const impSfx = new Audio("sfx/imp.mp3");
muhSfx.preload = "auto";
impSfx.preload = "auto";

function playMuhPackOnce() {
  const a = muhSfx.cloneNode();
  const b = impSfx.cloneNode();
  a.volume = 1.0;
  b.volume = 1.0;
  a.play().catch(()=>{});
  b.play().catch(()=>{});
}

/* Cute one-shot (post-game question) */
const cuteSfx = new Audio("sfx/cute.mp3");
cuteSfx.preload = "auto";

function playCute() {
  // cute.mp3 is quiet -> play 2 layers to make it louder (≈ +6dB)
  const a = cuteSfx.cloneNode();
  const b = cuteSfx.cloneNode();
  a.volume = 1.0;
  b.volume = 0.9;
  a.play().catch(()=>{});
  b.play().catch(()=>{});
}

function fadeOutAudio(audio, ms = 2500) {
  if (!audio) return;
  const startVol = audio.volume ?? 1;
  const steps = 30;
  const stepTime = ms / steps;
  let i = 0;
  const t = setInterval(() => {
    i++;
    const k = 1 - (i / steps);
    audio.volume = Math.max(0, startVol * k);
    if (i >= steps) {
      clearInterval(t);
      try { audio.pause(); } catch {}
      audio.currentTime = 0;
      audio.volume = startVol;
    }
  }, stepTime);
}


/* =========================================================
   🎆 FINAL FX (confetti/bursts/cats + lights)
   ========================================================= */
let fxRunning = false;
let catTimer = null;
let burstTimer = null;
let confettiTimer = null;
let lightsTimer = null;

function clearFx() {
  if (fxLayer) fxLayer.innerHTML = "";
  if (catLayer) catLayer.innerHTML = "";
  if (lightsLayer) { lightsLayer.classList.remove("on"); lightsLayer.innerHTML = ""; }

  if (catTimer) { clearInterval(catTimer); catTimer = null; }
  if (burstTimer) { clearInterval(burstTimer); burstTimer = null; }
  if (confettiTimer) { clearInterval(confettiTimer); confettiTimer = null; }
  if (lightsTimer) { clearInterval(lightsTimer); lightsTimer = null; }
}

function countFxNodes() {
  const a = fxLayer ? fxLayer.childNodes.length : 0;
  const b = catLayer ? catLayer.childNodes.length : 0;
  const c = lightsLayer ? lightsLayer.childNodes.length : 0;
  return a + b + c;
}

const FX_HARD_CAP = 2600;

function makeConfettiPath(kind = 0) {
  if (kind === 0) return "M-1.8-0.9 H1.8 V0.9 H-1.8 Z";
  if (kind === 1) return "M0-2.1 L2.1 2.1 L-2.1 2.1 Z";
  if (kind === 2) return "M0-2.4 L2.4 0 L0 2.4 L-2.4 0 Z";
  if (kind === 3) return "M-2 0 C-1.2-2.2 1.2-2.2 2 0 C1.2 2.2-1.2 2.2-2 0 Z";
  return "M0-2.6 L0.7-0.7 L2.6 0 L0.7 0.7 L0 2.6 L-0.7 0.7 L-2.6 0 L-0.7-0.7 Z";
}

function spawnConfetti(amount = 220) {
  if (!fxLayer) return;
  if (countFxNodes() > FX_HARD_CAP) return;

  const colors = [
    "#ff3b6a","#ffcc00","#00e5ff","#7c4dff","#00e676","#ff6d00","#ff1744",
    "#ffffff","#ffd1dc","#b3fffd","#e6c7ff"
  ];

  for (let i = 0; i < amount; i++) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("fxConfetti");
    path.setAttribute("d", makeConfettiPath(Math.floor(rand(0, 5))));
    path.setAttribute("fill", pick(colors));

    const x = rand(1, 99);
    const delay = 0;
    const dur = rand(7000, 12000);
    const drift = rand(-620, 620);
    const r0 = rand(0, 360);
    const r1 = r0 + rand(1100, 2600);
    const s = rand(0.7, 2.35);

    path.style.setProperty("--x", `${x}vw`);
    path.style.setProperty("--delay", `${delay}ms`);
    path.style.setProperty("--dur", `${dur}ms`);
    path.style.setProperty("--drift", `${drift}px`);
    path.style.setProperty("--r0", `${r0}deg`);
    path.style.setProperty("--r1", `${r1}deg`);
    path.style.setProperty("--s", `${s}`);

    fxLayer.appendChild(path);
    setTimeout(() => path.remove(), delay + dur + 250);
  }
}

function makeBurstGroup() {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.classList.add("fxBurst");

  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const x1 = Math.cos(a) * 0.6;
    const y1 = Math.sin(a) * 0.6;
    const x2 = Math.cos(a) * 4.6;
    const y2 = Math.sin(a) * 4.6;

    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${x1} ${y1} L${x2} ${y2}`);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", pick(["#ff3b6a", "#ffcc00", "#00e5ff", "#7c4dff", "#00e676", "#ff6d00", "#ffffff"]));
    p.setAttribute("stroke-width", String(rand(0.35, 0.85)));
    p.setAttribute("stroke-linecap", "round");
    g.appendChild(p);
  }
  return g;
}

function spawnBurst() {
  if (!fxLayer) return;
  if (countFxNodes() > FX_HARD_CAP) return;

  const g = makeBurstGroup();
  const bx = rand(8, 92);
  const by = rand(8, 60);
  const bdelay = rand(0, 120);
  const bdur = rand(800, 1400);

  g.style.setProperty("--bx", `${bx}vw`);
  g.style.setProperty("--by", `${by}vh`);
  g.style.setProperty("--bdelay", `${bdelay}ms`);
  g.style.setProperty("--bdur", `${bdur}ms`);

  fxLayer.appendChild(g);
  setTimeout(() => g.remove(), bdelay + bdur + 180);
}

function spawnCat() {
  if (!catLayer) return;
  if (countFxNodes() > FX_HARD_CAP) return;

  const span = document.createElement("span");
  span.className = "catPop";
  span.textContent = "₍^. .^₎⟆₍^. .^₎⟆";

  span.style.left = `${rand(6, 94)}%`;
  span.style.top = `${rand(8, 92)}%`;

  const size = rand(14, 38);
  span.style.fontSize = `${size}px`;
  span.style.setProperty("--cdur", `${rand(700, 1400)}ms`);
  span.style.color = pick(["#ffffff", "#ffe8ef", "#fff7cc", "#e6fffb", "#f2e6ff", "#ffd1dc"]);

  catLayer.appendChild(span);
  setTimeout(() => span.remove(), 1700);
}

/* Lights */
function getStageCenterPx() {
  if (!stageEl) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
  const r = stageEl.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function makeBeam(color, cxPx, cyPx, angleDeg, durMs, wiggleDeg) {
  const d = document.createElement("div");
  d.className = "lightBeam";

  d.style.setProperty("--cx", `${cxPx}px`);
  d.style.setProperty("--cy", `${cyPx}px`);
  d.style.setProperty("--ang", `${angleDeg}deg`);
  d.style.setProperty("--dur", `${durMs}ms`);
  d.style.setProperty("--wiggle", `${wiggleDeg}deg`);

  d.style.background = `radial-gradient(circle at 50% 50%,
    ${color} 0%,
    rgba(255,255,255,0.16) 24%,
    rgba(255,255,255,0.06) 40%,
    rgba(255,255,255,0.00) 64%)`;

  return d;
}

function buildLightsOnce() {
  if (!lightsLayer) return;

  lightsLayer.innerHTML = "";
  lightsLayer.classList.add("on");

  const { cx, cy } = getStageCenterPx();

  const halo = document.createElement("div");
  halo.className = "halo";
  halo.style.setProperty("--cx", `${cx}px`);
  halo.style.setProperty("--cy", `${cy}px`);
  lightsLayer.appendChild(halo);

  const colors = [
    "rgba(255, 40, 120, 0.60)",
    "rgba(80, 220, 255, 0.60)",
    "rgba(255, 220, 60, 0.60)",
    "rgba(150, 90, 255, 0.60)",
    "rgba(60, 255, 170, 0.60)"
  ];

  const beams = 8;
  const baseOffset = rand(0, 360);

  for (let i = 0; i < beams; i++) {
    const baseAng = baseOffset + (i * (360 / beams));
    const ang = baseAng + rand(-14, 14);
    const dur = rand(1300, 2400);
    const wiggle = rand(14, 28);
    lightsLayer.appendChild(makeBeam(pick(colors), cx, cy, ang, dur, wiggle));
  }

  const st = document.createElement("div");
  st.className = "strobe";
  lightsLayer.appendChild(st);
}

function startLights() {
  if (!lightsLayer) return;

  buildLightsOnce();

  if (lightsTimer) clearInterval(lightsTimer);
  lightsTimer = setInterval(() => buildLightsOnce(), 3000);

  const onMove = () => {
    if (!lightsLayer.classList.contains("on")) return;
    buildLightsOnce();
  };
  window.addEventListener("resize", onMove, { passive: true });
  window.addEventListener("scroll", onMove, { passive: true });
}

function startCelebration() {
  if (fxRunning) return;
  fxRunning = true;

  clearFx();

  // warm up
  for (let k = 0; k < 10; k++) {
    setTimeout(() => spawnConfetti(260), k * 55);
  }
  spawnConfetti(1100);

  confettiTimer = setInterval(() => {
    spawnConfetti(220);
    spawnConfetti(180);
  }, 90);

  burstTimer = setInterval(() => {
    const n = Math.floor(rand(2, 5));
    for (let i = 0; i < n; i++) spawnBurst();
  }, 220);

  catTimer = setInterval(() => {
    const n = Math.floor(rand(3, 8));
    for (let i = 0; i < n; i++) spawnCat();
  }, 140);

  startLights();
}

/* =========================================================
   ❤️ GAME LOGIC (puzzle + riddles)
   ========================================================= */
const order = [0, 1, 2, 3, 4];

const riddles = {
  0: { title: "Ну ка", text: "Где мы чмокнулись в первый раз??", answers: ["Дача", "На даче", "дача", "на даче","1"] },
  1: { title: "Отвечай быстро!!", text: "Ты котик???", answers: ["Да", "да","1"] },
  2: { title: "вопрос...", text: "Паста или оливки?))", answers: ["паста", "Паста","1"] },
  3: { title: "Хихихи", text: "Куда была наша первая поездка?", answers: ["Питер", "питер", "Санкт-Петербург", "спб", "Санкт Петербург", "санкт петербург","1"] },
  4: { title: "???", text: "Еще раз, ты киса???", answers: ["Да", "да", "ДА", "y","1"] },
};

const looseTransforms = {
  0: { x: -120, y: -80, r: -14 },
  1: { x:  120, y: -85, r:  12 },
  2: { x: -130, y:  35, r:  18 },
  3: { x:  130, y:  30, r: -16 },
  4: { x:    0, y:  125, r:   7 },
};
const finalTransforms = { 0:{x:0,y:0,r:0},1:{x:0,y:0,r:0},2:{x:0,y:0,r:0},3:{x:0,y:0,r:0},4:{x:0,y:0,r:0} };

let currentStep = 0;
let pendingPieceId = null;
let prankRunning = false;
let swappedToFinal = false;

/* MUH state */
// DEV: start immediately at the "Продолжить?" checkpoint (skip the long path)
const START_AT_CONTINUE = false;

let muhShown = false;
let muhTimer = null;

function pieceElById(id){
  return pieces.find(p => Number(p.dataset.id) === id);
}

function applyTransform(pieceId, t){
  const el = pieceElById(pieceId);
  if (!el) return;
  el.style.setProperty("--tx", `${t.x}px`);
  el.style.setProperty("--ty", `${t.y}px`);
  el.style.setProperty("--tr", `${t.r}deg`);
  el.style.transform = `translate(${t.x}px, ${t.y}px) rotate(${t.r}deg)`;
}

function openModalForPiece(pieceId){
  pendingPieceId = pieceId;
  const r = riddles[pieceId];
  riddleTitle.textContent = r.title;
  riddleText.textContent = r.text;
  errorEl.textContent = "";
  answerInput.value = "";
  modal.classList.remove("hidden");
  setTimeout(() => answerInput.focus(), 0);
}

function closeModal(){
  modal.classList.add("hidden");
  pendingPieceId = null;
}

function lockPiece(pieceId){
  applyTransform(pieceId, finalTransforms[pieceId]);
  const el = pieceElById(pieceId);
  if (el) el.classList.add("locked");
}

function updateNextGlow(){
  pieces.forEach(p => p.classList.remove("next"));
  const nextId = order[currentStep];
  pieceElById(nextId)?.classList.add("next");
}

function showFinalHeart() {
  heartBase?.classList.remove("hiddenHeart");
  heartBase?.classList.add("showHeart");

  pieces.forEach(p => {
    p.classList.remove("next");
    p.style.opacity = 0;
    p.style.pointerEvents = "none";
  });
}

function swapHeartToFinalImage() {
  if (swappedToFinal) return;
  swappedToFinal = true;

  stageEl?.classList.add("stage--final");

  if (heartSvg) {
    heartSvg.style.opacity = "0";
    heartSvg.style.transform = "scale(.9)";
  }

  if (finalImage) {
    finalImage.classList.remove("hidden");
    requestAnimationFrame(() => finalImage.classList.add("show"));
  }

  if (titleEl) titleEl.textContent = "Ты умничка, люблю!!!";

  startCelebration();

  // ✅ Через 10 секунд после старта праздника — MUH overlay
  if (muhTimer) clearTimeout(muhTimer);
  muhTimer = setTimeout(showMuhPrompt, 10000);
}

/* =========================================================
   🎥 Video prank sequence
   ========================================================= */
async function runPrank() {
  if (prankRunning) return;
  prankRunning = true;

  await sleep(2000);

  playDown();
  pauseBgmForVideo();

  fadeEl.classList.remove("hidden");
  fadeEl.classList.remove("dim");
  requestAnimationFrame(() => fadeEl.classList.add("show"));

  await sleep(950);
  await sleep(4200);

  cinemaEl.classList.remove("hidden");
  cinemaHint.classList.add("hidden");
  cinemaEl.setAttribute("aria-hidden", "false");

  let finished = false;

  const finishPrank = async () => {
    if (finished) return;
    finished = true;

    // закрываем кино
    cinemaEl.classList.add("hidden");
    cinemaEl.setAttribute("aria-hidden", "true");
    cinemaHint.classList.add("hidden");

    // убираем затемнение
    fadeEl.classList.remove("show");
    await sleep(950);
    fadeEl.classList.add("hidden");

    // музыка на финальную
    if (musicUnlocked) {
      switchToFinalMusic();
    } else {
      musicBtn?.classList.remove("hidden");
    }

    // ✅ финальная картинка
    swapHeartToFinalImage();

    prankRunning = false;
  };

  // слушаем конец видео
  const onEnded = () => finishPrank();
  videoEl.addEventListener("ended", onEnded, { once: true });

  // пробуем запустить видео
  try {
    videoEl.currentTime = 0;
    await videoEl.play();
  } catch {
    // autoplay blocked — покажем подсказку
    cinemaHint.classList.remove("hidden");

    // ✅ страховка: если юзер не включит — через 6 сек всё равно идём дальше
    setTimeout(() => finishPrank(), 6000);
  }

  // кликом по экрану кино пробуем включить
  cinemaEl.onclick = async () => {
    if (cinemaEl.classList.contains("hidden")) return;
    try {
      await videoEl.play();
      cinemaHint.classList.add("hidden");
    } catch {
      setTimeout(() => finishPrank(), 1200);
    }
  };
}

/* =========================================================
   😼 MUH prompt (dim background + image + button)
   ========================================================= */
function showMuhPrompt() {
  if (muhShown || !muhOverlay) return;
  muhShown = true;

  // Dim with fade
  fadeEl.classList.remove("hidden");
  fadeEl.classList.add("dim");
  requestAnimationFrame(() => fadeEl.classList.add("show"));

  // show overlay
  muhOverlay.classList.remove("hidden");
  muhOverlay.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => muhOverlay.classList.add("show"));

  // финальная музыка должна затухнуть
  fadeOutMusic(500);

  // play sounds once
  playMuhPackOnce();
}

/* =========================================================
   ➡️ Continue -> Intro -> MiniGame
   ========================================================= */
async function startGameFlowFromContinue() {
  // stop MUH timer
  if (muhTimer) { clearTimeout(muhTimer); muhTimer = null; }

  // stop fx/timers
  fxRunning = false;
  clearFx();

  // stop video/cinema clicks
  try { videoEl.pause(); videoEl.currentTime = 0; } catch {}
  cinemaEl.onclick = null;

  // hide MUH overlay & fades
  try {
    muhOverlay.classList.remove("show");
    muhOverlay.classList.add("hidden");
    muhOverlay.setAttribute("aria-hidden", "true");
  } catch {}
  try {
    fadeEl.classList.remove("show");
    await sleep(280);
    fadeEl.classList.add("hidden");
    fadeEl.classList.remove("dim");
  } catch {}

  // stop any old music completely (already faded), then start game.mp3
  try { bgmHtml.pause(); bgmHtml.currentTime = 0; } catch {}
  try { finHtml.pause(); finHtml.currentTime = 0; } catch {}

  // since this is user gesture, autoplay ok
  try {
    gameHtml.currentTime = 0;
    await gameHtml.play();
  } catch {
    // if somehow blocked, try once on next pointer
    document.addEventListener("pointerdown", () => gameHtml.play().catch(()=>{}), { once: true });
  }

  // make a clean black canvas scene (but keep JS alive)
  document.body.innerHTML = "";
  document.documentElement.style.background = "#000";
  document.body.style.background = "#000";
  document.body.style.margin = "0";
  document.body.style.height = "100vh";
  document.body.style.overflow = "hidden";

  // create intro overlay
  const intro = document.createElement("div");
  intro.id = "introOverlay";
  intro.className = "introOverlay";
  intro.innerHTML = `
    <div class="introWrap">
      <div id="introTitle" class="introTitle"></div>
      <img id="introGif" class="introGif" alt="" />
      <div id="introArrow" class="introArrow left">➤</div>
    </div>
  `;
  document.body.appendChild(intro);

  const title = document.getElementById("introTitle");
  const gif = document.getElementById("introGif");
  const arrow = document.getElementById("introArrow");

  const typewriter = async (el, text, speed = 85) => {
    if (!el) return;
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      await sleep(speed);
    }
  };

  const showCard = async ({ gifSrc, text, arrowSide }, holdMs) => {
    gif.src = gifSrc;
    gif.style.display = "";
    arrow.style.display = "";
    arrow.classList.toggle("left", arrowSide === "left");
    arrow.classList.toggle("right", arrowSide === "right");
    await typewriter(title, text, 70);
    await sleep(holdMs);
  };

  // 1) ЭТО ТЫ
  await showCard({ gifSrc: "img/ti.gif", text: "ЭТО ТЫ", arrowSide: "left" }, 5000);

  // 2) А ЭТО Я
  title.textContent = "";
  await showCard({ gifSrc: "img/ya.gif", text: "А ЭТО Я", arrowSide: "left" }, 5000);

  // 3) Быстро лети...
  gif.style.display = "none";
  arrow.style.display = "none";
  title.textContent = "";
  await typewriter(title, "БЫСТРО ЛЕТИ КО МНЕ ٩(ˊᗜˋ*)و ♡", 38);
  await sleep(2600);

  // fade into game
  const f = document.createElement("div");
  f.className = "gameFade on";
  document.body.appendChild(f);
  await sleep(280);

  // clear intro and start game
  document.body.innerHTML = "";
  document.body.style.background = "#000";
  document.body.appendChild(f);
  await sleep(80);
  startFlappyMiniGame();
  // fade off
  requestAnimationFrame(() => f.className = "gameFade off");
  setTimeout(() => f.remove(), 520);
}

/* hook button */
if (muhContinueBtn) {
  muhContinueBtn.addEventListener("click", startGameFlowFromContinue);
}

/* =========================================================
   💖 After MiniGame WIN -> Valentine Question Scene
   ========================================================= */
async function runAfterGameWinScene() {
  // wait 3 seconds after finish
  await sleep(3000);

  // stop game loop & inputs before we replace DOM
  try { window.__stopFlappyLoop && window.__stopFlappyLoop(); } catch {}

  // clear everything on screen
  document.body.innerHTML = "";
  document.documentElement.style.background = "#000";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.height = "100vh";

  // full-screen background back1.jpg
  const bg = document.createElement("div");
  bg.className = "postBg";
  bg.style.backgroundImage = 'url("img/back1.jpg")';
  document.body.appendChild(bg);

  // explosion effect
  const boom = document.createElement("div");
  boom.className = "boom";
  document.body.appendChild(boom);

  // UI card
  const ui = document.createElement("div");
  ui.className = "postCard";
  ui.innerHTML = `
    <div id="postTitle" class="postTitle">Ты моя Валентинка???</div>
    <img id="postGif" class="postGif" src="img/flower.gif" alt="">
    <button id="postYes" class="postYes" type="button">ДА</button>
  `;
  document.body.appendChild(ui);

  // play cute once on enter
  playCute();

  const yesBtn = document.getElementById("postYes");
  const title = document.getElementById("postTitle");
  const gif = document.getElementById("postGif");

  let clicked = false;
  yesBtn.addEventListener("click", async () => {
    if (clicked) return;
    clicked = true;

    // click sfx
    playCute();

    // swap content
    title.textContent = "УРА! ПРАВИЛЬНО!";
    gif.src = "img/fin.gif";
    yesBtn.disabled = true;
    yesBtn.textContent = "❤";

    // wait 5s then fade to black + fade music
    await sleep(5000);

    const endFade = document.createElement("div");
    endFade.className = "endFade";
    document.body.appendChild(endFade);
    requestAnimationFrame(() => endFade.classList.add("show"));

    fadeOutAudio(gameHtml, 3500);

    // keep black
  });
}

/* =========================================================
   🕹️ MiniGame (Flappy postcard)
   - 16:9 window with border, bigger but not full-screen
   - back1.jpg background
   - bubu.gif player (mirrored, animated)
   - ya.gif finish (same size as player)
   - easy physics: gentle fall, soft lift, no "rocket jump"
   ========================================================= */
function startFlappyMiniGame() {
  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.style.background = "#000";
  document.body.style.overflow = "hidden";

  // ===== 16:9 контейнер + рамка (крупнее, но не на весь экран) =====
  const frame = document.createElement("div");
  frame.style.position = "fixed";
  frame.style.left = "50%";
  frame.style.top = "50%";
  frame.style.transform = "translate(-50%, -50%)";
  frame.style.width = "min(98vw, 1500px)";
  frame.style.aspectRatio = "16 / 9";
  frame.style.border = "10px solid rgba(120, 220, 255, 0.95)";
  frame.style.borderRadius = "18px";
  frame.style.boxSizing = "border-box";
  frame.style.overflow = "hidden";
  frame.style.background = "#000";
  frame.style.boxShadow = "0 20px 60px rgba(0,0,0,.55)";
  document.body.appendChild(frame);

  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  frame.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  function frameSize() {
    const r = frame.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function resize() {
    const { w, h } = frameSize();
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const W = () => frameSize().w;
  const H = () => frameSize().h;

  // ===== масштаб под рамку (умеренный) =====
  const SCALE = Math.max(0.95, Math.min(1.25, H() / 720));

  // ===== фон =====
  const bgImg = new Image();
  bgImg.src = "img/back1.jpg";
  let bgReady = false;
  bgImg.onload = () => (bgReady = true);

  // ===== bubu gif =====
  const birdImg = new Image();
  birdImg.src = "img/bubu.gif";
  let birdReady = false;
  birdImg.onload = () => (birdReady = true);

  // парковка, чтобы gif точно анимировался
  birdImg.alt = "";
  birdImg.style.position = "fixed";
  birdImg.style.left = "-9999px";
  birdImg.style.top = "-9999px";
  birdImg.style.width = "1px";
  birdImg.style.height = "1px";
  birdImg.style.opacity = "0.01";
  birdImg.style.pointerEvents = "none";
  document.body.appendChild(birdImg);

  // ===== финиш ya.gif (размер = bubu) =====
  const finishImg = new Image();
  finishImg.src = "img/ya.gif";
  let finishReady = false;
  finishImg.onload = () => (finishReady = true);

  // парковка для ya.gif (если браузер "замораживает" gif в canvas)
  finishImg.alt = "";
  finishImg.style.position = "fixed";
  finishImg.style.left = "-9999px";
  finishImg.style.top = "-9999px";
  finishImg.style.width = "1px";
  finishImg.style.height = "1px";
  finishImg.style.opacity = "0.01";
  finishImg.style.pointerEvents = "none";
  document.body.appendChild(finishImg);

  // ===== параметры "открытки" (планируемая физика) =====
  const TOTAL_PIPES = 5;

  const pipeW = 90 * SCALE;
  const gapHalf = 250 * SCALE;         // окна больше
  const speed = 1.85 * SCALE;          // трубы медленнее
  const gravity = 0.17 * SCALE;        // падение мягче
  const jumpImpulse = -10.6 * SCALE;    // маленький импульс вверх (не ракета)
  const maxUp = -7 * SCALE;            // ограничение резкого взлёта
  const maxDown = 6 * SCALE;           // ограничение резкого падения
  const spawnEveryMs = 1450;           // реже трубы
  const finishGapAfterLastPipePx = 420 * SCALE;

  const bird = {
    x: Math.round(W() * 0.22),
    y: Math.round(H() * 0.5),
    vy: 0,
    size: 104 * SCALE,
  };

  const pipes = [];
  let spawned = 0;
  let pipeTimer = 0;

  let finishX = null;
  let finishY = null;

  let running = true;
  let dead = false;
  let won = false;

  let stopLoop = false;
  let winHandled = false;

  // управление
  function flap() {
    if (!running || dead || won) return;
    bird.vy += jumpImpulse;                 // ✅ добавляем импульс (планирование)
    if (bird.vy < maxUp) bird.vy = maxUp;   // ✅ не "ракетит"
  }

  const onKeyDown = (e) => { if (e.code === "Space") flap(); };
  const onMouseDown = () => flap();
  const onTouchStart = (e) => { e.preventDefault(); flap(); };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("touchstart", onTouchStart, { passive: false });

  // allow external stop (so we can safely replace DOM after finish)
  window.__stopFlappyLoop = () => {
    stopLoop = true;
    try { window.removeEventListener("keydown", onKeyDown); } catch {}
    try { window.removeEventListener("mousedown", onMouseDown); } catch {}
    try { window.removeEventListener("touchstart", onTouchStart); } catch {}
  };

  // коллизии
  function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
    const px = Math.max(rx, Math.min(cx, rx + rw));
    const py = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - px;
    const dy = cy - py;
    return dx * dx + dy * dy <= cr * cr;
  }

  function spawnPipe() {
    const margin = 170 * SCALE;
    const gapY = margin + Math.random() * (H() - margin * 2);
    pipes.push({ x: W() + 40, gapY });
    spawned++;

    if (spawned === TOTAL_PIPES) {
      finishX = W() + 40 + finishGapAfterLastPipePx;
      finishY = Math.round(H() * 0.5);
    }
  }

  function restart() {
    dead = false;
    won = false;
    running = true;

    bird.y = Math.round(H() * 0.5);
    bird.vy = 0;

    pipes.length = 0;
    spawned = 0;
    pipeTimer = 0;

    finishX = null;
    finishY = null;
  }

  // рестарт по клику/пробелу — один раз
  let restartBound = false;
  function bindRestartOnce() {
    if (restartBound) return;
    restartBound = true;

    const once = (e) => {
      if (e.type === "keydown" && e.code !== "Space") return;
      window.removeEventListener("mousedown", once);
      window.removeEventListener("keydown", once);
      restartBound = false;
      restart();
    };

    window.addEventListener("mousedown", once);
    window.addEventListener("keydown", once);
  }

  function drawBgCover() {
    if (!bgReady) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W(), H());
      return;
    }
    const cw = W(), ch = H();
    const iw = bgImg.naturalWidth || 1;
    const ih = bgImg.naturalHeight || 1;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s;
    const dh = ih * s;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  }

  function loop(ts) {
    if (loop.prev == null) loop.prev = ts;
    const dt = ts - loop.prev;
    loop.prev = ts;

    // UPDATE
    if (running && !dead && !won) {
      if (spawned < TOTAL_PIPES) {
        pipeTimer += dt;
        if (pipeTimer >= spawnEveryMs) {
          pipeTimer = 0;
          spawnPipe();
        }
      }

      // физика: плавное падение + лимит скорости
      bird.vy += gravity;
      if (bird.vy > maxDown) bird.vy = maxDown;
      bird.y += bird.vy;

      // вниз можно (не проигрыш) — просто пол
      const floor = H() - bird.size / 2;
      if (bird.y > floor) {
        bird.y = floor;
        bird.vy = 0;
      }
      // потолок тоже не проигрыш
      const ceil = bird.size / 2;
      if (bird.y < ceil) {
        bird.y = ceil;
        bird.vy = 0;
      }

      // движение труб
      for (const p of pipes) p.x -= speed;
      while (pipes.length && pipes[0].x < -pipeW - 160) pipes.shift();

      // движение финиша
      if (finishX != null) finishX -= speed;

      // коллизии = проигрыш
      for (const p of pipes) {
        const topH = p.gapY - gapHalf;
        const botY = p.gapY + gapHalf;

        const hitTop = circleRectCollide(
          bird.x, bird.y, bird.size / 2,
          p.x, 0, pipeW, Math.max(0, topH)
        );
        const hitBot = circleRectCollide(
          bird.x, bird.y, bird.size / 2,
          p.x, botY, pipeW, Math.max(0, H() - botY)
        );

        if (hitTop || hitBot) {
          dead = true;
          running = false;
          bindRestartOnce();
          break;
        }
      }

      // финиш: ya.gif размером как bubu
      if (!dead && finishX != null) {
        const s = bird.size;
        const finishRight = finishX + s / 2;
        if (bird.x > finishRight) {
          won = true;
          running = false;
          if (!winHandled) { winHandled = true; runAfterGameWinScene().catch(()=>{}); }
        }
      }
    }

    // DRAW
    ctx.clearRect(0, 0, W(), H());
    drawBgCover();

    // трубы (чёткие)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const p of pipes) {
      const topH = p.gapY - gapHalf;
      const botY = p.gapY + gapHalf;
      ctx.fillRect(p.x, 0, pipeW, Math.max(0, topH));
      ctx.fillRect(p.x, botY, pipeW, Math.max(0, H() - botY));
    }

    // финиш ya.gif
    if (finishX != null) {
      const fx = finishX;
      const fy = finishY ?? Math.round(H() * 0.5);
      const s = bird.size;

      if (finishReady) {
        ctx.drawImage(finishImg, fx - s / 2, fy - s / 2, s, s);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(fx - s / 2, fy - s / 2, s, s);
      }
    }

    // bubu.gif (отзеркален)
    if (birdReady) {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.scale(-1, 1);
      ctx.drawImage(birdImg, -bird.size / 2, -bird.size / 2, bird.size, bird.size);
      ctx.restore();
    } else {
      // fallback
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#ff6aa2";
      ctx.fill();
    }

    // сообщения в центре (без верхнего HUD)
    if (dead) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = `900 ${Math.round(44 * SCALE)}px system-ui, Arial`;
      ctx.textAlign = "center";
      ctx.fillText("НУУУУ((", W() / 2, H() * 0.48);

      ctx.font = `700 ${Math.round(18 * SCALE)}px system-ui, Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Клик/Пробел — ещё раз", W() / 2, H() * 0.56);
    }

    if (won) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = `900 ${Math.round(44 * SCALE)}px system-ui, Arial`;
      ctx.textAlign = "center";
      ctx.fillText("УРААА❤️", W() / 2, H() * 0.50);
    }

    if (!stopLoop) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}


/* =========================================================
   Init
   ========================================================= */
for (const id of order) applyTransform(id, looseTransforms[id]);
updateNextGlow();
setHint("Нажми на подсвеченный кусочек ✮⋆˙");

// If enabled, jump straight to the checkpoint overlay for faster testing
if (START_AT_CONTINUE) {
  // Make sure overlay elements exist (if script loaded at end of body, they do)
  setTimeout(() => {
    try { showMuhPrompt(); } catch {}
  }, 60);
}

pieces.forEach(p => p.addEventListener("click", e => {
  if (prankRunning || swappedToFinal) return;

  const id = Number(e.currentTarget.dataset.id);
  if (id !== order[currentStep]) {
    setHint("Собираем по порядку ᨐฅ");
    return;
  }
  openModalForPiece(id);
}));

checkBtn.addEventListener("click", () => {
  if (pendingPieceId == null) return;

  const user = normalize(answerInput.value);
  const ok = riddles[pendingPieceId].answers.map(normalize).includes(user);

  if (!ok) {
    playWrong();
    errorEl.textContent = "Не-а >⩊< попробуй ещё раз";
    return;
  }

  playClick();
  lockPiece(pendingPieceId);
  closeModal();

  currentStep++;

  if (currentStep >= order.length) {
    setHint("⎛⎝ ≽ > ⩊ < ≼ ⎠⎞");
    showFinalHeart();
    runPrank();
  } else {
    setHint("Верно! Теперь следующий кусочек ✮⋆˙");
    updateNextGlow();
  }
});

closeBtn.addEventListener("click", closeModal);
answerInput.addEventListener("keydown", e => { if (e.key === "Enter") checkBtn.click(); });
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
