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
      type: e.type || 'walker',
    })),
    movingHazards: (L.movingHazards || []).map(m => ({
      bx: m.x, by: m.y, x: m.x, y: m.y, w: m.w, h: m.h,
      axis: m.axis || 'x', amp: m.amp, speed: m.speed, off: 0, dir: 1,
    })),
    powerups: (L.powerups || []).map(pu => ({ x: pu[0], y: pu[1], w: POWERUP, h: POWERUP, type: pu[2] || 'shield', taken: false })),
    coins: L.coins.map(c => ({ x: c[0], y: c[1], w: COIN, h: COIN, collected: false })),
    goal: { x: L.goal[0], y: L.goal[1], w: GOAL_W, h: GOAL_H },
    player: { x: L.spawn[0], y: L.spawn[1], vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H, onGround: false, facing: 1, jumps: 0, jumpBuffer: 0, touchingWall: false, wallSide: 0, wallKick: 0, wallKickTime: 0 },
    jumpCount: 0,
    spawn: { x: L.spawn[0], y: L.spawn[1] },
    checkpoints: (L.checkpoints || []).map(x => ({ x: x, active: false })),
    checkpoint: { x: L.spawn[0], y: L.spawn[1] }, // aktif yeniden doğuş noktası
    won: false,
    dead: false,
    time: 0,
    collected: 0,
    stomps: 0,
    invincible: 0, // kalkan kalan süre (sn)
    shields: 0,    // toplanan kalkan sayısı (efekt/ses tetikleme için)
    totalCoins: L.coins.length,
  };
}

// Oyuncuya zarar verir; kalkan (invincible) aktifse ölmez. Dönüş: öldü mü.
function hurt(world) {
  if (world.invincible > 0) return false;
  world.dead = true;
  return true;
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
  p.touchingWall = false;
  eachSolid(world, (t) => {
    if (aabb(p, t)) {
      if (dx > 0) { p.x = t.x - p.w; p.touchingWall = true; p.wallSide = 1; }
      else if (dx < 0) { p.x = t.x + t.w; p.touchingWall = true; p.wallSide = -1; }
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

// Oyuncuyu son aktif checkpoint'e (yoksa başlangıca) döndürür.
function respawn(world) {
  const p = world.player;
  const cp = world.checkpoint || world.spawn;
  p.x = cp.x; p.y = cp.y;
  p.vx = 0; p.vy = 0; p.onGround = false; p.jumps = 0;
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
    // Uçan düşman dikeyde de hafif sallanır.
    if (e.type === 'flyer') e.y = e.by + Math.sin((world.time || 0) * 3 + e.bx * 0.02) * 12;
    e.facing = e.dir;
    if (aabb(p, e)) {
      const stomp = p.vy > 0 && (p.y + p.h) <= e.y + e.h * 0.6;
      if (stomp) { e.alive = false; p.vy = STOMP_BOUNCE; p.onGround = false; world.stomps += 1; }
      else { hurt(world); }
    }
  }
}

// Hareketli tehlikeler (testere): devriye gezer, değince öldürür (katı değil).
function updateMovingHazards(world, dt) {
  if (!world.movingHazards || !world.movingHazards.length) return;
  const p = world.player;
  for (const m of world.movingHazards) {
    m.off += m.speed * dt * m.dir;
    if (m.off >= m.amp) { m.off = m.amp; m.dir = -1; }
    else if (m.off <= 0) { m.off = 0; m.dir = 1; }
    m.x = m.bx + (m.axis === 'x' ? m.off : 0);
    m.y = m.by + (m.axis === 'y' ? m.off : 0);
    if (aabb(p, m)) hurt(world);
  }
}

// Bir fizik adımı. input: { left, right, jump } (jump = bu adımda zıplama isteği).
function stepWorld(world, dt, input) {
  if (world.won || world.dead) return;
  const p = world.player;

  updateMovers(world, dt);
  if (world.invincible > 0) world.invincible = Math.max(0, world.invincible - dt);

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) p.facing = dir;
  // Duvar zıplaması itmesi kısa süre yatay kontrolü geçersiz kılar (arka arkaya
  // duvara yapışıp tırmanmayı önler, temiz bir yay verir).
  if (p.wallKickTime > 0) { p.wallKickTime -= dt; p.vx = p.wallKick; }
  else { p.vx = dir * MOVE_SPEED; }

  // Zıplama / duvar zıplaması (jump buffer ile). Havada duvara yaslıyken zıplama
  // duvardan uzağa iter; yoksa normal (yer/çift) zıplama.
  p.jumpBuffer = input.jump ? JUMP_BUFFER : Math.max(0, p.jumpBuffer - dt);
  if (p.jumpBuffer > 0) {
    if (!p.onGround && p.touchingWall) {
      p.vy = JUMP_VELOCITY;
      p.wallKick = -p.wallSide * MOVE_SPEED;
      p.wallKickTime = WALL_KICK_TIME;
      p.jumps = 1;
      p.jumpBuffer = 0;
      world.jumpCount = (world.jumpCount || 0) + 1;
    } else if (p.jumps < MAX_JUMPS) {
      p.vy = JUMP_VELOCITY; p.onGround = false; p.jumps += 1; p.jumpBuffer = 0;
      world.jumpCount = (world.jumpCount || 0) + 1;
    }
  }

  p.vy += GRAVITY * dt;
  if (p.vy > MAX_FALL) p.vy = MAX_FALL;

  moveX(world, p.vx * dt);
  moveY(world, p.vy * dt);
  if (p.onGround) { p.jumps = 0; p.wallKickTime = 0; }

  // Duvara tutunma (wall slide): havada duvara yaslıyken düşme hızını sınırla.
  if (!p.onGround && p.touchingWall && p.vy > WALL_SLIDE_SPEED) p.vy = WALL_SLIDE_SPEED;

  for (const c of world.coins) {
    if (!c.collected && aabb(p, c)) { c.collected = true; world.collected += 1; }
  }

  updateEnemies(world, dt);
  updateMovingHazards(world, dt);

  // Güç-yükseltmesi (kalkan) topla.
  if (world.powerups) {
    for (const pu of world.powerups) {
      if (!pu.taken && aabb(p, pu)) { pu.taken = true; world.invincible = SHIELD_TIME; world.shields = (world.shields || 0) + 1; }
    }
  }

  // Tehlikeye (diken vb.) değme → ölüm (kalkan varsa korur).
  for (const h of world.hazards) { if (aabb(p, h)) { hurt(world); break; } }

  // Checkpoint çizgisini geçince aktifleşir (yeniden doğuş noktası ilerler).
  if (world.checkpoints) {
    for (const cp of world.checkpoints) {
      if (!cp.active && p.x >= cp.x) { cp.active = true; world.checkpoint = { x: cp.x, y: world.spawn.y }; }
    }
  }

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

// Bölüm derecesi 1-3 ⭐: bitirme (1) + tüm coinler (1) + hedef süre (par) altı (1).
function levelStars(levelIndex, time, coins, totalCoins) {
  const par = (LEVELS[levelIndex] && LEVELS[levelIndex].par) || 30;
  let s = 1;
  if (totalCoins > 0 && coins >= totalCoins) s += 1;
  if (time <= par) s += 1;
  return s;
}

// Bir bölüm bitince ilerlemeyi günceller (sonraki bölümü açar; en iyi süre,
// en çok coin ve en yüksek yıldız kalıcı tutulur).
function recordWin(world, prog) {
  prog = prog || {};
  const i = world.level;
  const next = Math.min(LEVELS.length - 1, i + 1);
  prog.unlocked = Math.max(unlockedLevel(prog), next);
  prog.best = prog.best || {};
  const b = prog.best[i] || {};
  b.time = (b.time == null) ? world.time : Math.min(b.time, world.time);
  b.coins = Math.max(b.coins || 0, world.collected);
  b.stars = Math.max(b.stars || 0, levelStars(i, world.time, world.collected, world.totalCoins));
  prog.best[i] = b;
  return prog;
}
