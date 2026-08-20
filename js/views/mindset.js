/* mindset.js — the "WHY NOT ME?" motivation screen.
 *
 * Editorial poster style: black background, red typography, strong negative space.
 * Not a daily dashboard — a deliberate pause for perspective.
 */

import { el, icon } from '../ui.js';
import * as store from '../storage.js';

const MANTRAS = [
  'WHY NOT ME?',
  'BUILD.',
  'DISCIPLINE.',
  'SHOW UP.',
  'DO IT AGAIN.',
  'THE WORK IS THE IDENTITY.',
  'NO EXCUSES.',
  'BECOME.',
  'RELENTLESS.',
  'ONE MORE.'
];

let currentMantra = 0;
let rotationInterval = null;

export function view(params, app) {
  const container = el('div', { class: 'view mindset-view' });

  const settings = store.getSettings();
  const goal = store.weightGoal();
  const streak = store.getWorkoutStreaks();
  const lifetime = store.lifetimeStats();
  const rate = store.getWeightLossRate();

  function paint() {
    container.replaceChildren();

    /* Full-screen black canvas */
    const canvas = el('div', { class: 'mindset-canvas' });

    /* Mantra display - large, editorial */
    const mantraEl = el('h1', { class: 'mindset-mantra', 'aria-live': 'polite' }, [
      el('span', { text: MANTRAS[currentMantra] })
    ]);

    /* Silhouette divider */
    const silhouette = el('div', { class: 'mindset-silhouette', 'aria-hidden': 'true' });

    /* Stats strip - subtle, at bottom */
    const statsStrip = el('div', { class: 'mindset-stats' }, [
      goal.current != null && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'CURRENT WEIGHT' }),
        el('span', { class: 'stat-value', text: `${goal.current} ${settings.units}` })
      ]),
      goal.current != null && goal.start != null && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'TOTAL CHANGE' }),
        el('span', { class: 'stat-value', text: `${goal.lost > 0 ? '-' : '+'}${Math.abs(goal.lost)} ${settings.units}` })
      ]),
      streak.current > 0 && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'CURRENT STREAK' }),
        el('span', { class: 'stat-value', text: `${streak.current} DAYS` })
      ]),
      streak.longest > 0 && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'BEST STREAK' }),
        el('span', { class: 'stat-value', text: `${streak.longest} DAYS` })
      ]),
      lifetime.workouts > 0 && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'TOTAL SESSIONS' }),
        el('span', { class: 'stat-value', text: String(lifetime.workouts) })
      ]),
      rate != null && el('div', { class: 'stat-item' }, [
        el('span', { class: 'stat-label', text: 'WEEKLY TREND' }),
        el('span', { class: 'stat-value', text: `${rate > 0 ? '+' : ''}${rate} ${settings.units}/wk` })
      ])
    ].filter(Boolean));

    /* Navigation hint */
    const hint = el('p', { class: 'mindset-hint' }, [
      'Tap to cycle · Swipe to dismiss'
    ]);

    canvas.append(mantraEl, silhouette, statsStrip, hint);
    container.appendChild(canvas);

    /* Start rotation */
    startRotation(mantraEl);
  }

  function startRotation(mantraEl) {
    stopRotation();
    rotationInterval = setInterval(() => {
      currentMantra = (currentMantra + 1) % MANTRAS.length;
      mantraEl.style.opacity = '0';
      mantraEl.style.transform = 'translateY(20px) scale(0.95)';
      setTimeout(() => {
        mantraEl.firstChild.textContent = MANTRAS[currentMantra];
        mantraEl.style.opacity = '1';
        mantraEl.style.transform = 'translateY(0) scale(1)';
      }, 300);
    }, 8000);
  }

  function stopRotation() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    }
  }

  /* Touch/click to cycle manually */
  let touchStartX = 0;
  container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      /* Swipe dismiss - go back */
      stopRotation();
      app.go('#/');
    } else {
      /* Tap - cycle */
      currentMantra = (currentMantra + 1) % MANTRAS.length;
      const mantraEl = container.querySelector('.mindset-mantra');
      if (mantraEl) {
        mantraEl.style.opacity = '0';
        mantraEl.style.transform = 'translateY(20px) scale(0.95)';
        setTimeout(() => {
          mantraEl.firstChild.textContent = MANTRAS[currentMantra];
          mantraEl.style.opacity = '1';
          mantraEl.style.transform = 'translateY(0) scale(1)';
        }, 200);
      }
    }
  }, { passive: true });

  container.addEventListener('click', e => {
    if (e.target.closest('.mindset-hint')) return;
    currentMantra = (currentMantra + 1) % MANTRAS.length;
    const mantraEl = container.querySelector('.mindset-mantra');
    if (mantraEl) {
      mantraEl.style.opacity = '0';
      mantraEl.style.transform = 'translateY(20px) scale(0.95)';
      setTimeout(() => {
        mantraEl.firstChild.textContent = MANTRAS[currentMantra];
        mantraEl.style.opacity = '1';
        mantraEl.style.transform = 'translateY(0) scale(1)';
      }, 200);
    }
  });

  return {
    title: 'Mindset',
    eyebrow: '',
    node: container,
    destroy() { stopRotation(); }
  };
}