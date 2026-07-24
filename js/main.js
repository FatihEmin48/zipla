// Başlatma + oyun döngüsü: girdi oku → fizik adımı → çiz → HUD. Bölüm bitince
// kazanma ekranı; ölünce başa döner; R yeniden başlatır. İlerleme localStorage.
(function () {
  let world, prog, paused = false, last = 0, deaths = 0;
  let els = {};

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
    showOverlay(
      `<h2>🏁 Bölüm Tamam!</h2>` +
      `<div class="ov-stat">⏱️ Süre: <b>${fmtTime(world.time)}</b></div>` +
      `<div class="ov-stat">🪙 Coin: <b>${world.collected}/${world.totalCoins}</b></div>` +
      `<div class="ov-stat">🏆 En iyi: <b>${fmtTime(best.time)}</b></div>` +
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
      b.textContent = i > unlocked ? '🔒' : (i + 1);
      if (i <= unlocked) b.addEventListener('click', () => startLevel(i));
      els.levelbar.appendChild(b);
    }
  }

  function updateHUD() {
    els.hudLevel.textContent = `Bölüm ${world.level + 1} · ${world.name}`;
    els.hudCoins.textContent = `🪙 ${world.collected}/${world.totalCoins}`;
    els.hudTime.textContent = `⏱️ ${fmtTime(world.time)}`;
  }

  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    const input = Input.read();
    if (input.restart && !paused) startLevel(world.level);
    if (!paused) {
      stepWorld(world, dt, input);
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
    els.hudTime = document.getElementById('hud-time');

    Render.init(els.canvas);
    Input.attach();
    Input.bindButton(document.getElementById('btn-left'), 'left');
    Input.bindButton(document.getElementById('btn-right'), 'right');
    Input.bindButton(document.getElementById('btn-jump'), 'jump');
    document.getElementById('btn-restart').addEventListener('click', () => startLevel(world.level));

    prog = loadProgress();
    startLevel(unlockedLevel(prog));

    last = performance.now();
    requestAnimationFrame(loop);
  });
})();
