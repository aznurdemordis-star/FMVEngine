import { state } from './state.js';
import { getPlaylistUrlAt, selectVideoFromPlaylist } from './playlist.js';
import { fetchVideo } from './video.js';

export function toast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.style.opacity = 1;
  setTimeout(() => t.style.opacity = 0, 1500);
}

export function togglePanel() {
  document.getElementById('panel').classList.toggle('hidden');
}

export function openVideoPicker() {
  const list = document.getElementById('video-picker-list');
  const layer = state.layers[state.activeLayer];
  const shortcuts = layer.playlist
    .map((_, i) => ({ url: getPlaylistUrlAt(i), i }))
    .filter(x => x.url && x.i !== layer.currentVideoIndex);
  if (!shortcuts.length) {
    list.innerHTML = '<div class="vp-empty">Aucune autre vidéo dans le menu (Layer ' + state.activeLayer + '). Colle une URL ci-dessous.</div>';
  } else {
    list.innerHTML = shortcuts.map(x => {
      const label = `#${x.i + 1} ${x.url}`;
      return `<div class="vp-item" onclick="pickFromPlaylist(${x.i})" title="${x.url}">${label}</div>`;
    }).join('');
  }
  document.getElementById('video-picker-url').value = '';
  document.getElementById('video-picker').classList.add('active');
  setTimeout(() => document.getElementById('video-picker-url').focus(), 50);
}

export function closeVideoPicker(e) {
  if (e && e.target && e.target.id !== 'video-picker') return;
  document.getElementById('video-picker').classList.remove('active');
}

export function pickFromPlaylist(i) {
  closeVideoPicker();
  selectVideoFromPlaylist(i);
}

export function loadFromPicker() {
  const url = (document.getElementById('video-picker-url').value || '').trim();
  if (!url) return;
  closeVideoPicker();
  fetchVideo(url);
}

export function fetchVideoUrl() {
  openVideoPicker();
}
