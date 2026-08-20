/* sessions.js — gym session history.
 *
 * One row per trained day with check-in / check-out, duration, volume and PRs.
 * Opening a session shows the per-exercise log and compares it with the
 * previous time that exercise was trained.
 */

import { el, icon, sheet, relativeDate } from '../ui.js';
import { getExercise } from '../data/exercises.js';
import { exercisesOf } from '../data/workouts.js';
import * as store from '../storage.js';

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const units = store.getSettings().units;
    const history = store.sessionHistory();
    const streak = store.workoutStreak();
    container.replaceChildren();

    if (!history.length) {
      container.appendChild(el('div', { class: 'empty' }, [
        el('p', { style: 'font-size:17px;font-weight:800;color:var(--text)', text: 'YOUR STORY STARTS HERE.' }),
        el('p', { text: 'Log your first gym session to start building your history.' }),
        el('a', { class: 'btn btn-primary', style: 'margin-top:12px', href: '#/', text: 'GO TO TODAY' })
      ]));
      return;
    }

    /* headline */
    container.appendChild(el('section', { class: 'card accent-workout' }, [
      el('p', { class: 'eyebrow', text: 'Workout streak' }),
      el('div', { class: 'score-line', style: 'margin-top:6px' }, [
        el('strong', { text: String(streak.current) }),
        el('span', { class: 'dim', style: 'font-size:15px;margin-left:8px', text: streak.current === 1 ? 'day' : 'days' })
      ]),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:6px',
        text: `Best ${streak.longest} · scheduled rest days carry the streak over` }),
      el('div', { class: 'stat-row', style: 'margin-top:16px' }, [
        stat('Sessions', String(history.length)),
        stat('Total sets', String(history.reduce((n, s) => n + s.sets, 0))),
        stat(`Volume ${units}`, fmt(history.reduce((n, s) => n + s.volume, 0)))
      ])
    ]));

    /* list */
    container.appendChild(el('div', { class: 'section-title' }, [
      el('h2', { text: 'Session history' }),
      el('span', { text: `${history.length} logged` })
    ]));

    container.appendChild(el('div', { class: 'stack' }, history.map(s => el('button', {
      class: 'session-row', type: 'button',
      'aria-label': `${s.date}, ${s.title}. Open details.`,
      onclick: () => openSession(s)
    }, [
      el('div', { class: 'row-between' }, [
        el('div', { class: 'grow' }, [
          el('p', { class: 'eyebrow', text: relativeDate(s.date) }),
          el('p', { style: 'font-size:16px;font-weight:800;margin-top:2px', text: s.title.toUpperCase() })
        ]),
        el('span', { class: 'tag', text: `${s.exercisesDone}/${s.exercisesTotal}` })
      ]),
      el('div', { class: 'session-metrics' }, [
        mini('Check-in', s.checkIn != null ? `${s.checkIn}` : '—'),
        mini('Check-out', s.checkOut != null ? `${s.checkOut}` : '—'),
        mini('Change', s.sessionChange != null ? `${s.sessionChange > 0 ? '+' : ''}${s.sessionChange}` : '—'),
        mini('Duration', s.durationMin ? `${s.durationMin}m` : '—'),
        mini('Sets', String(s.sets)),
        mini(`Volume`, fmt(s.volume))
      ])
    ]))));

    container.appendChild(el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45',
      text: 'Session change is the difference between your two weigh-ins. It reflects hydration, food and fluid loss — not fat lost.' }));
  }

  /* ---------- one session ---------- */
  function openSession(s) {
    const units = store.getSettings().units;
    const ids = exercisesOf(s.day);
    const rows = [];

    for (const id of ids) {
      const ex = getExercise(id);
      if (!ex) continue;
      const hist = store.exerciseHistory(id);
      const thisTime = hist.find(h => h.date === s.date);
      if (!thisTime) continue;
      const before = hist.find(h => h.date < s.date) || null;

      const top = thisTime.sets
        .filter(x => Number(x.weight) > 0 && Number(x.reps) > 0)
        .reduce((a, b) => (!a || store.estimate1RM(b.weight, b.reps) > store.estimate1RM(a.weight, a.reps) ? b : a), null);
      const prevTop = before?.sets
        .filter(x => Number(x.weight) > 0 && Number(x.reps) > 0)
        .reduce((a, b) => (!a || store.estimate1RM(b.weight, b.reps) > store.estimate1RM(a.weight, a.reps) ? b : a), null);

      const up = top && prevTop
        ? store.estimate1RM(top.weight, top.reps) - store.estimate1RM(prevTop.weight, prevTop.reps)
        : null;

      rows.push(el('div', { class: 'sess-ex' }, [
        el('div', { class: 'row-between' }, [
          el('span', { style: 'font-weight:700;font-size:14.5px', text: ex.name }),
          up != null ? el('span', {
            class: `tag ${up > 0.5 ? 'tag-accent' : ''}`.trim(),
            text: up > 0.5 ? '↑ up' : up < -0.5 ? '↓ down' : '= flat'
          }) : null
        ]),
        el('div', { class: 'hist-sets', style: 'margin-top:6px' }, thisTime.sets.map(x =>
          el('span', { text: `${x.weight ?? '—'}${units}×${x.reps ?? '—'}${x.rpe ? ` @${x.rpe}` : ''}` }))),
        prevTop ? el('p', { class: 'dim', style: 'font-size:12px;margin-top:5px',
          text: `Previous best that day: ${prevTop.weight}${units} × ${prevTop.reps} (${before.date})` }) : null
      ]));
    }

    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'stat-row' }, [
        stat('Duration', s.durationMin ? `${s.durationMin}m` : '—'),
        stat('Sets', String(s.sets)),
        stat('Reps', String(s.reps))
      ]),
      el('div', { class: 'stat-row' }, [
        stat(`Volume ${units}`, fmt(s.volume)),
        stat('Avg RPE', s.avgRpe != null ? String(s.avgRpe) : '—'),
        stat('Exercises', `${s.exercisesDone}/${s.exercisesTotal}`)
      ]),
      s.sessionChange != null ? el('div', { class: 'session-delta', style: 'margin-top:4px' }, [
        el('p', { class: 'eyebrow', text: 'Session weight change' }),
        el('p', { class: 'delta-value', text: `${s.sessionChange > 0 ? '+' : ''}${s.sessionChange} ${units}` }),
        el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45',
          text: 'Hydration, food and glycogen — not fat loss. Use the long-term trend for that.' })
      ]) : null,
      rows.length ? el('p', { class: 'eyebrow', style: 'margin-top:8px', text: 'Exercise log' }) : null,
      ...rows
    ]);

    sheet(`${s.day.name} · ${s.title}`, body);
  }

  paint();
  return { title: 'Sessions', eyebrow: 'History', back: '#/analytics', node: container };
}

const fmt = n => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : String(n));

function stat(label, value) {
  return el('div', { class: 'stat' }, [el('b', { text: value }), el('span', { text: label })]);
}

function mini(label, value) {
  return el('div', { class: 'sess-mini' }, [
    el('span', { class: 'sm-label', text: label }),
    el('span', { class: 'sm-value', text: value })
  ]);
}
