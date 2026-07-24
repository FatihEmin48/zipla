// Zıpla! — saf oyun mantığı (fizik, çarpışma, coin, hedef, ilerleme kaydı).
// DOM/canvas'a dokunmaz → Node ile headless test edilebilir. Fonksiyonlar bir
// `world` nesnesi üzerinde çalışır (global durum yok), böylece izole test edilir.

// AABB çakışması (kenar teması çakışma sayılmaz).
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Bir bölümden yeni dünya kurar.
function createWorld(levelIndex) {
  const i = Math.max(0, Math.min(LEVELS.length - 1, levelIndex | 0));
  const L = LEVELS[i];
  return {
    level: i,
    name: L.name,
    width: L.width,
    height: L.height,
    platforms: L.platforms.map(t => ({ x: t[0], y: t[1], w: t[2], h: t[3] })),
    coins: L.coins.map(c => ({ x: c[0], y: c[1], w: COIN, h: COIN, collected: false })),
    goal: { x: L.goal[0], y: L.goal[1], w: GOAL_W, h: GOAL_H },
    player: { x: L.spawn[0], y: L.spawn[1], vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H, onGround: false, facing: 1 },
    spawn: { x: L.spawn[0], y: L.spawn[1] },
    won: false,
    dead: false,
    time: 0,
    collected: 0,
    totalCoins: L.coins.length,
  };
}

// Yatay hareket + çarpışma çözümü (eksen ayrık AABB).
function moveX(world, dx) {
  const p = world.player;
  p.x += dx;
  for (const t of world.platforms) {
    if (aabb(p, t)) {
      if (dx > 0) p.x = t.x - p.w;
      else if (dx < 0) p.x = t.x + t.w;
      p.vx = 0;
    }
  }
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > world.width) p.x = world.width - p.w;
}

// Dikey hareket + çarpışma çözümü; zemine değince onGround = true.
function moveY(world, dy) {
  const p = world.player;
  p.y += dy;
  p.onGround = false;
  for (const t of world.platforms) {
    if (aabb(p, t)) {
      if (dy > 0) { p.y = t.y - p.h; p.onGround = true; }
      else if (dy < 0) { p.y = t.y + t.h; }
      p.vy = 0;
    }
  }
}

// Oyuncuyu başlangıca (ya da checkpoint'e) döndürür.
function respawn(world) {
  const p = world.player;
  p.x = world.spawn.x; p.y = world.spawn.y;
  p.vx = 0; p.vy = 0; p.onGround = false;
  world.dead = false;
}

// Bir fizik adımı. input: { left, right, jump } (jump = bu adımda zıplama isteği).
function stepWorld(world, dt, input) {
  if (world.won || world.dead) return;
  const p = world.player;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.vx = dir * MOVE_SPEED;
  if (dir !== 0) p.facing = dir;

  if (input.jump && p.onGround) { p.vy = JUMP_VELOCITY; p.onGround = false; }

  p.vy += GRAVITY * dt;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;

  moveX(world, p.vx * dt);
  moveY(world, p.vy * dt);

  for (const c of world.coins) {
    if (!c.collected && aabb(p, c)) { c.collected = true; world.collected += 1; }
  }

  if (aabb(p, world.goal)) world.won = true;

  // Bölüm altına düşme → ölüm.
  if (p.y > world.height + 80) world.dead = true;

  world.time += dt;
}

// --- İlerleme kaydı (localStorage): açılan bölüm + bölüm başına en iyi süre/coin ---
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveProgress(prog) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(prog)); } catch (e) { /* yok */ }
}
function unlockedLevel(prog) { return Math.max(0, Math.min(LEVELS.length - 1, (prog && prog.unlocked) | 0)); }

// Bir bölüm bitince ilerlemeyi günceller (sonraki bölümü açar, en iyi süre/coin).
function recordWin(world, prog) {
  prog = prog || {};
  const i = world.level;
  const next = Math.min(LEVELS.length - 1, i + 1);
  prog.unlocked = Math.max(unlockedLevel(prog), next);
  prog.best = prog.best || {};
  const prev = prog.best[i];
  const result = { time: world.time, coins: world.collected };
  if (!prev || world.time < prev.time) prog.best[i] = result;
  else if (world.collected > (prev.coins || 0)) prog.best[i].coins = world.collected;
  return prog;
}
