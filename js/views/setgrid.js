/* setgrid.js — the set / rep / weight / RPE logger.
 *
 * Shared by the exercise detail screen and workout mode so a set ticked in one
 * place is already ticked in the other.
 *
 * Built for logging mid-set with one thumb: previous values copy in with a
 * single tap, RPE is a tap row rather than a keyboard, and set type cycles from
 * a badge. Warm-ups are recorded but never counted as work.
 */

import { el, icon, toast, sheet } from '../ui.js';
import * as store from '../storage.js';
import { restAfterSet } from '../timer.js';
import { goalGuidance } from './settings.js';
import { plateCalculator } from './plates.js';

const RPE_CHOICES = [6, 7, 8, 9, 10];
const TYPE_CYCLE = ['working', 'warmup', 'drop', 'failure'];

export function setGrid(dayId, exercise, opts = {}) {
  const settings = store.getSettings();
  const unit = settings.units;
  const date = opts.date instanceof Date ? opts.date : new Date();

  const prev = store.previousSets(exercise.id, date);
  /* Placeholders should suggest the working weight, not the warm-up that
     happens to come first — otherwise every row proposes 40kg. */
  const prevFirst = prev?.sets?.find(s => store.setType(s).counts) || prev?.sets?.[0];

  let count = Math.max(
    settings.defaultSets,
    store.getEntry(dayId, exercise.id, settings.defaultSets, date).sets
      .filter(s => s.done || s.weight || s.reps).length
  );

  const wrap = el('div', { class: 'stack' });

  function save(i, data) {
    return store.logSet(dayId, exercise.id, i, data, count, date);
  }

  function paint() {
    const entry = store.getEntry(dayId, exercise.id, count, date);
    wrap.replaceChildren();

    const g = goalGuidance();
    wrap.appendChild(el('div', { class: 'row-between' }, [
      el('p', { class: 'dim', style: 'font-size:12px;letter-spacing:.04em',
        text: `${settings.goal}: ${g.reps} · ${g.rest}` }),
      el('button', {
        class: 'link-more', type: 'button', text: 'Plates →',
        onclick: () => plateCalculator(Number(entry.sets[0]?.weight) || Number(prevFirst?.weight) || 60)
      })
    ]));

    /* ---- previous performance, one tap to reuse ---- */
    if (prev) {
      wrap.appendChild(el('div', { class: 'prev-card' }, [
        el('div', { class: 'row-between' }, [
          el('span', { class: 'eyebrow', text: `Last time · ${prev.date}` }),
          el('button', {
            class: 'btn btn-sm', type: 'button', text: 'USE THESE',
            onclick: () => {
              prev.sets.forEach((p, i) => {
                if (i >= 10) return;
                if (i >= count) count = i + 1;
                save(i, { weight: p.weight ?? null, reps: p.reps ?? null, rpe: p.rpe ?? null, type: p.type || 'working' });
              });
              toast('Previous values copied');
              paint();
              opts.onChange?.();
            }
          })
        ]),
        el('div', { class: 'hist-sets', style: 'margin-top:8px' }, prev.sets.map(p =>
          el('span', { text: `${p.weight ?? '—'}${unit} × ${p.reps ?? '—'}${p.rpe ? ` @${p.rpe}` : ''}` })))
      ]));
    }

    wrap.appendChild(el('div', { class: 'setgrid-head' }, [
      el('span', { text: 'SET' }),
      el('span', { text: unit.toUpperCase() }),
      el('span', { text: 'REPS' }),
      el('span', { text: 'RPE' }),
      el('span', { text: '' })
    ]));

    const grid = el('div', { class: 'setgrid' });

    entry.sets.slice(0, count).forEach((s, i) => {
      const type = store.setType(s);
      const row = el('div', { class: `set-row${s.done ? ' done' : ''}${type.id === 'warmup' ? ' warmup' : ''}` });

      /* set number doubles as the type control */
      const num = el('button', {
        class: `n type-${type.id}`, type: 'button',
        'aria-label': `Set ${i + 1}, ${type.label}. Change type.`,
        title: type.label,
        text: type.short || String(i + 1),
        onclick: () => {
          const next = TYPE_CYCLE[(TYPE_CYCLE.indexOf(type.id) + 1) % TYPE_CYCLE.length];
          save(i, { type: next });
          paint();
          opts.onChange?.();
        }
      });

      const mk = (key, placeholder, step, max) => el('input', {
        type: 'number', inputmode: 'decimal', step: String(step), min: '0', max: String(max),
        value: s[key] == null ? '' : String(s[key]),
        placeholder,
        'aria-label': `Set ${i + 1} ${key}`,
        onchange: e => {
          const raw = e.target.value === '' ? null : Number(e.target.value);
          save(i, { [key]: raw });
          opts.onChange?.();
        }
      });

      const weight = mk('weight', prevFirst?.weight != null ? String(prevFirst.weight) : '—', 0.5, 999);
      const reps = mk('reps', prevFirst?.reps != null ? String(prevFirst.reps) : String(settings.defaultReps), 1, 100);

      /* RPE is a tap target rather than a keyboard — nobody types mid-set */
      const rpeBtn = el('button', {
        class: `rpe-btn${s.rpe ? ' set' : ''}`, type: 'button',
        'aria-label': `Set ${i + 1} RPE${s.rpe ? `, currently ${s.rpe}` : ''}`,
        text: s.rpe ? String(s.rpe) : '–',
        onclick: () => openRpe(i, s.rpe)
      });

      const check = el('button', {
        class: 'set-check', type: 'button',
        'aria-pressed': String(!!s.done),
        'aria-label': `${s.done ? 'Undo' : 'Complete'} set ${i + 1}`,
        html: icon('check'),
        onclick: () => {
          const done = !s.done;
          /* ticking means "this is what I lifted", so freeze what is on screen */
          const updated = save(i, {
            done,
            weight: weight.value === '' ? (done ? Number(prevFirst?.weight) || null : null) : Number(weight.value),
            reps: reps.value === '' ? (done ? Number(prevFirst?.reps) || settings.defaultReps : null) : Number(reps.value),
            rpe: s.rpe ?? null
          });
          if (done) {
            /* warm-ups do not deserve a rest timer or a PR celebration */
            if (store.setType(s).counts) restAfterSet();
            if (updated.newPR) {
              toast(`NEW PR — ${updated.newPR.weight} ${unit} × ${updated.newPR.reps}`, 'check');
              navigator.vibrate?.([30, 80, 30]);
            } else {
              navigator.vibrate?.(18);
            }
          }
          paint();
          opts.onChange?.();
        }
      });

      row.append(num, weight, reps, rpeBtn, check);
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

    /* ---- note ---- */
    const note = store.getExerciseNote(dayId, exercise.id, date);
    wrap.appendChild(el('button', {
      class: 'note-row', type: 'button',
      'aria-label': note ? 'Edit note' : 'Add a note',
      onclick: () => openNote(note)
    }, [
      el('span', { class: 'eyebrow', text: note ? 'Note' : '+ Add note' }),
      note ? el('span', { class: 'note-text', text: note }) : null
    ]));

    if (entry.sets.some(s => store.setType(s).id === 'warmup' && s.done)) {
      wrap.appendChild(el('p', { class: 'dim', style: 'font-size:11.5px',
        text: 'Warm-up sets are recorded but excluded from volume and records.' }));
    }
  }

  function openRpe(i, current) {
    const body = el('div', { class: 'stack' }, [
      el('p', { class: 'dim', style: 'font-size:13px',
        text: 'How hard was that set? 10 means nothing left, 8 means about two reps in reserve.' }),
      el('div', { class: 'rpe-row' }, RPE_CHOICES.map(v => el('button', {
        class: 'rpe-choice', type: 'button', 'aria-pressed': String(current === v), text: String(v),
        onclick: () => { save(i, { rpe: v }); ref.close(); paint(); opts.onChange?.(); }
      }))),
      el('button', {
        class: 'btn btn-ghost btn-block', type: 'button', text: 'Clear',
        onclick: () => { save(i, { rpe: null }); ref.close(); paint(); opts.onChange?.(); }
      })
    ]);
    const ref = sheet(`Set ${i + 1} — RPE`, body);
  }

  function openNote(current) {
    const ta = el('textarea', {
      class: 'input', rows: '4', 'aria-label': 'Exercise note',
      placeholder: 'Grip, setup, how it felt, what to change next time…'
    });
    ta.value = current;
    const body = el('div', { class: 'stack' }, [
      ta,
      el('button', {
        class: 'btn btn-primary btn-block', type: 'button', text: 'SAVE NOTE',
        onclick: () => {
          store.setExerciseNote(dayId, exercise.id, ta.value, date);
          toast('Note saved');
          ref.close();
          paint();
        }
      })
    ]);
    const ref = sheet(`${exercise.name} — note`, body);
    setTimeout(() => ta.focus(), 60);
  }

  paint();

  return {
    node: wrap,
    refresh: paint,
    get setCount() { return count; }
  };
}

/** The big MARK COMPLETE / COMPLETED button, kept consistent across screens. */
export function completeButton(dayId, exercise, setCount, onChange, date = new Date()) {
  const btn = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button' });

  function paint() {
    const done = store.getEntry(dayId, exercise.id, setCount, date).done;
    btn.innerHTML = done ? `${icon('check')} <span>COMPLETED</span>` : `${icon('check')} <span>MARK COMPLETE</span>`;
    btn.classList.toggle('btn-primary', !done);
    btn.classList.toggle('btn-ghost', done);
    btn.setAttribute('aria-pressed', String(done));
  }

  btn.addEventListener('click', () => {
    const done = !store.getEntry(dayId, exercise.id, setCount, date).done;
    store.setExerciseDone(dayId, exercise.id, done, setCount, date);
    if (done) { toast(`${exercise.name} complete`); navigator.vibrate?.([20, 40, 20]); }
    paint();
    onChange?.(done);
  });

  paint();
  return { node: btn, refresh: paint };
}
