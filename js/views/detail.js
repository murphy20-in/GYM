/* detail.js — exercise detail screen.
 *
 * Ordered for someone standing in a gym: the visual and the six-line quick form
 * come first and fit on one screen, everything else is below the fold.
 */

import { el, exerciseFigure, phaseLadder } from '../ui.js';
import { muscleMapSVG, muscleLegend } from '../muscles.js';
import { getExercise } from '../data/exercises.js';
import { getDay, exercisesOf } from '../data/workouts.js';
import * as store from '../storage.js';
import { setGrid, completeButton } from './setgrid.js';

const bullets = (items, kind, mark) => el('ul', { class: 'list' },
  items.map(t => el('li', { class: `cue cue-${kind}` }, [
    el('i', { text: mark }), el('span', { text: t })
  ])));

const numbered = (items) => el('ol', { class: 'list' },
  items.map((t, i) => el('li', { class: 'cue cue-num' }, [
    el('i', { text: String(i + 1) }), el('span', { text: t })
  ])));

function block(title, body, cls = '') {
  return el('section', { class: `card ${cls}`.trim() }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:10px', text: title }),
    body
  ]);
}

export function view(params, app) {
  const ex = getExercise(params.id);
  if (!ex) return { title: 'Not found', node: el('div', { class: 'empty', text: 'That exercise does not exist.' }) };

  const dayId = params.day || null;
  const day = dayId ? getDay(dayId) : null;
  const settings = store.getSettings();

  const ladder = phaseLadder(ex);
  /* the ladder highlights whichever phase the animation is currently in */
  const fig = exerciseFigure(ex, { onPhase: p => ladder.highlight(p) });
  const figure = el('div', {}, [fig.node, ladder.node]);

  const tags = el('div', { class: 'detail-tags' }, [
    el('span', { class: 'tag tag-accent', text: ex.muscleGroup }),
    el('span', { class: 'tag', text: ex.equipment }),
    el('span', { class: 'tag', text: ex.difficulty })
  ]);

  /* the sticky top bar already carries the name; repeating it here would just
     push the visual — the reason someone opens this screen — below the fold */
  const head = el('header', { class: 'detail-head' }, [
    el('h2', { class: 'sr-only', text: ex.name }),
    tags
  ]);

  const quick = el('section', { class: 'quickform' }, [
    el('h3', { text: 'Quick Form' }),
    el('ol', {}, ex.quickForm.map(t => el('li', {}, [el('span', { text: t })])))
  ]);

  const muscles = block('Muscles Worked', el('div', {}, [
    el('div', { html: muscleMapSVG(ex.primary, ex.secondary) }),
    el('div', { html: muscleLegend(ex.primary, ex.secondary) }),
    el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:10px', text: ex.targetMuscles.join(' · ') })
  ]));

  const howTo = block('How To Perform', el('div', { class: 'stack' }, [
    el('div', {}, [
      el('p', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'Set up' }),
      numbered(ex.setup)
    ]),
    el('div', {}, [
      el('p', { class: 'eyebrow', style: 'margin:6px 0 8px', text: 'Execute' }),
      numbered(ex.instructions)
    ]),
    el('p', { class: 'dim', style: 'font-size:12.5px', text: `Tempo: ${ex.tempo}` })
  ]));

  const formCheck = block('Form Check — Good Form', bullets(ex.formCues, 'good', '✓'));
  const mistakes = block('Watch Out — Common Mistakes', bullets(ex.commonMistakes, 'warn', '⚠'));

  const breathing = block('Breathing', el('div', { class: 'breath' }, [
    el('div', { class: 'breath-row in' }, [
      el('span', { class: 'arrow', text: '↓' }),
      el('span', { text: ex.breathing.eccentric }),
      el('b', { text: 'Inhale' })
    ]),
    el('div', { class: 'breath-row out' }, [
      el('span', { class: 'arrow', text: '↑' }),
      el('span', { text: ex.breathing.concentric }),
      el('b', { text: 'Exhale' })
    ])
  ]));

  const safety = block('Safety', el('div', {}, [
    bullets(ex.safety, 'safe', '•'),
    el('p', {
      class: 'dim', style: 'font-size:12.5px;margin-top:10px',
      text: 'Stop and reassess technique or load if a movement causes sharp or unusual pain. This is general training guidance, not medical advice.'
    })
  ]), 'safety');

  /* ---- tracking ---- */
  const trackingWrap = el('div', { class: 'stack' });
  let actions = null;

  if (day && !day.rest) {
    const grid = setGrid(dayId, ex, { onChange: () => complete.refresh() });
    const complete = completeButton(dayId, ex, grid.setCount, () => {
      grid.refresh();
      app.refreshChrome?.();
    });
    trackingWrap.append(el('h3', { class: 'eyebrow', text: `Track — ${day.name}` }), grid.node);
    actions = el('div', { class: 'detail-actions' }, [complete.node]);
    trackingWrap.appendChild(strengthCard(ex));
  } else {
    trackingWrap.appendChild(strengthCard(ex));
    const pr = store.getPR(ex.id);
    const hist = store.exerciseHistory(ex.id).slice(0, 3);
    trackingWrap.append(block('Your Numbers', el('div', { class: 'stack' }, [
      el('div', { class: 'pr-row' }, [
        el('span', { class: 'nm', text: 'Best' }),
        el('span', { class: 'v', text: pr?.best ? `${pr.best.weight} ${settings.units}` : 'Not recorded' })
      ]),
      el('div', { class: 'pr-row' }, [
        el('span', { class: 'nm', text: 'Most recent' }),
        el('span', { class: 'v', text: pr?.latest ? `${pr.latest.weight} ${settings.units} × ${pr.latest.reps ?? '—'}` : 'Not recorded' })
      ]),
      ...hist.map(h => el('div', { class: 'hist-row' }, [
        el('span', { class: 'dt', text: h.date }),
        el('div', { class: 'hist-sets' }, h.sets.map(s =>
          el('span', { text: `${s.weight ?? '—'}${settings.units}×${s.reps ?? '—'}` })))
      ]))
    ])));
  }

  const node = el('div', { class: 'view' }, [
    el('div', { class: 'detail-grid' }, [
      el('div', { class: 'col-sticky stack' }, [head, figure, quick]),
      el('div', { class: 'stack-lg' }, [
        muscles, howTo, formCheck, mistakes, breathing, safety,
        trackingWrap
      ])
    ]),
    actions
  ]);

  return {
    title: ex.name,
    eyebrow: day ? `${day.name} · ${day.title}` : 'Exercise Library',
    back: day ? `#/day/${day.id}` : '#/library',
    node,
    destroy() { fig.destroy(); }
  };
}

/**
 * Strength picture for one exercise. Renders an empty state rather than zeros
 * when nothing has been logged — no invented numbers.
 */
function strengthCard(ex) {
  const units = store.getSettings().units;
  const st = store.strengthFor(ex.id);

  if (!st) {
    return block('Strength', el('div', { class: 'empty' }, [
      el('p', { text: 'No strength data yet.' }),
      el('p', { style: 'font-size:13px', text: 'Log a set with weight and reps to start tracking progression.' })
    ]));
  }

  const arrow = st.trend === 'up' ? '↑ Improving' : st.trend === 'down' ? '↓ Down' : '= Holding';
  return block('Strength', el('div', {}, [
    el('div', { class: 'stat-row' }, [
      el('div', { class: 'stat' }, [
        el('b', { text: `${st.last.topWeight}×${st.last.topReps}` }),
        el('span', { text: 'Last session' })
      ]),
      el('div', { class: 'stat' }, [
        el('b', { text: `${st.best.topWeight}×${st.best.topReps}` }),
        el('span', { text: 'Best' })
      ]),
      el('div', { class: 'stat' }, [
        el('b', { text: String(st.best.e1rm) }),
        el('span', { text: `Est. 1RM ${units}` })
      ])
    ]),
    el('div', { class: 'row-between', style: 'margin-top:12px' }, [
      el('span', { class: 'dim', style: 'font-size:12.5px', text: `Trend vs previous session` }),
      el('span', { class: `tag ${st.trend === 'up' ? 'tag-accent' : ''}`.trim(), text: arrow })
    ]),
    st.previous ? el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:8px',
      text: `Previous: ${st.previous.topWeight}${units} × ${st.previous.topReps} on ${st.previous.date}` }) : null,
    el('p', { class: 'dim', style: 'font-size:11.5px;margin-top:10px;line-height:1.45',
      text: 'Estimated 1RM is a calculation from your logged weight and reps (Epley), not a tested maximum.' })
  ]));
}

/** Exercise ids adjacent to this one in a day, for prev/next affordances. */
export function neighbours(dayId, exId) {
  const day = getDay(dayId);
  if (!day) return {};
  const ids = exercisesOf(day);
  const i = ids.indexOf(exId);
  return { index: i, total: ids.length, prev: ids[i - 1], next: ids[i + 1] };
}
