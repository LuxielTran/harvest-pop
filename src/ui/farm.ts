// Farm Home: the 2.5D scene (barn, silo, machines, coop, chickens, plots on an
// isometric lawn), the HUD, the bottom bar and every farm popup (build shop,
// inventory/storage upgrade, upgrade shop, orders, match map, settings).

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import {
  BOOSTERS, CHICKEN_COST, COOP_CAPACITY, COOP_COST, CROPS, MACHINES, MATCH_LEVELS, MATERIALS, MATERIAL_PRICE, PLOT_COST, RECIPES,
  XP_THRESHOLDS, xpForNextLevel, type StorageType,
} from '../config';
import { t } from '../i18n';
import * as St from '../state';
import { S } from '../state';
import { tutorial } from '../tutorial';
import { centerOf, closePopup, currentPopup, el, floatLabel, fmtTime, img, openPopup, rerenderPopup, setPopupRenderer, stage, toast } from './common';

export interface FarmHandlers { playLevel(index: number): void; }
let handlers: FarmHandlers = { playLevel: () => {} };
export function setFarmHandlers(h: FarmHandlers): void { handlers = h; }

let root: HTMLElement | null = null;
let scene: HTMLElement | null = null;
const sigs = new Map<string, string>();
let timerHandle = 0;

// Scene positions (bottom-centre anchors in scene pixels). Buildings stand on
// two diagonal rows; the six plots form a 3×2 block on the isometric grid
// (plot 0, the tutorial's first plot, is the front one).
const PLOT_GRID = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]];
const SCENE = {
  barn: { x: 108, y: 200 }, silo: { x: 302, y: 190 },
  feedmill: { x: 72, y: 332 }, bakery: { x: 200, y: 324 }, coop: { x: 330, y: 324 },
  chickens: [{ x: 286, y: 404 }, { x: 350, y: 416 }],
  plots: PLOT_GRID.map(([a, b]) => ({ x: 200 + 52 * (a - b), y: 534 - 26 * (a + b) })),
};

function gate(action: string, target?: string | number): boolean {
  if (tutorial.allows(action, target)) return true;
  toast(t('err_tutorial'), 'warn');
  return false;
}

function report(err: string): boolean {
  if (!err) return true;
  toast(t(err), 'warn');
  return false;
}

export function buildFarm(): HTMLElement {
  if (root) return root;
  root = el(`<div id="farm" class="screen">
    <div class="hud">
      <button class="pill coin" id="hud-coinbtn" style="border:0">${img(A.ICON_COIN)}<span id="hud-coin">0</span></button>
      <div class="pill lvl">${img(A.ICON_XP)}<b id="hud-lvl">Lv 1</b><div class="bar"><i id="hud-xp"></i></div></div>
      <div class="pill star">${img(A.ICON_STAR)}<span id="hud-star">0</span></div>
      <button class="iconbtn" id="btn-settings">${img(A.ICON_SETTINGS)}</button>
    </div>
    <div class="scene"><div class="ground"></div>${img(A.SCENE_DECOR, 'decor')}</div>
    <div class="bottombar">
      <button class="bbtn" data-tut="shop" id="bb-shop">${img(A.ICON_SHOP)}<span>${t('shop')}</span></button>
      <button class="bbtn" data-tut="orders" id="bb-orders">${img(A.ICON_ORDERS)}<span>${t('orders')}</span><b class="badge" id="orders-badge" style="display:none"></b></button>
      <button class="bbtn match" data-tut="match" id="bb-match">${img(A.ICON_MATCH)}<span>${t('match')}</span></button>
      <button class="bbtn" data-tut="upgrades" id="bb-upgrades">${img(A.ICON_HAMMER)}<span>${t('upgrade')}</span></button>
    </div>
  </div>`);
  scene = root.querySelector<HTMLElement>('.scene')!;
  scene.querySelector<HTMLElement>('.ground')!.style.backgroundImage = `url("${A.svgUrl(A.LAWN_TILE)}")`;
  root.querySelector('#bb-shop')!.addEventListener('click', () => gate('openShop') && openShop());
  root.querySelector('#bb-orders')!.addEventListener('click', () => gate('openOrders') && openOrders());
  root.querySelector('#bb-match')!.addEventListener('click', () => gate('openMatch') && openMatchMap());
  root.querySelector('#bb-upgrades')!.addEventListener('click', () => gate('openUpgrades') && openUpgradeShop());
  root.querySelector('#btn-settings')!.addEventListener('click', () => gate('openSettings') && openSettings());
  // The coin pill opens the studio's coin shop when that module is on; otherwise it is just the counter.
  root.querySelector('#hud-coinbtn')!.addEventListener('click', () => { if (!St.tutorialActive()) FalconSDK.shop.open('header_coin'); });
  buildScene();
  St.onChange(() => { if (root?.classList.contains('on')) { updateFarm(); rerenderPopup(); tutorial.render(); } });
  St.onEvent(onGameEvent);
  stage().appendChild(root);
  return root;
}

export function showFarm(): void {
  buildFarm();
  root!.classList.add('on');
  updateFarm();
  clearInterval(timerHandle);
  timerHandle = window.setInterval(() => { St.tick(); updateTimers(); }, 500);
  tutorial.setFarmVisible(true);
  tutorial.render();
}

export function hideFarm(): void {
  closePopup();
  root?.classList.remove('on');
  clearInterval(timerHandle);
  tutorial.setFarmVisible(false);
}

// ---------------------------------------------------------------------------
// Scene

function buildScene(): void {
  const s = scene!;
  // Objects lower on screen are nearer the camera, so they draw on top.
  const add = (html: string, key: string, x: number, y: number, onTap: () => void): HTMLElement => {
    const e = el(html);
    e.dataset.key = key;
    e.style.left = `${x}px`;
    e.style.top = `${y}px`;
    e.style.zIndex = String(Math.round(y));
    e.addEventListener('click', onTap);
    s.appendChild(e);
    return e;
  };
  add('<button class="obj" data-tut="barn"></button>', 'barn', SCENE.barn.x, SCENE.barn.y, () => gate('openBarn') && openInventory('barn'));
  add('<button class="obj" data-tut="silo"></button>', 'silo', SCENE.silo.x, SCENE.silo.y, () => gate('openSilo') && openInventory('silo'));
  add('<button class="obj" data-tut="mill"></button>', 'feedmill', SCENE.feedmill.x, SCENE.feedmill.y, () => tapMachine('feedmill'));
  add('<button class="obj" data-tut="bakery"></button>', 'bakery', SCENE.bakery.x, SCENE.bakery.y, () => tapMachine('bakery'));
  add('<button class="obj" data-tut="coop"></button>', 'coop', SCENE.coop.x, SCENE.coop.y, () => tapCoop());
  SCENE.chickens.forEach((p, i) => add(`<button class="obj" data-tut="chicken${i}"></button>`, `chicken${i}`, p.x, p.y, () => tapChicken(i)));
  SCENE.plots.forEach((p, i) => add(`<button class="plot" data-tut="plot${i}"></button>`, `plot${i}`, p.x, p.y, () => tapPlot(i)));
}

function setObj(key: string, sig: string, html: string, cls = ''): void {
  if (sigs.get(key) === sig) return;
  sigs.set(key, sig);
  const e = scene!.querySelector<HTMLElement>(`[data-key="${key}"]`)!;
  e.innerHTML = html;
  e.className = (e.classList.contains('plot') ? 'plot ' : 'obj ') + cls;
}

const timerHtml = (readyAt: number): string => `<span class="timer" data-timer="${readyAt}">${fmtTime(readyAt - St.now())}</span>`;

export function updateFarm(): void {
  if (!root) return;
  root.querySelector('#hud-coin')!.textContent = String(S.wallet.coin);
  root.querySelector('#hud-star')!.textContent = String(S.wallet.star);
  const lvl = St.farmLevel();
  root.querySelector('#hud-lvl')!.textContent = `${t('level')} ${lvl}`;
  const next = xpForNextLevel(lvl);
  const base = XP_THRESHOLDS[lvl] ?? 0;
  const pct = next === null ? 100 : Math.min(100, ((S.progress.xp - base) / (next - base)) * 100);
  (root.querySelector('#hud-xp') as HTMLElement).style.width = `${pct}%`;
  const ready = S.farm.orders.filter(St.canFulfil).length;
  const badge = root.querySelector<HTMLElement>('#orders-badge')!;
  badge.style.display = ready ? '' : 'none';
  badge.textContent = String(ready);

  // Barn & silo
  for (const type of ['barn', 'silo'] as StorageType[]) {
    const used = St.used(type);
    const cap = S.storage[type].cap;
    const full = used >= cap;
    setObj(type, `${used}/${cap}`, `${img(type === 'barn' ? A.ICON_BARN : A.ICON_SILO, 'bld', type === 'barn' ? 140 : 130)}<span class="lbl" style="${full ? 'background:#d63a3a' : ''}">${t(type)} ${used}/${cap}</span>`);
  }
  // Machines
  for (const id of ['feedmill', 'bakery']) {
    const m = S.farm.machines[id];
    const cfg = MACHINES[id];
    const icon = id === 'feedmill' ? A.ICON_MILL : A.ICON_BAKERY;
    if (!m.owned) {
      const can = cfg.unlockLevel <= St.farmLevel();
      setObj(id, `locked:${can}`, `${img(icon, 'bld', 120)}${img(A.ICON_LOCK, 'lockmark')}<span class="lbl">${can ? `${t(id)} · ${cfg.cost}` : `${t(id)} · ${t('level')} ${cfg.unlockLevel}`}</span>`, 'locked');
      continue;
    }
    let extra = '';
    if (m.status === 'processing') extra = timerHtml(m.readyAt);
    else if (m.status === 'output' && m.recipe) extra = `<span class="bubble">${img(A.ITEM_ICON[RECIPES[m.recipe].output])}</span>`;
    setObj(id, `${m.status}:${m.readyAt}`, `${img(icon, 'bld', 120)}${extra}<span class="lbl">${t(id)}</span>`);
  }
  // Coop & chickens
  if (!S.farm.coopBuilt) setObj('coop', 'locked', `${img(A.ICON_COOP, 'bld', 110)}${img(A.ICON_LOCK, 'lockmark')}<span class="lbl">${t('coop')}</span>`, 'locked');
  else setObj('coop', `built:${S.farm.chickens.length}`, `${img(A.ICON_COOP, 'bld', 110)}<span class="lbl">${t('coop_short')} ${S.farm.chickens.length}/${COOP_CAPACITY}</span>`);
  SCENE.chickens.forEach((_, i) => {
    const c = S.farm.chickens[i];
    const e = scene!.querySelector<HTMLElement>(`[data-key="chicken${i}"]`)!;
    e.style.display = c ? '' : 'none';
    if (!c) return;
    let extra = '';
    if (c.status === 'hungry') extra = `<span class="bubble warn">${img(A.ICON_FEED)}</span>`;
    else if (c.status === 'producing') extra = timerHtml(c.readyAt);
    else extra = `<span class="bubble">${img(A.ICON_EGG)}</span>`;
    setObj(`chicken${i}`, `${c.status}:${c.readyAt}`, `${img(A.ICON_CHICKEN, 'bld', 50)}${extra}`);
  });
  // Plots: an iso soil tile (or the grass tile of a plot for sale) with the crop standing on it.
  const soil = img(A.PLOT_SOIL, 'soil');
  S.farm.plots.forEach((p, i) => {
    if (p.status === 'locked') { setObj(`plot${i}`, 'locked', `${img(A.PLOT_GRASS, 'soil')}<span class="price">${img(A.ICON_COIN)}${PLOT_COST}</span>`, 'locked'); return; }
    if (p.status === 'empty') { setObj(`plot${i}`, 'empty', `${soil}<span class="bubble">${img(A.ICON_PLUS)}</span>`); return; }
    const crop = CROPS[p.crop!];
    const stages = A.CROP_STAGE[crop.id];
    if (p.status === 'ready') { setObj(`plot${i}`, `ready:${crop.id}`, `${soil}${img(stages[2], 'crop')}<span class="bubble">${img(A.ITEM_ICON[crop.id])}</span>`, 'ready'); return; }
    const left = p.readyAt - St.now();
    const grow = (St.tutorialActive() ? crop.tutorialSeconds : crop.growSeconds) * 1000;
    const stage = left > grow * 0.5 ? 0 : 1;
    setObj(`plot${i}`, `growing:${crop.id}:${stage}:${p.readyAt}`, `${soil}${img(stages[stage], 'crop')}${timerHtml(p.readyAt)}`, 'growing');
  });
}

function updateTimers(): void {
  const now = St.now();
  for (const e of stage().querySelectorAll<HTMLElement>('[data-timer]')) e.textContent = fmtTime(Number(e.dataset.timer) - now);
  // Growth stage flips at half time without a state change.
  if (S.farm.plots.some((p) => p.status === 'growing')) updateFarm();
}

// ---------------------------------------------------------------------------
// Scene taps

function tapPlot(i: number): void {
  const p = S.farm.plots[i];
  if (p.status === 'locked') { if (gate('buyPlot', i) && report(St.buyPlot(i))) pop(`plot${i}`, img(A.ICON_COIN) + `-${PLOT_COST}`); return; }
  if (p.status === 'empty') { if (gate('openPlot', i)) openPlantMenu(i); return; }
  if (p.status === 'ready') {
    if (!gate('harvest', i)) return;
    const crop = CROPS[p.crop!];
    if (report(St.harvest(i))) pop(`plot${i}`, `${img(A.ITEM_ICON[crop.id])}+${crop.yieldQty}`);
    return;
  }
  toast(fmtTime(p.readyAt - St.now()));
}

function tapMachine(id: string): void {
  const m = S.farm.machines[id];
  if (!m.owned) {
    if (!gate('buyMachine', id)) return;
    const cfg = MACHINES[id];
    if (cfg.unlockLevel > St.farmLevel()) { toast(t('unlock_at', { n: cfg.unlockLevel }), 'warn'); return; }
    openShop();
    return;
  }
  if (m.status === 'output') { if (gate('collectOutput', id)) collectMachine(id); return; }
  if (gate('openMachine', id)) openMachine(id);
}

function collectMachine(id: string): void {
  const m = S.farm.machines[id];
  const r = m.recipe ? RECIPES[m.recipe] : null;
  if (report(St.collectOutput(id)) && r) pop(id, `${img(A.ITEM_ICON[r.output])}+${r.outputQty}`);
}

function tapCoop(): void {
  if (!S.farm.coopBuilt) { if (gate('openShop')) openShop(); return; }
  if (gate('openCoop')) openCoop();
}

function tapChicken(i: number): void {
  const c = S.farm.chickens[i];
  if (!c) return;
  if (c.status === 'hungry') { if (gate('feed', i)) feedChicken(i); return; }
  if (c.status === 'ready') { if (gate('collectEgg', i)) collectChicken(i); return; }
  toast(fmtTime(c.readyAt - St.now()));
}

function feedChicken(i: number): void {
  if (report(St.feedChicken(i))) pop(`chicken${i}`, `${img(A.ICON_FEED)}-1`);
}
function collectChicken(i: number): void {
  if (report(St.collectEgg(i))) pop(`chicken${i}`, `${img(A.ICON_EGG)}+2`);
}

function pop(key: string, html: string): void {
  const e = scene?.querySelector(`[data-key="${key}"]`);
  if (!e) return;
  const c = centerOf(e);
  floatLabel(c.x, c.y - 30, html);
}

function onGameEvent(e: St.GameEvent): void {
  if (!root?.classList.contains('on')) return;
  if (e.type === 'collectBlocked') toast(t(e.storage === 'barn' ? 'barn_full' : 'silo_full'), 'warn');
  if (e.type === 'levelUp') toast(t('level_up', { n: e.level }));
  if (e.type === 'xp' && e.delta > 0) { const c = centerOf(root.querySelector('.pill.lvl')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_XP)}+${e.delta}`); }
}

// ---------------------------------------------------------------------------
// Popups

function openPlantMenu(i: number): void {
  const p = openPopup('plant', t('choose_crop'));
  const render = (): void => {
    p.body.innerHTML = '';
    for (const c of Object.values(CROPS)) {
      const locked = c.unlockLevel > St.farmLevel();
      const row = el(`<div class="row${locked ? ' dim' : ''}">${img(A.ITEM_ICON[c.id], 'ic')}<div class="info"><b>${t(c.id)}</b><small>${locked ? t('unlock_at', { n: c.unlockLevel }) : `${fmtTime((St.tutorialActive() ? c.tutorialSeconds : c.growSeconds) * 1000)} · +${c.exp} XP`}</small></div>
        <button class="btn green small" data-tut="plant:${c.id}" ${locked ? 'disabled' : ''}>${t('plant')}</button></div>`);
      row.querySelector('button')!.addEventListener('click', () => {
        if (!gate('plant', i)) return;
        if (report(St.plantCrop(i, c.id))) closePopup();
      });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function openShop(): void {
  const p = openPopup('shop', t('shop'));
  const render = (): void => {
    p.body.innerHTML = '';
    const lvl = St.farmLevel();
    const addRow = (icon: string, name: string, desc: string, price: number, key: string, enabled: boolean, onBuy: () => void): void => {
      const row = el(`<div class="row${enabled ? '' : ' dim'}">${img(icon, 'ic')}<div class="info"><b>${name}</b><small>${desc}</small></div>
        <button class="btn orange small" data-tut="shop:${key}" ${enabled ? '' : 'disabled'}><span class="price">${img(A.ICON_COIN)}${price}</span></button></div>`);
      row.querySelector('button')!.addEventListener('click', onBuy);
      p.body.appendChild(row);
    };
    const freePlot = S.farm.plots.findIndex((x) => x.status === 'locked');
    addRow(A.CROP_STAGE.wheat[2], t('plot'), `${S.farm.plots.filter((x) => x.status !== 'locked').length}/${S.farm.plots.length}`, PLOT_COST, 'plot', freePlot >= 0,
      () => { if (gate('buyPlot', freePlot) && report(St.buyPlot(freePlot))) closePopup(); });
    addRow(A.ICON_COOP, t('coop'), `${COOP_CAPACITY} ${t('chicken').toLowerCase()}`, COOP_COST, 'coop', !S.farm.coopBuilt,
      () => { if (gate('buy', 'coop') && report(St.buyCoop())) closePopup(); });
    addRow(A.ICON_CHICKEN, t('chicken'), `${t('feed')} → ${t('egg')}`, CHICKEN_COST, 'chicken', S.farm.coopBuilt && S.farm.chickens.length < COOP_CAPACITY,
      () => { if (gate('buyChicken') && report(St.buyChicken())) closePopup(); });
    for (const m of Object.values(MACHINES)) {
      if (S.farm.machines[m.id].owned) continue;
      const ok = m.unlockLevel <= lvl;
      addRow(m.id === 'bakery' ? A.ICON_BAKERY : A.ICON_MILL, t(m.id), ok ? m.recipes.map((r) => t(RECIPES[r].output)).join(', ') : t('unlock_at', { n: m.unlockLevel }), m.cost, m.id, ok,
        () => { if (gate('buyMachine', m.id) && report(St.buyMachine(m.id))) closePopup(); });
    }
    // Boosters for the match game, bought with the same coins (hidden during the tutorial).
    if (!St.tutorialActive()) {
      p.body.appendChild(el(`<div class="section">${t('boosters')}</div>`));
      for (const b of BOOSTERS) {
        addRow(A.ITEM_ICON[b.key], t(`booster_${b.key}`), `${t(`booster_${b.key}_desc`)} ${t('booster_owned', { n: St.boosterCount(b.key) })}`, b.price, `booster_${b.key}`, true, () => {
          const err = St.buyBooster(b.key);
          if (err === 'err_coin') { if (!FalconSDK.shop.open(`buy_booster_${b.key}`)) toast(t('err_coin'), 'warn'); return; }
          if (report(err)) toast(t('booster_bought', { name: t(`booster_${b.key}`) }));
        });
      }
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

function openCoop(): void {
  const p = openPopup('coop', t('coop'));
  const render = (): void => {
    p.body.innerHTML = '';
    S.farm.chickens.forEach((c, i) => {
      const status = c.status === 'hungry' ? t('chicken_hungry') : c.status === 'producing' ? `<span data-timer="${c.readyAt}">${fmtTime(c.readyAt - St.now())}</span>` : t('chicken_ready');
      const action = c.status === 'hungry' ? `<button class="btn green small" data-tut="chicken:feed">${t('feed_v')}</button>`
        : c.status === 'ready' ? `<button class="btn orange small" data-tut="chicken:collect">${t('collect')}</button>` : '';
      const row = el(`<div class="row">${img(A.ICON_CHICKEN, 'ic')}<div class="info"><b>${t('chicken')} ${i + 1}</b><small>${status}</small></div>${action}</div>`);
      row.querySelector('button')?.addEventListener('click', () => {
        if (c.status === 'hungry') { if (gate('feed', i)) feedChicken(i); }
        else if (gate('collectEgg', i)) collectChicken(i);
      });
      p.body.appendChild(row);
    });
    if (S.farm.chickens.length < COOP_CAPACITY) {
      const row = el(`<div class="row">${img(A.ICON_CHICKEN, 'ic')}<div class="info"><b>${t('chicken')}</b><small>${t('buy')}</small></div>
        <button class="btn orange small" data-tut="coop:buy"><span class="price">${img(A.ICON_COIN)}${CHICKEN_COST}</span></button></div>`);
      row.querySelector('button')!.addEventListener('click', () => { if (gate('buyChicken')) report(St.buyChicken()); });
      p.body.appendChild(row);
    }
    p.body.appendChild(el(`<div class="muted center">${t('feed')}: ${St.count('feed')}</div>`));
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

function openMachine(id: string): void {
  const p = openPopup('machine', t(id));
  const render = (): void => {
    p.body.innerHTML = '';
    const m = S.farm.machines[id];
    if (m.status !== 'idle' && m.recipe) {
      const r = RECIPES[m.recipe];
      const status = m.status === 'processing' ? `<span data-timer="${m.readyAt}">${fmtTime(m.readyAt - St.now())}</span>` : t('machine_output');
      const row = el(`<div class="row">${img(A.ITEM_ICON[r.output], 'ic')}<div class="info"><b>${t(r.output)} ×${r.outputQty}</b><small>${status}</small></div>
        ${m.status === 'output' ? `<button class="btn orange small" data-tut="mill:collect">${t('collect')}</button>` : ''}</div>`);
      row.querySelector('button')?.addEventListener('click', () => { if (gate('collectOutput', id)) collectMachine(id); });
      p.body.appendChild(row);
      return;
    }
    for (const rid of MACHINES[id].recipes) {
      const r = RECIPES[rid];
      const inputs = r.inputs.map((x) => `<span class="${St.count(x.item) >= x.qty ? '' : 'no'}" style="${St.count(x.item) >= x.qty ? '' : 'color:#d63a3a'}">${x.qty} ${t(x.item)} (${St.count(x.item)})</span>`).join(' + ');
      const can = r.inputs.every((x) => St.count(x.item) >= x.qty) && r.unlockLevel <= St.farmLevel();
      const row = el(`<div class="row">${img(A.ITEM_ICON[r.output], 'ic')}<div class="info"><b>${t(r.output)} ×${r.outputQty}</b><small>${inputs}<br>${fmtTime((St.tutorialActive() ? r.tutorialSeconds : r.seconds) * 1000)} · +${r.exp} XP</small></div>
        <button class="btn green small" data-tut="mill:craft" ${can ? '' : 'disabled'}>${t('craft')}</button></div>`);
      row.querySelector('button')!.addEventListener('click', () => { if (gate('startRecipe', id)) report(St.startRecipe(id, rid)); });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function openInventory(type: StorageType): void {
  const p = openPopup('inventory', t('inventory'));
  let tab: StorageType = type;
  const render = (): void => {
    p.body.innerHTML = '';
    const tabs = el(`<div class="tabs"><button class="tab ${tab === 'silo' ? 'on' : ''}">${t('silo')}</button><button class="tab ${tab === 'barn' ? 'on' : ''}">${t('barn')}</button></div>`);
    tabs.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { tab = i === 0 ? 'silo' : 'barn'; render(); }));
    p.body.appendChild(tabs);
    const st = S.storage[tab];
    const used = St.used(tab);
    p.body.appendChild(el(`<div class="meter${used >= st.cap ? ' full' : ''}"><i style="width:${Math.min(100, (used / st.cap) * 100)}%"></i><b>${used} / ${st.cap}</b></div>`));
    const items = Object.entries(st.items).filter(([, q]) => q > 0);
    const grid = el('<div class="grid"></div>');
    for (const [item, q] of items) grid.appendChild(el(`<div class="cell">${img(A.ITEM_ICON[item])}<b>${q}</b><small>${t(item)}</small></div>`));
    if (!items.length) grid.appendChild(el(`<div class="cell" style="grid-column:span 4"><small>—</small></div>`));
    p.body.appendChild(grid);
    // Upgrade section
    const up = St.nextUpgrade(tab);
    if (!up) { p.body.appendChild(el(`<div class="center muted">${t('maxed')}</div>`)); return; }
    const need = up.required.map((r) => `<div class="cell ${St.count(r.item) >= r.qty ? 'ok' : 'no'}">${img(A.ITEM_ICON[r.item])}<b>${St.count(r.item)}/${r.qty}</b><small>${t(r.item)}</small></div>`).join('');
    const box = el(`<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><b class="center">${t('upgrade_to', { name: t(tab), n: up.tier })}</b>
      <div class="center muted">${t('cap_now', { a: st.cap, b: up.capacityAfter })}</div><div class="need">${need}</div>
      <div class="center"><button class="btn green" data-tut="${tab}:upgrade" ${St.canAffordUpgrade(tab) ? '' : 'disabled'}>${img(A.ICON_HAMMER)}${t('upgrade')}</button></div></div>`);
    box.querySelector('button')!.addEventListener('click', () => {
      if (!gate('upgrade', tab)) return;
      const before = st.cap;
      if (report(St.upgradeStorage(tab))) toast(t('cap_now', { a: before, b: S.storage[tab].cap }));
    });
    p.body.appendChild(box);
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function openUpgradeShop(): void {
  const p = openPopup('upgrades', t('upgrades'));
  const render = (): void => {
    p.body.innerHTML = '';
    p.body.appendChild(el(`<div class="center" style="font-weight:900;font-size:18px;display:flex;justify-content:center;align-items:center;gap:6px">${img(A.ICON_STAR, '', 28)} ${S.wallet.star} ${t('star')}</div>`));
    p.body.appendChild(el(`<div class="muted center">${t('shop_materials')}</div>`));
    for (const m of MATERIALS) {
      const price = MATERIAL_PRICE[m];
      const row = el(`<div class="row">${img(A.ITEM_ICON[m], 'ic')}<div class="info"><b>${t(m)}</b><small>${t('owned')}: ${St.count(m)} · ${m === 'nail' || m === 'screw' ? t('barn') : t('silo')}</small></div>
        <button class="btn blue small" data-tut="upgrades:${m}" ${S.wallet.star >= price ? '' : 'disabled'}><span class="price">${img(A.ICON_STAR)}${price}</span></button></div>`);
      let busy = false; // ST-04: a double tap buys once
      row.querySelector('button')!.addEventListener('click', () => {
        if (busy || !gate('buyMaterial', m)) return;
        busy = true;
        report(St.buyMaterial(m));
        setTimeout(() => { busy = false; }, 250);
      });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

function openOrders(): void {
  const p = openPopup('orders', t('orders'));
  const render = (): void => {
    p.body.innerHTML = '';
    St.refillOrders();
    if (!S.farm.orders.length) { p.body.appendChild(el(`<div class="center muted">${t('order_empty')}</div>`)); return; }
    for (const o of S.farm.orders) {
      const can = St.canFulfil(o);
      const items = o.items.map((x) => `<div class="cell ${St.count(x.item) >= x.qty ? 'ok' : 'no'}">${img(A.ITEM_ICON[x.item])}<b>${St.count(x.item)}/${x.qty}</b><small>${t(x.item)}</small></div>`).join('');
      const row = el(`<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div class="need" style="justify-content:flex-start">${items}</div>
        <div style="display:flex;align-items:center;gap:8px"><span class="price" style="flex:1">${img(A.ICON_COIN)}${o.coin} &nbsp; ${img(A.ICON_XP)}${o.exp}</span>
        <button class="btn grey small skip">${t('skip')}</button><button class="btn green small go" ${can ? '' : 'disabled'}>${t('deliver')}</button></div></div>`);
      row.querySelector('.go')!.addEventListener('click', () => { if (report(St.fulfilOrder(o.id))) { const c = centerOf(root!.querySelector('.pill.coin')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_COIN)}+${o.coin}`); } });
      row.querySelector('.skip')!.addEventListener('click', () => St.skipOrder(o.id));
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
}

export function levelUnlocked(i: number): boolean {
  const cfg = MATCH_LEVELS[i];
  return cfg.unlockAfter === 0 || (S.match.bestStars[String(cfg.unlockAfter)] ?? 0) >= 1;
}

export function openMatchMap(): void {
  // In the tutorial the Match button goes straight to level 1.
  if (St.tutorialActive()) { handlers.playLevel(0); return; }
  const p = openPopup('map', t('match'));
  const render = (): void => {
    p.body.innerHTML = '';
    const grid = el('<div class="maplist"></div>');
    let current = -1;
    MATCH_LEVELS.forEach((cfg, i) => {
      const best = S.match.bestStars[String(cfg.id)] ?? 0;
      const unlocked = levelUnlocked(i);
      if (current < 0 && unlocked && best === 0) current = i;
      const b = el(`<button class="lvlbtn${unlocked ? '' : ' locked'}${current === i ? ' current' : ''}"><b>${cfg.id}</b>
        <div class="st">${[1, 2, 3].map((s) => img(A.ICON_STAR, best >= s ? 'on' : '')).join('')}</div>
        <div class="g">${img(A.TILE_ART[cfg.goal.tile])}${cfg.goal.qty} ${img(A.ICON_CLOCK)}${cfg.moves}${unlocked ? '' : ' 🔒'}</div></button>`);
      b.addEventListener('click', () => { if (unlocked) handlers.playLevel(i); else toast(t('locked'), 'warn'); });
      grid.appendChild(b);
    });
    p.body.appendChild(grid);
  };
  render();
  setPopupRenderer(render);
}

function openSettings(): void {
  const p = openPopup('settings', t('settings'));
  const render = (): void => {
    p.body.innerHTML = '';
    for (const key of ['sound', 'music', 'haptic'] as const) {
      const row = el(`<div class="switch"><span>${t(key)}</span><button class="${S.settings[key] ? 'on' : ''}"></button></div>`);
      row.querySelector('button')!.addEventListener('click', () => St.setSetting(key, !S.settings[key]));
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
}

export function isPopupOpen(): boolean { return currentPopup() !== null; }
