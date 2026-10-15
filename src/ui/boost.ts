// Farm Boost: a rewarded ad that runs every farm timer (fields, animals,
// machines, trees) ×BOOST_SPEED for BOOST_SECONDS. The HUD button lives in
// farm.ts; this file holds the offer popup and the ad itself.
//
// The ad goes through the SDK (`ads.showRewarded()`), so the shell app shows a
// real one. With no shell app (plain browser, Preview) the SDK answers "watched"
// at once, so a simulated ad plays first to show the flow as the player sees it.

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import { BOOST_SECONDS, BOOST_SPEED, SIM_AD_SECONDS } from '../config';
import { t } from '../i18n';
import * as St from '../state';
import { tutorial } from '../tutorial';
import { closePopup, el, fmtTime, img, openPopup, setPopupRenderer, stage, toast } from './common';

let watching = false;

/** The offer popup: what the boost does, the time left on a running one, and "Watch ad". */
export function openBoostOffer(): void {
  const p = openPopup('boost', t('boost_title'));
  p.card.classList.add('boost');
  const render = (): void => {
    const left = St.boostLeft();
    p.body.innerHTML = `<div class="boost-art">${img(A.ICON_CLOCK)}<b>×${BOOST_SPEED}</b></div>
      <div class="center">${t('boost_desc', { n: BOOST_SPEED, m: BOOST_SECONDS / 60 })}</div>
      ${left > 0 ? `<div class="center boost-left">${t('boost_running')} <b data-timer="${St.S.boost.until}">${fmtTime(left)}</b></div>` : ''}`;
    p.foot.style.display = '';
    p.foot.innerHTML = `<button class="btn green" id="boost-watch" data-tut="boost:watch">📺 ${t(left > 0 ? 'boost_extend' : 'boost_watch', { m: BOOST_SECONDS / 60 })}</button>`;
    p.foot.querySelector('#boost-watch')!.addEventListener('click', () => void watchForBoost());
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

async function watchForBoost(): Promise<void> {
  if (watching || !tutorial.allows('watchBoost')) return;
  watching = true;
  closePopup();
  const where = St.boostLeft() > 0 ? 'boost_extend' : 'boost_offer';
  FalconSDK.analytics.logAction('rw_boost_watch', { where, params: { farmLevel: St.farmLevel() } });
  const shown = FalconSDK.bridge.isNative() ? await FalconSDK.ads.showRewarded() : (await simulatedAd()) && (await FalconSDK.ads.showRewarded());
  FalconSDK.analytics.logAction('rw_boost_result', { where, params: { shown, farmLevel: St.farmLevel() } });
  watching = false;
  if (!shown) { toast(t('ad_not_ready'), 'warn'); return; }
  St.startBoost();
  toast(t('boost_on', { n: BOOST_SPEED, m: fmtTime(St.boostLeft()) }));
}

/** A stand-in rewarded ad: a countdown, then ✕. Closing it early forfeits the reward. */
function simulatedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    const ad = el(`<div class="simad">
      <div class="simad-top"><span class="simad-tag">AD</span><span class="simad-reward"></span><button class="simad-x">✕</button></div>
      <div class="simad-body">${img(A.ICON_TRACTOR)}<b>Harvest Pop</b><span>${t('ad_sim_line')}</span></div>
      <div class="simad-bar"><i></i></div>
    </div>`);
    const reward = ad.querySelector<HTMLElement>('.simad-reward')!;
    const bar = ad.querySelector<HTMLElement>('.simad-bar i')!;
    const close = ad.querySelector<HTMLElement>('.simad-x')!;
    const start = performance.now();
    const total = SIM_AD_SECONDS * 1000;
    let done = false;
    const step = (): void => {
      const ms = performance.now() - start;
      done = ms >= total;
      bar.style.width = `${Math.min(1, ms / total) * 100}%`;
      reward.textContent = done ? t('ad_sim_done') : t('ad_sim_wait', { n: Math.ceil((total - ms) / 1000) });
      ad.classList.toggle('done', done);
    };
    step();
    const handle = window.setInterval(step, 100);
    close.addEventListener('click', () => {
      clearInterval(handle);
      ad.remove();
      resolve(done);
    });
    stage().appendChild(ad);
  });
}
