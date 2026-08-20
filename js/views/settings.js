/* settings.js — personalisation, plan editing and local data management. */

import { el, toast, sheet, icon } from '../ui.js';
import { MEAL_PLAN, DEFAULT_HABITS, TARGET_RANGE, SCORE_WEIGHTS } from '../data/plan.js';
import * as store from '../storage.js';
import { storageStatus, requestPersistence, formatBytes, isInstalled, markExported, lastExport } from '../persist.js';

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

/* ---------- small controls ---------- */

function row(label, hint, control) {
  return el('label', { class: 'setting-row' }, [
    el('div', {}, [el('div', { class: 'lbl', text: label }), hint && el('div', { class: 'hint', text: hint })]),
    control
  ]);
}

function segmented(options, value, onPick, labelFor = String) {
  const wrap = el('div', { class: 'seg', role: 'group' },
    options.map(o => el('button', {
      type: 'button', dataset: { v: String(o) },
      'aria-pressed': String(o === value), text: labelFor(o),
      onclick: () => {
        for (const b of wrap.children) b.setAttribute('aria-pressed', String(b.dataset.v === String(o)));
        onPick(o);
      }
    })));
  return wrap;
}

function stepper(value, min, max, step, onChange) {
  const input = el('input', {
    type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), 'aria-label': 'value'
  });
  const clamp = v => Math.max(min, Math.min(max, Math.round(v * 100) / 100));
  const set = v => { input.value = String(clamp(v)); onChange(clamp(v)); };
  input.addEventListener('change', () => set(Number(input.value) || min));
  return el('div', { class: 'stepper', style: 'width:150px' }, [
    el('button', { type: 'button', 'aria-label': 'Decrease', text: '−', onclick: () => set(Number(input.value) - step) }),
    input,
    el('button', { type: 'button', 'aria-label': 'Increase', text: '+', onclick: () => set(Number(input.value) + step) })
  ]);
}

function toggle(value, onChange) {
  const btn = el('button', {
    class: 'switch', type: 'button', role: 'switch', 'aria-checked': String(value), 'aria-label': 'Toggle',
    onclick: () => {
      const next = btn.getAttribute('aria-checked') !== 'true';
      btn.setAttribute('aria-checked', String(next));
      onChange(next);
    }
  });
  return btn;
}

/* ---------- view ---------- */

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const s = store.getSettings();
    const goal = store.weightGoal();
    container.replaceChildren();

    /* ---- profile ---- */
    const guidance = el('p', { class: 'dim', style: 'font-size:12.5px' });
    const paintGuidance = () => {
      const g = goalGuidance();
      guidance.textContent = `${g.reps} · ${g.rest} — ${g.note}`;
    };
    paintGuidance();

    container.appendChild(el('section', { class: 'card' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Profile' }),
      row('Name', 'Shown on the home screen', el('input', {
        class: 'input', type: 'text', value: s.name, style: 'width:170px', maxlength: '24', 'aria-label': 'Your name',
        onchange: e => { store.saveSettings({ name: e.target.value.trim() }); toast('Saved'); }
      })),
      row('Primary goal', 'Adjusts rep and rest suggestions only', el('select', {
        class: 'input', style: 'width:170px', 'aria-label': 'Primary goal',
        onchange: e => { store.saveSettings({ goal: e.target.value }); paintGuidance(); toast('Goal updated'); }
      }, GOALS.map(g => el('option', { value: g, text: g, selected: g === s.goal })))),
      row('Training experience', 'For your own reference', el('select', {
        class: 'input', style: 'width:170px', 'aria-label': 'Training experience',
        onchange: e => store.saveSettings({ experience: e.target.value })
      }, LEVELS.map(l => el('option', { value: l, text: l, selected: l === s.experience })))),
      row('Units', 'Used for every weight field',
        segmented(['kg', 'lb'], s.units, v => { store.saveSettings({ units: v }); toast(`Units: ${v}`); paint(); })),
      el('div', { style: 'padding-top:10px' }, [guidance])
    ]));

    /* ---- weight goal ---- */
    container.appendChild(el('section', { class: 'card accent-weight' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Weight goal' }),
      row('Starting weight', goal.start ? `Journey began at ${goal.start} ${s.units}` : 'Set on your first weigh-in',
        stepper(s.startWeight ?? goal.current ?? 90, 30, 300, 0.1, v => { store.saveSettings({ startWeight: v }); toast('Start weight saved'); })),
      row('Target weight', `Must sit inside ${s.targetMin}–${s.targetMax} ${s.units}`,
        stepper(s.targetWeight, s.targetMin, s.targetMax, 0.5, v => { store.saveSettings({ targetWeight: v }); toast(`Target ${v} ${s.units}`); })),
      row('Range minimum', 'Low end of your acceptable range',
        stepper(s.targetMin, 40, 200, 0.5, v => {
          store.saveSettings({ targetMin: v, targetWeight: Math.max(v, s.targetWeight) });
        })),
      row('Range maximum', 'High end of your acceptable range',
        stepper(s.targetMax, 40, 200, 0.5, v => {
          store.saveSettings({ targetMax: v, targetWeight: Math.min(v, s.targetWeight) });
        })),
      el('p', { class: 'dim', style: 'font-size:12px;padding-top:10px;line-height:1.45',
        text: 'A range rather than a single number: body weight moves around day to day, and anywhere inside the range is the goal met.' })
    ]));

    /* ---- nutrition ---- */
    const plan = store.getMealPlan();
    const targets = store.getTargets();
    container.appendChild(el('section', { class: 'card accent-nutrition' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Nutrition' }),
      row('Daily calories', 'Leave blank to total the meal plan', el('input', {
        class: 'input', type: 'number', style: 'width:120px', min: '800', max: '6000', step: '10',
        value: s.dailyCalories ?? '', placeholder: String(targets.kcal), 'aria-label': 'Daily calorie target',
        onchange: e => { store.saveSettings({ dailyCalories: e.target.value ? Number(e.target.value) : null }); toast('Saved'); paint(); }
      })),
      row('Daily protein (g)', 'Leave blank to total the meal plan', el('input', {
        class: 'input', type: 'number', style: 'width:120px', min: '30', max: '400', step: '1',
        value: s.dailyProtein ?? '', placeholder: String(targets.protein), 'aria-label': 'Daily protein target',
        onchange: e => { store.saveSettings({ dailyProtein: e.target.value ? Number(e.target.value) : null }); toast('Saved'); paint(); }
      })),
      el('p', { class: 'eyebrow', style: 'margin:14px 0 8px', text: 'Meal plan' }),
      ...plan.map(meal => el('button', {
        class: 'plan-row', type: 'button', onclick: () => editMeal(meal),
        'aria-label': `Edit ${meal.name}`
      }, [
        el('span', { class: 'grow' }, [
          el('strong', { text: meal.name }),
          el('span', { class: 'dim', style: 'display:block;font-size:12px',
            text: `≈ ${meal.kcal} kcal · ≈ ${meal.protein} g · ${meal.items.length} items` })
        ]),
        el('span', { class: 'dim', html: icon('right') })
      ])),
      s.mealPlan ? el('button', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:10px', type: 'button', text: 'Restore default meal plan',
        onclick: () => { store.saveSettings({ mealPlan: null }); toast('Default plan restored', 'reset'); paint(); }
      }) : null
    ]));

    /* ---- habits ---- */
    const habits = store.getHabits();
    container.appendChild(el('section', { class: 'card accent-habits' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Habits' }),
      row('Hide private habits', 'Keeps them behind a veil on the Habits screen',
        toggle(s.hidePrivate, v => { store.saveSettings({ hidePrivate: v }); toast(v ? 'Private habits hidden' : 'Private habits shown'); })),
      el('p', { class: 'eyebrow', style: 'margin:14px 0 8px', text: `Tracking ${habits.length} habits` }),
      ...habits.map(h => el('div', { class: 'plan-row', style: 'cursor:default' }, [
        el('span', { class: 'grow' }, [
          el('strong', { text: h.name }),
          el('span', { class: 'dim', style: 'display:block;font-size:12px',
            text: `${h.type}${h.unit ? ' · ' + h.unit : ''}${h.private ? ' · private' : ''}` })
        ]),
        el('button', {
          class: 'link-more', type: 'button', text: h.private ? 'Make open' : 'Make private',
          onclick: () => {
            const list = store.getHabits().map(x => x.id === h.id ? { ...x, private: !x.private } : x);
            store.saveHabits(list); paint();
          }
        })
      ])),
      el('a', { class: 'btn btn-block', style: 'margin-top:10px', href: '#/habits', text: 'Add or remove habits' }),
      s.habits ? el('button', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:8px', type: 'button', text: 'Restore default habits',
        onclick: () => { store.saveSettings({ habits: null }); toast('Default habits restored', 'reset'); paint(); }
      }) : null
    ]));

    /* ---- score weighting ---- */
    const weights = store.getScoreWeights();
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Daily score weighting' }),
      ...Object.entries(weights).map(([k, v]) => row(
        k[0].toUpperCase() + k.slice(1),
        `${Math.round((v / total) * 100)}% of the score`,
        stepper(v, 0, 100, 5, nv => {
          store.saveSettings({ scoreWeights: { ...store.getScoreWeights(), [k]: nv } });
        })
      )),
      el('p', { class: 'dim', style: 'font-size:12px;padding-top:10px;line-height:1.45',
        text: 'Weight tracking scores whether you recorded a measurement, never whether the number fell. Shares are normalised, so they need not add to 100.' }),
      s.scoreWeights ? el('button', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:8px', type: 'button', text: 'Restore default weighting',
        onclick: () => { store.saveSettings({ scoreWeights: null }); toast('Defaults restored', 'reset'); paint(); }
      }) : null
    ]));

    /* ---- workout ---- */
    container.appendChild(el('section', { class: 'card accent-workout' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Workout defaults' }),
      row('Default sets', 'Rows shown in the set logger', stepper(s.defaultSets, 1, 8, 1, v => store.saveSettings({ defaultSets: v }))),
      row('Default reps', 'Placeholder in the reps field', stepper(s.defaultReps, 1, 30, 1, v => store.saveSettings({ defaultReps: v }))),
      row('Rest timer', 'Length of one rest period', stepper(s.restSeconds, 15, 600, 15, v => store.saveSettings({ restSeconds: v }))),
      row('Auto-start rest', 'Start the timer when a set is ticked', toggle(s.autoRest, v => store.saveSettings({ autoRest: v }))),
      row('Reduce motion', 'Holds exercise visuals still and calms transitions',
        toggle(!!s.reduceMotion, v => { store.saveSettings({ reduceMotion: v }); toast(v ? 'Motion reduced' : 'Motion restored'); }))
    ]));

    /* ---- privacy ---- */
    container.appendChild(el('section', { class: 'card' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'Your data stays on this device' }),
      el('p', { class: 'muted', style: 'font-size:14px;line-height:1.5',
        text: 'Your weight, workout, meal and private habit data are stored locally in your browser. Nothing is uploaded to a server.' }),
      el('ul', { class: 'list', style: 'margin-top:12px' }, [
        priv('No account, no sign-in'),
        priv('No analytics or third-party tracking'),
        priv('No external database — the app works fully offline'),
        priv('Habit data never leaves this device')
      ]),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:12px',
        text: 'Because it is local-only, clearing your browser data erases it. Export a backup to keep a copy.' })
    ]));

    /* ---- data ---- */
    const fileInput = el('input', { type: 'file', accept: 'application/json', class: 'sr-only' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      try {
        await store.importData(await file.text());
        toast('Data restored');
        paint();
      } catch {
        toast('Could not read that file', 'close');
      }
      fileInput.value = '';
    });

    /* ---- durability ---- */
    const durability = el('section', { class: 'card stack' }, [
      el('h3', { class: 'eyebrow', text: 'Storage durability' }),
      el('p', { class: 'dim', style: 'font-size:12.5px', text: 'Checking…' })
    ]);
    container.appendChild(durability);
    paintDurability(durability);

    container.appendChild(el('section', { class: 'card stack' }, [
      el('h3', { class: 'eyebrow', text: 'Data' }),
      el('a', { class: 'btn btn-block', href: '#/backfill', text: 'ADD PAST DATA' }),
      el('p', { class: 'dim', style: 'font-size:12px;margin:-2px 0 6px',
        text: 'Log a day you already trained — weight, meals, habits and workout.' }),
      el('button', { class: 'btn btn-block', type: 'button', text: 'EXPORT MY DATA', onclick: exportBackup }),
      el('button', { class: 'btn btn-block', type: 'button', text: 'IMPORT DATA', onclick: () => fileInput.click() }),
      fileInput,
      el('p', { class: 'eyebrow', style: 'margin-top:8px', text: 'Reset' }),
      resetBtn('Reset workout data', 'Sessions, logged sets and personal records are removed. Weight, meals and habits are kept.', 'workout'),
      resetBtn('Reset weight data', 'Every weigh-in is removed, including check-ins and check-outs.', 'weight'),
      resetBtn('Reset nutrition data', 'Meal completion history is removed. Your meal plan is kept.', 'nutrition'),
      resetBtn('Reset habit data', 'All habit records are removed. Your habit list is kept.', 'habits'),
      resetBtn('Reset everything', 'Settings, weight, workouts, meals and habits are all removed from this device.', 'all')
    ]));

    /* ---- about ---- */
    container.appendChild(el('section', { class: 'card' }, [
      el('h3', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'About' }),
      el('p', { class: 'muted', style: 'font-size:14px',
        text: 'A personal gym companion: 57 exercises with animated form visuals, weight, nutrition and habit tracking — all offline.' }),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:10px',
        text: 'General training guidance only — not medical advice. Stop if a movement causes sharp or unusual pain.' })
    ]));
  }

  /* ---------- meal editor ---------- */
  function editMeal(meal) {
    const name = el('input', { class: 'input', type: 'text', value: meal.name, 'aria-label': 'Meal name', maxlength: '24' });
    const kcal = el('input', { class: 'input', type: 'number', value: String(meal.kcal), min: '0', step: '10', 'aria-label': 'Approximate calories' });
    const protein = el('input', { class: 'input', type: 'number', value: String(meal.protein), min: '0', step: '1', 'aria-label': 'Approximate protein' });
    const items = el('textarea', {
      class: 'input', rows: '7', 'aria-label': 'Items, one per line', style: 'resize:vertical;line-height:1.5'
    });
    items.value = meal.items.join('\n');

    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'field' }, [el('label', { text: 'Meal name' }), name]),
      el('div', { class: 'row', style: 'gap:10px' }, [
        el('div', { class: 'field grow' }, [el('label', { text: '≈ kcal' }), kcal]),
        el('div', { class: 'field grow' }, [el('label', { text: '≈ protein (g)' }), protein])
      ]),
      el('div', { class: 'field' }, [el('label', { text: 'Items — one per line' }), items]),
      el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button', text: 'SAVE MEAL',
        onclick: () => {
          const plan = store.getMealPlan().map(m => m.id === meal.id ? {
            ...m,
            name: name.value.trim() || m.name,
            kcal: Number(kcal.value) || 0,
            protein: Number(protein.value) || 0,
            items: items.value.split('\n').map(x => x.trim()).filter(Boolean)
          } : m);
          store.saveSettings({ mealPlan: plan });
          toast('Meal saved');
          ref.close();
          paint();
        }
      })
    ]);
    const ref = sheet(`Edit ${meal.name}`, body);
  }

  function resetBtn(label, message, scope) {
    return el('button', {
      class: 'btn btn-block btn-danger', type: 'button', text: label,
      onclick: () => confirmSheet(label + '?', message, () => {
        store.clearAll(scope);
        toast(`${label} done`, 'reset');
        paint();
      })
    });
  }

  paint();
  return { title: 'Settings', eyebrow: 'Preferences', node: container };
}

async function paintDurability(section) {
  const st = await storageStatus();
  const backup = lastExport();
  section.replaceChildren();
  section.appendChild(el('h3', { class: 'eyebrow', text: 'Storage durability' }));

  const ok = st.persisted;
  section.appendChild(el('div', { class: 'row', style: 'gap:10px;align-items:flex-start' }, [
    el('span', { class: ok ? 'tag tag-accent' : 'tag tag-warn', text: ok ? 'PROTECTED' : 'BEST-EFFORT' }),
    el('p', { class: 'dim', style: 'font-size:12.5px;line-height:1.5', text: ok
      ? 'Your browser has marked this data as persistent, so it will not be cleared automatically.'
      : 'Your data is saved, but the browser may clear it automatically if storage runs low — or, on iPhone, after about 7 days without opening the app.' })
  ]));

  if (!ok) {
    section.appendChild(el('button', {
      class: 'btn btn-block', type: 'button', text: 'REQUEST PROTECTED STORAGE',
      onclick: async () => {
        const r = await requestPersistence({ force: true });
        toast(r.persisted ? 'Storage protected' : 'Browser declined — add to home screen', r.persisted ? 'check' : 'close');
        paintDurability(section);
      }
    }));
  }

  if (!isInstalled()) {
    section.appendChild(el('p', { class: 'dim', style: 'font-size:12px;line-height:1.5',
      text: 'Add this app to your home screen (Share → Add to Home Screen). Installed apps keep their data far longer, and on iPhone it is the only way to avoid the 7-day clear-out.' }));
  }

  if (st.usage != null) {
    section.appendChild(el('p', { class: 'dim', style: 'font-size:12px',
      text: `Using ${formatBytes(st.usage)}${st.quota ? ' of ' + formatBytes(st.quota) + ' available' : ''}.` }));
  }

  section.appendChild(el('p', {
    class: backup.never || backup.days > 14 ? 'tag tag-warn' : 'dim',
    style: backup.never || backup.days > 14 ? 'display:inline-block' : 'font-size:12px',
    text: backup.never ? 'NO BACKUP YET — EXPORT BELOW'
      : backup.days === 0 ? 'Backed up today'
      : `Last backup ${backup.days} day${backup.days === 1 ? '' : 's'} ago`
  }));
}

function priv(text) {
  return el('li', { class: 'cue cue-good' }, [el('i', { text: '✓' }), el('span', { text })]);
}

async function exportBackup() {
  let payload;
  try {
    /* exportData is async: it reads progress photos out of IndexedDB. Without
       the await the Blob receives "[object Promise]" and the backup is junk. */
    payload = await store.exportData();
  } catch (err) {
    console.error(err);
    toast('Could not build the backup', 'close');
    return;
  }
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: `fitness-data-${store.dateKey()}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  markExported();
  toast('Backup downloaded');
}

/* Destructive actions always take two deliberate taps. */
function confirmSheet(title, message, onConfirm) {
  const body = el('div', { class: 'stack' }, [
    el('p', { class: 'muted', text: message }),
    el('p', { class: 'dim', style: 'font-size:12.5px', text: 'This cannot be undone. Export a backup first if you might want it back.' }),
    el('button', {
      class: 'btn btn-danger btn-block btn-lg', type: 'button', text: 'Yes, delete',
      onclick: () => { onConfirm(); ref.close(); }
    }),
    el('button', { class: 'btn btn-ghost btn-block', type: 'button', text: 'Cancel', onclick: () => ref.close() })
  ]);
  const ref = sheet(title, body);
}
