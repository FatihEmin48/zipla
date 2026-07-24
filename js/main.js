// Başlatma + oyun döngüsü: girdi oku → fizik adımı → çiz → HUD. Bölüm bitince
// kazanma ekranı; ölünce başa döner; R yeniden başlatır. İlerleme localStorage.
(function () {
  let world, prog, paused = false, last = 0, deaths = 0;
  let els = {};
  let prev = { collected: 0, stomps: 0, dead: false, won: false, jumpCount: 0 };

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
    prev = { collected: 0, stomps: 0, dead: false, won: false, jumpCount: 0 };
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
    const allDone = completedCount() === LEVELS.length;
    showOverlay(
      `<h2>🏁 Bölüm Tamam!</h2>` +
      `<div class="ov-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>` +
      (allDone ? `<div class="ov-done">🏆 Tüm bölümleri bitirdin! ⭐ ${totalStars()}/${3 * LEVELS.length}</div>` : '') +
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

  function totalStars() {
    let s = 0;
    for (let i = 0; i < LEVELS.length; i++) s += (prog.best && prog.best[i] && prog.best[i].stars) || 0;
    return s;
  }
  function completedCount() {
    let c = 0;
    for (let i = 0; i < LEVELS.length; i++) if (prog.best && prog.best[i]) c++;
    return c;
  }
  function updateProgressLine() {
    const s = totalStars(), max = 3 * LEVELS.length;
    let txt = `⭐ ${s}/${max}`;
    if (completedCount() === LEVELS.length) txt += (s === max ? ' · TÜM YILDIZLAR! 🏆' : ' · tüm bölümler bitti! 🎉');
    els.progressLine.textContent = txt;
  }

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
    updateProgressLine();
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
      const cx = pl.x + pl.w / 2, cy = pl.y + pl.h / 2, feet = pl.y + pl.h;
      if (world.collected > prev.collected) { Sound.play('coin'); Render.burst(cx, cy, '#f1c40f', 8, { speed: 140, life: 0.5, r: 3 }); }
      if (world.stomps > prev.stomps) { Sound.play('stomp'); Render.burst(cx, feet, '#b0413e', 10, { speed: 150, life: 0.4, r: 3 }); }
      if (world.dead && !prev.dead) { Sound.play('death'); Render.burst(cx, cy, '#4dd0e1', 14, { speed: 190, life: 0.6, r: 3 }); }
      if (world.won && !prev.won) { Sound.play('win'); Render.burst(cx, cy, '#f1c40f', 20, { speed: 200, life: 0.8, r: 3 }); }
      if (world.jumpCount > prev.jumpCount) { Sound.play('jump'); Render.burst(cx, feet, '#cdeeff', 5, { speed: 80, up: 40, life: 0.3, r: 2 }); }
      prev.collected = world.collected; prev.stomps = world.stomps;
      prev.dead = world.dead; prev.won = world.won; prev.jumpCount = world.jumpCount;
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
    els.progressLine = document.getElementById('progress-line');
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

    const musicBtn = document.getElementById('music-btn');
    const syncMusic = () => { musicBtn.classList.toggle('off', !Music.isOn()); };
    musicBtn.addEventListener('click', () => { Music.toggle(); syncMusic(); });
    syncMusic();
    // Autoplay politikası: müzik açıksa ilk etkileşimde başlat.
    const kick = () => { Music.resumeIfOn(); window.removeEventListener('keydown', kick); window.removeEventListener('pointerdown', kick); };
    window.addEventListener('keydown', kick);
    window.addEventListener('pointerdown', kick);

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
