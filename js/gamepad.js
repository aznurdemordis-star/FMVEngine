import { state, FPS, BTN_MAP, BTN_COLOR_MAP, AUTO_TRIGGER_BTN, currentScene } from './state.js';
import { videos, padHint, pauseOverlay } from './dom.js';
import { toast } from './ui.js';

let startWasPressed = false;

function executeAction(mode, dest, targetLayer = 0) {
  if (mode === 'none' || !dest) return;
  if (mode === 'jump') {
    const v = videos[targetLayer];
    if (v) v.currentTime = parseInt(dest) / FPS;
  } else if (mode === 'video') {
    import('./video.js').then(m => m.fetchVideo(dest, targetLayer));
  } else if (mode === 'scene') {
    import('./scenes.js').then(m => m.loadSceneByName(dest));
  }
}

function togglePause() {
  const isPaused = pauseOverlay.style.display === 'flex';
  if (isPaused) {
    pauseOverlay.style.display = 'none';
    videos.forEach(v => { if (v.src) v.play().catch(() => {}); });
  } else {
    videos.forEach(v => v.pause());
    pauseOverlay.style.display = 'flex';
  }
}

export function checkGamepad() {
  const gp = navigator.getGamepads()[0];
  const startPressed = !!gp?.buttons?.[9]?.pressed;
  if (startPressed && !startWasPressed) {
    togglePause();
  }
  startWasPressed = startPressed;

  if (state.isEdit || document.hidden) {
    padHint.classList.remove('active');
    requestAnimationFrame(checkGamepad);
    return;
  }

  let hintShown = false;
  const jumps = currentScene().jumps;

  jumps.forEach((j, idx) => {
    const srcLayer = j.sourceLayer ?? 0;
    const tgtLayer = j.targetLayer ?? 0;
    const srcVideo = videos[srcLayer];
    if (!srcVideo) return;

    const presented = state.presentedFrames[srcLayer];
    const f = presented >= 0 ? presented : Math.floor(srcVideo.currentTime * FPS);
    const inside = f >= j.in && f <= j.out;
    const rt = state.jumpRuntime[idx] || { acted: false, wasInside: false, lastFrame: -1 };
    const crossedInto = rt.lastFrame < j.in && f >= j.in;

    if (inside && !rt.wasInside) rt.acted = false;
    if (crossedInto) rt.acted = false;

    if (inside && j.btn !== AUTO_TRIGGER_BTN && !hintShown) {
      padHint.textContent = BTN_MAP[j.btn] || "?";
      const color = BTN_COLOR_MAP[j.btn] || BTN_COLOR_MAP.default;
      padHint.style.borderColor = color;
      padHint.style.boxShadow = `0 0 40px ${color}aa`;
      padHint.classList.add('active');
      hintShown = true;
    }

    if ((inside || crossedInto) && j.btn === AUTO_TRIGGER_BTN && !rt.acted) {
      rt.acted = true;
      executeAction(j.sMode, j.sDest, tgtLayer);
    } else if (inside && gp && gp.buttons[j.btn]?.pressed && !rt.acted) {
      rt.acted = true;
      toast("REUSSITE !");
      executeAction(j.sMode, j.sDest, tgtLayer);
    }

    // Loop zone: seek back if we're at/past OUT and haven't acted — even if RAF was late and f jumped past
    if (j.loop && !rt.acted && (inside || rt.wasInside) && f >= j.out) {
      srcVideo.currentTime = j.in / FPS;
      rt.wasInside = true;
      rt.lastFrame = j.in;
      state.jumpRuntime[idx] = rt;
      return;
    }

    if (!inside && rt.wasInside && !rt.acted && !j.loop) {
      toast("ECHEC...");
      executeAction(j.fMode, j.fDest, tgtLayer);
    }

    rt.wasInside = inside;
    rt.lastFrame = f;
    state.jumpRuntime[idx] = rt;
  });

  if (!hintShown) padHint.classList.remove('active');

  requestAnimationFrame(checkGamepad);
}

export function initFocusSafety() {
  window.addEventListener('blur', () => {
    if (!state.isEdit && videos.some(v => v.src && !v.paused)) {
      videos.forEach(v => v.pause());
      pauseOverlay.style.display = 'flex';
    }
  });

  pauseOverlay.onclick = () => {
    togglePause();
  };
}
