/* progress.js — adherence over day / week / month / year, plus training records.
 *
 * The four headline numbers are kept separate on purpose. Rolling workout,
 * nutrition, habit and weight-tracking data into a single "fat loss %" would be
 * a made-up number, so each is reported on its own terms.
 */

import { el, relativeDate } from '../ui.js';
import { yearBars } from '../chart.js';
import { WEEK } from '../data/workouts.js';
import { EXERCISES, getExercise } from '../data/exercises.js';
import * as store from '../storage.js';

const PERIODS = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
let period = 'WEEK';   /* remembered between visits */

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  /* ?period=MONTH makes each view shareable and bookmarkable */
  const asked = String(params.period || '').toUpperCase();
  if (PERIODS.includes(asked)) period = asked;

  function paint() {
    const settings = store.getSettings();
    container.replaceChildren();

    container.appendChild(el('div', { class: 'chips', role: 'group', 'aria-label': 'Time period' },
      PERIODS.map(p => el('button', {
        class: 'chip', type: 'button', text: p, 'aria-pressed': String(p === period),
        onclick: () => { period = p; paint(); }
      }))));

    if (period === 'DAY') container.appendChild(dayCard());
    if (period === 'WEEK') container.appendChild(weekCard());
    if (period === 'MONTH') container.appendChild(monthCard());
    if (period === 'YEAR') container.appendChild(yearCard(settings));

    container.appendChild(recordsCard(settings));
    container.appendChild(historyCard(settings));
  }

  /* ---------- day ---------- */
  function dayCard() {
    const b = store.dailyBreakdown();
    return el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: 'Daily progress' }),
      el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${b.score}%` })]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.score}%` })]),
      el('ul', { class: 'score-parts', style: 'margin-top:16px' }, [
        row('Workout', b.workout.applicable ? `${b.workout.done} / ${b.workout.total}` : 'Rest day'),
        row('Meals', `${b.nutrition.done} / ${b.nutrition.total}`),
        row('Weight recorded', b.weight.expected === 2
          ? `${(b.weight.checkIn ? 1 : 0) + (b.weight.checkOut ? 1 : 0)} / 2`
          : (b.weight.value ? 'Yes' : 'No')),
        row('Habits tracked', `${b.habits.done} / ${b.habits.total}`)
      ])
    ]);
  }

  /* ---------- week ---------- */
  function weekCard() {
    const w = store.weekBreakdown();
    return el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: 'This week' }),
      el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${w.score}%` })]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${w.score}%` })]),

      el('div', { style: 'margin-top:18px' }, w.days.map(d => el('div', { class: `weekbar${d.isToday ? ' today' : ''}` }, [
        el('span', { class: 'd', text: d.day.short }),
        d.day.rest && !d.workout.applicable && d.score === 0
          ? el('span', { class: 'dim', style: 'font-size:12px;letter-spacing:.1em', text: 'REST' })
          : el('div', { class: 'bar bar-sm' }, [el('i', { style: `width:${d.future ? 0 : d.score}%` })]),
        el('span', { class: 'p', text: d.future ? '—' : `${d.score}%` })
      ]))),

      el('div', { class: 'stat-row', style: 'margin-top:18px' }, [
        stat('Workouts', `${w.workouts.done}/${w.workouts.total}`),
        stat('Meals', `${w.meals.done}/${w.meals.total}`),
        stat('Weigh-ins', `${w.weighIns.done}/${w.weighIns.total}`)
      ]),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:12px',
        text: `Habit adherence ${w.habitAdherence}% — days a habit met its own aim.` })
    ]);
  }

  /* ---------- month ---------- */
  function monthCard() {
    const m = store.monthBreakdown();
    const label = m.monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    /* Monday-first calendar grid */
    const lead = (m.monthStart.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(el('span', { class: 'cal-cell empty' }));
    for (const d of m.days) {
      const state = d.future ? 'future'
        : d.score >= 80 ? 'strong'
        : d.score > 0 ? 'partial'
        : d.day.rest ? 'rest' : 'none';
      cells.push(el('span', {
        class: `cal-cell ${state}`,
        role: 'img',
        'aria-label': `${d.date}: ${d.future ? 'upcoming' : state === 'rest' ? 'rest day' : d.score + ' percent'}`,
        title: `${d.date}: ${d.future ? 'upcoming' : d.score + '%'}`,
        text: String(Number(d.date.slice(-2)))
      }));
    }

    return el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: label }),
      el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${m.score}%` })]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${m.score}%` })]),

      el('div', { class: 'cal-head', style: 'margin-top:18px' },
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => el('span', { text: d }))),
      el('div', { class: 'cal-grid' }, cells),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:10px',
        text: '● 80%+ · ◐ partial · rest days and upcoming days are dimmed' }),

      el('div', { style: 'margin-top:18px' }, [
        consistency('Workout consistency', m.workoutConsistency),
        consistency('Nutrition consistency', m.nutritionConsistency),
        consistency('Habit consistency', m.habitConsistency),
        consistency('Weight-tracking consistency', m.weightConsistency)
      ])
    ]);
  }

  /* ---------- year ---------- */
  function yearCard(settings) {
    const y = store.yearBreakdown();
    return el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: String(y.year) }),
      el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${y.score}%` })]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${y.score}%` })]),

      el('div', { style: 'margin-top:18px' }, [yearBars(y.months)]),

      el('div', { class: 'stat-row', style: 'margin-top:18px' }, [
        stat('Workouts', String(y.workouts)),
        stat('Meals', String(y.meals)),
        stat('Habit adherence', `${y.habitAdherence}%`)
      ]),
      el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
        stat('Weight change', y.weightChange == null ? '—' : `${y.weightChange > 0 ? '+' : ''}${y.weightChange} ${settings.units}`),
        stat('Best workout run', String(y.bestWorkoutStreak)),
        stat('Best habit run', String(y.bestHabitStreak))
      ])
    ]);
  }

  /* ---------- training records (unchanged behaviour) ---------- */
  function recordsCard(settings) {
    const prs = store.getAllPRs();
    const recorded = EXERCISES.filter(e => prs[e.id]);
    const keyLifts = ['barbell-bench-press', 'barbell-squat', 'deadlift', 'overhead-press', 'barbell-row'];
    const list = (recorded.length ? recorded : keyLifts.map(getExercise)).map(ex => {
      const pr = prs[ex.id];
      return el('div', { class: 'pr-row' }, [
        el('span', { class: 'nm', text: ex.name }),
        el('span', {
          class: 'v',
          html: pr?.latest ? `${pr.latest.weight} ${settings.units}<small>Current</small>` : `<span class="dim">Not recorded</span>`
        }),
        el('span', { class: 'v best', html: pr?.best ? `${pr.best.weight} ${settings.units}<small>Best</small>` : '' })
      ]);
    });

    return el('section', { class: 'card' }, [
      el('p', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Personal records' }),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-bottom:8px',
        text: recorded.length
          ? `${recorded.length} exercise${recorded.length === 1 ? '' : 's'} with logged weight`
          : 'Log a set with weight to start tracking records.' }),
      ...list
    ]);
  }

  function historyCard(settings) {
    const withHistory = EXERCISES
      .map(ex => ({ ex, hist: store.exerciseHistory(ex.id) }))
      .filter(x => x.hist.length);

    if (!withHistory.length) {
      return el('div', { class: 'empty' }, [
        el('p', { text: 'No sets logged yet.' }),
        el('p', { style: 'font-size:13px', text: 'Weights, reps and RPE you record in workout mode appear here.' })
      ]);
    }

    const picker = el('select', { class: 'input', 'aria-label': 'Choose an exercise' },
      withHistory.map(({ ex }) => el('option', { value: ex.id, text: ex.name })));
    const body = el('div', {});

    function paintHistory() {
      const rec = withHistory.find(x => x.ex.id === picker.value) || withHistory[0];
      body.replaceChildren();
      for (const h of rec.hist.slice(0, 12)) {
        body.appendChild(el('div', { class: 'hist-row' }, [
          el('span', { class: 'dt', text: relativeDate(h.date) }),
          el('div', { class: 'hist-sets' }, h.sets.map(s =>
            el('span', { text: `${s.weight ?? '—'}${settings.units} × ${s.reps ?? '—'}${s.rpe ? ` @${s.rpe}` : ''}` })))
        ]));
      }
    }
    picker.addEventListener('change', paintHistory);
    paintHistory();

    return el('section', { class: 'card stack' }, [
      el('p', { class: 'eyebrow', text: 'Exercise history' }), picker, body
    ]);
  }

  paint();
  return { title: 'Progress', eyebrow: 'Adherence & records', node: container };
}

function row(label, detail) {
  return el('li', {}, [
    el('span', { class: 'grow', text: label }),
    el('span', { class: 'dim', style: 'font-size:12.5px', text: detail })
  ]);
}

function stat(label, value) {
  return el('div', { class: 'stat' }, [el('b', { text: value }), el('span', { text: label })]);
}

function consistency(label, value) {
  return el('div', { style: 'margin-bottom:12px' }, [
    el('div', { class: 'row-between' }, [
      el('span', { style: 'font-size:13px', text: label }),
      el('span', { class: 'dim', style: 'font-size:13px', text: `${value}%` })
    ]),
    el('div', { class: 'bar bar-sm', style: 'margin-top:5px' }, [el('i', { style: `width:${value}%` })])
  ]);
}
