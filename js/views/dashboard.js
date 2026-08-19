/* dashboard.js — "Today".
 *
 * Ordered around the real day rather than around the data model: weight first
 * (it is the first thing measured at the gym), then the workout, then nutrition,
 * then habits, then the score that summarises all of it. Private habits are
 * collapsed behind their own control and never surface a value here.
 */

import { el, icon, greeting } from '../ui.js';
import { dayFor, exercisesOf, nextTrainingDay } from '../data/workouts.js';
import * as store from '../storage.js';
import { dayStrip } from './daystrip.js';
import { weighInSheet, checkPair } from './weighin.js';

const pct = n => `${Math.round(n)}%`;

export function view(params, app) {
  const settings = store.getSettings();
  const day = dayFor();
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const b = store.dailyBreakdown();
    const goal = store.weightGoal();
    const plan = store.getMealPlan();
    const targets = store.getTargets();
    const habits = store.getHabits();
    const log = store.getDayLog();
    const w = store.weightsOn();

    container.replaceChildren();

    /* ---------- greeting ---------- */
    container.appendChild(el('header', { class: 'dash-head' }, [
      el('p', { class: 'greeting', text: `${greeting()}, ${settings.name || 'there'}` }),
      el('p', { class: 'dim', style: 'font-size:12.5px',
        text: new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) })
    ]));

    /* ---------- weight ---------- */
    const weightCard = el('section', { class: 'card accent-weight' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Weight' }),
        el('a', { class: 'link-more', href: '#/weight', text: 'Journey →' })
      ]),
      goal.current == null
        ? el('div', { class: 'stack', style: 'margin-top:10px' }, [
            el('p', { class: 'muted', text: 'No weigh-in yet. Record one to start your trend.' }),
            el('button', {
              class: 'btn btn-primary btn-block', type: 'button', text: 'LOG WEIGHT',
              onclick: () => weighInSheet('manual', { onSaved: paint })
            })
          ])
        : el('div', {}, [
            el('div', { class: 'big-metric' }, [
              el('strong', { text: String(goal.current) }),
              el('span', { text: settings.units })
            ]),
            el('div', { class: 'row-between', style: 'margin-top:12px' }, [
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `Start ${goal.start} ${settings.units}` }),
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `Target ${goal.target} ${settings.units}` })
            ]),
            el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${goal.pct}%` })]),
            el('p', { style: 'margin-top:8px;font-size:13.5px',
              text: goal.remaining > 0
                ? `${goal.remaining} ${settings.units} to target · ${goal.lost > 0 ? goal.lost + ' lost so far' : 'trend building'}`
                : 'You are within your target range.' })
          ])
    ]);
    container.appendChild(weightCard);

    /* ---------- workout ---------- */
    const ids = exercisesOf(day);
    const needsCheckIn = !day.rest && !w.checkin;
    const workoutCard = el('section', { class: 'card accent-workout' }, [
      el('p', { class: 'eyebrow', text: day.rest ? 'Today' : "Today's workout" }),
      el('h2', { style: 'font-size:22px;margin-top:4px', text: day.rest ? 'Rest / Recovery' : day.title }),
      day.rest
        ? el('div', { class: 'stack', style: 'margin-top:10px' }, [
            el('p', { class: 'muted', style: 'font-size:14px', text: 'Recovery is part of the program.' }),
            el('p', { class: 'dim', style: 'font-size:13px',
              text: `Next: ${nextTrainingDay(day).name} — ${nextTrainingDay(day).title}` })
          ])
        : el('div', {}, [
            el('div', { class: 'row-between', style: 'margin-top:12px' }, [
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `${b.workout.done} / ${b.workout.total} exercises` }),
              el('span', { class: 'dim', style: 'font-size:12.5px', text: pct(b.workout.value * 100) })
            ]),
            el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.workout.value * 100}%` })]),
            needsCheckIn
              ? el('button', {
                  class: 'btn btn-primary btn-lg btn-block', style: 'margin-top:14px', type: 'button',
                  html: `${icon('timer')}<span>GYM CHECK-IN</span>`,
                  onclick: () => weighInSheet('checkin', { dayId: day.id, onSaved: paint })
                })
              : el('a', {
                  class: 'btn btn-primary btn-lg btn-block', style: 'margin-top:14px',
                  href: `#/workout/${day.id}`,
                  html: `${icon('play')}<span>${b.workout.done ? 'CONTINUE WORKOUT' : 'START WORKOUT'}</span>`
                }),
            el('a', { class: 'btn btn-ghost btn-block', style: 'margin-top:8px', href: `#/day/${day.id}`, text: 'View exercise list' })
          ])
    ]);
    container.appendChild(workoutCard);

    /* check-in / check-out pair once a session is under way */
    if (!day.rest && (w.checkin || w.checkout)) {
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', style: 'margin-bottom:10px', text: 'Session weigh-ins' }),
        checkPair(day.id, paint)
      ]));
    }

    /* ---------- nutrition ---------- */
    const kcalPct = targets.kcal ? Math.min(100, (b.nutrition.kcal / targets.kcal) * 100) : 0;
    const protPct = targets.protein ? Math.min(100, (b.nutrition.protein / targets.protein) * 100) : 0;

    container.appendChild(el('section', { class: 'card accent-nutrition' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Nutrition' }),
        el('a', { class: 'link-more', href: '#/nutrition', text: 'Meals →' })
      ]),
      el('div', { class: 'macro-row', style: 'margin-top:12px' }, [
        el('div', {}, [
          el('p', { class: 'macro-value', text: `≈ ${b.nutrition.kcal} / ${targets.kcal}` }),
          el('p', { class: 'dim', style: 'font-size:11.5px', text: 'kcal' }),
          el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${kcalPct}%` })])
        ]),
        el('div', {}, [
          el('p', { class: 'macro-value', text: `≈ ${b.nutrition.protein} / ${targets.protein}` }),
          el('p', { class: 'dim', style: 'font-size:11.5px', text: 'g protein' }),
          el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${protPct}%` })])
        ])
      ]),
      el('div', { class: 'meal-toggles', style: 'margin-top:14px' }, plan.map(meal => {
        const done = !!log.meals[meal.id];
        return el('button', {
          class: `meal-toggle${done ? ' done' : ''}`, type: 'button',
          'aria-pressed': String(done),
          'aria-label': `${meal.name}, ${done ? 'completed' : 'not completed'}`,
          onclick: () => { store.setMeal(meal.id, !done); paint(); }
        }, [
          el('span', { class: 'tick', html: done ? icon('check') : '' }),
          el('span', { class: 'grow', text: meal.name }),
          el('span', { class: 'dim', style: 'font-size:11.5px', text: `≈${meal.kcal}` })
        ]);
      }))
    ]));

    /* ---------- habits ---------- */
    const publicHabits = habits.filter(h => !h.private);
    const privateHabits = habits.filter(h => h.private);
    const privateTracked = privateHabits.filter(h => log.habits[h.id]?.tracked).length;

    container.appendChild(el('section', { class: 'card accent-habits' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: "Today's habits" }),
        el('a', { class: 'link-more', href: '#/habits', text: 'All →' })
      ]),
      publicHabits.length
        ? el('ul', { class: 'habit-mini', style: 'margin-top:10px' }, publicHabits.map(h => {
            const entry = log.habits[h.id];
            return el('li', {}, [
              el('span', { class: 'grow', text: h.name }),
              el('span', {
                class: entry?.tracked ? 'tag tag-accent' : 'tag',
                text: entry?.tracked ? formatValue(h, entry) : 'Not tracked'
              })
            ]);
          }))
        : el('p', { class: 'dim', style: 'font-size:13px;margin-top:8px', text: 'No open habits yet.' }),
      privateHabits.length ? el('a', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:12px', href: '#/habits',
        text: settings.hidePrivate
          ? `🔒 Private habits · ${privateTracked} / ${privateHabits.length} tracked`
          : `Private habits · ${privateTracked} / ${privateHabits.length} tracked`
      }) : null
    ]));

    /* ---------- daily progress ---------- */
    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Daily progress' }),
        el('a', { class: 'link-more', href: '#/progress', text: 'Week · Month · Year →' })
      ]),
      el('div', { class: 'score-line', style: 'margin-top:10px' }, [
        el('strong', { text: pct(b.score) })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.score}%` })]),
      el('ul', { class: 'score-parts', style: 'margin-top:14px' }, [
        part('Workout', b.workout.applicable ? `${b.workout.done} / ${b.workout.total}` : 'Rest day', b.workout.applicable ? b.workout.value : null),
        part('Meals', `${b.nutrition.done} / ${b.nutrition.total}`, b.nutrition.value),
        part('Weight', b.weight.expected === 2
          ? `${(b.weight.checkIn ? 1 : 0) + (b.weight.checkOut ? 1 : 0)} / 2 recorded`
          : (b.weight.value ? 'Recorded' : 'Not recorded'), b.weight.value),
        part('Habits', `${b.habits.done} / ${b.habits.total} tracked`, b.habits.value)
      ]),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:12px;line-height:1.45',
        text: 'Weight counts as recorded, not as a number going down. Weight fluctuates naturally — the trend is what matters.' })
    ]));

    /* ---------- week at a glance ---------- */
    container.appendChild(el('div', {}, [
      el('div', { class: 'section-title' }, [el('h2', { text: 'This week' })]),
      dayStrip(day.id, id => app.go(`#/day/${id}`))
    ]));
  }

  function part(label, detail, value) {
    return el('li', {}, [
      el('span', { class: 'grow', text: label }),
      el('span', { class: 'dim', style: 'font-size:12.5px', text: detail }),
      el('span', { class: 'part-dot' + (value == null ? ' na' : value >= 1 ? ' full' : value > 0 ? ' part' : '') })
    ]);
  }

  paint();

  return { title: 'Today', eyebrow: day.rest ? 'Rest day' : day.title, node: container };
}

function formatValue(habit, entry) {
  if (habit.type === 'yesno') return entry.value ? 'Yes' : 'No';
  const v = Number(entry.value) || 0;
  if (habit.type === 'duration') return `${v} h`;
  return habit.unit ? `${v}` : String(v);
}
