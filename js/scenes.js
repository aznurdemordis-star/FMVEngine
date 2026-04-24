import { state, LAYER_COUNT, currentScene, makeScene } from './state.js';
import { fetchVideo, clearLayerVideo, setLayerVolume, setLayerMuted, setActiveLayer } from './video.js';
import { getPlaylistUrlAt, renderPlaylist, applyCurrentVideoLoop } from './playlist.js';
import { renderList } from './jumps.js';
import { toast } from './ui.js';

export function renderSceneUI() {
  const sel = document.getElementById('scene-select');
  if (sel) {
    sel.innerHTML = state.scenes.map((s, i) =>
      `<option value="${i}" ${i === state.currentSceneIdx ? 'selected' : ''}>#${i + 1}${i === state.startupSceneIdx ? ' ★' : ''} - ${s.name}</option>`
    ).join('');
  }
  const dl = document.getElementById('scene-datalist');
  if (dl) dl.innerHTML = state.scenes.map(s => `<option value="${s.name}">`).join('');
  const startupLabel = document.getElementById('startup-scene-label');
  if (startupLabel) {
    const startupScene = state.scenes[state.startupSceneIdx];
    startupLabel.textContent = startupScene ? startupScene.name : '-';
  }
}

export async function loadScene(idx) {
  if (idx < 0 || idx >= state.scenes.length) return;
  state.currentSceneIdx = idx;
  state.jumpRuntime = {};
  state.activeIdx = -1;
  state.presentedFrames.fill(-1);

  const scene = currentScene();

  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = scene.layers[i];
    setLayerVolume(i, layer.volume);
    setLayerMuted(i, layer.muted);
    if (layer.playlist.length) {
      layer.currentVideoIndex = layer.startVideoIndex;
      await fetchVideo(getPlaylistUrlAt(layer.startVideoIndex, i), i);
    } else {
      clearLayerVideo(i);
    }
  }

  renderSceneUI();
  setActiveLayer(state.activeLayer);
  renderPlaylist();
  renderList();
  applyCurrentVideoLoop();
  import('./io.js').then(m => m.renderAudioControls());
}

export function loadSceneByName(name) {
  const idx = state.scenes.findIndex(s => s.name === name);
  if (idx === -1) {
    toast("ScÃ¨ne introuvable : " + name);
    return;
  }
  loadScene(idx);
}

export function selectScene(value) {
  loadScene(parseInt(value, 10));
}

export function setCurrentSceneAsStartup() {
  state.startupSceneIdx = state.currentSceneIdx;
  renderSceneUI();
  toast("ScÃ¨ne de dÃ©marrage : " + currentScene().name);
}

export function addScene() {
  const name = (prompt("Nom de la nouvelle scÃ¨ne :", "Scene " + (state.scenes.length + 1)) || "").trim();
  if (!name) return;
  if (state.scenes.some(s => s.name === name)) {
    toast("Nom dÃ©jÃ  utilisÃ©");
    return;
  }
  state.scenes.push(makeScene(name));
  loadScene(state.scenes.length - 1);
  toast("ScÃ¨ne crÃ©Ã©e : " + name);
}

export function renameScene() {
  const scene = currentScene();
  const name = (prompt("Renommer la scÃ¨ne :", scene.name) || "").trim();
  if (!name || name === scene.name) return;
  if (state.scenes.some(s => s.name === name)) {
    toast("Nom dÃ©jÃ  utilisÃ©");
    return;
  }
  scene.name = name;
  renderSceneUI();
  toast("ScÃ¨ne renommÃ©e : " + name);
}

export function deleteScene() {
  if (state.scenes.length <= 1) {
    toast("Au moins une scÃ¨ne requise");
    return;
  }
  const scene = currentScene();
  if (!confirm('Supprimer la scÃ¨ne "' + scene.name + '" ?')) return;
  const deletedIdx = state.currentSceneIdx;
  state.scenes.splice(state.currentSceneIdx, 1);
  if (deletedIdx < state.startupSceneIdx) {
    state.startupSceneIdx -= 1;
  } else if (deletedIdx === state.startupSceneIdx) {
    state.startupSceneIdx = Math.max(0, Math.min(state.startupSceneIdx, state.scenes.length - 1));
  }
  const newIdx = Math.min(state.currentSceneIdx, state.scenes.length - 1);
  loadScene(newIdx);
  toast("ScÃ¨ne supprimÃ©e");
}
