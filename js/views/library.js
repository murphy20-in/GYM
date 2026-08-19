/* library.js — the full exercise library with search and muscle-group filters. */

import { el, icon, exerciseCard } from '../ui.js';
import { EXERCISES, MUSCLE_GROUPS, searchExercises } from '../data/exercises.js';

const state = { query: '', group: 'All' };   /* preserved between visits */

export function view(params, app) {
  const results = el('div', { class: 'lib-grid' });
  const count = el('p', { class: 'dim', style: 'font-size:12.5px' });

  const input = el('input', {
    class: 'input', type: 'search', value: state.query,
    placeholder: 'Search exercises, muscles or equipment…',
    'aria-label': 'Search exercises',
    autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false'
  });

  const chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by muscle group' },
    ['All', ...MUSCLE_GROUPS].map(g => el('button', {
      class: 'chip', type: 'button', dataset: { group: g },
      'aria-pressed': String(state.group === g),
      text: g.toUpperCase(),
      onclick: () => {
        state.group = g;
        for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.group === g));
        paint();
      }
    })));

  function paint() {
    const list = searchExercises(state.query, state.group);
    results.replaceChildren();

    if (!list.length) {
      results.appendChild(el('div', { class: 'empty' }, [
        el('p', { text: `No exercises match “${state.query}”.` }),
        el('button', {
          class: 'btn', type: 'button', text: 'Clear filters',
          onclick: () => { state.query = ''; state.group = 'All'; input.value = ''; for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.group === 'All')); paint(); }
        })
      ]));
    } else {
      for (const ex of list) {
        results.appendChild(exerciseCard(ex, { onClick: () => app.go(`#/exercise/${ex.id}`) }));
      }
    }
    count.textContent = `${list.length} of ${EXERCISES.length} exercises`;
  }

  /* short debounce keeps typing smooth on a phone while filtering 57 items */
  let t = 0;
  input.addEventListener('input', () => {
    state.query = input.value;
    clearTimeout(t);
    t = setTimeout(paint, 90);
  });

  paint();

  return {
    title: 'Exercises',
    eyebrow: 'Library',
    node: el('div', { class: 'view stack' }, [
      el('div', { class: 'searchbar' }, [el('span', { html: icon('search') }), input]),
      chips,
      count,
      results
    ])
  };
}
