/* nutrition.js — the daily meal plan and completion tracking.
 *
 * Every calorie and protein figure is an estimate of a home-cooked portion, so
 * the UI shows "≈" everywhere rather than implying gram-level accuracy.
 */

import { el, icon, sheet, toast } from '../ui.js';
import * as store from '../storage.js';

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const plan = store.getMealPlan();
    const targets = store.getTargets();
    const log = store.getDayLog();
    const b = store.dailyBreakdown();
    container.replaceChildren();

    const kcalPct = targets.kcal ? Math.min(100, (b.nutrition.kcal / targets.kcal) * 100) : 0;
    const protPct = targets.protein ? Math.min(100, (b.nutrition.protein / targets.protein) * 100) : 0;

    /* ---------- summary ---------- */
    container.appendChild(el('section', { class: 'card accent-nutrition' }, [
      el('p', { class: 'eyebrow', text: "Today's nutrition" }),
      el('div', { class: 'row-between', style: 'margin-top:12px' }, [
        el('span', { style: 'font-size:13px', text: 'Meals' }),
        el('span', { class: 'dim', style: 'font-size:13px', text: `${b.nutrition.done} / ${b.nutrition.total}` })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.nutrition.value * 100}%` })]),

      el('div', { class: 'row-between', style: 'margin-top:16px' }, [
        el('span', { style: 'font-size:13px', text: 'Protein' }),
        el('span', { class: 'dim', style: 'font-size:13px', text: `≈ ${b.nutrition.protein} / ${targets.protein} g` })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${protPct}%` })]),

      el('div', { class: 'row-between', style: 'margin-top:16px' }, [
        el('span', { style: 'font-size:13px', text: 'Calories' }),
        el('span', { class: 'dim', style: 'font-size:13px', text: `≈ ${b.nutrition.kcal} / ${targets.kcal} kcal` })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${kcalPct}%` })]),

      el('p', { class: 'dim', style: 'font-size:12px;margin-top:14px;line-height:1.45',
        text: 'Calories and protein are approximate. Portion size, cooking method and ingredient variation all move these numbers.' })
    ]));

    /* ---------- meals ---------- */
    container.appendChild(el('div', { class: 'section-title' }, [
      el('h2', { text: 'Meals' }),
      el('span', { text: `≈ ${targets.kcal} kcal · ≈ ${targets.protein} g` })
    ]));

    container.appendChild(el('div', { class: 'stack' }, plan.map(meal => {
      const done = !!log.meals[meal.id];
      return el('button', {
        class: `meal-card${done ? ' done' : ''}`, type: 'button',
        'aria-label': `${meal.name}, ${done ? 'completed' : 'not completed'}. Open details.`,
        onclick: () => openMeal(meal, done)
      }, [
        el('span', { class: 'meal-tick', html: done ? icon('check') : '' }),
        el('span', { class: 'grow' }, [
          el('span', { class: 'meal-name', text: meal.name }),
          el('span', { class: 'meal-macros', text: `≈ ${meal.kcal} kcal · ≈ ${meal.protein} g protein` }),
          el('span', { class: 'meal-items', text: meal.items.slice(0, 3).join(' · ') + (meal.items.length > 3 ? ' …' : '') })
        ]),
        el('span', { class: 'dim', html: icon('right') })
      ]);
    })));

    container.appendChild(el('a', {
      class: 'btn btn-ghost btn-block', href: '#/settings', text: 'Edit meal plan in Settings'
    }));
  }

  function openMeal(meal, done) {
    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'row', style: 'gap:8px' }, [
        el('span', { class: 'tag tag-accent', text: `≈ ${meal.kcal} kcal` }),
        el('span', { class: 'tag', text: `≈ ${meal.protein} g protein` })
      ]),
      el('ul', { class: 'list', style: 'margin-top:4px' }, meal.items.map(i =>
        el('li', { class: 'cue cue-num' }, [el('i', { text: '•' }), el('span', { text: i })]))),
      el('button', {
        class: `btn btn-lg btn-block ${done ? 'btn-ghost' : 'btn-primary'}`, type: 'button',
        html: done ? `${icon('check')}<span>COMPLETED — TAP TO UNDO</span>` : `${icon('check')}<span>MARK COMPLETE</span>`,
        onclick: () => {
          store.setMeal(meal.id, !done);
          toast(done ? `${meal.name} cleared` : `${meal.name} complete`);
          ref.close();
          paint();
        }
      }),
      el('p', { class: 'dim', style: 'font-size:12px', text: 'Amounts are approximate — adjust the plan in Settings if yours differs.' })
    ]);
    const ref = sheet(meal.name, body);
  }

  paint();
  return { title: 'Nutrition', eyebrow: 'Meal plan', node: container };
}
