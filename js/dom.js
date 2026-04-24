import { LAYER_COUNT } from './state.js';

export const videos = Array.from({ length: LAYER_COUNT }, (_, i) => document.getElementById(`player-${i}`));
export const seekBar = document.getElementById('seek-bar');
export const curFEl = document.getElementById('cur-frame');
export const totFEl = document.getElementById('total-frames');
export const ctxMenu = document.getElementById('ctx');
export const fetchBar = document.getElementById('fetch-progress');
export const padHint = document.getElementById('gamepad-hint');
export const pauseOverlay = document.getElementById('pause-overlay');
