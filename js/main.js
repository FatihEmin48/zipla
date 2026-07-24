// Başlatma + oyun döngüsü: girdi oku → fizik adımı → çiz → HUD. Bölüm bitince
// kazanma ekranı; ölünce başa döner; R yeniden başlatır. İlerleme localStorage.
(function () {
  let world, prog, paused = false, last = 0, deaths = 0;
  let els = {};
  let prev = { collected: 0, stomps: 0, dead: false, won: false, jumps: 0 };

  function fmtTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec * 100) % 100);
    return `${m}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  function startLevel(i) {
    world = createWorld(i);
    deaths = 0;
    paused = false;
    prev = { collected: 0, stomps: 0, dead: false, won: false, jumps: 0 };
    hideOverlay();
    buildLevelBar();
  }

  function onWin() {
    paused = true;
    prog = recordWin(world, prog);
    saveProgress(prog);
    buildLevelBar();
    const hasNext = world.level < LEVELS.length - 1;
    const best = prog.best[world.level];
    const par = LEVELS[world.level].par;
    const stars = levelStars(world.level, world.time, world.collected, world.totalCoins);
    showOverlay(
      `<h2>🏁 Bölüm Tamam!</h2>` +
      `<div class="ov-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>` +
      `<div class="ov-stat">⏱️ Süre: <b>${fmtTime(world.time)}</b> · hedef ${par}s ${world.time <= par ? '✓' : '✗'}</div>` +
      `<div class="ov-stat">🪙 Coin: <b>${world.collected}/${world.totalCoins}</b> ${world.collected >= world.totalCoins ? '✓' : ''}</div>` +
      `<div class="ov-stat">🥾 Düşman: <b>${world.stomps}</b></div>` +
      `<div class="ov-stat">🏆 En iyi: <b>${fmtTime(best.time)}</b> · ${'★'.repeat(best.stars || 0)}</div>` +
      `<div class="ov-btns">` +
      (hasNext ? `<button id="ov-next" class="ov-btn">Sonraki ▶</button>` : `<button id="ov-next" class="ov-btn">🎉 Bitti — Baştan</button>`) +
      `<button id="ov-replay" class="ov-btn ghost">Tekrar</button>` +
      `</div>`
    );
    document.getElementById('ov-next').addEventListener('click', () => {
      startLevel(hasNext ? world.level + 1 : 0);
    });
    document.getElementById('ov-replay').addEventListener('click', () => startLevel(world.level));
  }

  function showOverlay(html) { els.overlay.innerHTML = html; els.overlay.classList.remove('hidden'); }
  function hideOverlay() { els.overlay.classList.add('hidden'); }

  function buildLevelBar() {
    const unlocked = unlockedLevel(prog);
    els.levelbar.innerHTML = '';
    for (let i = 0; i < LEVELS.length; i++) {
      const b = document.createElement('button');
      b.className = 'lvl-btn' + (world && world.level === i ? ' cur' : '') + (i > unlocked ? ' locked' : '');
      const bi = prog.best && prog.best[i];
      b.innerHTML = i > unlocked ? '🔒' : `${i + 1}` + (bi && bi.stars ? `<span class="lvl-stars">${'★'.repeat(bi.stars)}</span>` : '');
      if (i <= unlocked) b.addEventListener('click', () => startLevel(i));
      els.levelbar.appendChild(b);
    }
  }

  function updateHUD() {
    els.hudLevel.textContent = `Bölüm ${world.level + 1} · ${world.name}`;
    els.hudCoins.textContent = `🪙 ${world.collected}/${world.totalCoins}`;
    els.hudDeaths.textContent = `☠️ ${deaths}`;
    els.hudTime.textContent = `⏱️ ${fmtTime(world.time)}`;
  }

  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    const input = Input.read();
    if (input.restart && !paused) startLevel(world.level);
    if (!paused) {
      stepWorld(world, dt, input);
      // Durum farkından ses olayları
      const pl = world.player;
      if (world.collected > prev.collected) Sound.play('coin');
      if (world.stomps > prev.stomps) Sound.play('stomp');
      if (world.dead && !prev.dead) Sound.play('death');
      if (world.won && !prev.won) Sound.play('win');
      if (pl.jumps > prev.jumps) Sound.play('jump');
      prev.collected = world.collected; prev.stomps = world.stomps;
      prev.dead = world.dead; prev.won = world.won; prev.jumps = pl.jumps;
      if (world.dead) { deaths++; respawn(world); }
      if (world.won) onWin();
    }
    Render.draw(world);
    updateHUD();
    requestAnimationFrame(loop);
  }

  window.addEventListener('DOMContentLoaded', () => {
    els.canvas = document.getElementById('game');
    els.overlay = document.getElementById('overlay');
    els.levelbar = document.getElementById('levelbar');
    els.hudLevel = document.getElementById('hud-level');
    els.hudCoins = document.getElementById('hud-coins');
    els.hudDeaths = document.getElementById('hud-deaths');
    els.hudTime = document.getElementById('hud-time');

    Render.init(els.canvas);
    Input.attach();
    Input.bindButton(document.getElementById('btn-left'), 'left');
    Input.bindButton(document.getElementById('btn-right'), 'right');
    Input.bindButton(document.getElementById('btn-jump'), 'jump');
    document.getElementById('btn-restart').addEventListener('click', () => startLevel(world.level));

    const soundBtn = document.getElementById('sound-btn');
    const syncSound = () => { const on = Sound.isEnabled(); soundBtn.textContent = on ? '🔊' : '🔇'; soundBtn.classList.toggle('muted', !on); };
    soundBtn.addEventListener('click', () => { Sound.toggle(); syncSound(); });
    syncSound();

    // Tam ekran + (destekleniyorsa) yatay kilitleme — telefonda yatay oynanış.
    document.getElementById('fs-btn').addEventListener('click', async () => {
      try {
        const el = document.documentElement;
        if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) { try { await screen.orientation.lock('landscape'); } catch (e) { /* iOS vb. desteklemez */ } }
      } catch (e) { /* yok */ }
    });

    prog = loadProgress();
    startLevel(unlockedLevel(prog));

    last = performance.now();
    requestAnimationFrame(loop);

    // PWA: service worker (yüklenebilir + çevrimdışı). Desteklenmezse sessiz geçilir.
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
  });
})();
