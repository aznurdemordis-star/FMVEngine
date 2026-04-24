import { state, BTN_MAP, AUTO_TRIGGER_BTN, currentScene } from './state.js';
import { seekBar, ctxMenu } from './dom.js';

function updateDestLists() {
  const sMode = document.getElementById('cfg-s-mode').value;
  const fMode = document.getElementById('cfg-f-mode').value;
  document.getElementById('cfg-s-dest').setAttribute('list', sMode === 'scene' ? 'scene-datalist' : 'playlist-datalist');
  document.getElementById('cfg-f-dest').setAttribute('list', fMode === 'scene' ? 'scene-datalist' : 'playlist-datalist');
}

function readJumpFromForm() {
  return {
    in: parseInt(document.getElementById('cfg-in').value) || 0,
    out: parseInt(document.getElementById('cfg-out').value) || 0,
    btn: parseInt(document.getElementById('cfg-btn').value, 10),
    sourceLayer: parseInt(document.getElementById('cfg-source-layer').value) || 0,
    targetLayer: parseInt(document.getElementById('cfg-target-layer').value) || 0,
    loop: document.getElementById('cfg-loop').checked,
    sMode: document.getElementById('cfg-s-mode').value,
    sDest: document.getElementById('cfg-s-dest').value,
    fMode: document.getElementById('cfg-f-mode').value,
    fDest: document.getElementById('cfg-f-dest').value,
  };
}

export function addJump() {
  updateDestLists();
  currentScene().jumps.push(readJumpFromForm());
  state.activeIdx = currentScene().jumps.length - 1;
  renderList();
  updateZoneVis();
}

export function syncActive() {
  updateDestLists();
  if (state.activeIdx < 0) return;
  currentScene().jumps[state.activeIdx] = readJumpFromForm();
  renderList();
  updateZoneVis();
}

export function renderList() {
  const jumps = currentScene().jumps;
  document.getElementById('jump-list').innerHTML = jumps.map((j, i) => {
    const loopTag = j.loop ? ' LOOP' : '';
    const src = j.sourceLayer ?? 0;
    const tgt = j.targetLayer ?? 0;
    const triggerLabel = j.btn === AUTO_TRIGGER_BTN ? 'AUTO' : (BTN_MAP[j.btn] || '?');
    return `
    <div onclick="selectJump(${i})" style="padding:10px; margin-top:5px; border:1px solid ${i === state.activeIdx ? '#00f2ff' : '#252535'}; background:${i === state.activeIdx ? 'rgba(0,242,255,0.05)' : '#050508'}; cursor:pointer; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
      <span style="color:${i === state.activeIdx ? '#00f2ff' : '#666'}">#${i} L${src}->L${tgt} [${triggerLabel}]${loopTag}</span>
      <span onclick="deleteJump(${i}, event)" style="color:#e05; font-weight:bold; padding:0 5px">X</span>
    </div>
  `;
  }).join('');
}

export function selectJump(i) {
  state.activeIdx = i;
  const j = currentScene().jumps[i];
  document.getElementById('cfg-in').value = j.in;
  document.getElementById('cfg-out').value = j.out;
  document.getElementById('cfg-btn').value = j.btn;
  document.getElementById('cfg-source-layer').value = j.sourceLayer ?? 0;
  document.getElementById('cfg-target-layer').value = j.targetLayer ?? 0;
  document.getElementById('cfg-loop').checked = !!j.loop;
  document.getElementById('cfg-s-mode').value = j.sMode;
  document.getElementById('cfg-s-dest').value = j.sDest;
  document.getElementById('cfg-f-mode').value = j.fMode;
  document.getElementById('cfg-f-dest').value = j.fDest;
  updateDestLists();
  renderList();
  updateZoneVis();
}

export function deleteJump(i, e) {
  e.stopPropagation();
  currentScene().jumps.splice(i, 1);
  state.activeIdx = -1;
  renderList();
  updateZoneVis();
}

export function updateZoneVis() {
  const vis = document.getElementById('zone-vis');
  if (state.activeIdx < 0) {
    vis.style.width = "0";
    return;
  }
  const j = currentScene().jumps[state.activeIdx];
  const max = parseInt(seekBar.max) || 1;
  vis.style.left = (j.in / max * 100) + "%";
  vis.style.width = (Math.max(1, j.out - j.in) / max * 100) + "%";
}

export function setPoint(type) {
  const f = ctxMenu.dataset.f;
  if (type === 'in') document.getElementById('cfg-in').value = f;
  if (type === 'out') document.getElementById('cfg-out').value = f;
  syncActive();
}
