/* backfill.js — log a day you already lived.
 *
 * Everything in storage is date-addressed, so this screen is the same set of
 * controls as Today pointed at a past date. It writes nothing on its own: only
 * what you tick gets recorded, so a partially remembered day stays partial
 * rather than being filled in with assumptions.
 */

import { el, icon, toast } from '../ui.js';
import { dayFor, exercisesOf } from '../data/workouts.js';
import { getExercise } from '../data/exercises.js';
import * as store from '../storage.js';
import { weighInSheet } from './weighin.js';

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const midday = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  /* default to yesterday — the most likely thing you forgot to log */
  let target = new Date();
  target.setDate(target.getDate() - 1);
  if (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
    const [y, m, d] = params.date.split('-').map(Number);
    target = new Date(y, m - 1, d);
  }

  function setDate(d) {
    const today = new Date();
    /* never let a future day be logged */
    if (d > today) { toast('That day has not happened yet', 'close'); return; }
    target = d;
    paint();
  }

  function paint() {
    const settings = store.getSettings();
    const units = settings.units;
    const when = midday(target);
    const day = dayFor(when);
    const log = store.getDayLog(iso(when));
    const w = store.weightsOn(when);
    const plan = store.getMealPlan();
    const habits = store.getHabits();
    const ids = exercisesOf(day);
    const b = store.dailyBreakdown(iso(when));

    container.replaceChildren();

    /* ---------- date picker ---------- */
    const dateInput = el('input', {
      type: 'date', class: 'input', value: iso(target), max: iso(new Date()),
      'aria-label': 'Date to log',
      onchange: e => {
        const [y, m, d] = e.target.value.split('-').map(Number);
        if (y) setDate(new Date(y, m - 1, d));
      }
    });

    const quick = [1, 2, 3, 7].map(n => {
      const d = new Date(); d.setDate(d.getDate() - n);
      return el('button', {
        class: 'chip', type: 'button',
        'aria-pressed': String(iso(d) === iso(target)),
        text: n === 1 ? 'Yesterday' : n === 7 ? '1 week ago' : `${n} days ago`,
        onclick: () => setDate(d)
      });
    });

    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: 'Logging for' }),
      el('h2', { class: 'display display-md', style: 'margin-top:6px',
        text: when.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) }),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:4px',
        text: day.rest ? 'Scheduled: rest / recovery' : `Scheduled: ${day.title}` }),
      el('div', { style: 'margin-top:12px' }, [dateInput]),
      el('div', { class: 'chips', style: 'margin-top:10px' }, quick),
      el('div', { class: 'row-between', style: 'margin-top:14px' }, [
        el('span', { class: 'dim', style: 'font-size:12.5px', text: 'Day score once saved' }),
        el('span', { class: 'tag tag-accent', text: `${b.score}%` })
      ])
    ]));

    /* ---------- weight ---------- */
    const slot = (kind, label) => {
      const entry = w[kind];
      return el('button', {
        class: `check-slot${entry ? ' filled' : ''}`, type: 'button',
        'aria-label': entry ? `${label}: ${entry.kg} ${units}. Change.` : `Record ${label}`,
        onclick: () => weighInSheet(kind, { date: when, dayId: day.id, onSaved: paint })
      }, [
        el('span', { class: 'eyebrow', text: label }),
        el('strong', { text: entry ? `${entry.kg}` : '—' }),
        el('span', { class: 'dim', style: 'font-size:11px', text: entry ? `${units} · ${entry.time}` : 'not recorded' })
      ]);
    };

    container.appendChild(el('section', { class: 'card accent-weight' }, [
      el('p', { class: 'eyebrow', text: 'Weight' }),
      el('div', { class: 'check-pair', style: 'margin-top:10px' }, [
        slot('checkin', 'Check-in'), slot('checkout', 'Check-out')
      ]),
      el('button', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:10px', type: 'button',
        text: 'LOG A ONE-OFF WEIGHT',
        onclick: () => weighInSheet('manual', { date: when, dayId: day.id, onSaved: paint })
      })
    ]));

    /* ---------- meals ---------- */
    container.appendChild(el('section', { class: 'card accent-nutrition' }, [
      el('p', { class: 'eyebrow', text: 'Meals' }),
      el('div', { class: 'meal-toggles', style: 'margin-top:10px' }, plan.map(meal => {
        const done = !!log.meals[meal.id];
        return el('button', {
          class: `meal-toggle${done ? ' done' : ''}`, type: 'button',
          'aria-pressed': String(done),
          onclick: () => { store.setMeal(meal.id, !done, iso(when)); paint(); }
        }, [
          el('span', { class: 'tick', html: done ? icon('check') : '' }),
          el('span', { class: 'grow', text: meal.name }),
          el('span', { class: 'dim', style: 'font-size:11.5px', text: `≈${meal.kcal}` })
        ]);
      }))
    ]));

    /* ---------- habits ---------- */
    container.appendChild(el('section', { class: 'card accent-habits' }, [
      el('p', { class: 'eyebrow', text: 'Habits' }),
      el('div', { class: 'stack', style: 'margin-top:10px' }, habits.map(h => {
        const entry = log.habits[h.id];
        const row = el('div', { class: 'backfill-habit' }, [
          el('div', { class: 'grow' }, [
            el('span', { style: 'font-weight:650;font-size:14px', text: h.name }),
            el('span', { class: 'dim', style: 'display:block;font-size:11.5px',
              text: entry?.tracked ? 'Tracked' : 'Not tracked' })
          ])
        ]);

        if (h.type === 'yesno') {
          const val = entry?.tracked ? entry.value : null;
          row.appendChild(el('div', { class: 'row', style: 'gap:6px' }, [
            el('button', {
              class: 'seg-btn', type: 'button', style: 'flex:0 0 58px',
              'aria-pressed': String(val === true), text: 'YES',
              onclick: () => { store.setHabit(h.id, { value: true }, iso(when)); paint(); }
            }),
            el('button', {
              class: 'seg-btn', type: 'button', style: 'flex:0 0 58px',
              'aria-pressed': String(val === false), text: 'NO',
              onclick: () => { store.setHabit(h.id, { value: false }, iso(when)); paint(); }
            })
          ]));
        } else {
          const step = h.type === 'duration' ? 0.5 : 1;
          const input = el('input', {
            type: 'number', min: '0', step: String(step), style: 'width:74px',
            class: 'input', value: entry?.tracked ? String(entry.value ?? 0) : '',
            placeholder: h.target ? String(h.target) : '0',
            'aria-label': `${h.name} value`,
            onchange: e => {
              const v = e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0);
              if (v == null) store.clearHabit(h.id, iso(when));
              else store.setHabit(h.id, { value: v }, iso(when));
              paint();
            }
          });
          row.appendChild(input);
        }
        return row;
      }))
    ]));

    /* ---------- workout ---------- */
    if (!day.rest) {
      const doneCount = ids.filter(id => store.getEntry(day.id, id, 1, when).done).length;
      const session = store.getSession(day.id, when);
      const mins = (session.startedAt && session.endedAt)
        ? Math.round((session.endedAt - session.startedAt) / 60000) : '';

      container.appendChild(el('section', { class: 'card accent-workout' }, [
        el('div', { class: 'row-between' }, [
          el('p', { class: 'eyebrow', text: `Workout · ${day.title}` }),
          el('span', { class: 'dim', style: 'font-size:12.5px', text: `${doneCount} / ${ids.length}` })
        ]),
        el('div', { class: 'row', style: 'gap:8px;margin-top:12px' }, [
          el('button', {
            class: 'btn grow', type: 'button', text: 'MARK ALL DONE',
            onclick: () => {
              for (const id of ids) store.setExerciseDone(day.id, id, true, settings.defaultSets, when);
              toast('Workout logged');
              paint();
            }
          }),
          el('button', {
            class: 'btn btn-ghost grow', type: 'button', text: 'CLEAR',
            onclick: () => {
              for (const id of ids) store.setExerciseDone(day.id, id, false, settings.defaultSets, when);
              paint();
            }
          })
        ]),
        el('div', { class: 'stack', style: 'margin-top:12px' }, ids.map(id => {
          const ex = getExercise(id);
          const done = store.getEntry(day.id, id, 1, when).done;
          return el('button', {
            class: `meal-toggle${done ? ' done' : ''}`, type: 'button',
            'aria-pressed': String(done),
            onclick: () => { store.setExerciseDone(day.id, id, !done, settings.defaultSets, when); paint(); }
          }, [
            el('span', { class: 'tick', html: done ? icon('check') : '' }),
            el('span', { class: 'grow', text: ex.name }),
            el('span', { class: 'dim', style: 'font-size:11px', text: ex.muscleGroup })
          ]);
        })),
        el('label', { class: 'setting-row', style: 'margin-top:8px;border:0' }, [
          el('div', {}, [
            el('div', { class: 'lbl', text: 'Session length' }),
            el('div', { class: 'hint', text: 'Minutes, if you remember' })
          ]),
          el('input', {
            type: 'number', class: 'input', style: 'width:100px', min: '1', max: '600',
            value: String(mins), placeholder: '—', 'aria-label': 'Session minutes',
            onchange: e => {
              if (!e.target.value) return;
              store.setSessionDuration(day.id, e.target.value, when);
              toast('Duration saved');
              paint();
            }
          })
        ]),
        el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45',
          text: 'Marking an exercise done records your default sets. To enter the actual weights and reps, open the exercise from that day in the schedule.' })
      ]));
    } else {
      container.appendChild(el('div', { class: 'empty' }, [
        el('p', { text: 'Rest day — nothing scheduled to log.' })
      ]));
    }

    container.appendChild(el('p', { class: 'dim', style: 'font-size:12px;line-height:1.5;text-align:center',
      text: 'Only what you tick is saved. Anything left untouched stays unrecorded rather than being guessed at.' }));
  }

  paint();
  return { title: 'Add past data', eyebrow: 'Backfill', back: '#/settings', node: container };
}
