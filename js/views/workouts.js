/* workouts.js — the weekly schedule and a single day's exercise list. */

import { el, icon, exerciseCard } from '../ui.js';
import { WEEK, getDay, dayFor, exercisesOf, shiftDay } from '../data/workouts.js';
import { getExercise } from '../data/exercises.js';
import { dayStrip } from './daystrip.js';
import * as store from '../storage.js';

/* ---------- week overview ---------- */

export function weekView(params, app) {
  const todayId = dayFor().id;
  const summary = store.weekSummary(WEEK);

  const cards = WEEK.map((day, i) => {
    const s = summary[i];
    const ids = exercisesOf(day);
    return el('button', {
      class: 'card', type: 'button',
      style: 'text-align:left;width:100%',
      onclick: () => app.go(`#/day/${day.id}`)
    }, [
      el('div', { class: 'row-between' }, [
        el('div', { class: 'grow' }, [
          el('p', { class: 'eyebrow', text: `${day.name}${day.id === todayId ? ' · Today' : ''}` }),
          el('h3', { style: 'font-size:18px;margin-top:4px', text: day.rest ? 'Rest / Recovery' : day.title }),
          el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:4px',
            text: day.rest ? 'No session scheduled' : `${ids.length} exercises · ${day.sections.map(x => x.name).join(' + ')}` })
        ]),
        el('span', { class: `tag${day.id === todayId ? ' tag-accent' : ''}`, text: day.short })
      ]),
      !day.rest && el('div', { style: 'margin-top:12px' }, [
        el('div', { class: 'bar bar-sm' }, [el('i', { style: `width:${s.pct}%` })]),
        el('p', { class: 'dim', style: 'font-size:11.5px;margin-top:6px', text: `${s.done} / ${s.total} complete this week` })
      ])
    ]);
  });

  return {
    title: 'Workouts',
    eyebrow: 'Weekly split',
    node: el('div', { class: 'view stack' }, cards)
  };
}

/* ---------- one day ---------- */

export function view(params, app) {
  const day = getDay(params.id) || dayFor();
  const ids = exercisesOf(day);
  const prog = store.sessionProgress(day.id, ids);
  const isToday = day.id === dayFor().id;

  const node = el('div', { class: 'view stack-lg' }, [
    dayStrip(day.id, id => app.go(`#/day/${id}`)),

    el('section', { class: 'card' }, [
      el('div', { class: 'row-between' }, [
        el('div', { class: 'grow' }, [
          el('p', { class: 'eyebrow', text: `${day.name}${isToday ? ' · Today' : ''}` }),
          el('h2', { style: 'font-size:22px;margin-top:4px', text: day.rest ? 'Rest / Recovery' : day.title })
        ]),
        el('button', {
          class: 'btn btn-icon', type: 'button', 'aria-label': 'Previous day', html: icon('left'),
          onclick: () => app.go(`#/day/${shiftDay(day.id, -1).id}`)
        }),
        el('button', {
          class: 'btn btn-icon', type: 'button', 'aria-label': 'Next day', html: icon('right'),
          onclick: () => app.go(`#/day/${shiftDay(day.id, 1).id}`)
        })
      ]),
      !day.rest && el('div', { style: 'margin-top:14px' }, [
        el('div', { class: 'bar' }, [el('i', { style: `width:${prog.pct}%` })]),
        el('div', { class: 'row-between', style: 'margin-top:8px' }, [
          el('span', { class: 'dim', style: 'font-size:12.5px', text: `${prog.done} / ${prog.total} exercises` }),
          el('span', { class: 'dim', style: 'font-size:12.5px', text: `${prog.pct}%` })
        ])
      ]),
      !day.rest && el('a', {
        class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:14px',
        href: `#/workout/${day.id}`,
        html: `${icon('play')}<span>${prog.done ? 'CONTINUE WORKOUT' : 'START WORKOUT'}</span>`
      })
    ])
  ]);

  if (day.rest) {
    node.appendChild(el('div', { class: 'empty' }, [
      el('p', { style: 'font-size:16px;font-weight:700;color:var(--text)', text: 'Rest day' }),
      el('p', { text: 'Recovery is part of the program.' })
    ]));
  }

  for (const section of day.sections) {
    node.appendChild(el('div', {}, [
      el('div', { class: 'section-title' }, [
        el('h2', { text: section.name }),
        el('span', { text: `${section.exercises.length} exercises` })
      ]),
      el('div', { class: 'stack' }, section.exercises.map((id, i) =>
        exerciseCard(getExercise(id), {
          index: i + 1,
          done: store.getEntry(day.id, id, 1).done,
          onClick: () => app.go(`#/exercise/${id}?day=${day.id}`)
        })))
    ]));
  }

  return {
    title: day.name,
    eyebrow: day.rest ? 'Rest / Recovery' : day.title,
    back: '#/workouts',
    node
  };
}
