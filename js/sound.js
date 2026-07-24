// Basit ses efektleri — Web Audio ile anlık sentezlenir (ses dosyası yok).
// AudioContext ilk kullanıcı etkileşiminde kurulur. Mute tercihi localStorage'da.
const Sound = (function () {
  const MUTE_KEY = 'zipla_muted';
  let ctx = null, master = null, enabled = true;
  try { enabled = localStorage.getItem(MUTE_KEY) !== '1'; } catch (e) { /* yok */ }

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* yok */ } }
    const t0 = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    if (Array.isArray(freq)) {
      osc.frequency.setValueAtTime(freq[0], t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq[1]), t0 + dur);
    } else {
      osc.frequency.setValueAtTime(freq, t0);
    }
    const v = vol == null ? 1 : vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const fx = {
    jump:  () => tone([320, 620], 0.16, 'square', 0.5),
    coin:  () => { tone(880, 0.07, 'square', 0.5); tone(1320, 0.10, 'square', 0.4, 0.06); },
    stomp: () => { tone([420, 90], 0.12, 'sawtooth', 0.6); tone(1200, 0.05, 'square', 0.3); },
    death: () => { tone([440, 90], 0.4, 'sawtooth', 0.5); },
    win:   () => { tone(523, 0.12, 'triangle', 0.6); tone(659, 0.12, 'triangle', 0.6, 0.12); tone(784, 0.12, 'triangle', 0.6, 0.24); tone(1046, 0.22, 'triangle', 0.6, 0.36); },
    ui:    () => tone(660, 0.05, 'square', 0.4),
  };

  function play(name) {
    if (!enabled) return;
    const f = fx[name];
    if (f) { try { f(); } catch (e) { /* sessiz */ } }
  }

  function isEnabled() { return enabled; }
  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(MUTE_KEY, enabled ? '0' : '1'); } catch (e) { /* yok */ }
    if (enabled) play('ui');
    return enabled;
  }

  return { play, toggle, isEnabled };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Sound };
