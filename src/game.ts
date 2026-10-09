// Harvest Pop — Farm × Match-3.
//
// The farm is the hub; the "levels" of the FalconGame contract are the
// Match-3 levels. `startLevel(index)` lands straight on that match board and
// emits `levelStart`; `win` / `lose` close the turn. The one exception is the
// automatic boot call made by `registerFalconGame`, which lands on the farm
// (the GDD tutorial starts there) unless `?level=N` asks for a board.

import FalconSDK from '@falcongames/game-client-sdk';
import { createFalconEvents, type FalconGame } from './falcon-game';
import { MATCH_LEVELS } from './config';
import { initLang } from './i18n';
import * as St from './state';
import { tutorial } from './tutorial';
import { closePopup, stage, toast } from './ui/common';
import { buildFarm, hideFarm, levelUnlocked, setFarmHandlers, showFarm } from './ui/farm';
import { closeMatch, isMatchOpen, matchProgress, openMatch, pauseMatch, reviveMatch, showResult } from './ui/match';
import './style.css';

const events = createFalconEvents();
let booted = false;
let bootCallSeen = false;
let paused = false;
let lostLevel = -1;

function boot(): void {
  if (booted) return;
  booted = true;
  initLang();
  const q = new URLSearchParams(location.search);
  if (q.get('reset') === '1') St.resetAll();
  else St.loadFromSave(FalconSDK.userData.get());
  if (q.get('skiptut') === '1' && St.tutorialActive()) { St.setTutorialStep('COMPLETE'); St.refillOrders(); }
  stage();
  buildFarm();
  setFarmHandlers({ playLevel: (i) => startLevel(i) });
  tutorial.start();
  St.refillOrders();
}

function goFarm(): void {
  closePopup();
  if (isMatchOpen()) {
    closeMatch();
    tutorial.onMatchLeave();
  }
  showFarm();
}

/** Enter match level `index` (0-based) straight away. */
function startLevel(index: number): void {
  boot();
  const level = Math.max(0, Math.min(MATCH_LEVELS.length - 1, Math.floor(index)));
  const hasQuery = new URLSearchParams(location.search).has('level');
  if (!bootCallSeen) {
    bootCallSeen = true;
    if (!hasQuery) { showFarm(); return; }
  }
  // An unplayable level (locked) still opens when asked for explicitly — the IDE drives levels by index.
  closePopup();
  if (St.S.tutorial.stepId === 'COMPLETE' && !levelUnlocked(level)) toast('🔒');
  hideFarm();
  paused = false;
  lostLevel = -1;
  const inTutorial = St.tutorialActive();
  openMatch(level, {
    onWin: (i, stars) => {
      const id = MATCH_LEVELS[i].id;
      const delta = St.completeMatch(id, stars);
      tutorial.onMatchWon();
      events.emit('win');
      const next = i + 1 < MATCH_LEVELS.length && !St.tutorialActive() ? () => startLevel(i + 1) : undefined;
      showResult({ won: true, stars, delta: delta + (St.tutorialActive() ? 0 : 0), onFarm: goFarm, onNext: next });
    },
    onLose: (i) => {
      lostLevel = i;
      events.emit('lose', { canRevive: true });
      showResult({ won: false, stars: 0, delta: 0, onFarm: goFarm, onRetry: () => startLevel(i) });
    },
    onQuit: () => {
      if (FalconSDK.analytics.turn.isActive()) FalconSDK.analytics.turn.end('Skip', { levelProgress: matchProgress() });
      goFarm();
    },
  }, { tutorial: inTutorial });
  if (inTutorial) tutorial.onMatchEnter();
  // Fire when the board is READY to play — the studio layer starts the level's clock here.
  events.emit('levelStart', { index: level, difficulty: 'normal', levelId: String(MATCH_LEVELS[level].id) });
}

/** What the studio layer attaches to. See falcon-game.ts for every member. */
export const game: FalconGame = {
  getLevelCount: () => MATCH_LEVELS.length,
  startLevel,
  on: events.on,
  pause: () => { paused = true; pauseMatch(true); },
  resume: () => { paused = false; pauseMatch(false); },
  getProgress: () => matchProgress(),
  revive: () => {
    if (lostLevel < 0) return false;
    const ok = reviveMatch();
    if (ok) lostLevel = -1;
    return ok;
  },
  audio: {
    set: (key, on) => St.setSetting(key, on),
    get: (key) => St.S.settings[key] === 1,
  },
};

export const isPaused = (): boolean => paused;
