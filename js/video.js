import { state, FPS, LAYER_COUNT, currentScene } from './state.js';
import { videos, fetchBar, seekBar, curFEl, totFEl } from './dom.js';
import { toast } from './ui.js';
import { applyCurrentVideoLoop, renderPlaylist } from './playlist.js';

export function updateVideoFilters() {
  const sat = document.getElementById('v-sat').value;
  const con = document.getElementById('v-con').value;
  const lum = document.getElementById('v-lum').value;
  document.getElementById('val-sat').textContent = sat + "%";
  document.getElementById('val-con').textContent = con + "%";
  document.getElementById('val-lum').textContent = lum + "%";
  const filter = `saturate(${sat}%) contrast(${con}%) brightness(${lum}%)`;
  videos.forEach(v => v.style.filter = filter);
}

export async function fetchVideo(url, layerIdx = state.activeLayer) {
  if (!url) return;
  fetchBar.style.width = "0%";
  const video = videos[layerIdx];
  const layer = currentScene().layers[layerIdx];
  try {
    const resp = await fetch(url);
    const total = parseInt(resp.headers.get('content-length'));
    const reader = resp.body.getReader();
    let loaded = 0, chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total) fetchBar.style.width = (loaded / total * 100) + "%";
    }
    video.src = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
    layer.currentSourceUrl = url;
    if (layerIdx === state.activeLayer) {
      document.getElementById('src-info').textContent = url;
    }
    const idx = layer.playlist.findIndex(item => (typeof item === 'string' ? item : item.url) === url);
    if (idx !== -1) {
      layer.currentVideoIndex = idx;
    } else {
      layer.currentVideoIndex = -1;
      video.loop = false;
    }
    applyCurrentVideoLoop(layerIdx);
    if (layerIdx === state.activeLayer) renderPlaylist();
    setTimeout(() => fetchBar.style.width = "0%", 800);
  } catch (e) {
    console.error(e);
    toast("Erreur URL");
  }
}

export function clearLayerVideo(layerIdx) {
  const layer = currentScene().layers[layerIdx];
  const v = videos[layerIdx];
  v.pause();
  v.removeAttribute('src');
  v.load();
  layer.currentSourceUrl = "";
  layer.currentVideoIndex = -1;
}

export function playPause() {
  const anyPlaying = videos.some(v => v.src && !v.paused);
  if (anyPlaying) {
    videos.forEach(v => v.pause());
  } else {
    videos.forEach(v => { if (v.src) v.play().catch(() => {}); });
  }
}

export function stepFrame(d) {
  const v = videos[state.activeLayer];
  v.pause();
  v.currentTime += d / FPS;
}

export function toggleMode() {
  state.isEdit = !state.isEdit;
  const btn = document.getElementById('btn-mode');
  btn.textContent = state.isEdit ? "MODE ÉDITION" : "MODE JEU";
  btn.style.color = state.isEdit ? "#fff" : "#00f2ff";
  document.getElementById('pause-overlay').style.display = 'none';
}

export function setLayerVolume(layerIdx, value) {
  currentScene().layers[layerIdx].volume = value;
  videos[layerIdx].volume = value;
}

export function setLayerMuted(layerIdx, muted) {
  currentScene().layers[layerIdx].muted = muted;
  videos[layerIdx].muted = muted;
}

export function setLayerVolumeFromUI(idx, value) {
  setLayerVolume(idx, parseInt(value) / 100);
}

export function setLayerMutedFromUI(idx, muted) {
  setLayerMuted(idx, muted);
}

export function setActiveLayer(idx) {
  if (idx < 0 || idx >= LAYER_COUNT) return;
  state.activeLayer = idx;
  document.querySelectorAll('.layer-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.layer) === idx);
  });
  const layer = currentScene().layers[idx];
  document.getElementById('src-info').textContent = layer.currentSourceUrl || "Aucune source chargée";
  const v = videos[idx];
  const tot = Math.floor((v.duration || 0) * FPS);
  seekBar.max = tot || 0;
  totFEl.textContent = tot || 0;
  seekBar.value = Math.floor((v.currentTime || 0) * FPS);
  curFEl.textContent = Math.floor((v.currentTime || 0) * FPS);
  renderPlaylist();
  applyCurrentVideoLoop(idx);
}
