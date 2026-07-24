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
    ctx.fillStyle = '#b0413e';
    roundRect(e.x, e.y, e.w, e.h, 6);
    ctx.fill();
    ctx.fillStyle = '#7d2a28';
    ctx.fillRect(e.x + 2, e.y + e.h - 4, e.w - 4, 4);
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

  function draw(world) {
    let cam = world.player.x + world.player.w / 2 - VIEW_W / 2;
    cam = Math.max(0, Math.min(world.width - VIEW_W, cam));
    const tsec = world.time;

    drawSky();
    drawClouds(cam);

    ctx.save();
    ctx.translate(-Math.round(cam), 0);
    for (const t of world.platforms) drawPlatform(t);
    if (world.movers) for (const m of world.movers) drawMover(m);
    for (const h of world.hazards) drawHazard(h);
    if (world.enemies) for (const e of world.enemies) drawEnemy(e);
    drawGoal(world.goal, tsec);
    for (const c of world.coins) if (!c.collected) drawCoin(c, tsec);
    drawPlayer(world.player);
    ctx.restore();
  }

  return { init, draw };
})();
