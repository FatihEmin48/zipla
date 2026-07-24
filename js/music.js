// Arka plan müziği — Web Audio ile sentezlenen basit, yumuşak chiptune döngü
// (dosyasız). Varsayılan KAPALI; 🎵 düğmesiyle açılır (tercih localStorage'da).
// Lookahead zamanlayıcı ile notalar önceden planlanır (akıcı ritim).
const Music = (function () {
  const KEY = 'zipla_music';
  let ctx = null, master = null, on = false, timer = null;
  let nextTime = 0, step = 0;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) { /* yok */ }

  const BPM = 96;
  const stepDur = 60 / BPM / 2; // sekizlik nota süresi

  // C majör — A4=440'a göre yarım-ton uzaklıkları.
  const N = { C4: -9, D4: -7, E4: -5, F4: -4, G4: -2, A4: 0, B4: 2, C5: 3, D5: 5, E5: 7, G5: 10 };
  const f = (n) => 440 * Math.pow(2, N[n] / 12);
  // 16 adımlık döngü (C – G – Am – F akorları). Bas + arpej melodi.
  const bass = ['C4', null, null, null, 'G4', null, null, null, 'A4', null, null, null, 'F4', null, null, null];
  const mel = ['C5', 'E5', 'G5', 'E5', 'D5', 'G5', 'B4', 'D5', 'C5', 'E5', 'A4', 'C5', 'C5', 'F4', 'A4', 'F4'];

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.06; // arka planda kalsın
    master.connect(ctx.destination);
  }

  function note(freq, t, dur, type, vol) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function scheduler() {
    if (!ctx) return;
    while (nextTime < ctx.currentTime + 0.15) {
      const b = bass[step % 16], m = mel[step % 16];
      if (b) note(f(b), nextTime, stepDur * 3.5, 'triangle', 0.5);
      if (m) note(f(m), nextTime, stepDur * 0.9, 'square', 0.26);
      nextTime += stepDur;
      step++;
    }
  }

  function start() {
    ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* yok */ } }
    nextTime = ctx.currentTime + 0.06; step = 0;
    if (!timer) timer = setInterval(scheduler, 40);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* yok */ }
    if (on) start(); else stop();
    return on;
  }
  function isOn() { return on; }
  // İlk kullanıcı etkileşiminden sonra çağrılır (autoplay politikası): açıksa başlat.
  function resumeIfOn() { if (on && !timer) start(); }

  return { toggle, isOn, resumeIfOn };
})();
