/* setgrid.js — the set / rep / weight / RPE logger.
 *
 * Shared by the exercise detail screen and workout mode so a set ticked in one
 * place is already ticked in the other. Values from the last time this exercise
 * was performed appear as placeholders, so a working set is usually two taps.
 */

import { el, icon, toast } from '../ui.js';
import * as store from '../storage.js';
import { restAfterSet } from '../timer.js';
import { goalGuidance } from './settings.js';

export function setGrid(dayId, exercise, opts = {}) {
  const settings = store.getSettings();
  const unit = settings.units;
  const history = store.exerciseHistory(exercise.id);
  const last = history.find(h => h.date !== store.dateKey());
  const lastSet = last?.sets?.[0];

  let count = Math.max(
    settings.defaultSets,
    store.getEntry(dayId, exercise.id, settings.defaultSets).sets.filter(s => s.done || s.weight || s.reps).length
  );

  const wrap = el('div', { class: 'stack' });

  function paint() {
    const entry = store.getEntry(dayId, exercise.id, count);
    wrap.replaceChildren();

    /* rep and rest suggestion follows the goal chosen in Settings */
    const g = goalGuidance();
    wrap.appendChild(el('p', { class: 'dim', style: 'font-size:12px;letter-spacing:.04em',
      text: `${store.getSettings().goal}: ${g.reps} · ${g.rest}` }));

    wrap.appendChild(el('div', { class: 'setgrid-head' }, [
      el('span', { text: 'SET' }),
      el('span', { text: unit.toUpperCase() }),
      el('span', { text: 'REPS' }),
      el('span', { text: 'RPE' }),
      el('span', { text: '' })
    ]));

    const grid = el('div', { class: 'setgrid' });
    entry.sets.slice(0, count).forEach((s, i) => {
      const row = el('div', { class: `set-row${s.done ? ' done' : ''}` });

      const num = el('span', { class: 'n', text: String(i + 1) });

      const mk = (key, placeholder, step, max) => el('input', {
        type: 'number', inputmode: 'decimal', step: String(step), min: '0', max: String(max),
        value: s[key] == null ? '' : String(s[key]),
        placeholder,
        'aria-label': `Set ${i + 1} ${key}`,
        onchange: (e) => {
          const raw = e.target.value === '' ? null : Number(e.target.value);
          store.logSet(dayId, exercise.id, i, { [key]: raw }, count);
          opts.onChange?.();
        }
      });

      const weight = mk('weight', lastSet?.weight != null ? String(lastSet.weight) : '—', 0.5, 999);
      const reps = mk('reps', lastSet?.reps != null ? String(lastSet.reps) : String(settings.defaultReps), 1, 100);
      const rpe = mk('rpe', '—', 0.5, 10);

      const check = el('button', {
        class: 'set-check', type: 'button',
        'aria-pressed': String(!!s.done),
        'aria-label': `${s.done ? 'Undo' : 'Complete'} set ${i + 1}`,
        html: icon('check'),
        onclick: () => {
          const done = !s.done;
          /* tick means "this is what I actually lifted", so freeze the shown values */
          const updated = store.logSet(dayId, exercise.id, i, {
            done,
            weight: weight.value === '' ? (done ? Number(lastSet?.weight) || null : null) : Number(weight.value),
            reps: reps.value === '' ? (done ? Number(lastSet?.reps) || settings.defaultReps : null) : Number(reps.value),
            rpe: rpe.value === '' ? null : Number(rpe.value)
          }, count);
          if (done) {
            restAfterSet();
            if (updated.newPR) {
              toast(`🔥 NEW PR: ${updated.newPR.weight} ${unit} × ${updated.newPR.reps}! (Prev: ${updated.newPR.prevWeight})`, 'check');
              navigator.vibrate?.([30, 80, 30]);
            } else {
              navigator.vibrate?.(18);
            }
          }
          paint();
          opts.onChange?.();
        }
      });

      row.append(num, weight, reps, rpe, check);
      grid.appendChild(row);
    });

    wrap.appendChild(grid);

    wrap.appendChild(el('div', { class: 'row', style: 'gap:8px' }, [
      el('button', {
        class: 'btn btn-ghost grow', type: 'button', text: '− Set',
        disabled: count <= 1,
        onclick: () => { count = Math.max(1, count - 1); paint(); }
      }),
      el('button', {
        class: 'btn btn-ghost grow', type: 'button', text: '+ Set',
        disabled: count >= 10,
        onclick: () => { count = Math.min(10, count + 1); paint(); }
      })
    ]));

    if (last) {
      wrap.appendChild(el('p', {
        class: 'dim', style: 'font-size:12.5px',
        text: `Last time (${last.date}): ` + last.sets
          .map(s => `${s.weight ?? '—'}${unit}×${s.reps ?? '—'}`).join(', ')
      }));
    }
  }

  paint();

  return {
    node: wrap,
    refresh: paint,
    get setCount() { return count; }
  };
}

/** The big MARK COMPLETE / COMPLETED button, kept consistent across screens. */
export function completeButton(dayId, exercise, setCount, onChange) {
  const btn = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button' });

  function paint() {
    const done = store.getEntry(dayId, exercise.id, setCount).done;
    btn.innerHTML = done ? `${icon('check')} <span>COMPLETED</span>` : `${icon('check')} <span>MARK COMPLETE</span>`;
    btn.classList.toggle('btn-primary', !done);
    btn.classList.toggle('btn-ghost', done);
    btn.setAttribute('aria-pressed', String(done));
  }

  btn.addEventListener('click', () => {
    const done = !store.getEntry(dayId, exercise.id, setCount).done;
    store.setExerciseDone(dayId, exercise.id, done, setCount);
    if (done) { toast(`${exercise.name} complete`); navigator.vibrate?.([20, 40, 20]); }
    paint();
    onChange?.(done);
  });

  paint();
  return { node: btn, refresh: paint };
}
