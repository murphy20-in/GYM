/* chart.js — lightweight SVG charts. No library, no canvas, no dependencies.
 *
 * The weight chart deliberately draws the moving-average trend as the dominant
 * line and the daily readings as faint dots: day-to-day scale movement is mostly
 * water, food and glycogen, and showing it prominently invites the wrong
 * conclusion.
 */

const NS = 'http://www.w3.org/2000/svg';
const W = 320, H = 170;
const PAD = { l: 30, r: 10, t: 12, b: 22 };

const mk = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

const fmtDate = iso => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

/**
 * @param {Array<{date,kg}>} series  daily readings, chronological
 * @param {Array<{date,kg}>} trend   moving average, same length
 * @param {{target?:number, unit?:string}} opts
 */
export function weightChart(series, trend, opts = {}) {
  const svg = mk('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'chart',
    role: 'img',
    'aria-label': describe(series, trend, opts)
  });

  if (!series.length) {
    svg.appendChild(mk('text', { x: W / 2, y: H / 2, class: 'chart-empty', 'text-anchor': 'middle' }))
      .textContent = 'No measurements yet';
    return svg;
  }

  const values = series.map(p => p.kg);
  let lo = Math.min(...values), hi = Math.max(...values);
  /* include the target line only when it is near the data, so a far-off goal
     does not squash the visible variation into a flat line */
  if (opts.target != null && opts.target > lo - (hi - lo || 2) * 2) lo = Math.min(lo, opts.target);
  const span = Math.max(hi - lo, 1);
  lo -= span * 0.12; hi += span * 0.12;

  const innerW = W - PAD.l - PAD.r, innerH = H - PAD.t - PAD.b;
  const x = i => PAD.l + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = v => PAD.t + innerH - ((v - lo) / (hi - lo)) * innerH;

  /* horizontal guides + y labels */
  for (const frac of [0, 0.5, 1]) {
    const v = lo + (hi - lo) * frac;
    const yy = y(v);
    svg.appendChild(mk('line', { x1: PAD.l, y1: yy, x2: W - PAD.r, y2: yy, class: 'chart-grid' }));
    const t = mk('text', { x: PAD.l - 5, y: yy + 3.5, class: 'chart-axis', 'text-anchor': 'end' });
    t.textContent = v.toFixed(1);
    svg.appendChild(t);
  }

  /* target line */
  if (opts.target != null && opts.target >= lo && opts.target <= hi) {
    const yy = y(opts.target);
    svg.appendChild(mk('line', { x1: PAD.l, y1: yy, x2: W - PAD.r, y2: yy, class: 'chart-target' }));
    const t = mk('text', { x: W - PAD.r, y: yy - 4, class: 'chart-target-label', 'text-anchor': 'end' });
    t.textContent = `target ${opts.target}`;
    svg.appendChild(t);
  }

  /* raw readings: faint */
  if (series.length > 1) {
    svg.appendChild(mk('polyline', {
      class: 'chart-raw',
      points: series.map((p, i) => `${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')
    }));
  }
  if (series.length <= 45) {
    for (let i = 0; i < series.length; i++) {
      svg.appendChild(mk('circle', { cx: x(i), cy: y(series[i].kg), r: 1.9, class: 'chart-dot' }));
    }
  }

  /* trend: dominant */
  if (trend && trend.length > 1) {
    svg.appendChild(mk('polyline', {
      class: 'chart-trend',
      points: trend.map((p, i) => `${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')
    }));
  }

  /* latest reading marker */
  const last = series.length - 1;
  svg.appendChild(mk('circle', { cx: x(last), cy: y(series[last].kg), r: 3.6, class: 'chart-latest' }));

  /* x labels: first and last only — more would not fit on a phone */
  const first = mk('text', { x: PAD.l, y: H - 6, class: 'chart-axis' });
  first.textContent = fmtDate(series[0].date);
  svg.appendChild(first);
  if (series.length > 1) {
    const lastLabel = mk('text', { x: W - PAD.r, y: H - 6, class: 'chart-axis', 'text-anchor': 'end' });
    lastLabel.textContent = fmtDate(series[last].date);
    svg.appendChild(lastLabel);
  }

  return svg;
}

function describe(series, trend, opts) {
  if (!series.length) return 'Weight chart, no measurements yet';
  const from = series[0], to = series[series.length - 1];
  const delta = (to.kg - from.kg).toFixed(1);
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'level';
  return `Weight chart from ${from.date} to ${to.date}: ${from.kg} to ${to.kg} ${opts.unit || 'kg'}, trending ${dir} ${Math.abs(delta)}`;
}

/**
 * Twelve-month bar rollup for the yearly view.
 * @param {Array<{label,score,active}>} months
 */
export function yearBars(months) {
  const rows = document.createElement('div');
  rows.className = 'year-bars';
  for (const m of months) {
    const row = document.createElement('div');
    row.className = 'year-row' + (m.active ? '' : ' idle');
    row.innerHTML =
      `<span class="ym">${m.label}</span>` +
      `<span class="bar bar-sm"><i style="width:${m.score}%"></i></span>` +
      `<span class="yv">${m.active ? m.score + '%' : '—'}</span>`;
    rows.appendChild(row);
  }
  return rows;
}
