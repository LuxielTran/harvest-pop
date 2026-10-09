// TutorialDirector: the forced T00→T12 walkthrough of the GDD. Steps are
// derived from the save (so leaving and resuming lands on the same step),
// actions outside the step are refused, and the highlighted target is the
// first matching `[data-tut]` element on screen.

import { S, count, isTutorialStep, onChange, onEvent, refillOrders, setTutorialStep, tutorialActive, tutorialGrantFeed, grantTutorialBonusStars } from './state';
import { t } from './i18n';
import { el, stage, toStage } from './ui/common';

const HAND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M22 60c-8-6-14-16-14-24 0-4 4-6 8-2l4 6V12a5 5 0 0 1 10 0v18l2-2a5 5 0 0 1 8 2l2 2a5 5 0 0 1 8 2v16c0 6-6 10-10 10z" fill="#ffd9b3" stroke="#3b2a14" stroke-width="3" stroke-linejoin="round"/></svg>`;
const FARMER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="36" r="22" fill="#ffd9b3"/><path d="M8 30c4-18 44-18 48 0z" fill="#e3a84c"/><path d="M4 30h56l-4 6H8z" fill="#c98a2a"/><circle cx="24" cy="38" r="3" fill="#3b2a14"/><circle cx="40" cy="38" r="3" fill="#3b2a14"/><path d="M24 48q8 6 16 0" stroke="#3b2a14" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#ff9a9a" opacity=".6"><circle cx="18" cy="44" r="3"/><circle cx="46" cy="44" r="3"/></g></svg>`;

interface StepDef {
  /** Actions the step allows: `action` or `action:target`. */
  allows: string[];
  /** Highlight candidates, first one found in the DOM wins. */
  targets: () => string[];
  text: () => string;
  /** True when the step is done → advance. */
  done: () => boolean;
  onEnter?: () => void;
  /** Bubble position. */
  top?: boolean;
}

const ALWAYS = ['close', 'openInventory', 'openSettings', 'toggleSetting', 'openBarn', 'openSilo'];

const STEPS: Record<string, StepDef> = {
  T01: {
    allows: ['buyPlot:0'],
    targets: () => ['plot0'],
    text: () => t('tut_T01'),
    done: () => S.farm.plots[0].status !== 'locked',
  },
  T02: {
    allows: ['openPlot:0', 'plant:0'],
    targets: () => (S.farm.plots[0].status === 'empty' ? ['plant:wheat', 'plot0'] : []),
    text: () => (S.farm.plots[0].status === 'growing' ? t('tut_T02_wait') : t('tut_T02')),
    done: () => S.farm.plots[0].status === 'ready',
  },
  T03: {
    allows: ['harvest:0', 'openPlot:0'],
    targets: () => ['plot0'],
    text: () => t('tut_T03'),
    done: () => S.farm.plots[0].status === 'empty' && count('wheat') >= 2,
  },
  T04: {
    allows: ['openShop', 'buy:coop'],
    targets: () => ['shop:coop', 'shop'],
    text: () => t('tut_T04'),
    done: () => S.farm.coopBuilt,
  },
  T05: {
    allows: ['openCoop', 'buyChicken'],
    targets: () => ['coop:buy', 'coop'],
    text: () => t('tut_T05'),
    done: () => S.farm.chickens.length >= 1,
  },
  T06: {
    allows: ['openMachine:feedmill', 'startRecipe:feedmill', 'collectOutput:feedmill'],
    targets: () => {
      const m = S.farm.machines.feedmill;
      if (m.status === 'idle') return ['mill:craft', 'mill'];
      if (m.status === 'output') return ['mill:collect', 'mill'];
      return [];
    },
    text: () => {
      const m = S.farm.machines.feedmill;
      return m.status === 'processing' ? t('tut_T06_wait') : m.status === 'output' ? t('tut_T06_collect') : t('tut_T06');
    },
    done: () => S.farm.machines.feedmill.status === 'idle' && count('feed') >= 4,
  },
  T07: {
    allows: ['openChicken:0', 'feed:0', 'collectEgg:0', 'openCoop'],
    targets: () => {
      const c = S.farm.chickens[0];
      if (!c) return [];
      if (c.status === 'hungry') return ['chicken:feed', 'chicken0'];
      if (c.status === 'ready') return ['chicken:collect', 'chicken0'];
      return [];
    },
    text: () => {
      const c = S.farm.chickens[0];
      return c?.status === 'producing' ? t('tut_T07_wait') : c?.status === 'ready' ? t('tut_T07_collect') : t('tut_T07');
    },
    // Resume-safe: the step also ends when the eggs are ready and the barn cannot take them.
    done: () => blockedOnce,
  },
  T08: {
    allows: ['openMatch', 'openChicken:0', 'collectEgg:0'],
    targets: () => ['match'],
    text: () => t('tut_T08'),
    done: () => matchEntered,
    onEnter: () => tutorialGrantFeed(),
    top: true,
  },
  T09: {
    allows: ['openMatch', 'match'],
    targets: () => [],
    text: () => t('tut_T09'),
    done: () => matchWon,
    top: true,
  },
  T10: {
    allows: ['openUpgrades', 'buyMaterial:nail', 'buyMaterial:screw'],
    targets: () => (count('nail') < 1 ? ['upgrades:nail', 'upgrades'] : ['upgrades:screw', 'upgrades']),
    text: () => (count('nail') >= 1 ? t('tut_T10_screw') : t('tut_T10')),
    done: () => count('nail') >= 1 && count('screw') >= 1,
    top: true,
  },
  T11: {
    allows: ['openBarn', 'upgrade:barn'],
    targets: () => ['barn:upgrade', 'barn'],
    text: () => t('tut_T11'),
    done: () => S.storage.barn.tier >= 2,
  },
  T12: {
    allows: ['openChicken:0', 'collectEgg:0', 'openCoop'],
    targets: () => ['chicken:collect', 'chicken0'],
    text: () => t('tut_T12'),
    done: () => S.farm.chickens[0]?.status === 'hungry' && count('egg') >= 2,
  },
};

const ORDER = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12'];

let blockedOnce = false;
let matchEntered = false;
let matchWon = false;
let bubble: HTMLElement | null = null;
let hand: HTMLElement | null = null;
let veil: HTMLElement | null = null;
let highlighted: Element | null = null;
let farmVisible = true;

export const tutorial = {
  active: (): boolean => tutorialActive(),
  step: (): string => S.tutorial.stepId,

  /** Boot: T00 sets up the start state (the fresh save already is it) and moves to T01. */
  start(): void {
    if (isTutorialStep('T00')) setTutorialStep('T01');
    if (tutorialActive()) STEPS[S.tutorial.stepId]?.onEnter?.();
    onChange(() => this.refresh());
    onEvent((e) => {
      if (e.type === 'collectBlocked' && e.storage === 'barn' && isTutorialStep('T07')) { blockedOnce = true; this.refresh(); }
    });
    this.refresh();
  },

  allows(action: string, target?: string | number): boolean {
    if (!tutorialActive()) return true;
    if (ALWAYS.includes(action)) return true;
    const step = STEPS[S.tutorial.stepId];
    if (!step) return true;
    const key = target === undefined ? action : `${action}:${target}`;
    return step.allows.includes(key) || step.allows.includes(action);
  },

  onMatchEnter(): void { if (isTutorialStep('T08')) { matchEntered = true; this.refresh(); } },
  onMatchLeave(): void { matchEntered = false; if (isTutorialStep('T09')) { setTutorialStep('T08'); this.refresh(); } },
  onMatchWon(): void {
    if (isTutorialStep('T09')) { grantTutorialBonusStars(2); matchWon = true; this.refresh(); }
  },
  setFarmVisible(v: boolean): void { farmVisible = v; this.render(); },

  /** Advance through every completed step, then redraw the overlay. */
  refresh(): void {
    if (!tutorialActive()) { this.render(); return; }
    for (let guard = 0; guard < 12; guard++) {
      const id = S.tutorial.stepId;
      const step = STEPS[id];
      if (!step || !step.done()) break;
      const i = ORDER.indexOf(id);
      const next = ORDER[i + 1] ?? 'COMPLETE';
      setTutorialStep(next);
      if (next === 'COMPLETE') { refillOrders(); break; }
      STEPS[next].onEnter?.();
    }
    this.render();
  },

  render(): void {
    const root = stage();
    if (highlighted) { highlighted.classList.remove('tut-hl'); highlighted = null; }
    const active = tutorialActive() && (farmVisible || S.tutorial.stepId === 'T09');
    if (!active) { bubble?.remove(); hand?.remove(); veil?.remove(); bubble = hand = veil = null; return; }
    const step = STEPS[S.tutorial.stepId];
    if (!step) return;
    if (!bubble) { bubble = el(`<div class="tut-bubble"><div class="farmer">${FARMER}</div><span></span></div>`); root.appendChild(bubble); }
    bubble.classList.toggle('top', !!step.top && farmVisible);
    bubble.classList.toggle('mid', !farmVisible);
    bubble.querySelector('span')!.textContent = step.text();
    let target: Element | null = null;
    for (const key of step.targets()) {
      target = root.querySelector(`[data-tut="${key}"]`);
      if (target) break;
    }
    if (target) {
      target.classList.add('tut-hl');
      highlighted = target;
      if (!hand) { hand = el(`<div class="tut-hand">${HAND}</div>`); root.appendChild(hand); }
      const r = target.getBoundingClientRect();
      const p = toStage(r.left + r.width * 0.6, r.top + r.height * 0.6);
      hand.style.left = `${p.x}px`;
      hand.style.top = `${p.y}px`;
      hand.style.display = '';
    } else if (hand) hand.style.display = 'none';
  },
};
