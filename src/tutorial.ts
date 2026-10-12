// TutorialDirector: the forced walkthrough. Steps are derived from the save (so
// leaving and resuming lands on the same step), actions outside the step are
// refused, and the highlighted target is the first matching `[data-tut]`
// element on screen.
//
// Level 1: sow 6 wheat → reap until the silo is full → Match-3 for stars → buy
// the silo upgrade materials → upgrade the silo. That reaches farm level 2 (the
// level-up popup lists corn, coop, chicken, egg, feed mill, bakery), then:
// buy & place a coop → buy 3 chickens → buy & place a feed mill → make chicken
// feed → sweep the feed over the chickens → sweep the basket over them for eggs
// → buy & place a bakery → bake bread → collect it.

import { COOP_CAPACITY, TUTORIAL_CHICKENS } from './config';
import { S, count, free, isTutorialStep, machineJobs, onChange, refillOrders, setTutorialStep, tutorialActive, tutorialGrantLevel, tutorialGrantSeeds, grantTutorialBonusStars } from './state';
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

const ALWAYS = ['close', 'openInventory', 'openSettings', 'toggleSetting', 'openBarn', 'openSilo', 'move'];

const plotKey = (status: string): string[] => {
  const i = S.farm.plots.findIndex((p) => p.status === status);
  return i < 0 ? [] : [`plot${i}`];
};
const chickKey = (status: string): string[] => {
  const i = S.farm.chickens.findIndex((c) => c.status === status);
  return i < 0 ? [] : [`chick${i}`];
};
const canSow = (): boolean => count('wheat') > 0 && S.farm.plots.some((p) => p.status === 'empty');
/** While a bought building is being placed, its ✓ is the target. */
const PLACE = 'place:ok';
const siloBlocked = (): boolean => S.farm.plots.some((p) => p.status === 'ready') && free('silo') < 2;

/** Targets for making something in a machine: drop the product in, wait, collect. */
function machineTargets(id: string, tut: string, rid: string): string[] {
  const j = machineJobs(id);
  if (j.done.length) return [tut];
  if (j.running) return [];
  return [`prod:${rid}`, tut];
}
function machineText(id: string, make: string, wait: string, collect: string): string {
  const j = machineJobs(id);
  return t(j.done.length ? collect : j.running ? wait : make);
}

const STEPS: Record<string, StepDef> = {
  // Sow all six fields: tap a field, then drag the wheat from the tray across them.
  SOW: {
    allows: ['openPlot', 'plant'],
    targets: () => (canSow() ? ['seed:wheat', ...plotKey('empty')] : []),
    text: () => (canSow() ? t('tut_sow') : t('tut_grow_wait')),
    done: () => count('wheat') === 0 && S.farm.plots.every((p) => p.status !== 'empty'),
    onEnter: () => tutorialGrantSeeds(),
    top: true,
  },
  // Reap with the sickle until the silo cannot take the next field (6 fields × 2 = 12 > 10 slots).
  REAP: {
    allows: ['openPlot', 'harvest'],
    targets: () => ['sickle', ...plotKey('ready')],
    text: () => (S.farm.plots.some((p) => p.status === 'ready') ? t('tut_reap') : t('tut_grow_wait')),
    done: () => siloBlocked() || S.storage.silo.tier >= 2,
    top: true,
  },
  MATCH: {
    allows: ['openMatch'],
    targets: () => ['match'],
    text: () => t('tut_silo_full'),
    done: () => matchEntered || S.wallet.star >= 2 || S.storage.silo.tier >= 2,
  },
  PLAY: {
    allows: ['openMatch', 'match'],
    targets: () => [],
    text: () => t('tut_play'),
    done: () => matchWon || S.wallet.star >= 2 || S.storage.silo.tier >= 2,
    top: true,
  },
  MATS: {
    allows: ['openUpgrades', 'buyMaterial:bolt', 'buyMaterial:tape'],
    targets: () => (count('bolt') < 1 ? ['upgrades:bolt', 'upgrades'] : ['upgrades:tape', 'upgrades']),
    text: () => (count('bolt') >= 1 ? t('tut_mats_tape') : t('tut_mats')),
    done: () => (count('bolt') >= 1 && count('tape') >= 1) || S.storage.silo.tier >= 2,
    top: true,
  },
  SILO: {
    allows: ['openSilo', 'upgrade:silo'],
    targets: () => ['silo:upgrade', 'silo'],
    text: () => t('tut_silo'),
    done: () => S.storage.silo.tier >= 2,
  },
  // Level 2 arrives here (popup: corn, coop, chicken, egg, feed mill, bakery).
  COOP: {
    allows: ['openShop', 'buy:coop', 'place'],
    targets: () => [PLACE, 'shop:coop', 'shop'],
    text: () => (placing() ? t('tut_place') : t('tut_coop')),
    done: () => S.farm.coopBuilt,
    onEnter: () => tutorialGrantLevel(2),
  },
  CHICKS: {
    allows: ['openShop', 'buy:chicken'],
    targets: () => ['shop:chicken', 'shop'],
    text: () => t('tut_chicks', { n: S.farm.chickens.length, m: TUTORIAL_CHICKENS }),
    done: () => S.farm.chickens.length >= Math.min(TUTORIAL_CHICKENS, COOP_CAPACITY),
  },
  MILL: {
    allows: ['openShop', 'buy:feedmill', 'place'],
    targets: () => [PLACE, 'shop:feedmill', 'shop'],
    text: () => (placing() ? t('tut_place') : t('tut_mill')),
    done: () => S.farm.machines.feedmill.owned,
  },
  // Make chicken feed (2 wheat + 1 corn → 3 feed): drop it into the mill, wait, collect.
  FEED: {
    allows: ['openMachine:feedmill', 'startRecipe:feedmill', 'collectOutput:feedmill'],
    targets: () => machineTargets('feedmill', 'mill', 'feed'),
    text: () => machineText('feedmill', 'tut_feed', 'tut_feed_wait', 'tut_feed_collect'),
    done: () => count('feed') >= 3 || S.farm.chickens.some((c) => c.status !== 'hungry'),
  },
  // Feed the chickens: tap the coop, sweep the feed over them.
  EAT: {
    allows: ['openCoop', 'feed'],
    targets: () => (count('feed') > 0 ? ['tool:feed', ...chickKey('hungry'), 'coop'] : []),
    text: () => t('tut_eat'),
    done: () => S.farm.chickens.every((c) => c.status !== 'hungry') || (count('feed') === 0 && S.farm.chickens.some((c) => c.status !== 'hungry')),
    top: true,
  },
  // Collect the eggs: tap the coop, sweep the basket over the chickens.
  EGGS: {
    allows: ['openCoop', 'collectEgg'],
    targets: () => (S.farm.chickens.some((c) => c.status === 'ready') ? ['tool:basket', ...chickKey('ready'), 'coop'] : []),
    text: () => (S.farm.chickens.some((c) => c.status === 'ready') ? t('tut_eggs') : t('tut_eggs_wait')),
    done: () => S.farm.chickens.every((c) => c.status === 'hungry') && count('egg') >= 2,
    top: true,
  },
  BAKERY: {
    allows: ['openShop', 'buy:bakery', 'place'],
    targets: () => [PLACE, 'shop:bakery', 'shop'],
    text: () => (placing() ? t('tut_place') : t('tut_bakery')),
    done: () => S.farm.machines.bakery.owned,
  },
  // Bake bread (3 wheat → 1 bread): drop it into the bakery, wait, collect.
  BREAD: {
    allows: ['openMachine:bakery', 'startRecipe:bakery', 'collectOutput:bakery'],
    targets: () => machineTargets('bakery', 'bakery', 'bread'),
    text: () => machineText('bakery', 'tut_bread', 'tut_bread_wait', 'tut_bread_collect'),
    done: () => count('bread') >= 1,
  },
};

const ORDER = ['SOW', 'REAP', 'MATCH', 'PLAY', 'MATS', 'SILO', 'COOP', 'CHICKS', 'MILL', 'FEED', 'EAT', 'EGGS', 'BAKERY', 'BREAD'];
/** Saves from earlier walkthroughs resume at the matching (or an earlier) step. */
const OLD_STEPS: Record<string, string> = {
  T00: 'SOW', T01: 'SOW', T02: 'SOW', T03: 'REAP', T04: 'MATCH', T05: 'MATCH', T06: 'MATCH', T07: 'MATCH',
  T08: 'MATCH', T09: 'PLAY', T10: 'MATS', T11: 'SILO', T12: 'COOP', BARN: 'SILO',
};

let matchEntered = false;
let matchWon = false;
let bubble: HTMLElement | null = null;
let hand: HTMLElement | null = null;
let highlighted: Element | null = null;
let farmVisible = true;
const placing = (): boolean => !!stage().querySelector(`[data-tut="${PLACE}"]`);

export const tutorial = {
  active: (): boolean => tutorialActive(),
  step: (): string => S.tutorial.stepId,

  /** Boot: a fresh save (T00) or an old step id moves to its step here. */
  start(): void {
    this.enterSaved();
    onChange(() => this.refresh());
    this.refresh();
  },

  /** After "Reset all game": the save is fresh again, so is the walkthrough. */
  restart(): void {
    matchEntered = false;
    matchWon = false;
    this.enterSaved();
    this.refresh();
  },

  enterSaved(): void {
    const old = OLD_STEPS[S.tutorial.stepId];
    if (old) setTutorialStep(old);
    if (tutorialActive()) STEPS[S.tutorial.stepId]?.onEnter?.();
  },

  allows(action: string, target?: string | number): boolean {
    if (!tutorialActive()) return true;
    if (ALWAYS.includes(action)) return true;
    const step = STEPS[S.tutorial.stepId];
    if (!step) return true;
    const key = target === undefined ? action : `${action}:${target}`;
    return step.allows.includes(key) || step.allows.includes(action);
  },

  onMatchEnter(): void { if (isTutorialStep('MATCH')) { matchEntered = true; this.refresh(); } },
  onMatchLeave(): void { matchEntered = false; if (isTutorialStep('PLAY')) { setTutorialStep('MATCH'); this.refresh(); } },
  onMatchWon(): void {
    if (isTutorialStep('PLAY')) { grantTutorialBonusStars(2); matchWon = true; this.refresh(); }
  },
  setFarmVisible(v: boolean): void { farmVisible = v; this.render(); },

  /** Advance through every completed step, then redraw the overlay. */
  refresh(): void {
    if (!tutorialActive()) { this.render(); return; }
    for (let guard = 0; guard < ORDER.length + 1; guard++) {
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
    const active = tutorialActive() && (farmVisible || S.tutorial.stepId === 'PLAY');
    if (!active) { bubble?.remove(); hand?.remove(); bubble = hand = null; return; }
    const step = STEPS[S.tutorial.stepId];
    if (!step) return;
    if (!bubble) { bubble = el(`<div class="tut-bubble"><div class="farmer">${FARMER}</div><span></span></div>`); root.appendChild(bubble); }
    bubble.classList.toggle('top', !!step.top && farmVisible);
    bubble.classList.toggle('mid', !farmVisible);
    bubble.querySelector('span')!.textContent = step.text();
    const keys = step.targets();
    let target: Element | null = null;
    let k = 0;
    for (; k < keys.length; k++) {
      target = root.querySelector(`[data-tut="${keys[k]}"]`);
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
      // A drag tool (seed, sickle, feed, basket, a product) points the hand along the sweep to the next target.
      const dest = /^(seed:|sickle|tool:|prod:)/.test(keys[k]) && keys[k + 1] ? root.querySelector(`[data-tut="${keys[k + 1]}"]`) : null;
      hand.classList.toggle('drag', !!dest);
      if (dest) {
        const d = dest.getBoundingClientRect();
        const q = toStage(d.left + d.width / 2, d.top + d.height * 0.4);
        hand.style.setProperty('--dx', `${q.x - p.x}px`);
        hand.style.setProperty('--dy', `${q.y - p.y}px`);
      }
    } else if (hand) hand.style.display = 'none';
  },
};
