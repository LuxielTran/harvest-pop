// TutorialDirector: guided lessons. Each lesson is a list of small steps, one
// interaction each (tap this, drag that, tap ✕ to close…). Steps are derived
// from the save, so leaving and resuming lands on the same step; actions
// outside the step are refused; the highlighted target is the first matching
// `[data-tut]` element on screen, and a hand shows the tap or the sweep.
//
// Lessons (farm-data LEVEL_LESSONS):
//   L1 (level 1, the walkthrough): pan the map → sow 6 wheat → reap until the silo
//      is full → Match-3 for stars → Upgrade Shop (bolt, tape, ✕) → silo upgrade (✕)
//      → harvest the rest → Shop: coop (place ✓) → 3 chickens (✕) → feed them with the
//      gifted feed → collect the eggs. Ends on farm level 2.
//   L2 (level 2): Shop: feed mill (place ✓) → make feed → a visitor (tap, deliver).
//   L3 (level 3): Shop: bakery → bake bread → collect.
//   L4 (level 4): the truck: open Orders → deliver → ✕.
//   L6 (level 6): the farmhouse: open achievements → claim → ✕.

import { LEVEL_LESSONS, TUTORIAL_CHICKENS } from './config';
import {
  S, anyClaimable, count, farmLevel, free, isTutorialStep, lessonDone, machineJobs, machinesOf, markLessonDone, onChange, pensOf, refillOrders,
  setTutorialStep, spawnVisitor, stat, tutorialActive, tutorialEnsure, tutorialGrantLevel, tutorialGrantSeeds, grantTutorialBonusStars,
} from './state';
import { t } from './i18n';
import { currentPopup, el, onPopupChange, stage, toStage, toast } from './ui/common';

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
  /** Bubble at the top of the screen (the target sits low). */
  top?: boolean;
}

const ALWAYS = ['close', 'openInventory', 'openSettings', 'toggleSetting', 'openBarn', 'openSilo', 'move', 'pan'];

// ---- what the UI reports (set from ui/farm.ts) ----
let trayKey: string | null = null; // 'plot' | 'pen:<type>' | 'mach:<type>'
let panned = false;
let matchEntered = false;
let matchWon = false;
let farmVisible = true;
/** Stat counters at the start of the step that waits for them to grow. */
let base: Record<string, number> = {};

const PLACE = 'place:ok';
const placing = (): boolean => !!stage().querySelector(`[data-tut="${PLACE}"]`);
const popup = (id: string): boolean => currentPopup() === id;
const noPopup = (): boolean => currentPopup() === null;
const trayIs = (prefix: string): boolean => !!trayKey && trayKey.startsWith(prefix);

const plotKey = (status: string): string[] => {
  const i = S.farm.plots.findIndex((p) => p.status === status);
  return i < 0 ? [] : [`plot${i}`];
};
const penKey = (type: string): string => `pen${S.farm.pens.findIndex((p) => p.type === type)}`;
const machKey = (type: string): string => `mach${S.farm.machines.findIndex((m) => m.type === type)}`;
const machIndex = (type: string): number => S.farm.machines.findIndex((m) => m.type === type);
const animalKey = (type: string, status: string): string[] => {
  const pen = S.farm.pens.find((p) => p.type === type);
  const i = pen?.animals.findIndex((c) => c.status === status) ?? -1;
  return i < 0 ? [] : [`animal${i}`];
};
const chickens = (): number => S.farm.pens.find((p) => p.type === 'coop')?.animals.length ?? 0;
const chickenStatus = (): string[] => S.farm.pens.find((p) => p.type === 'coop')?.animals.map((c) => c.status) ?? [];
const siloBlocked = (): boolean => S.farm.plots.some((p) => p.status === 'ready') && free('silo') < 2;
const siloUpgraded = (): boolean => S.storage.silo.tier >= 2;

/** A field tool step: tap a field of `status`, then sweep the tool over such fields. */
const sweep = (tool: string, status: string, tapText: string, dragText: string, allows: string[], done: () => boolean): StepDef => ({
  allows,
  targets: () => (trayIs('plot') ? [tool, ...plotKey(status)] : plotKey(status)),
  text: () => t(trayIs('plot') ? dragText : tapText),
  done,
  top: true,
});
/** Open the Shop, buy `key`, place it (✓). */
const buyBuilding = (key: string, shopText: string, buyText: string, allows: string[], done: () => boolean): StepDef => ({
  allows: ['openShop', ...allows, 'place'],
  targets: () => (placing() ? [PLACE] : popup('shop') ? [`shop:${key}`] : ['shop']),
  text: () => t(placing() ? 'tut_place' : popup('shop') ? buyText : shopText),
  done,
});
/** Tap ✕ on the open popup. */
const closeStep = (allows: string[] = []): StepDef => ({ allows, targets: () => ['close'], text: () => t('tut_close'), done: noPopup });
/** Make something in a machine: tap it, drop the product in, wait, collect. */
const machineSteps = (prefix: string, type: string, rid: string, texts: { tap: string; drag: string; wait: string; collect: string }): [string, StepDef][] => [
  [`${prefix}_TAP`, { allows: [`openMachine:${type}`], targets: () => [machKey(type)], text: () => t(texts.tap), done: () => trayIs(`mach:${type}`) || S.farm.machines[machIndex(type)]?.queue.length > 0 }],
  [`${prefix}_DRAG`, {
    allows: [`openMachine:${type}`, `startRecipe:${type}`],
    targets: () => (trayIs(`mach:${type}`) ? [`prod:${rid}`, machKey(type)] : [machKey(type)]),
    text: () => t(trayIs(`mach:${type}`) ? texts.drag : texts.tap),
    done: () => S.farm.machines[machIndex(type)]?.queue.length > 0,
  }],
  [`${prefix}_WAIT`, { allows: [], targets: () => [], text: () => t(texts.wait), done: () => machineJobs(machIndex(type)).done.length > 0 || S.farm.machines[machIndex(type)]?.queue.length === 0 }],
  [`${prefix}_COLLECT`, {
    allows: [`collectOutput:${type}`], targets: () => [machKey(type)], text: () => t(texts.collect),
    done: () => machineJobs(machIndex(type)).done.length === 0, // nothing left to collect
  }],
];

const L1: [string, StepDef][] = [
  ['PAN', { allows: [], targets: () => [], text: () => t('tut_pan'), done: () => panned, onEnter: () => tutorialGrantSeeds() }],
  ['SOW_TAP', { allows: ['openPlot'], targets: () => plotKey('empty'), text: () => t('tut_sow_tap'), done: () => trayIs('plot') || !S.farm.plots.some((p) => p.status === 'empty'), top: true }],
  ['SOW_DRAG', sweep('seed:wheat', 'empty', 'tut_sow_tap', 'tut_sow_drag', ['openPlot', 'plant'], () => count('wheat') === 0 && !S.farm.plots.some((p) => p.status === 'empty'))],
  ['GROW_WAIT', { allows: [], targets: () => [], text: () => t('tut_grow_wait'), done: () => S.farm.plots.some((p) => p.status === 'ready') }],
  ['REAP_TAP', { allows: ['openPlot'], targets: () => plotKey('ready'), text: () => t('tut_reap_tap'), done: () => trayIs('plot') || siloBlocked(), top: true }],
  ['REAP_DRAG', sweep('sickle', 'ready', 'tut_reap_tap', 'tut_reap_drag', ['openPlot', 'harvest'], () => siloBlocked() || siloUpgraded())],
  ['MATCH', { allows: ['openMatch'], targets: () => ['match'], text: () => t('tut_silo_full'), done: () => matchEntered || S.wallet.star >= 2 || siloUpgraded() }],
  ['PLAY', { allows: ['openMatch', 'match'], targets: () => [], text: () => t('tut_play'), done: () => matchWon || S.wallet.star >= 2 || siloUpgraded(), top: true }],
  ['MATS_OPEN', { allows: ['openUpgrades'], targets: () => ['upgrades'], text: () => t('tut_mats_open'), done: () => popup('upgrades') || (count('bolt') >= 1 && count('tape') >= 1) || siloUpgraded(), top: true }],
  ['MATS_BOLT', { allows: ['openUpgrades', 'buyMaterial:bolt'], targets: () => (popup('upgrades') ? ['upgrades:bolt'] : ['upgrades']), text: () => t(popup('upgrades') ? 'tut_mats_bolt' : 'tut_mats_open'), done: () => count('bolt') >= 1 || siloUpgraded(), top: true }],
  ['MATS_TAPE', { allows: ['openUpgrades', 'buyMaterial:tape'], targets: () => (popup('upgrades') ? ['upgrades:tape'] : ['upgrades']), text: () => t(popup('upgrades') ? 'tut_mats_tape' : 'tut_mats_open'), done: () => count('tape') >= 1 || siloUpgraded(), top: true }],
  ['MATS_CLOSE', closeStep(['openUpgrades'])],
  ['SILO_TAP', { allows: ['openSilo'], targets: () => ['silo'], text: () => t('tut_silo_tap'), done: () => popup('inventory') || siloUpgraded() }],
  ['SILO_UP', { allows: ['openSilo', 'upgrade:silo'], targets: () => (popup('inventory') ? ['silo:upgrade'] : ['silo']), text: () => t(popup('inventory') ? 'tut_silo_up' : 'tut_silo_tap'), done: siloUpgraded }],
  ['SILO_CLOSE', closeStep(['openSilo'])],
  ['REAP_REST', sweep('sickle', 'ready', 'tut_reap_rest', 'tut_reap_drag', ['openPlot', 'harvest'], () => !S.farm.plots.some((p) => p.status !== 'empty'))],
  ['SHOP1', { allows: ['openShop'], targets: () => ['shop'], text: () => t('tut_shop_open'), done: () => popup('shop') || pensOf('coop') > 0 }],
  ['COOP_BUY', buyBuilding('coop', 'tut_shop_open', 'tut_coop_buy', ['buy:coop'], () => pensOf('coop') > 0)],
  ['SHOP2', { allows: ['openShop'], targets: () => ['shop'], text: () => t('tut_shop_again'), done: () => popup('shop') || chickens() >= TUTORIAL_CHICKENS }],
  ['CHICKS', { allows: ['openShop', 'buy:chicken'], targets: () => (popup('shop') ? ['shop:chicken'] : ['shop']), text: () => t(popup('shop') ? 'tut_chicks' : 'tut_shop_again', { n: chickens(), m: TUTORIAL_CHICKENS }), done: () => chickens() >= TUTORIAL_CHICKENS }],
  ['SHOP_CLOSE', closeStep(['openShop'])],
  ['EAT_TAP', { allows: ['openPen'], targets: () => [penKey('coop')], text: () => t('tut_eat_tap'), done: () => trayIs('pen:coop') || chickenStatus().every((s) => s !== 'hungry'), top: true }],
  ['EAT_DRAG', {
    allows: ['openPen', 'feed'],
    targets: () => (trayIs('pen:coop') ? ['tool:feed', ...animalKey('coop', 'hungry'), penKey('coop')] : [penKey('coop')]),
    text: () => t(trayIs('pen:coop') ? 'tut_eat_drag' : 'tut_eat_tap'),
    done: () => chickenStatus().every((s) => s !== 'hungry') || (count('feed') === 0 && chickenStatus().some((s) => s !== 'hungry')),
    top: true,
  }],
  ['EGGS_WAIT', { allows: [], targets: () => [], text: () => t('tut_eggs_wait'), done: () => chickenStatus().some((s) => s === 'ready') }],
  ['EGGS_TAP', { allows: ['openPen'], targets: () => [penKey('coop')], text: () => t('tut_eggs_tap'), done: () => trayIs('pen:coop') || !chickenStatus().some((s) => s === 'ready'), top: true }],
  ['EGGS_DRAG', {
    allows: ['openPen', 'collect'],
    targets: () => (trayIs('pen:coop') ? ['tool:basket', ...animalKey('coop', 'ready'), penKey('coop')] : [penKey('coop')]),
    text: () => t(trayIs('pen:coop') ? 'tut_eggs_drag' : 'tut_eggs_tap'),
    done: () => !chickenStatus().some((s) => s === 'ready') && !chickenStatus().some((s) => s === 'feeding') && count('egg') >= 2,
    top: true,
  }],
];

const L2: [string, StepDef][] = [
  ['MILL_SHOP', { allows: ['openShop'], targets: () => ['shop'], text: () => t('tut_mill_shop'), done: () => popup('shop') || machinesOf('feedmill') > 0, onEnter: () => { tutorialEnsure('wheat', 2); tutorialEnsure('corn', 1); } }],
  ['MILL_BUY', buyBuilding('feedmill', 'tut_mill_shop', 'tut_mill_buy', ['buy:feedmill'], () => machinesOf('feedmill') > 0)],
  ...machineSteps('MILL', 'feedmill', 'feed', { tap: 'tut_mill_tap', drag: 'tut_mill_drag', wait: 'tut_mill_wait', collect: 'tut_mill_collect' }),
  ['VISIT_TAP', { allows: ['openVisitor'], targets: () => ['visitor'], text: () => t('tut_visitor_tap'), done: () => popup('visitor') || stat('visitors') > (base.visitors ?? 0), onEnter: () => { base.visitors = stat('visitors'); spawnVisitor(true); } }],
  ['VISIT_SERVE', { allows: ['openVisitor', 'serveVisitor'], targets: () => (popup('visitor') ? ['visitor:serve'] : ['visitor']), text: () => t(popup('visitor') ? 'tut_visitor_serve' : 'tut_visitor_tap'), done: () => stat('visitors') > (base.visitors ?? 0) }],
];

const L3: [string, StepDef][] = [
  ['BAK_SHOP', { allows: ['openShop'], targets: () => ['shop'], text: () => t('tut_bakery_shop'), done: () => popup('shop') || machinesOf('bakery') > 0, onEnter: () => tutorialEnsure('wheat', 3) }],
  ['BAK_BUY', buyBuilding('bakery', 'tut_bakery_shop', 'tut_bakery_buy', ['buy:bakery'], () => machinesOf('bakery') > 0)],
  ...machineSteps('BAK', 'bakery', 'bread', { tap: 'tut_bakery_tap', drag: 'tut_bakery_drag', wait: 'tut_bakery_wait', collect: 'tut_bakery_collect' }),
];

const L4: [string, StepDef][] = [
  ['TRUCK_OPEN', { allows: ['openOrders'], targets: () => ['orders'], text: () => t('tut_truck_open'), done: () => popup('orders') || stat('orders') > (base.orders ?? 0), onEnter: () => { base.orders = stat('orders'); tutorialEnsure('wheat', 2); refillOrders(true); } }],
  ['TRUCK_DELIVER', { allows: ['openOrders', 'deliver'], targets: () => (popup('orders') ? ['orders:deliver'] : ['orders']), text: () => t(popup('orders') ? 'tut_truck_deliver' : 'tut_truck_open'), done: () => stat('orders') > (base.orders ?? 0) }],
  ['TRUCK_CLOSE', closeStep(['openOrders'])],
];

const L6: [string, StepDef][] = [
  ['HOME_TAP', { allows: ['openHouse'], targets: () => ['house'], text: () => t('tut_home_tap'), done: () => popup('achievements') }],
  ['HOME_CLAIM', { allows: ['openHouse', 'claim'], targets: () => (popup('achievements') ? ['ach:claim'] : ['house']), text: () => t(popup('achievements') ? 'tut_home_claim' : 'tut_home_tap'), done: () => !anyClaimable() }],
  ['HOME_CLOSE', closeStep(['openHouse'])],
];

const LESSONS: Record<string, [string, StepDef][]> = { L1, L2, L3, L4, L6 };
const STEPS: Record<string, StepDef> = {};
const ORDER: Record<string, string[]> = {};
for (const [lesson, steps] of Object.entries(LESSONS)) {
  ORDER[lesson] = steps.map(([id]) => `${lesson}:${id}`);
  for (const [id, def] of steps) STEPS[`${lesson}:${id}`] = def;
}
const lessonOf = (stepId: string): string => stepId.split(':')[0];
/** Lessons in play order with the farm level that starts each. */
const LESSON_LEVELS: [string, number][] = [['L1', 1], ...Object.entries(LEVEL_LESSONS).map(([lvl, id]) => [id, Number(lvl)] as [string, number])];

let refreshing = false;
let again = false;
let bubble: HTMLElement | null = null;
let hand: HTMLElement | null = null;
let highlighted: Element | null = null;

export const tutorial = {
  active: (): boolean => tutorialActive(),
  step: (): string => S.tutorial.stepId,

  /** Boot: resume the saved step (an unknown one restarts its lesson). */
  start(): void {
    this.enterSaved();
    onChange(() => this.refresh());
    onPopupChange(() => this.refresh());
    this.refresh();
  },

  /** After "Reset all game": the save is fresh again, so is the walkthrough. */
  restart(): void {
    matchEntered = matchWon = panned = false;
    trayKey = null;
    base = {};
    this.enterSaved();
    this.refresh();
  },

  enterSaved(): void {
    if (!tutorialActive()) return;
    const id = S.tutorial.stepId;
    if (!STEPS[id]) {
      const lesson = LESSONS[lessonOf(id)] ? lessonOf(id) : 'L1';
      setTutorialStep(ORDER[lesson][0]);
    }
    STEPS[S.tutorial.stepId]?.onEnter?.();
  },

  /** The current step's highlight candidates (the shop uses them to pick its tab). */
  targets(): string[] { return tutorialActive() ? STEPS[S.tutorial.stepId]?.targets() ?? [] : []; },

  allows(action: string, target?: string | number): boolean {
    if (!tutorialActive()) return true;
    if (ALWAYS.includes(action)) return true;
    const step = STEPS[S.tutorial.stepId];
    if (!step) return true;
    const key = target === undefined ? action : `${action}:${target}`;
    return step.allows.includes(key) || step.allows.includes(action);
  },

  // ---- what the farm UI reports ----
  onTray(key: string | null): void { trayKey = key; this.refresh(); },
  onPan(): void { if (!panned) { panned = true; this.refresh(); } },
  onMatchEnter(): void { if (isTutorialStep('L1:MATCH')) { matchEntered = true; this.refresh(); } },
  onMatchLeave(): void { matchEntered = false; if (isTutorialStep('L1:PLAY')) { setTutorialStep('L1:MATCH'); this.refresh(); } },
  onMatchWon(): void {
    if (isTutorialStep('L1:PLAY')) { grantTutorialBonusStars(2); matchWon = true; this.refresh(); }
  },
  setFarmVisible(v: boolean): void { farmVisible = v; this.render(); },

  /** Advance through every completed step, start the next due lesson, then redraw the overlay.
   *  Saves made along the way call back into refresh(); those re-entries are folded into one more pass. */
  refresh(): void {
    if (refreshing) { again = true; return; }
    refreshing = true;
    try {
      do { again = false; this.refreshOnce(); } while (again);
    } finally { refreshing = false; }
  },

  refreshOnce(): void {
    if (tutorialActive()) {
      for (let guard = 0; guard < 40; guard++) {
        const id = S.tutorial.stepId;
        const step = STEPS[id];
        if (!step || !step.done()) break;
        const lesson = lessonOf(id);
        const order = ORDER[lesson];
        const next = order[order.indexOf(id) + 1];
        if (next) { setTutorialStep(next); STEPS[next].onEnter?.(); continue; }
        this.finishLesson(lesson);
        break;
      }
    }
    if (!tutorialActive()) this.maybeStartLesson();
    this.render();
  },

  finishLesson(lesson: string): void {
    markLessonDone(lesson);
    setTutorialStep('IDLE');
    if (lesson === 'L1') tutorialGrantLevel(2);
    else toast(t('tut_lesson_done'));
    refillOrders();
  },

  /** A lesson starts once its level is reached, the lessons before it are done and nothing is open. */
  maybeStartLesson(): void {
    if (!farmVisible || currentPopup() !== null || placing() || stage().querySelector('.dragtool')) return;
    const lvl = farmLevel();
    for (const [lesson, level] of LESSON_LEVELS) {
      if (lessonDone(lesson)) continue;
      if (level > lvl) return;
      base = {};
      setTutorialStep(ORDER[lesson][0]);
      STEPS[ORDER[lesson][0]].onEnter?.();
      this.refresh();
      return;
    }
  },

  render(): void {
    const root = stage();
    if (highlighted) { highlighted.classList.remove('tut-hl'); highlighted = null; }
    const active = tutorialActive() && (farmVisible || S.tutorial.stepId === 'L1:PLAY');
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

