/* workoutMode.js — one exercise at a time, built for one thumb.
 *
 * Everything needed mid-set is above the fold: the visual, the set logger and
 * the six form cues. Navigation is two big targets at the bottom of the screen.
 */

import { el, icon, exerciseFigure, minutesBetween } from '../ui.js';
import { getDay, dayFor, exercisesOf, nextTrainingDay } from '../data/workouts.js';
import { getExercise } from '../data/exercises.js';
import * as store from '../storage.js';
import { setGrid, completeButton } from './setgrid.js';
import { weighInSheet, sessionWeightNote } from './weighin.js';

export function view(params, app) {
  const day = getDay(params.id) || dayFor();

  if (day.rest) {
    const next = nextTrainingDay(day);
    return {
      title: 'Rest day', eyebrow: day.name, back: '#/',
      node: el('div', { class: 'view empty' }, [
        el('p', { style: 'font-size:17px;font-weight:700;color:var(--text)', text: 'Nothing scheduled today' }),
        el('p', { text: `Next up: ${next.name} — ${next.title}` }),
        el('a', { class: 'btn', href: `#/workout/${next.id}`, text: `Start ${next.name}`, style: 'margin-top:10px' })
      ])
    };
  }

  const ids = exercisesOf(day);
  let index = Math.max(0, Math.min(ids.length - 1, Number(params.i ?? 0) || 0));

  store.startSession(day.id);

  const container = el('div', { class: 'view' });
  let figure = null;

  function progressPips(doneIds) {
    return el('div', { class: 'wm-progress', 'aria-hidden': 'true' },
      ids.map((id, i) => el('i', {
        class: doneIds.has(id) ? 'done' : i === index ? 'current' : ''
      })));
  }

  function finishScreen() {
    const prog = store.sessionProgress(day.id, ids);
    const session = store.completeSession(day.id);
    const mins = minutesBetween(session.startedAt, session.endedAt);
    const sets = Object.values(session.ex || {}).flatMap(e => e.sets.filter(s => s.done)).length;
    const volume = Object.values(session.ex || {})
      .flatMap(e => e.sets.filter(s => s.done))
      .reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0);
    const units = store.getSettings().units;

    const w = store.weightsOn();
    const adherence = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;

    return el('section', { class: 'card finish-card' }, [
      el('div', { class: 'tick', html: icon('check') }),
      el('h2', { style: 'font-size:24px', text: 'WORKOUT COMPLETE' }),
      el('p', { class: 'muted', style: 'margin-top:6px', text: `${day.name} · ${day.title}` }),
      el('p', { class: 'dim', style: 'margin-top:4px', text: `${prog.done} / ${prog.total} exercises completed` }),

      el('div', { class: 'finish-stats' }, [
        el('div', {}, [el('b', { text: mins ? `${mins}` : '—' }), el('span', { text: 'Minutes' })]),
        el('div', {}, [el('b', { text: String(sets) }), el('span', { text: 'Sets' })]),
        el('div', {}, [el('b', { text: `${adherence}%` }), el('span', { text: 'Adherence' })])
      ]),
      el('div', { class: 'finish-stats', style: 'margin-top:10px' }, [
        el('div', {}, [el('b', { text: w.checkin ? `${w.checkin.kg}` : '—' }), el('span', { text: `Check-in ${units}` })]),
        el('div', {}, [el('b', { text: w.checkout ? `${w.checkout.kg}` : '—' }), el('span', { text: `Check-out ${units}` })]),
        el('div', {}, [el('b', { text: volume ? `${Math.round(volume)}` : '—' }), el('span', { text: `Volume ${units}` })])
      ]),

      /* the difference is shown only with its caveat attached */
      sessionWeightNote(w.checkin?.kg ?? null, w.checkout?.kg ?? null),

      el('div', { class: 'stack', style: 'margin-top:20px' }, [
        !w.checkout ? el('button', {
          class: 'btn btn-primary btn-lg btn-block', type: 'button',
          html: `${icon('timer')}<span>GYM CHECK-OUT</span>`,
          onclick: () => weighInSheet('checkout', { dayId: day.id, onSaved: paint })
        }) : null,
        el('a', {
          class: `btn btn-lg btn-block ${w.checkout ? 'btn-primary' : ''}`.trim(),
          href: '#/', text: 'DAILY SUMMARY'
        }),
        el('a', { class: 'btn btn-ghost btn-block', href: '#/progress', text: 'View progress' }),
        el('button', {
          class: 'btn btn-ghost btn-block', type: 'button', text: 'Back to exercises',
          onclick: () => { index = 0; paint(); }
        })
      ])
    ]);
  }

  function paint() {
    figure?.destroy();
    container.replaceChildren();

    const doneIds = new Set(ids.filter(id => store.getEntry(day.id, id, 1).done));
    const allDone = doneIds.size === ids.length;
    const ex = getExercise(ids[index]);

    container.appendChild(el('header', { class: 'wm-head' }, [
      el('p', { class: 'counter', text: `${day.name} · ${day.title}` }),
      el('p', { class: 'counter', text: `Exercise ${index + 1} / ${ids.length}` }),
      el('h2', { text: ex.name })
    ]));
    container.appendChild(progressPips(doneIds));

    if (allDone) {
      container.appendChild(finishScreen());
      return;
    }

    /* Check-in comes first in the real gym flow, but it never blocks training. */
    if (!store.weightsOn().checkin) {
      container.appendChild(el('section', { class: 'card accent-weight checkin-prompt' }, [
        el('div', { class: 'row-between' }, [
          el('div', { class: 'grow' }, [
            el('p', { class: 'eyebrow', text: 'Gym check-in' }),
            el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:2px', text: 'Log your weight before you start.' })
          ]),
          el('button', {
            class: 'btn btn-primary', type: 'button', text: 'WEIGH IN',
            onclick: () => weighInSheet('checkin', { dayId: day.id, onSaved: paint })
          })
        ])
      ]));
    }

    figure = exerciseFigure(ex, { period: 3400 });
    container.appendChild(figure.node);

    const grid = setGrid(day.id, ex, { onChange: () => { complete.refresh(); repaintPips(); } });
    const complete = completeButton(day.id, ex, grid.setCount, (done) => {
      grid.refresh();
      repaintPips();
      app.refreshChrome?.();
      if (done) {
        const remaining = ids.filter(id => !store.getEntry(day.id, id, 1).done);
        if (!remaining.length) { paint(); return; }
        if (index < ids.length - 1) setTimeout(() => { index++; paint(); }, 520);
      }
    });

    function repaintPips() {
      const fresh = new Set(ids.filter(id => store.getEntry(day.id, id, 1).done));
      const pips = container.querySelector('.wm-progress');
      pips?.replaceWith(progressPips(fresh));
    }

    container.appendChild(el('section', { class: 'card', style: 'margin-top:16px' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:10px', text: 'Log your sets' }),
      grid.node
    ]));

    container.appendChild(el('section', { class: 'quickform', style: 'margin-top:16px' }, [
      el('h3', { text: 'Form Quick Check' }),
      el('ol', {}, ex.quickForm.map(t => el('li', {}, [el('span', { text: t })])))
    ]));

    container.appendChild(el('div', { class: 'stack', style: 'margin-top:16px' }, [
      complete.node,
      el('a', {
        class: 'btn btn-ghost btn-block', href: `#/exercise/${ex.id}?day=${day.id}`,
        text: 'Full form guide, mistakes & breathing'
      })
    ]));

    container.appendChild(el('nav', { class: 'wm-nav', 'aria-label': 'Exercise navigation' }, [
      el('button', {
        class: 'btn btn-lg', type: 'button', disabled: index === 0,
        html: `${icon('left')}<span>PREVIOUS</span>`,
        onclick: () => { index--; paint(); }
      }),
      el('button', {
        class: 'btn btn-lg', type: 'button', disabled: index >= ids.length - 1,
        html: `<span>NEXT</span>${icon('right')}`,
        onclick: () => { index++; paint(); }
      })
    ]));

    /* keep the deep link current so a refresh returns to the same exercise */
    history.replaceState(null, '', `#/workout/${day.id}?i=${index}`);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function onKey(e) {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'ArrowRight' && index < ids.length - 1) { index++; paint(); }
    if (e.key === 'ArrowLeft' && index > 0) { index--; paint(); }
  }
  document.addEventListener('keydown', onKey);

  paint();

  return {
    title: 'Workout',
    eyebrow: `${day.name} · ${day.title}`,
    back: `#/day/${day.id}`,
    node: container,
    destroy() {
      figure?.destroy();
      document.removeEventListener('keydown', onKey);
    }
  };
}
