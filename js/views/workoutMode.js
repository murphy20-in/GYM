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

  function elapsedTimer(startedAt) {
    const timerDisplay = el('span', { class: 'timer-digits', text: '00:00' });
    function update() {
      if (!timerDisplay.isConnected) return;
      const s = Math.floor((Date.now() - startedAt) / 1000);
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = s % 60;
      timerDisplay.textContent = (hrs > 0 ? `${String(hrs).padStart(2, '0')}:` : '') + 
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      setTimeout(update, 1000);
    }
    setTimeout(update, 0);
    return timerDisplay;
  }

  function getExerciseComparisons() {
    const comparisons = [];
    for (const id of ids) {
      const ex = getExercise(id);
      const history = store.exerciseHistory(id);
      if (history.length > 1) {
        // history[0] is today, history[1] is previous
        const todaySets = history[0].sets.filter(s => s.done);
        const prevSets = history[1].sets.filter(s => s.done);
        if (todaySets.length && prevSets.length) {
          const todayBest = todaySets.reduce((a, b) => Number(b.weight) > Number(a.weight) ? b : a);
          const prevBest = prevSets.reduce((a, b) => Number(b.weight) > Number(a.weight) ? b : a);
          
          const weightDiff = todayBest.weight - prevBest.weight;
          const repsDiff = todayBest.reps - prevBest.reps;
          
          let trend = 'same';
          if (weightDiff > 0 || (weightDiff === 0 && repsDiff > 0)) trend = 'up';
          else if (weightDiff < 0 || (weightDiff === 0 && repsDiff < 0)) trend = 'down';
          
          comparisons.push({
            name: ex.name,
            today: `${todayBest.weight} × ${todayBest.reps}`,
            prev: `${prevBest.weight} × ${prevBest.reps}`,
            trend,
            diffText: weightDiff !== 0 
              ? `${weightDiff > 0 ? '+' : ''}${weightDiff} kg` 
              : repsDiff !== 0 ? `${repsDiff > 0 ? '+' : ''}${repsDiff} reps` : 'No change'
          });
        }
      }
    }
    return comparisons;
  }

  function checkoutScreen() {
    const seed = store.latestWeight()?.kg ?? 75;
    const units = store.getSettings().units;
    
    const input = el('input', {
      type: 'number', inputmode: 'decimal', step: '0.1', min: '20', max: '400',
      class: 'weigh-input', value: String(seed), 'aria-label': `Weight in ${units}`
    });
    
    const nudge = (delta) => {
      const next = Math.round((Number(input.value || seed) + delta) * 10) / 10;
      input.value = String(Math.min(400, Math.max(20, next)));
    };
    
    return el('section', { class: 'card finish-card check-out-capture-card' }, [
      el('div', { class: 'tick', html: icon('scale') }),
      el('h2', { style: 'font-size:24px;text-align:center', text: 'GYM CHECK-OUT' }),
      el('p', { class: 'muted', style: 'margin-top:6px;text-align:center', text: 'END-OF-SESSION WEIGHT' }),
      
      el('div', { class: 'weigh-row', style: 'margin-top:16px' }, [
        el('button', { class: 'btn btn-icon', type: 'button', text: '−', onclick: () => nudge(-0.1) }),
        el('div', { class: 'weigh-value' }, [input, el('span', { class: 'weigh-unit', text: units })]),
        el('button', { class: 'btn btn-icon', type: 'button', text: '+', onclick: () => nudge(0.1) })
      ]),
      el('div', { class: 'row', style: 'gap:8px;justify-content:center;margin-top:10px;margin-bottom:20px' },
        [-1, -0.5, 0.5, 1].map(d => el('button', {
          class: 'chip', type: 'button', text: (d > 0 ? '+' : '') + d, onclick: () => nudge(d)
        }))),
      
      el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button', text: 'FINISH SESSION',
        onclick: () => {
          try {
            const val = Number(input.value);
            if (val > seed * 4 && val.toString().length >= 3 && !input.value.includes('.')) {
              const suggested = val / 10;
              if (confirm(`Did you mean ${suggested} ${units}?`)) {
                input.value = String(suggested);
                return;
              }
            }
            store.addWeight(input.value, 'checkout', new Date(), day.id);
            store.completeSession(day.id);
            paint();
          } catch (err) {
            toast('Enter a valid weight', 'close');
          }
        }
      })
    ]);
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
    
    // Previous session comparisons
    const comparisons = getExerciseComparisons();
    const compRows = comparisons.length 
      ? el('div', { class: 'comp-rows stack', style: 'margin-top:16px;gap:8px;text-align:left;width:100%' }, [
          el('p', { class: 'eyebrow', text: 'Strength Progress vs Last Session' }),
          ...comparisons.map(c => el('div', { class: 'comp-row row-between', style: 'font-size:13.5px;padding:6px 0;border-bottom:1px solid var(--line-soft)' }, [
            el('span', { class: 'comp-name grow', style: 'font-weight:650', text: c.name }),
            el('div', { style: 'display:flex;align-items:center;gap:8px' }, [
              el('span', { class: 'comp-prev dim', style: 'font-variant-numeric:tabular-nums', text: c.prev }),
              el('span', { class: 'comp-arrow dim', text: c.trend === 'up' ? '↑' : c.trend === 'down' ? '↓' : '→' }),
              el('span', { class: `comp-diff ${c.trend}`, style: `font-weight:700;color:var(${c.trend === 'up' ? '--c-workout' : c.trend === 'down' ? '--danger' : '--text-3'})`, text: c.diffText })
            ])
          ]))
        ])
      : null;

    const b = store.dailyBreakdown();

    return el('section', { class: 'card finish-card stack' }, [
      el('div', { class: 'tick', html: icon('check') }),
      el('h2', { style: 'font-size:24px;text-align:center', text: 'SESSION SUMMARY' }),
      el('p', { class: 'muted', style: 'margin-top:6px;text-align:center', text: `${day.name} · ${day.title}` }),
      el('p', { class: 'dim', style: 'margin-top:4px;text-align:center', text: `${prog.done} / ${prog.total} exercises completed` }),

      el('div', { class: 'finish-stats', style: 'width:100%' }, [
        el('div', {}, [el('b', { text: mins ? `${mins}m` : '—' }), el('span', { text: 'Duration' })]),
        el('div', {}, [el('b', { text: String(sets) }), el('span', { text: 'Sets' })]),
        el('div', {}, [el('b', { text: `${adherence}%` }), el('span', { text: 'Adherence' })])
      ]),
      el('div', { class: 'finish-stats', style: 'margin-top:10px;width:100%' }, [
        el('div', {}, [el('b', { text: w.checkin ? `${w.checkin.kg}` : '—' }), el('span', { text: `Check-in ${units}` })]),
        el('div', {}, [el('b', { text: w.checkout ? `${w.checkout.kg}` : '—' }), el('span', { text: `Check-out ${units}` })]),
        el('div', {}, [el('b', { text: volume ? `${Math.round(volume)}` : '—' }), el('span', { text: `Volume ${units}` })])
      ]),

      /* the difference is shown only with its caveat attached */
      sessionWeightNote(w.checkin?.kg ?? null, w.checkout?.kg ?? null),

      compRows,

      el('div', { class: 'finish-stats', style: 'margin-top:16px;border-top:1px solid var(--line-soft);padding-top:12px;width:100%' }, [
        el('div', {}, [el('b', { text: `${b.score}%` }), el('span', { text: 'Daily Adherence Score' })])
      ]),

      el('div', { class: 'stack', style: 'margin-top:20px;width:100%' }, [
        el('a', { class: 'btn btn-primary btn-lg btn-block', href: '#/', text: 'DAILY SUMMARY' }),
        el('a', { class: 'btn btn-ghost btn-block', href: '#/analytics', text: 'View Analytics' }),
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

    const w = store.weightsOn();
    const startedAt = store.getSession(day.id).startedAt || Date.now();

    if (allDone) {
      if (!w.checkout) {
        container.appendChild(checkoutScreen());
      } else {
        container.appendChild(finishScreen());
      }
      return;
    }

    container.appendChild(el('header', { class: 'wm-head' }, [
      el('div', { class: 'row-between', style: 'width:100%' }, [
        el('p', { class: 'counter', text: `${day.name} · ${day.title}` }),
        el('div', { class: 'session-timer dim', style: 'display:flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700' }, [
          icon('timer'),
          elapsedTimer(startedAt)
        ])
      ]),
      el('p', { class: 'counter', text: `Exercise ${index + 1} / ${ids.length}` }),
      el('h2', { text: ex.name })
    ]));
    container.appendChild(progressPips(doneIds));

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
