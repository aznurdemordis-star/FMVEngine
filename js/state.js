export const FPS = 25;
export const LAYER_COUNT = 3;
export const AUTO_TRIGGER_BTN = -1;

export const BTN_MAP = { 0: "A", 1: "B", 2: "X", 3: "Y", 12: "↑", 13: "↓", 14: "←", 15: "→", [-1]: "AUTO" };
export const BTN_COLOR_MAP = { 0: "#2a6", 1: "#e05", 2: "#00f2ff", 3: "#e8a032", [-1]: "#9cf000", default: "#888" };

function makeLayer() {
  return {
    playlist: [],
    startVideoIndex: 0,
    currentVideoIndex: -1,
    currentSourceUrl: "",
    volume: 1.0,
    muted: false,
  };
}

export function makeScene(name = "Scene") {
  return {
    name,
    layers: Array.from({ length: LAYER_COUNT }, makeLayer),
    jumps: [],
  };
}

export const state = {
  scenes: [makeScene("Scene 1")],
  currentSceneIdx: 0,
  startupSceneIdx: 0,
  activeLayer: 0,
  activeIdx: -1,
  isEdit: true,
  jumpRuntime: {},
  presentedFrames: Array.from({ length: LAYER_COUNT }, () => -1),
};

export function currentScene() {
  return state.scenes[state.currentSceneIdx];
}

export function currentLayer(idx = state.activeLayer) {
  return currentScene().layers[idx];
}
