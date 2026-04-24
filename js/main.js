import { state, FPS, currentScene } from './state.js';
import { videos, seekBar, curFEl, totFEl, ctxMenu } from './dom.js';
import * as ui from './ui.js';
import * as videoMod from './video.js';
import * as playlist from './playlist.js';
import * as jumps from './jumps.js';
import * as io from './io.js';
import * as scenes from './scenes.js';
import { checkGamepad, initFocusSafety } from './gamepad.js';
import { closeVideoPicker, loadFromPicker } from './ui.js';

// Expose functions used via inline onclick="..." in HTML
Object.assign(window, ui, videoMod, playlist, jumps, io, scenes);

// Seek bar drives active layer
seekBar.oninput = () => {
  const v = videos[state.activeLayer];
  v.currentTime = seekBar.value / FPS;
  state.presentedFrames[state.activeLayer] = parseInt(seekBar.value, 10) || 0;
  state.jumpRuntime = {};
};

function getPresentedFrame(video, idx, metadata) {
  if (metadata && typeof metadata.mediaTime === 'number') {
    return Math.floor(metadata.mediaTime * FPS);
  }
  return Math.floor((video.currentTime || 0) * FPS);
}

function handlePresentedFrame(video, idx, frame) {
  state.presentedFrames[idx] = frame;

  const loopJump = currentScene().jumps.find((j, jumpIdx) => {
    if (!j.loop || (j.sourceLayer ?? 0) !== idx) return false;
    const rt = state.jumpRuntime[jumpIdx] || { acted: false };
    return !rt.acted && frame >= j.out;
  });
  if (loopJump) {
    video.currentTime = loopJump.in / FPS;
    if (video.paused) video.play().catch(() => {});
    return;
  }

  if (idx !== state.activeLayer) return;
  curFEl.textContent = frame;
  seekBar.value = frame;
}

function attachPresentedFrameTracking(video, idx) {
  if (typeof video.requestVideoFrameCallback !== 'function') return;

  const onFrame = (_now, metadata) => {
    handlePresentedFrame(video, idx, getPresentedFrame(video, idx, metadata));
    video.requestVideoFrameCallback(onFrame);
  };

  video.requestVideoFrameCallback(onFrame);
}

// Per-layer video events
videos.forEach((video, idx) => {
  attachPresentedFrameTracking(video, idx);

  video.addEventListener('timeupdate', () => {
    if (typeof video.requestVideoFrameCallback === 'function') return;
    handlePresentedFrame(video, idx, getPresentedFrame(video, idx));
  });
  video.addEventListener('loadedmetadata', () => {
    if (idx === state.activeLayer) {
      const tot = Math.floor(video.duration * FPS);
      seekBar.max = tot;
      totFEl.textContent = tot;
    }
    video.play().catch(() => {});
  });
  video.addEventListener('ended', () => {
    if (state.isEdit || video.loop) return;
    // If this layer has an active loop-zone jump covering the end, bounce back instead of advancing
    const loopJump = currentScene().jumps.find(j =>
      j.loop && (j.sourceLayer ?? 0) === idx && j.in <= video.duration * FPS && j.out >= video.duration * FPS - 1
    );
    if (loopJump) {
      video.currentTime = loopJump.in / FPS;
      video.play().catch(() => {});
      return;
    }
    const layer = currentScene().layers[idx];
    if (layer.playlist.length > 1) playlist.goToNextVideo(true, idx);
  });
});

// Timeline right-click → context menu to set IN/OUT
seekBar.oncontextmenu = e => {
  e.preventDefault();
  const pct = (e.clientX - seekBar.getBoundingClientRect().left) / seekBar.offsetWidth;
  ctxMenu.dataset.f = Math.floor(pct * (parseInt(seekBar.max) || 0));
  ctxMenu.style.display = 'block';
  ctxMenu.style.left = e.pageX + 'px';
  ctxMenu.style.top = (e.pageY - 110) + 'px';
};
window.addEventListener('click', () => {
  ctxMenu.style.display = 'none';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const picker = document.getElementById('video-picker');
  if (e.key === 'Escape') closeVideoPicker({ target: { id: 'video-picker' } });
  if (e.key === 'Enter' && picker.classList.contains('active')
      && document.activeElement && document.activeElement.id === 'video-picker-url') {
    loadFromPicker();
  }
});

// Layer switcher buttons
document.querySelectorAll('.layer-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    videoMod.setActiveLayer(parseInt(btn.dataset.layer));
  });
});

// Init
initFocusSafety();
io.initImport();
io.renderAudioControls();
scenes.renderSceneUI();
videoMod.setActiveLayer(0);
checkGamepad();
playlist.applyCurrentVideoLoop();
playlist.renderPlaylist();
