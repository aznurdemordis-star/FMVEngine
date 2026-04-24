import { state, currentScene } from './state.js';
import { videos } from './dom.js';
import { fetchVideo } from './video.js';
import { toast } from './ui.js';

export function getPlaylistUrlAt(index, layerIdx = state.activeLayer) {
  const item = currentScene().layers[layerIdx].playlist[index];
  if (!item) return "";
  return typeof item === 'string' ? item : (item.url || "");
}

export function isPlaylistLoopAt(index, layerIdx = state.activeLayer) {
  const item = currentScene().layers[layerIdx].playlist[index];
  if (!item || typeof item === 'string') return false;
  return !!item.loop;
}

export function applyCurrentVideoLoop(layerIdx = state.activeLayer) {
  const layer = currentScene().layers[layerIdx];
  const video = videos[layerIdx];
  video.loop = isPlaylistLoopAt(layer.currentVideoIndex, layerIdx);
  if (layerIdx !== state.activeLayer) return;
  const loopCheckbox = document.getElementById('playlist-loop');
  if (!loopCheckbox) return;
  loopCheckbox.disabled = layer.currentVideoIndex < 0 || !layer.playlist.length;
  loopCheckbox.checked = video.loop;
}

export function renderPlaylist() {
  const scene = currentScene();
  const layer = scene.layers[state.activeLayer];
  const dl = document.getElementById('playlist-datalist');
  if (dl) {
    const allUrls = new Map();
    scene.layers.forEach((l, li) => l.playlist.forEach(item => {
      const url = typeof item === 'string' ? item : item?.url;
      if (url && !allUrls.has(url)) allUrls.set(url, li);
    }));
    dl.innerHTML = [...allUrls.entries()]
      .map(([url, li]) => `<option value="${url}">L${li} — ${url}</option>`)
      .join('');
  }
  const root = document.getElementById('playlist-list');
  if (!layer.playlist.length) {
    root.innerHTML = '<div style="font-size:10px;color:#666">Aucune video (Scène "' + scene.name + '", Layer ' + state.activeLayer + ')</div>';
    return;
  }
  root.innerHTML = layer.playlist.map((_, i) => {
    const url = getPlaylistUrlAt(i);
    const loopFlag = isPlaylistLoopAt(i) ? ' [LOOP]' : '';
    const isStart = i === layer.startVideoIndex;
    const isCurrent = i === layer.currentVideoIndex;
    return `
    <div onclick="selectVideoFromPlaylist(${i})" style="padding:8px; margin-top:5px; border:1px solid ${isCurrent ? '#00f2ff' : '#252535'}; background:${isCurrent ? 'rgba(0,242,255,0.05)' : '#050508'}; cursor:pointer; border-radius:4px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
      <span onclick="setStartVideo(${i}, event)" title="Définir comme vidéo de départ" style="font-size:11px; flex-shrink:0; opacity:${isStart ? 1 : 0.25}; cursor:pointer" >⭐</span>
      <span style="color:${isCurrent ? '#00f2ff' : '#888'}; font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1">#${i + 1}${loopFlag} ${url}</span>
      <span onclick="removeVideoFromPlaylist(${i}, event)" style="color:#e05; font-weight:bold; padding:0 5px">✕</span>
    </div>
  `;
  }).join('');
}

export function setStartVideo(i, e) {
  e.stopPropagation();
  currentScene().layers[state.activeLayer].startVideoIndex = i;
  renderPlaylist();
  toast("Vidéo de départ (L" + state.activeLayer + ") : #" + (i + 1));
}

export function addVideoToPlaylist() {
  const layer = currentScene().layers[state.activeLayer];
  const input = document.getElementById('playlist-url');
  const url = (input.value || '').trim();
  if (!url) return;
  layer.playlist.push({ url, loop: false });
  input.value = '';
  if (layer.currentVideoIndex === -1) {
    layer.currentVideoIndex = 0;
    layer.startVideoIndex = 0;
    applyCurrentVideoLoop();
    fetchVideo(getPlaylistUrlAt(0));
  }
  renderPlaylist();
  toast("Video ajoutee (Layer " + state.activeLayer + ")");
}

export function selectVideoFromPlaylist(index, layerIdx = state.activeLayer) {
  const layer = currentScene().layers[layerIdx];
  if (index < 0 || index >= layer.playlist.length) return;
  layer.currentVideoIndex = index;
  applyCurrentVideoLoop(layerIdx);
  if (layerIdx === state.activeLayer) renderPlaylist();
  fetchVideo(getPlaylistUrlAt(index, layerIdx), layerIdx);
}

export function goToNextVideo(fromEnded = false, layerIdx = state.activeLayer) {
  const layer = currentScene().layers[layerIdx];
  if (!layer.playlist.length) return;
  if (layer.currentVideoIndex === -1) layer.currentVideoIndex = 0;
  else layer.currentVideoIndex = (layer.currentVideoIndex + 1) % layer.playlist.length;
  applyCurrentVideoLoop(layerIdx);
  if (layerIdx === state.activeLayer) renderPlaylist();
  fetchVideo(getPlaylistUrlAt(layer.currentVideoIndex, layerIdx), layerIdx);
  if (!fromEnded) toast("Video suivante (L" + layerIdx + ")");
}

export function goToPreviousVideo(layerIdx = state.activeLayer) {
  const layer = currentScene().layers[layerIdx];
  if (!layer.playlist.length) return;
  if (layer.currentVideoIndex === -1) layer.currentVideoIndex = 0;
  else layer.currentVideoIndex = (layer.currentVideoIndex - 1 + layer.playlist.length) % layer.playlist.length;
  applyCurrentVideoLoop(layerIdx);
  if (layerIdx === state.activeLayer) renderPlaylist();
  fetchVideo(getPlaylistUrlAt(layer.currentVideoIndex, layerIdx), layerIdx);
  toast("Video precedente (L" + layerIdx + ")");
}

export function removeVideoFromPlaylist(index, e) {
  e.stopPropagation();
  const layer = currentScene().layers[state.activeLayer];
  layer.playlist.splice(index, 1);
  if (!layer.playlist.length) {
    layer.currentVideoIndex = -1;
    layer.startVideoIndex = 0;
  } else {
    if (index < layer.currentVideoIndex) layer.currentVideoIndex -= 1;
    else if (index === layer.currentVideoIndex) layer.currentVideoIndex = Math.min(layer.currentVideoIndex, layer.playlist.length - 1);
    if (index < layer.startVideoIndex) layer.startVideoIndex -= 1;
    else if (index === layer.startVideoIndex) layer.startVideoIndex = 0;
  }
  applyCurrentVideoLoop();
  renderPlaylist();
}

export function updateCurrentVideoLoop() {
  const layer = currentScene().layers[state.activeLayer];
  const item = layer.playlist[layer.currentVideoIndex];
  if (layer.currentVideoIndex < 0 || !item || typeof item === 'string') return;
  const checked = document.getElementById('playlist-loop').checked;
  item.loop = checked;
  videos[state.activeLayer].loop = checked;
  renderPlaylist();
}
