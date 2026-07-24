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
    hazards: (L.hazards || []).map(t => ({ x: t[0], y: t[1], w: t[2], h: t[3] })),
    movers: (L.movers || []).map(m => ({
      bx: m.x, by: m.y, x: m.x, y: m.y, w: m.w, h: m.h,
      axis: m.axis || 'x', amp: m.amp, speed: m.speed,
      off: 0, dir: 1, dx: 0, dy: 0,
    })),
    enemies: (L.enemies || []).map(e => ({
      bx: e.x, by: e.y, x: e.x, y: e.y, w: e.w, h: e.h,
      range: e.range, speed: e.speed, off: 0, dir: 1, alive: true, facing: -1,
    })),
    coins: L.coins.map(c => ({ x: c[0], y: c[1], w: COIN, h: COIN, collected: false })),
    goal: { x: L.goal[0], y: L.goal[1], w: GOAL_W, h: GOAL_H },
    player: { x: L.spawn[0], y: L.spawn[1], vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H, onGround: false, facing: 1 },
    spawn: { x: L.spawn[0], y: L.spawn[1] },
    won: false,
    dead: false,
    time: 0,
    collected: 0,
    stomps: 0,
    totalCoins: L.coins.length,
  };
}

// Tüm katı zeminler (sabit platformlar + hareketli platformlar) üzerinde gez.
function eachSolid(world, fn) {
  for (const t of world.platforms) fn(t);
  if (world.movers) for (const m of world.movers) fn(m);
}

// Yatay hareket + çarpışma çözümü (eksen ayrık AABB).
function moveX(world, dx) {
  const p = world.player;
  p.x += dx;
  eachSolid(world, (t) => {
    if (aabb(p, t)) {
      if (dx > 0) p.x = t.x - p.w;
      else if (dx < 0) p.x = t.x + t.w;
      p.vx = 0;
    }
  });
  if (p.x < 0) p.x = 0;
  if (p.x + p.w > world.width) p.x = world.width - p.w;
}

// Dikey hareket + çarpışma çözümü; zemine değince onGround = true.
function moveY(world, dy) {
  const p = world.player;
  p.y += dy;
  p.onGround = false;
  eachSolid(world, (t) => {
    if (aabb(p, t)) {
      if (dy > 0) { p.y = t.y - p.h; p.onGround = true; }
      else if (dy < 0) { p.y = t.y + t.h; }
      p.vy = 0;
    }
  });
}

// Hareketli platformları güncelle; oyuncu üstündeyse onunla birlikte taşı.
function updateMovers(world, dt) {
  if (!world.movers || !world.movers.length) return;
  const p = world.player;
  for (const m of world.movers) {
    const ox = m.x, oy = m.y;
    m.off += m.speed * dt * m.dir;
    if (m.off >= m.amp) { m.off = m.amp; m.dir = -1; }
    else if (m.off <= 0) { m.off = 0; m.dir = 1; }
    m.x = m.bx + (m.axis === 'x' ? m.off : 0);
    m.y = m.by + (m.axis === 'y' ? m.off : 0);
    m.dx = m.x - ox; m.dy = m.y - oy;
    // Oyuncu bu platformun (eski konumdaki) üstünde duruyorsa birlikte taşınır.
    const onTop = p.x < ox + m.w && p.x + p.w > ox && Math.abs((p.y + p.h) - oy) <= 4;
    if (onTop) { p.x += m.dx; p.y += m.dy; }
  }
}

// Oyuncuyu başlangıca (ya da checkpoint'e) döndürür.
function respawn(world) {
  const p = world.player;
  p.x = world.spawn.x; p.y = world.spawn.y;
  p.vx = 0; p.vy = 0; p.onGround = false;
  world.dead = false;
}

// Düşmanları güncelle (devriye) + oyuncu çarpışması: üstüne basılırsa yenilir
// (zıplama sekmesi), yandan/alttan değilirse oyuncu ölür.
function updateEnemies(world, dt) {
  if (!world.enemies || !world.enemies.length) return;
  const p = world.player;
  for (const e of world.enemies) {
    if (!e.alive) continue;
    e.off += e.speed * dt * e.dir;
    if (e.off >= e.range) { e.off = e.range; e.dir = -1; }
    else if (e.off <= 0) { e.off = 0; e.dir = 1; }
    e.x = e.bx + e.off;
    e.facing = e.dir;
    if (aabb(p, e)) {
      const stomp = p.vy > 0 && (p.y + p.h) <= e.y + e.h * 0.6;
      if (stomp) { e.alive = false; p.vy = STOMP_BOUNCE; p.onGround = false; world.stomps += 1; }
      else { world.dead = true; }
    }
  }
}

// Bir fizik adımı. input: { left, right, jump } (jump = bu adımda zıplama isteği).
function stepWorld(world, dt, input) {
  if (world.won || world.dead) return;
  const p = world.player;

  updateMovers(world, dt);

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

  updateEnemies(world, dt);

  // Tehlikeye (diken vb.) değme → ölüm.
  for (const h of world.hazards) { if (aabb(p, h)) { world.dead = true; break; } }

  if (aabb(p, world.goal) && !world.dead) world.won = true;

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
