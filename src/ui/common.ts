// Shared DOM helpers: the fixed 400×800 stage that scales to the viewport,
// popups (one at a time), toasts and floating "+1" labels.

import { svgUrl } from '../art';

export const STAGE_W = 400;
export const STAGE_H = 800;

let stageEl: HTMLElement | null = null;
let scale = 1;

export function stage(): HTMLElement {
  if (!stageEl) {
    stageEl = document.getElementById('stage');
    if (!stageEl) {
      stageEl = document.createElement('div');
      stageEl.id = 'stage';
      document.body.appendChild(stageEl);
    }
    window.addEventListener('resize', fitStage);
    fitStage();
  }
  return stageEl;
}

export function getScale(): number { return scale; }

export function fitStage(): void {
  if (!stageEl) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  scale = Math.min(w / STAGE_W, h / STAGE_H);
  const x = Math.round((w - STAGE_W * scale) / 2);
  const y = Math.round((h - STAGE_H * scale) / 2);
  stageEl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

/** Pointer/client coordinates → stage coordinates. */
export function toStage(clientX: number, clientY: number): { x: number; y: number } {
  const r = stage().getBoundingClientRect();
  return { x: (clientX - r.left) / scale, y: (clientY - r.top) / scale };
}

export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild as T;
}

// `art` is inline SVG markup or an ASSET url (see art.ts).
export const img = (art: string, cls = '', size?: number): string =>
  `<img src="${svgUrl(art)}" class="${cls}" alt=""${size ? ` style="width:${size}px;height:${size}px"` : ''}>`;

export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r.toString().padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, '0')}m`;
}

// ---------------------------------------------------------------------------
// Popups

export interface Popup { id: string; root: HTMLElement; card: HTMLElement; body: HTMLElement; foot: HTMLElement; }
let current: Popup | null = null;
const popupListeners = new Set<(id: string | null) => void>();
export function onPopupChange(fn: (id: string | null) => void): void { popupListeners.add(fn); }

export function currentPopup(): string | null { return current?.id ?? null; }

export function openPopup(id: string, title: string, opts: { closable?: boolean; onClose?: () => void } = {}): Popup {
  closePopup();
  const closable = opts.closable !== false;
  const root = el(`<div class="backdrop" data-popup="${id}"><div class="card">
    <div class="head">${title}</div>${closable ? '<button class="x" data-tut="close">✕</button>' : ''}
    <div class="body"></div><div class="foot" style="display:none"></div></div></div>`);
  const card = root.querySelector<HTMLElement>('.card')!;
  const body = root.querySelector<HTMLElement>('.body')!;
  const foot = root.querySelector<HTMLElement>('.foot')!;
  const p: Popup = { id, root, card, body, foot };
  current = p;
  const close = (): void => { if (current === p) { closePopup(); opts.onClose?.(); } };
  root.querySelector('.x')?.addEventListener('click', close);
  root.addEventListener('pointerdown', (e) => { if (e.target === root && closable) close(); });
  stage().appendChild(root);
  for (const fn of [...popupListeners]) fn(id);
  return p;
}

export function closePopup(): void {
  if (!current) return;
  current.root.remove();
  current = null;
  for (const fn of [...popupListeners]) fn(null);
}

/** Re-run the renderer of the open popup (after a state change). */
let rerender: (() => void) | null = null;
export function setPopupRenderer(fn: (() => void) | null): void { rerender = fn; }
export function rerenderPopup(): void { if (current && rerender) rerender(); }

// ---------------------------------------------------------------------------
// Toasts & floats

let toastEl: HTMLElement | null = null;
let toastTimer = 0;
export function toast(text: string, kind: 'ok' | 'warn' = 'ok'): void {
  toastEl?.remove();
  toastEl = el(`<div class="toast ${kind}">${text}</div>`);
  stage().appendChild(toastEl);
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastEl?.remove(); toastEl = null; }, 1800);
}

export function floatLabel(x: number, y: number, html: string): void {
  const f = el(`<div class="float" style="left:${x}px;top:${y}px">${html}</div>`);
  stage().appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

/** Center of an element in stage coordinates. */
export function centerOf(target: Element): { x: number; y: number } {
  const r = target.getBoundingClientRect();
  return toStage(r.left + r.width / 2, r.top + r.height / 2);
}
