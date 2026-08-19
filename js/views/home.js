/* home.js — today's workout dashboard. */

import { el, icon, greeting, exerciseCard, relativeDate } from '../ui.js';
import { WEEK, dayFor, getDay, exercisesOf, nextTrainingDay, shiftDay } from '../data/workouts.js';
import { getExercise } from '../data/exercises.js';
import * as store from '../storage.js';

/** Horizontal Mon–Sun selector with a completion dot per day. */
export function dayStrip(activeId, onPick) {
  const summary = store.weekSummary(WEEK);
  const todayId = dayFor().id;

  return el('div', { class: 'daystrip', role: 'group', 'aria-label': 'Day of the week' },
    WEEK.map((d, i) => {
      const s = summary[i];
      const dotCls = d.rest ? '' : s.pct >= 100 ? 'full' : s.pct > 0 ? 'part' : '';
      return el('button', {
        class: `day-btn${d.id === todayId ? ' today' : ''}`,
        type: 'button',
        'aria-pressed': String(d.id === activeId),
        'aria-label': `${d.name}, ${d.rest ? 'rest day' : d.title}${d.rest ? '' : `, ${s.pct}% complete`}`,
        onclick: () => onPick(d.id)
      }, [
        el('span', { text: d.short }),
        el('span', { class: `dot ${dotCls}`.trim() })
      ]);
    }));
}

export function view(params, app) {
  const settings = store.getSettings();
  const today = dayFor();
  const day = params.day ? getDay(params.day) : today;
  const ids = exercisesOf(day);
  const prog = store.sessionProgress(day.id, ids);
  const isToday = day.id === today.id;

  const node = el('div', { class: 'view stack-lg' });

  /* ---- hero ---- */
  if (day.rest) {
    const next = nextTrainingDay(day);
    node.appendChild(el('section', { class: 'hero rest-hero' }, [
      el('p', { class: 'greeting', text: `${greeting()}, ${settings.name || 'there'}` }),
      el('p', { class: 'dayname', style: 'margin-top:16px', text: day.name }),
      el('h2', { class: 'big', text: 'REST DAY' }),
      el('p', { class: 'muted', text: 'Recovery is part of the program. Eat, sleep, walk, stretch.' }),
      el('div', { style: 'margin-top:20px' }, [
        el('p', { class: 'eyebrow', text: 'Next workout' }),
        el('p', { style: 'font-size:18px;font-weight:700;margin-top:4px', text: `${next.name} — ${next.title}` })
      ]),
      el('div', { class: 'actions' }, [
        el('a', { class: 'btn btn-primary btn-lg', href: `#/day/${next.id}`, text: `Preview ${next.name}` }),
        el('a', { class: 'btn btn-lg', href: '#/progress', text: 'Progress' })
      ])
    ]));
  } else {
    const started = prog.done > 0;
    node.appendChild(el('section', { class: 'hero' }, [
      el('p', { class: 'greeting', text: `${greeting()}, ${settings.name || 'there'}` }),
      el('p', { class: 'dayname', text: isToday ? `Today · ${day.name}` : day.name }),
      el('h2', { text: day.title }),
      el('div', { class: 'progress-line' }, [
        el('span', { text: 'Workout progress' }),
        el('span', { text: `${prog.done} / ${prog.total} exercises` })
      ]),
      el('div', { class: 'bar' }, [el('i', { style: `width:${prog.pct}%` })]),
      el('div', { class: 'actions' }, [
        el('a', {
          class: 'btn btn-primary btn-lg',
          href: `#/workout/${day.id}`,
          html: `${icon('play')}<span>${prog.pct >= 100 ? 'REVIEW WORKOUT' : started ? 'CONTINUE WORKOUT' : 'START WORKOUT'}</span>`
        }),
        el('a', { class: 'btn btn-lg', href: `#/day/${day.id}`, text: 'View list' })
      ])
    ]));
  }

  /* ---- day selector ---- */
  node.appendChild(el('div', {}, [
    el('div', { class: 'section-title' }, [el('h2', { text: 'This week' })]),
    dayStrip(day.id, id => app.go(id === today.id ? '#/' : `#/home/${id}`))
  ]));

  /* ---- prev / today / next ---- */
  node.appendChild(el('div', { class: 'daynav' }, [
    el('button', {
      class: 'btn btn-icon', type: 'button', 'aria-label': 'Previous day', html: icon('left'),
      onclick: () => app.go(`#/home/${shiftDay(day.id, -1).id}`)
    }),
    el('div', { class: 'center' }, [
      el('strong', { text: day.rest ? 'Rest / Recovery' : day.title }),
      el('span', { text: isToday ? 'Today' : day.name })
    ]),
    el('button', {
      class: 'btn btn-icon', type: 'button', 'aria-label': 'Next day', html: icon('right'),
      onclick: () => app.go(`#/home/${shiftDay(day.id, 1).id}`)
    })
  ]));

  /* ---- today's sections ---- */
  if (!day.rest) {
    for (const section of day.sections) {
      const doneCount = section.exercises.filter(id => store.getEntry(day.id, id, 1).done).length;
      node.appendChild(el('div', {}, [
        el('div', { class: 'section-title' }, [
          el('h2', { text: section.name }),
          el('span', { text: `${doneCount} / ${section.exercises.length} done` })
        ]),
        el('div', { class: 'stack' }, section.exercises.map((id, i) => {
          const ex = getExercise(id);
          return exerciseCard(ex, {
            index: i + 1,
            done: store.getEntry(day.id, id, 1).done,
            onClick: () => app.go(`#/exercise/${id}?day=${day.id}`)
          });
        }))
      ]));
    }
  }

  /* ---- last session note ---- */
  const stats = store.lifetimeStats();
  if (stats.workouts) {
    node.appendChild(el('p', {
      class: 'dim', style: 'font-size:12.5px;text-align:center;margin-top:6px',
      text: `${stats.workouts} workout${stats.workouts === 1 ? '' : 's'} logged · last ${relativeDate(stats.lastDate)}`
    }));
  }

  return {
    title: isToday ? 'Today' : day.name,
    eyebrow: day.rest ? 'Rest day' : day.title,
    node
  };
}
