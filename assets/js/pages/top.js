// Top（index.html）の入口
import { initCommon } from '../modules/common.js';
import { createScrollStage } from '../modules/scrollStage.js';
import { startAutoAdvance } from '../modules/autoAdvance.js';

const { kiosk } = initCommon({ page: 'top' });

const stageEl = document.querySelector('[data-stage]');
const stage = stageEl
  ? createScrollStage(stageEl, { indicator: document.querySelector('[data-stage-indicator]') })
  : null;

// 自動送りは、最初の画面が出てから始める
if (kiosk && stage) stage.ready.then(() => startAutoAdvance(stage));
