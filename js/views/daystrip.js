/* daystrip.js — the Mon–Sun selector, shared by the dashboard and the schedule. */

import { el } from '../ui.js';
import { WEEK, dayFor } from '../data/workouts.js';
import * as store from '../storage.js';

/** Horizontal day selector with a completion dot per day. */
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
