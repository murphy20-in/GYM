/* progress.js — weekly completion, personal records and exercise history. */

import { el, relativeDate } from '../ui.js';
import { WEEK } from '../data/workouts.js';
import { EXERCISES, getExercise } from '../data/exercises.js';
import * as store from '../storage.js';

export function view(params, app) {
  const settings = store.getSettings();
  const stats = store.lifetimeStats();
  const week = store.weekSummary(WEEK);
  const prs = store.getAllPRs();

  /* ---- lifetime ---- */
  const statRow = el('div', { class: 'stat-row' }, [
    el('div', { class: 'stat' }, [el('b', { text: String(stats.workouts) }), el('span', { text: 'Workouts' })]),
    el('div', { class: 'stat' }, [el('b', { text: String(stats.sets) }), el('span', { text: 'Sets logged' })]),
    el('div', { class: 'stat' }, [
      el('b', { text: stats.volume ? formatVolume(stats.volume) : '—' }),
      el('span', { text: `Volume ${settings.units}` })
    ])
  ]);

  /* ---- weekly completion ---- */
  const weekCard = el('section', { class: 'card' }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'This week' }),
    ...week.map(w => el('div', { class: `weekbar${w.isToday ? ' today' : ''}` }, [
      el('span', { class: 'd', text: w.day.short }),
      w.rest
        ? el('span', { class: 'dim', style: 'font-size:12px;letter-spacing:.1em', text: 'REST' })
        : el('div', { class: 'bar bar-sm' }, [el('i', { style: `width:${w.pct}%` })]),
      el('span', { class: 'p', text: w.rest ? '—' : `${w.pct}%` })
    ]))
  ]);

  /* ---- personal records ---- */
  const recorded = EXERCISES.filter(e => prs[e.id]);
  const keyLifts = ['barbell-bench-press', 'barbell-squat', 'deadlift', 'overhead-press', 'barbell-row'];
  const prList = (recorded.length ? recorded : keyLifts.map(getExercise)).map(ex => {
    const pr = prs[ex.id];
    return el('div', { class: 'pr-row' }, [
      el('span', { class: 'nm', text: ex.name }),
      el('span', { class: 'v', html: pr?.latest
        ? `${pr.latest.weight} ${settings.units}<small>Current</small>`
        : `<span class="dim">Not recorded</span>` }),
      el('span', { class: 'v best', html: pr?.best
        ? `${pr.best.weight} ${settings.units}<small>Best</small>`
        : '' })
    ]);
  });

  const prCard = el('section', { class: 'card' }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Personal records' }),
    el('p', { class: 'dim', style: 'font-size:12.5px;margin-bottom:8px',
      text: recorded.length ? `${recorded.length} exercise${recorded.length === 1 ? '' : 's'} with logged weight` : 'Log a set with weight to start tracking records.' }),
    ...prList
  ]);

  /* ---- history ---- */
  const historyExercises = EXERCISES
    .map(ex => ({ ex, hist: store.exerciseHistory(ex.id) }))
    .filter(x => x.hist.length);

  const picker = el('select', { class: 'input', 'aria-label': 'Choose an exercise' },
    historyExercises.map(({ ex }) => el('option', { value: ex.id, text: ex.name })));

  const histBody = el('div', {});

  function paintHistory() {
    const rec = historyExercises.find(x => x.ex.id === picker.value) || historyExercises[0];
    histBody.replaceChildren();
    if (!rec) return;
    for (const h of rec.hist.slice(0, 12)) {
      histBody.appendChild(el('div', { class: 'hist-row' }, [
        el('span', { class: 'dt', text: relativeDate(h.date) }),
        el('div', { class: 'hist-sets' }, h.sets.map(s =>
          el('span', { text: `${s.weight ?? '—'}${settings.units} × ${s.reps ?? '—'}${s.rpe ? ` @${s.rpe}` : ''}` })))
      ]));
    }
  }
  picker.addEventListener('change', paintHistory);
  paintHistory();

  const histCard = historyExercises.length
    ? el('section', { class: 'card stack' }, [
        el('h3', { class: 'eyebrow', text: 'Exercise history' }),
        picker,
        histBody
      ])
    : el('div', { class: 'empty' }, [
        el('p', { text: 'No sets logged yet.' }),
        el('p', { style: 'font-size:13px', text: 'Weights, reps and RPE you record in workout mode appear here.' })
      ]);

  return {
    title: 'Progress',
    eyebrow: 'History & records',
    node: el('div', { class: 'view stack-lg' }, [statRow, weekCard, prCard, histCard])
  };
}

function formatVolume(v) {
  return v >= 10000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}
