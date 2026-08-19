/* habits.js — daily habit tracking.
 *
 * Language is deliberately neutral: things are "tracked" or "not tracked",
 * counts are counts. Nothing here is labelled good, bad, a failure or a broken
 * streak, and private habits stay collapsed until the user opens them.
 */

import { el, icon, sheet, toast } from '../ui.js';
import { HABIT_TYPES } from '../data/plan.js';
import * as store from '../storage.js';

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });
  let revealPrivate = false;   /* per-visit, never persisted */

  function paint() {
    const settings = store.getSettings();
    const habits = store.getHabits();
    const log = store.getDayLog();
    const b = store.dailyBreakdown();
    container.replaceChildren();

    /* ---------- summary ---------- */
    container.appendChild(el('section', { class: 'card accent-habits' }, [
      el('p', { class: 'eyebrow', text: 'Today' }),
      el('div', { class: 'row-between', style: 'margin-top:10px' }, [
        el('span', { style: 'font-size:13px', text: 'Habits tracked' }),
        el('span', { class: 'dim', style: 'font-size:13px', text: `${b.habits.done} / ${b.habits.total}` })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.habits.value * 100}%` })]),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:12px;line-height:1.45',
        text: 'Your daily score counts habits you recorded, not the values you recorded. Tracking honestly is the whole point.' })
    ]));

    const publicHabits = habits.filter(h => !h.private);
    const privateHabits = habits.filter(h => h.private);

    /* ---------- open habits ---------- */
    if (publicHabits.length) {
      container.appendChild(el('div', { class: 'section-title' }, [el('h2', { text: 'Habits' })]));
      container.appendChild(el('div', { class: 'stack' }, publicHabits.map(h => habitCard(h, log.habits[h.id]))));
    }

    /* ---------- private habits ---------- */
    if (privateHabits.length) {
      const hidden = settings.hidePrivate && !revealPrivate;
      container.appendChild(el('div', { class: 'section-title' }, [
        el('h2', { text: settings.hidePrivate ? '🔒 Private habits' : 'Private habits' }),
        el('span', { text: `${privateHabits.filter(h => log.habits[h.id]?.tracked).length} / ${privateHabits.length} tracked` })
      ]));

      if (hidden) {
        container.appendChild(el('div', { class: 'card private-veil' }, [
          el('p', { class: 'muted', style: 'font-size:14px', text: 'These are kept out of sight by default.' }),
          el('button', {
            class: 'btn btn-block', style: 'margin-top:12px', type: 'button', text: 'Show private habits',
            onclick: () => { revealPrivate = true; paint(); }
          }),
          el('p', { class: 'dim', style: 'font-size:12px;margin-top:10px',
            text: 'They stay on this device only. Turn this veil off permanently in Settings.' })
        ]));
      } else {
        container.appendChild(el('div', { class: 'stack' }, privateHabits.map(h => habitCard(h, log.habits[h.id]))));
        if (settings.hidePrivate) {
          container.appendChild(el('button', {
            class: 'btn btn-ghost btn-block', type: 'button', text: 'Hide again',
            onclick: () => { revealPrivate = false; paint(); }
          }));
        }
      }
    }

    /* ---------- add ---------- */
    container.appendChild(el('button', {
      class: 'btn btn-block', style: 'margin-top:6px', type: 'button', text: '+ ADD HABIT',
      onclick: openAddHabit
    }));
  }

  /* ---------- one habit ---------- */

  function habitCard(habit, entry) {
    const tracked = !!entry?.tracked;
    const streaks = store.habitStreaks(habit.id);

    const card = el('section', { class: `card habit-card${tracked ? ' tracked' : ''}` }, [
      el('div', { class: 'row-between' }, [
        el('div', { class: 'grow' }, [
          el('p', { style: 'font-weight:700;font-size:15.5px', text: habit.name }),
          el('p', { class: 'dim', style: 'font-size:12px', text: describeHabit(habit) })
        ]),
        el('span', { class: tracked ? 'tag tag-accent' : 'tag', text: tracked ? 'Tracked' : 'Not tracked' })
      ]),
      control(habit, entry),
      el('div', { class: 'habit-foot' }, [
        el('span', { class: 'dim', text: habit.lowerIsBetter
          ? `${streaks.aimCurrent} day${streaks.aimCurrent === 1 ? '' : 's'} at zero · best ${streaks.aimLongest}`
          : `${streaks.aimCurrent} day${streaks.aimCurrent === 1 ? '' : 's'} at target · best ${streaks.aimLongest}` }),
        el('button', {
          class: 'link-more', type: 'button', text: 'Trends →',
          onclick: () => openTrends(habit)
        })
      ])
    ]);
    return card;
  }

  /** The daily input, shaped by the habit's tracking type. */
  function control(habit, entry) {
    const wrap = el('div', { class: 'habit-control' });
    const save = (value) => { store.setHabit(habit.id, { value }); paint(); };

    if (habit.type === 'yesno') {
      const value = entry?.tracked ? entry.value : null;
      wrap.append(
        el('button', {
          class: 'seg-btn', type: 'button', 'aria-pressed': String(value === true),
          text: 'YES', onclick: () => save(true)
        }),
        el('button', {
          class: 'seg-btn', type: 'button', 'aria-pressed': String(value === false),
          text: 'NO', onclick: () => save(false)
        })
      );
      /* a count follows a "yes" where the habit tracks quantity too */
      return wrap;
    }

    const step = habit.type === 'duration' ? 0.5 : 1;
    const current = Number(entry?.value ?? 0);
    const input = el('input', {
      type: 'number', inputmode: 'decimal', step: String(step), min: '0',
      value: String(current), 'aria-label': `${habit.name} value`,
      onchange: e => save(Math.max(0, Number(e.target.value) || 0))
    });

    wrap.append(
      el('div', { class: 'stepper', style: 'flex:1' }, [
        el('button', { type: 'button', 'aria-label': 'Decrease', text: '−',
          onclick: () => save(Math.max(0, Math.round((Number(input.value) - step) * 10) / 10)) }),
        input,
        el('button', { type: 'button', 'aria-label': 'Increase', text: '+',
          onclick: () => save(Math.round((Number(input.value) + step) * 10) / 10) })
      ])
    );
    if (!entry?.tracked) {
      wrap.appendChild(el('button', {
        class: 'btn', type: 'button', text: 'Track', onclick: () => save(Number(input.value) || 0)
      }));
    }
    return wrap;
  }

  /* ---------- trends ---------- */

  function openTrends(habit) {
    const totals = store.habitTotals(habit.id);
    const streaks = store.habitStreaks(habit.id);
    const days = last30(habit.id);

    const body = el('div', { class: 'stack' }, [
      habit.type !== 'yesno' ? el('div', { class: 'stat-row' }, [
        statBox('Today', totals.day),
        statBox('This week', totals.week),
        statBox('This month', totals.month)
      ]) : null,
      habit.type !== 'yesno'
        ? el('p', { class: 'dim', style: 'font-size:12.5px', text: `Average on tracked days: ${totals.average}${habit.unit ? ' ' + habit.unit : ''}` })
        : null,

      el('p', { class: 'eyebrow', style: 'margin-top:6px', text: 'Last 30 days' }),
      el('div', { class: 'dotstrip' }, days.map(d => el('span', {
        class: `dot30 ${d.state}`,
        title: `${d.date}: ${d.label}`
      }))),
      el('p', { class: 'dim', style: 'font-size:12px' },
        [el('span', { text: '● tracked and at aim · ◐ tracked · ○ not tracked' })]),

      el('div', { class: 'stat-row', style: 'margin-top:6px' }, [
        statBox('Tracking streak', streaks.trackCurrent),
        statBox(habit.lowerIsBetter ? 'Days at zero' : 'Days at target', streaks.aimCurrent),
        statBox('Best run', streaks.aimLongest)
      ]),

      el('button', {
        class: 'btn btn-danger btn-block', type: 'button', text: 'Remove this habit',
        onclick: () => {
          const list = store.getHabits().filter(h => h.id !== habit.id);
          store.saveHabits(list);
          toast('Habit removed', 'reset');
          ref.close();
          paint();
        }
      })
    ]);
    const ref = sheet(habit.name, body);
  }

  function last30(habitId) {
    const habit = store.getHabits().find(h => h.id === habitId);
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = store.dateKey(d);
      const entry = store.getDayLog(key).habits?.[habitId];
      const met = store.habitMetAim(habit, entry);
      out.push({
        date: key,
        state: !entry?.tracked ? 'none' : met ? 'aim' : 'some',
        label: !entry?.tracked ? 'not tracked' : `${entry.value}`
      });
    }
    return out;
  }

  /* ---------- add habit ---------- */

  function openAddHabit() {
    const name = el('input', { class: 'input', type: 'text', placeholder: 'e.g. Meditation', 'aria-label': 'Habit name', maxlength: '28' });
    const unit = el('input', { class: 'input', type: 'text', placeholder: 'e.g. minutes', 'aria-label': 'Unit (optional)', maxlength: '16' });
    const target = el('input', { class: 'input', type: 'number', min: '0', step: '0.5', placeholder: 'e.g. 10', 'aria-label': 'Daily target (optional)' });
    let type = 'yesno';
    let isPrivate = false;

    const typeButtons = el('div', { class: 'stack' }, HABIT_TYPES.map(t => el('button', {
      class: 'type-option', type: 'button', dataset: { t: t.id }, 'aria-pressed': String(t.id === type),
      onclick: () => {
        type = t.id;
        for (const b of typeButtons.children) b.setAttribute('aria-pressed', String(b.dataset.t === type));
      }
    }, [
      el('span', { class: 'grow' }, [
        el('strong', { text: t.label }),
        el('span', { class: 'dim', style: 'display:block;font-size:12px', text: t.hint })
      ])
    ])));

    const privateBtn = el('button', {
      class: 'switch', type: 'button', role: 'switch', 'aria-checked': 'false', 'aria-label': 'Private habit',
      onclick: () => { isPrivate = !isPrivate; privateBtn.setAttribute('aria-checked', String(isPrivate)); }
    });

    const body = el('div', { class: 'stack' }, [
      el('div', { class: 'field' }, [el('label', { text: 'Habit name' }), name]),
      el('div', { class: 'field' }, [el('label', { text: 'Tracking type' }), typeButtons]),
      el('div', { class: 'field' }, [el('label', { text: 'Unit (optional)' }), unit]),
      el('div', { class: 'field' }, [el('label', { text: 'Daily target (optional)' }), target]),
      el('div', { class: 'setting-row', style: 'border:0' }, [
        el('div', {}, [
          el('div', { class: 'lbl', text: 'Private' }),
          el('div', { class: 'hint', text: 'Kept behind the private section' })
        ]),
        privateBtn
      ]),
      el('button', {
        class: 'btn btn-primary btn-lg btn-block', type: 'button', text: 'ADD HABIT',
        onclick: () => {
          const label = name.value.trim();
          if (!label) { toast('Give the habit a name', 'close'); return; }
          const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `habit-${Date.now()}`;
          const list = store.getHabits();
          if (list.some(h => h.id === id)) { toast('You already track that', 'close'); return; }
          list.push({
            id, name: label, type,
            unit: unit.value.trim() || undefined,
            target: target.value ? Number(target.value) : undefined,
            private: isPrivate
          });
          store.saveHabits(list);
          toast('Habit added');
          ref.close();
          paint();
        }
      })
    ]);
    const ref = sheet('Add habit', body);
    setTimeout(() => name.focus(), 60);
  }

  paint();
  return { title: 'Habits', eyebrow: 'Daily tracking', node: container };
}

function describeHabit(h) {
  const t = HABIT_TYPES.find(x => x.id === h.type);
  const bits = [t ? t.label : h.type];
  if (h.unit) bits.push(h.unit);
  if (h.target) bits.push(`target ${h.target}`);
  return bits.join(' · ');
}

function statBox(label, value) {
  return el('div', { class: 'stat' }, [
    el('b', { text: String(value) }),
    el('span', { text: label })
  ]);
}
