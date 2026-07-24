// Canvas çizimi: kamera oyuncuyu yatayda takip eder; gökyüzü + bulut parallax,
// platformlar (çim+toprak), coin'ler, bitiş bayrağı ve karakter çizilir.
const Render = (function () {
  let ctx;

  function init(canvas) { ctx = canvas.getContext('2d'); }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#7ec8ff');
    g.addColorStop(1, '#cdeeff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function hills(offset, baseY, r, step, color) {
    ctx.fillStyle = color;
    for (let x = -(((offset % step) + step) % step) - step; x < VIEW_W + step; x += step) {
      ctx.beginPath();
      ctx.arc(x, baseY, r, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(0, baseY, VIEW_W, VIEW_H - baseY);
  }

  function drawScenery(cam) {
    // güneş
    ctx.fillStyle = 'rgba(255,244,200,0.9)';
    ctx.beginPath(); ctx.arc(VIEW_W - 70, 66, 32, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,250,225,0.35)';
    ctx.beginPath(); ctx.arc(VIEW_W - 70, 66, 44, 0, 7); ctx.fill();
    // tepeler (iki katman, parallax)
    hills(cam * 0.12, 300, 90, 150, '#bfe3b0');
    hills(cam * 0.22 + 80, 322, 120, 190, '#a4d492');
  }

  function drawClouds(cam) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const clouds = [[120, 70], [420, 110], [760, 60], [1050, 120], [1380, 80], [1680, 100]];
    for (const [cx, cy] of clouds) {
      const x = cx - cam * 0.35; // parallax
      const wrapped = ((x % (VIEW_W + 300)) + (VIEW_W + 300)) % (VIEW_W + 300) - 150;
      cloud(wrapped, cy);
    }
  }
  function cloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, 7);
    ctx.arc(x + 22, y + 4, 22, 0, 7);
    ctx.arc(x + 48, y, 16, 0, 7);
    ctx.fill();
  }

  function drawPlatform(t) {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.fillStyle = '#5aa93f';
    ctx.fillRect(t.x, t.y, t.w, 7);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(t.x, t.y + t.h - 4, t.w, 4);
  }

  function drawMover(m) {
    ctx.fillStyle = '#5a6b7a';
    ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.fillStyle = '#9fb4c4';
    ctx.fillRect(m.x, m.y, m.w, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(m.x + 3, m.y + m.h - 3, m.w - 6, 2);
    ctx.fillStyle = '#c9a24b';
    ctx.beginPath(); ctx.arc(m.x + 6, m.y + m.h / 2, 2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(m.x + m.w - 6, m.y + m.h / 2, 2, 0, 7); ctx.fill();
  }

  function drawEnemy(e) {
    if (!e.alive) return;
    const flyer = e.type === 'flyer';
    if (flyer) {
      const wy = e.y + e.h * 0.4;
      const flap = Math.sin(Date.now() / 90) * 4;
      ctx.fillStyle = '#c9a6f0';
      ctx.beginPath(); ctx.moveTo(e.x, wy); ctx.lineTo(e.x - 10, wy - 6 - flap); ctx.lineTo(e.x, wy + 5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(e.x + e.w, wy); ctx.lineTo(e.x + e.w + 10, wy - 6 - flap); ctx.lineTo(e.x + e.w, wy + 5); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = flyer ? '#8e5fd0' : '#b0413e';
    roundRect(e.x, e.y, e.w, e.h, 6);
    ctx.fill();
    if (!flyer) { ctx.fillStyle = '#7d2a28'; ctx.fillRect(e.x + 2, e.y + e.h - 4, e.w - 4, 4); }
    for (let i = 0; i < 2; i++) {
      const gx = i === 0 ? e.x + 8 : e.x + e.w - 8;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(gx, e.y + 12, 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#1a0b0b';
      ctx.beginPath(); ctx.arc(gx + (e.facing > 0 ? 1 : -1), e.y + 12, 1.8, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#1a0b0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x + 4, e.y + 5); ctx.lineTo(e.x + 12, e.y + 8);
    ctx.moveTo(e.x + e.w - 4, e.y + 5); ctx.lineTo(e.x + e.w - 12, e.y + 8);
    ctx.stroke();
  }

  function drawSaw(m) {
    const cx = m.x + m.w / 2, cy = m.y + m.h / 2, r = Math.max(m.w, m.h) / 2;
    const rot = Date.now() / 120;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = '#9aa7b3';
    const teeth = 8;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rr = (i % 2) ? r : r * 0.68;
      const fn = i === 0 ? 'moveTo' : 'lineTo';
      ctx[fn](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5b6670';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawHazard(h) {
    const n = Math.max(1, Math.round(h.w / 16));
    const sw = h.w / n;
    for (let i = 0; i < n; i++) {
      const x = h.x + i * sw;
      ctx.fillStyle = '#9aa7b3';
      ctx.beginPath();
      ctx.moveTo(x, h.y + h.h);
      ctx.lineTo(x + sw / 2, h.y);
      ctx.lineTo(x + sw, h.y + h.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.moveTo(x + sw / 2, h.y);
      ctx.lineTo(x + sw / 2 + 2, h.y + h.h);
      ctx.lineTo(x + sw / 2, h.y + h.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  function star(cx, cy, spikes, outer, inner) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / spikes;
      const rr = (i % 2) ? inner : outer;
      const fn = i === 0 ? 'moveTo' : 'lineTo';
      ctx[fn](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawPowerup(pu) {
    if (pu.taken) return;
    const cx = pu.x + pu.w / 2, cy = pu.y + pu.h / 2, r = pu.w / 2;
    const bob = Math.sin(Date.now() / 300 + pu.x) * 3;
    ctx.fillStyle = 'rgba(126,200,255,0.35)';
    ctx.beginPath(); ctx.arc(cx, cy + bob, r + 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#7ec8ff';
    star(cx, cy + bob, 5, r, r * 0.48); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#eaf3fb';
    star(cx, cy + bob, 5, r, r * 0.48); ctx.stroke();
  }

  function drawCoin(c, tsec) {
    const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const bob = Math.sin(tsec * 4 + c.x * 0.05) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy + bob, c.w / 2, 0, 7);
    ctx.fillStyle = '#f1c40f';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy + bob - 3, 2.5, 0, 7);
    ctx.fill();
  }

  function drawCheckpoint(cp) {
    const x = cp.x, top = 296, bot = 352;
    ctx.fillStyle = '#c9d2da';
    ctx.fillRect(x, top, 3, bot - top);
    ctx.fillStyle = cp.active ? '#5aa93f' : '#8a97a3';
    ctx.beginPath();
    ctx.moveTo(x + 3, top + 2);
    ctx.lineTo(x + 3 + 18, top + 9);
    ctx.lineTo(x + 3, top + 16);
    ctx.closePath();
    ctx.fill();
  }

  function drawGoal(g, tsec) {
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(g.x, g.y, 4, g.h);
    const wave = Math.sin(tsec * 5) * 2;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(g.x + 4, g.y + 2);
    ctx.lineTo(g.x + 4 + 24, g.y + 10 + wave);
    ctx.lineTo(g.x + 4, g.y + 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(g.x + 2, g.y, 4, 0, 7);
    ctx.fill();
  }

  function drawPlayer(p) {
    ctx.fillStyle = '#4dd0e1';
    roundRect(p.x, p.y, p.w, p.h, 7);
    ctx.fill();
    ctx.fillStyle = '#2aa5b8';
    ctx.fillRect(p.x, p.y + p.h - 7, p.w, 7); // ayak gölgesi
    // gözler (yön belli)
    const ex = p.facing > 0 ? p.x + p.w - 12 : p.x + 4;
    for (let i = 0; i < 2; i++) {
      const gx = ex + i * 8;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(gx + 2, p.y + 12, 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#12303a';
      ctx.beginPath(); ctx.arc(gx + 2 + (p.facing > 0 ? 1 : -1), p.y + 12, 1.8, 0, 7); ctx.fill();
    }
  }

  // --- Parçacıklar (görsel efekt) ---
  let particles = [];
  let pLast = 0;
  function burst(x, y, color, count, opts) {
    opts = opts || {};
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (opts.speed || 120) * (0.4 + Math.random() * 0.6);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 0),
        life: opts.life || 0.5, max: opts.life || 0.5, color: color, r: opts.r || 3,
      });
    }
  }
  function updateParticles(dt) {
    for (const p of particles) { p.life -= dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    if (particles.length) particles = particles.filter(p => p.life > 0);
  }
  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw(world) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const pdt = pLast ? Math.min(0.05, (now - pLast) / 1000) : 0;
    pLast = now;
    updateParticles(pdt);

    let cam = world.player.x + world.player.w / 2 - VIEW_W / 2;
    cam = Math.max(0, Math.min(world.width - VIEW_W, cam));
    const tsec = world.time;

    drawSky();
    drawScenery(cam);
    drawClouds(cam);

    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    for (const t of world.platforms) drawPlatform(t);
    if (world.movers) for (const m of world.movers) drawMover(m);
    for (const h of world.hazards) drawHazard(h);
    if (world.movingHazards) for (const m of world.movingHazards) drawSaw(m);
    if (world.checkpoints) for (const cp of world.checkpoints) drawCheckpoint(cp);
    if (world.enemies) for (const e of world.enemies) drawEnemy(e);
    drawGoal(world.goal, tsec);
    if (world.powerups) for (const pu of world.powerups) drawPowerup(pu);
    for (const c of world.coins) if (!c.collected) drawCoin(c, tsec);
    drawPlayer(world.player);
    if (world.invincible > 0) {
      const pp = world.player;
      ctx.strokeStyle = 'rgba(126,200,255,' + (0.4 + 0.3 * Math.sin(Date.now() / 80)) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pp.x + pp.w / 2, pp.y + pp.h / 2, pp.w * 0.9, 0, 7);
      ctx.stroke();
    }
    drawParticles();
    ctx.restore();
  }

  return { init, draw, burst };
})();
