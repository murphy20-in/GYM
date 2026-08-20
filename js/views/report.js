/* report.js — monthly report and year in review.
 *
 * Every figure is computed from logged sets; nothing is estimated to fill a
 * gap. Where there is no data the section says so instead of drawing an empty
 * chart that looks like a real one.
 */

import { el, icon, relativeDate } from '../ui.js';
import { BY_ID, getExercise } from '../data/exercises.js';
import { MUSCLE_NAMES } from '../muscles.js';
import * as store from '../storage.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

let scope = 'MONTH';
let offset = 0;   /* 0 = current period, -1 = previous, … */

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });
  if (params.scope === 'YEAR' || params.scope === 'MONTH') scope = params.scope;

  function range() {
    const now = new Date();
    if (scope === 'YEAR') {
      const y = now.getFullYear() + offset;
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31), label: String(y) };
    }
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      from: d,
      to: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    };
  }

  function paint() {
    const units = store.getSettings().units;
    const { from, to, label } = range();
    const vol = store.volumeBetween(from, to);
    container.replaceChildren();

    /* ---- header ---- */
    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('div', { class: 'chips', role: 'group', 'aria-label': 'Report scope' },
        ['MONTH', 'YEAR'].map(s => el('button', {
          class: 'chip', type: 'button', text: s, 'aria-pressed': String(s === scope),
          onclick: () => { scope = s; offset = 0; paint(); }
        }))),
      el('div', { class: 'daynav', style: 'margin-top:12px' }, [
        el('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Earlier',
          html: icon('left'), onclick: () => { offset--; paint(); } }),
        el('div', { class: 'center' }, [
          el('strong', { class: 'display display-md', text: label.toUpperCase() }),
          el('span', { text: scope === 'YEAR' ? 'Year in review' : 'Monthly report' })
        ]),
        el('button', {
          class: 'btn btn-icon', type: 'button', 'aria-label': 'Later', html: icon('right'),
          disabled: offset >= 0, onclick: () => { if (offset < 0) { offset++; paint(); } }
        })
      ])
    ]));

    if (!vol.sessions) {
      container.appendChild(el('div', { class: 'empty' }, [
        el('p', { style: 'font-size:16px;font-weight:800;color:var(--text)', text: 'NO SESSIONS LOGGED' }),
        el('p', { text: `Nothing was recorded in ${label}.` }),
        el('a', { class: 'btn', style: 'margin-top:10px', href: '#/backfill', text: 'ADD PAST DATA' })
      ]));
      return;
    }

    /* ---- training ---- */
    const hours = Math.floor(vol.durationMin / 60);
    const mins = vol.durationMin % 60;
    container.appendChild(el('section', { class: 'card accent-workout' }, [
      el('p', { class: 'eyebrow', text: 'Training' }),
      el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
        stat('Sessions', String(vol.sessions)),
        stat('Sets', String(vol.sets)),
        stat('Reps', fmt(vol.reps))
      ]),
      el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
        stat(`Volume ${units}`, fmt(vol.volume)),
        stat('Time', vol.durationMin ? `${hours}h ${mins}m` : '—')
      ]),
      el('p', { class: 'dim', style: 'font-size:11.5px;margin-top:10px',
        text: 'Volume = weight × reps, summed over completed working sets. Warm-ups excluded.' })
    ]));

    /* ---- muscle distribution ---- */
    const dist = store.muscleDistribution(from, to, BY_ID);
    const muscles = Object.entries(dist).sort((a, b) => b[1].sets - a[1].sets);
    if (muscles.length) {
      const max = muscles[0][1].sets || 1;
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Muscle distribution' }),
        el('p', { class: 'dim', style: 'font-size:12px;margin-top:4px',
          text: 'Sets counted fully for primary muscles, half for secondary.' }),
        el('div', { style: 'margin-top:12px' }, muscles.map(([m, v]) => el('div', { class: 'dist-row' }, [
          el('span', { class: 'dist-name', title: MUSCLE_NAMES[m] || m, text: MUSCLE_NAMES[m] || m }),
          el('div', { class: 'bar bar-sm' }, [el('i', { style: `width:${(v.sets / max) * 100}%` })]),
          el('span', { class: 'dist-val', text: `${v.sets}` })
        ])))
      ]));
    }

    /* ---- planned vs actual ---- */
    const pva = store.plannedVsActual(from, to, BY_ID).filter(r => r.planned > 0);
    if (pva.length) {
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Planned vs actual' }),
        el('p', { class: 'dim', style: 'font-size:12px;margin-top:4px',
          text: 'Which muscles actually received the work the program prescribes.' }),
        el('div', { style: 'margin-top:12px' }, pva.map(r => el('div', { class: 'pva-row' }, [
          el('span', { class: 'pva-name', text: (MUSCLE_NAMES[r.muscle] || r.muscle) }),
          el('span', { class: 'pva-nums', text: `${r.actual} / ${r.planned}` }),
          el('span', {
            class: `tag ${r.ratio >= 90 ? 'tag-accent' : r.ratio >= 60 ? '' : 'tag-warn'}`.trim(),
            text: r.ratio == null ? '—' : `${r.ratio}%`
          })
        ])))
      ]));
    }

    /* ---- top exercises ---- */
    const top = Object.entries(vol.byExercise)
      .map(([id, v]) => ({ id, ...v, name: getExercise(id)?.name || id }))
      .sort((a, b) => b.volume - a.volume).slice(0, 6);
    if (top.length) {
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Most volume' }),
        el('div', { style: 'margin-top:10px' }, top.map(t => el('div', { class: 'pr-row' }, [
          el('span', { class: 'nm', text: t.name }),
          el('span', { class: 'v', html: `${fmt(t.volume)}<small>${units}</small>` }),
          el('span', { class: 'v', html: `${t.sets}<small>sets</small>` })
        ])))
      ]));
    }

    /* ---- records ---- */
    const prs = store.recentPRs(from, to, BY_ID);
    container.appendChild(el('section', { class: 'card' }, [
      el('p', { class: 'eyebrow', text: 'Records set' }),
      prs.length
        ? el('div', { style: 'margin-top:10px' }, prs.slice(0, 10).map(p => el('div', { class: 'pr-row' }, [
            el('span', { class: 'nm', text: p.name }),
            el('span', { class: 'v', html: `${p.kind === 'e1rm' ? p.value : p.weight}<small>${p.label}</small>` }),
            el('span', { class: 'dim', style: 'font-size:11.5px', text: relativeDate(p.date) })
          ])))
        : el('p', { class: 'dim', style: 'font-size:13px;margin-top:8px',
            text: 'No new records in this period. Records need a weight and reps on a working set.' })
    ]));

    /* ---- weight ---- */
    const weights = store.dailyWeights().filter(w => w.date >= store.dateKey(from) && w.date <= store.dateKey(to));
    container.appendChild(el('section', { class: 'card accent-weight' }, [
      el('p', { class: 'eyebrow', text: 'Body weight' }),
      weights.length > 1
        ? el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
            stat('Start', String(weights[0].kg)),
            stat('End', String(weights[weights.length - 1].kg)),
            stat('Change', `${weights[weights.length - 1].kg - weights[0].kg > 0 ? '+' : ''}${Math.round((weights[weights.length - 1].kg - weights[0].kg) * 10) / 10}`)
          ])
        : el('p', { class: 'dim', style: 'font-size:13px;margin-top:8px',
            text: 'Not enough weigh-ins in this period to show a change.' })
    ]));

    /* ---- adherence ---- */
    const adherence = scope === 'YEAR' ? store.yearBreakdown(from.getFullYear()) : store.monthBreakdown(from);
    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('p', { class: 'eyebrow', text: 'Adherence' }),
      el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${adherence.score}%` })]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${adherence.score}%` })]),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:10px',
        text: 'Averaged over days with something recorded, so months before you started tracking do not drag it down.' })
    ]));
  }

  paint();
  return { title: scope === 'YEAR' ? 'Year in review' : 'Monthly report', eyebrow: 'Report', back: '#/analytics', node: container };
}

const fmt = n => (n >= 10000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const stat = (label, value) => el('div', { class: 'stat' }, [el('b', { text: value }), el('span', { text: label })]);
