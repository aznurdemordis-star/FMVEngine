import { state, LAYER_COUNT, currentScene, makeScene } from './state.js';
import { fetchVideo, updateVideoFilters, setLayerVolume, setLayerMuted, clearLayerVideo } from './video.js';
import { getPlaylistUrlAt, applyCurrentVideoLoop, renderPlaylist } from './playlist.js';
import { renderList } from './jumps.js';
import { renderSceneUI } from './scenes.js';
import { toast } from './ui.js';
import { videos } from './dom.js';

export function exportJSON() {
  const data = {
    version: 3,
    currentSceneIdx: state.currentSceneIdx,
    startupSceneIdx: state.startupSceneIdx,
    scenes: state.scenes.map(s => ({
      name: s.name,
      layers: s.layers.map(l => ({
        playlist: l.playlist,
        startVideoIndex: l.startVideoIndex,
        volume: l.volume,
        muted: l.muted,
      })),
      jumps: s.jumps,
    })),
    filters: {
      sat: document.getElementById('v-sat').value,
      con: document.getElementById('v-con').value,
      lum: document.getElementById('v-lum').value,
    },
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]));
  a.download = "fmv_data.json";
  a.click();
}

function normalizePlaylist(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(item => {
    if (typeof item === 'string') return { url: item, loop: false };
    return { url: item?.url || "", loop: !!item?.loop };
  }).filter(item => item.url);
}

const cleanDest = v => (v == null || v === 'undefined') ? '' : String(v);

function normalizeJump(j) {
  return {
    in: j.in,
    out: j.out,
    btn: typeof j.btn === 'number' ? j.btn : 0,
    sourceLayer: j.sourceLayer ?? 0,
    targetLayer: j.targetLayer ?? 0,
    loop: !!j.loop,
    sMode: j.sMode || 'none',
    sDest: cleanDest(j.sDest),
    fMode: j.fMode || 'none',
    fDest: cleanDest(j.fDest),
  };
}

function sceneFromData(src, fallbackName) {
  const scene = makeScene(src?.name || fallbackName);
  if (Array.isArray(src?.layers)) {
    src.layers.slice(0, LAYER_COUNT).forEach((l, i) => {
      const layer = scene.layers[i];
      layer.playlist = normalizePlaylist(l.playlist);
      const maxStartIndex = Math.max(0, layer.playlist.length - 1);
      layer.startVideoIndex = Math.max(0, Math.min(
        typeof l.startVideoIndex === 'number' ? l.startVideoIndex : 0,
        maxStartIndex
      ));
      layer.volume = typeof l.volume === 'number' ? l.volume : 1.0;
      layer.muted = !!l.muted;
    });
  }
  scene.jumps = (src?.jumps || []).map(normalizeJump);
  return scene;
}

async function loadData(d) {
  // v3 (scenes)
  if (Array.isArray(d.scenes)) {
    state.scenes = d.scenes.map((s, i) => sceneFromData(s, "Scene " + (i + 1)));
    state.currentSceneIdx = Math.max(0, Math.min(d.currentSceneIdx ?? 0, state.scenes.length - 1));
    state.startupSceneIdx = Math.max(0, Math.min(d.startupSceneIdx ?? d.currentSceneIdx ?? 0, state.scenes.length - 1));
  }
  // v2 (layers, no scenes) or v1 (single playlist)
  else {
    const scene = makeScene("Scene 1");
    if (Array.isArray(d.layers)) {
      d.layers.slice(0, LAYER_COUNT).forEach((src, i) => {
        const layer = scene.layers[i];
        layer.playlist = normalizePlaylist(src.playlist);
        const maxStartIndex = Math.max(0, layer.playlist.length - 1);
        layer.startVideoIndex = Math.max(0, Math.min(
          typeof src.startVideoIndex === 'number' ? src.startVideoIndex : 0,
          maxStartIndex
        ));
        layer.volume = typeof src.volume === 'number' ? src.volume : 1.0;
        layer.muted = !!src.muted;
      });
    } else {
      const layer = scene.layers[0];
      layer.playlist = normalizePlaylist(d.playlist);
      const maxStartIndex = Math.max(0, layer.playlist.length - 1);
      layer.startVideoIndex = Math.max(0, Math.min(
        typeof d.startVideoIndex === 'number' ? d.startVideoIndex : 0,
        maxStartIndex
      ));
    }
    scene.jumps = (d.jumps || []).map(normalizeJump);
    state.scenes = [scene];
    state.currentSceneIdx = 0;
    state.startupSceneIdx = 0;
  }

  if (!state.scenes.length) {
    state.scenes = [makeScene("Scene 1")];
    state.currentSceneIdx = 0;
    state.startupSceneIdx = 0;
  }
  state.presentedFrames.fill(-1);

  if (d.filters) {
    document.getElementById('v-sat').value = d.filters.sat;
    document.getElementById('v-con').value = d.filters.con;
    document.getElementById('v-lum').value = d.filters.lum;
    updateVideoFilters();
  }

  const scene = currentScene();
  for (let i = 0; i < LAYER_COUNT; i++) {
    const layer = scene.layers[i];
    setLayerVolume(i, layer.volume);
    setLayerMuted(i, layer.muted);
    if (layer.playlist.length) {
      layer.currentVideoIndex = layer.startVideoIndex;
      fetchVideo(getPlaylistUrlAt(layer.startVideoIndex, i), i);
    } else {
      clearLayerVideo(i);
    }
  }

  renderSceneUI();
  renderAudioControls();
  applyCurrentVideoLoop();
  renderPlaylist();
  renderList();
  toast("Projet Importé");
}

export function renderAudioControls() {
  const root = document.getElementById('audio-controls');
  if (!root) return;
  const scene = currentScene();
  root.innerHTML = scene.layers.map((l, i) => `
    <div style="margin-bottom:10px">
      <div style="font-size:10px;color:#888;margin-bottom:3px">Layer ${i}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="range" class="vivid-slider" min="0" max="100" value="${Math.round(l.volume * 100)}"
          style="flex:1;margin:0" oninput="setLayerVolumeFromUI(${i}, this.value)">
        <label style="color:#aaa;font-size:10px;display:flex;align-items:center;gap:4px;cursor:pointer">
          <input type="checkbox" ${l.muted ? 'checked' : ''} onchange="setLayerMutedFromUI(${i}, this.checked)" style="accent-color:#00f2ff">
          Mute
        </label>
      </div>
    </div>
  `).join('');
}

export function initImport() {
  document.getElementById('f-import').onchange = e => {
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        loadData(d);
      } catch (err) {
        console.error(err);
        toast("Erreur JSON");
      }
    };
    r.readAsText(e.target.files[0]);
  };
}
