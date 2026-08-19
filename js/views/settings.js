/* settings.js — personalisation and local data management. */

import { el, toast, sheet } from '../ui.js';
import * as store from '../storage.js';

const GOALS = ['Muscle Gain', 'Strength', 'Fat Loss', 'General Fitness'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/* Guidance that shifts with the chosen goal. The prescribed program never
 * changes — only the rep-range and rest suggestions shown alongside it. */
const GOAL_GUIDANCE = {
  'Muscle Gain': { reps: '8–12 reps', rest: '60–120s rest', note: 'Stop 1–3 reps short of failure on most sets.' },
  'Strength': { reps: '3–6 reps', rest: '2–3 min rest', note: 'Prioritise the first exercise of each session and keep technique strict.' },
  'Fat Loss': { reps: '10–15 reps', rest: '45–90s rest', note: 'Keep the same lifts and effort; training holds muscle while you diet.' },
  'General Fitness': { reps: '8–15 reps', rest: '60–90s rest', note: 'Consistency beats intensity — finish every session feeling good.' }
};

export const goalGuidance = () => GOAL_GUIDANCE[store.getSettings().goal] || GOAL_GUIDANCE['Muscle Gain'];

function row(label, hint, control) {
  return el('label', { class: 'setting-row' }, [
    el('div', {}, [el('div', { class: 'lbl', text: label }), hint && el('div', { class: 'hint', text: hint })]),
    control
  ]);
}

function segmented(options, value, onPick, labelFor = String) {
  const wrap = el('div', { class: 'seg', role: 'group' },
    options.map(o => el('button', {
      class: '', type: 'button', dataset: { v: String(o) },
      'aria-pressed': String(o === value), text: labelFor(o),
      onclick: () => {
        for (const b of wrap.children) b.setAttribute('aria-pressed', String(b.dataset.v === String(o)));
        onPick(o);
      }
    })));
  return wrap;
}

function stepper(value, min, max, step, onChange, format = String) {
  const input = el('input', { type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), 'aria-label': 'value' });
  const clamp = v => Math.max(min, Math.min(max, v));
  const set = v => { input.value = String(clamp(v)); onChange(clamp(v)); };
  input.addEventListener('change', () => set(Number(input.value) || min));
  return el('div', { class: 'stepper', style: 'width:150px' }, [
    el('button', { type: 'button', 'aria-label': 'Decrease', text: '−', onclick: () => set(Number(input.value) - step) }),
    input,
    el('button', { type: 'button', 'aria-label': 'Increase', text: '+', onclick: () => set(Number(input.value) + step) })
  ]);
}

export function view(params, app) {
  const s = store.getSettings();
  const guidance = el('p', { class: 'dim', style: 'font-size:12.5px' });

  function paintGuidance() {
    const g = goalGuidance();
    guidance.textContent = `${g.reps} · ${g.rest} — ${g.note}`;
  }
  paintGuidance();

  const nameInput = el('input', {
    class: 'input', type: 'text', value: s.name, style: 'width:170px',
    'aria-label': 'Your name', maxlength: '24',
    onchange: e => { store.saveSettings({ name: e.target.value.trim() }); toast('Saved'); app.refreshChrome?.(); }
  });

  const profile = el('section', { class: 'card' }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Profile' }),
    row('Name', 'Shown on the home screen', nameInput),
    row('Primary goal', 'Adjusts rep and rest suggestions only',
      el('select', {
        class: 'input', style: 'width:170px', 'aria-label': 'Primary goal',
        onchange: e => { store.saveSettings({ goal: e.target.value }); paintGuidance(); toast('Goal updated'); }
      }, GOALS.map(g => el('option', { value: g, text: g, selected: g === s.goal })))),
    row('Training experience', 'For your own reference',
      el('select', {
        class: 'input', style: 'width:170px', 'aria-label': 'Training experience',
        onchange: e => store.saveSettings({ experience: e.target.value })
      }, LEVELS.map(l => el('option', { value: l, text: l, selected: l === s.experience })))),
    el('div', { style: 'padding-top:10px' }, [guidance])
  ]);

  const training = el('section', { class: 'card' }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Training defaults' }),
    row('Units', 'Used for every weight field',
      segmented(['kg', 'lb'], s.units, v => { store.saveSettings({ units: v }); toast(`Units: ${v}`); })),
    row('Default sets', 'Rows shown in the set logger',
      stepper(s.defaultSets, 1, 8, 1, v => store.saveSettings({ defaultSets: v }))),
    row('Default reps', 'Placeholder in the reps field',
      stepper(s.defaultReps, 1, 30, 1, v => store.saveSettings({ defaultReps: v }))),
    row('Rest timer', 'Length of one rest period',
      stepper(s.restSeconds, 15, 600, 15, v => store.saveSettings({ restSeconds: v }))),
    row('Auto-start rest', 'Start the timer when a set is ticked',
      toggle(s.autoRest, v => store.saveSettings({ autoRest: v })))
  ]);

  /* ---- data ---- */
  const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'sr-only' });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      store.importData(await file.text());
      toast('Data restored');
      app.go('#/progress');
    } catch (err) {
      toast('Could not read that file', 'close');
    }
    fileInput.value = '';
  });

  const data = el('section', { class: 'card stack' }, [
    el('h3', { class: 'eyebrow', text: 'Your data' }),
    el('p', { class: 'dim', style: 'font-size:12.5px',
      text: 'Everything is stored on this device in your browser. Nothing is uploaded, and clearing your browser data removes it.' }),
    el('button', { class: 'btn btn-block', type: 'button', text: 'Export backup (.json)', onclick: exportBackup }),
    el('button', { class: 'btn btn-block', type: 'button', text: 'Restore from backup', onclick: () => fileInput.click() }),
    fileInput,
    el('button', {
      class: 'btn btn-block btn-danger', type: 'button', text: 'Reset workout history',
      onclick: () => confirmSheet('Reset workout history?',
        'Completed sets, weights and personal records will be deleted from this device. Settings are kept.',
        () => { store.clearAll('sessions'); store.clearAll('prs'); toast('History cleared', 'reset'); app.go('#/progress'); })
    }),
    el('button', {
      class: 'btn btn-block btn-danger', type: 'button', text: 'Erase everything',
      onclick: () => confirmSheet('Erase all app data?',
        'Settings, history and records will all be deleted from this device. This cannot be undone.',
        () => { store.clearAll('all'); toast('All data erased', 'reset'); app.go('#/'); })
    })
  ]);

  const about = el('section', { class: 'card' }, [
    el('h3', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'About' }),
    el('p', { class: 'muted', style: 'font-size:14px',
      text: 'A personal workout companion: 57 exercises, animated form visuals, and offline tracking. Add it to your home screen to use it like an app.' }),
    el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:10px',
      text: 'General training guidance only — not medical advice. Stop if a movement causes sharp or unusual pain.' })
  ]);

  return {
    title: 'Settings',
    eyebrow: 'Preferences',
    node: el('div', { class: 'view stack-lg' }, [profile, training, data, about])
  };
}

function toggle(value, onChange) {
  const btn = el('button', {
    class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(value),
    'aria-label': 'Toggle',
    onclick: () => {
      const next = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', String(next));
      onChange(next);
    }
  });
  return btn;
}

function exportBackup() {
  const blob = new Blob([store.exportData()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `gym-backup-${store.dateKey()}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Backup downloaded');
}

function confirmSheet(title, message, onConfirm) {
  const body = el('div', { class: 'stack' }, [
    el('p', { class: 'muted', text: message }),
    el('button', {
      class: 'btn btn-danger btn-block btn-lg', type: 'button', text: 'Yes, continue',
      onclick: () => { onConfirm(); ref.close(); }
    }),
    el('button', { class: 'btn btn-ghost btn-block', type: 'button', text: 'Cancel', onclick: () => ref.close() })
  ]);
  const ref = sheet(title, body);
}
