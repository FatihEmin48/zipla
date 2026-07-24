// Girdi: klavye (← → / A D hareket, Boşluk/↑/W zıpla) + dokunmatik butonlar.
// Zıplama kenar-tetiklidir: her okumada bir kez tüketilir (basılı tutmak sekmez).
const Input = (function () {
  const held = { left: false, right: false };
  let jumpQueued = false;
  let restartQueued = false;

  function key(e, down) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') held.left = down;
    else if (k === 'arrowright' || k === 'd') held.right = down;
    else if (k === 'arrowup' || k === 'w' || k === ' ' || k === 'spacebar') { if (down && !e.repeat) jumpQueued = true; }
    else if (k === 'r') { if (down && !e.repeat) restartQueued = true; }
    else return;
    if (down) e.preventDefault();
  }

  function attach() {
    window.addEventListener('keydown', e => key(e, true));
    window.addEventListener('keyup', e => key(e, false));
  }

  // el: buton; kind: 'left' | 'right' | 'jump'
  function bindButton(el, kind) {
    const start = (e) => { e.preventDefault(); if (kind === 'jump') jumpQueued = true; else held[kind] = true; };
    const end = (e) => { e.preventDefault(); if (kind !== 'jump') held[kind] = false; };
    el.addEventListener('touchstart', start, { passive: false });
    el.addEventListener('touchend', end, { passive: false });
    el.addEventListener('touchcancel', end, { passive: false });
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
  }

  // Bu adımın girdisi. jump ve restart bir kez okunur (kenar).
  function read() {
    const s = { left: held.left, right: held.right, jump: jumpQueued, restart: restartQueued };
    jumpQueued = false;
    restartQueued = false;
    return s;
  }

  return { attach, bindButton, read };
})();
