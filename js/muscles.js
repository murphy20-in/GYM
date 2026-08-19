/* muscles.js — anatomical silhouette with primary / secondary highlighting.
 *
 * The body is built entirely out of muscle regions plus a few neutral parts
 * (head, hands, feet), so unworked muscles still read as a body while the
 * trained ones light up. Front and back views are drawn side by side because
 * most exercises here work at least one muscle you cannot see from the front.
 */

const B = 60;          /* width of one body */
const GAP = 16;
const H = 122;

/* Region label used in the legend and for the aria description. */
export const MUSCLE_NAMES = {
  chest: 'Chest', abs: 'Core', frontDelt: 'Front Delts', sideDelt: 'Side Delts',
  rearDelt: 'Rear Delts', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  lats: 'Lats', traps: 'Traps / Upper Back', lowerBack: 'Lower Back', glutes: 'Glutes',
  quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves'
};

const e = (cx, cy, rx, ry, m) => ({ t: 'ellipse', cx, cy, rx, ry, m });
const r = (x, y, w, h, rx, m) => ({ t: 'rect', x, y, w, h, rx, m });
const p = (d, m) => ({ t: 'path', d, m });

/* mirrored copies are generated around the body centre line */
const pair = (shape) => {
  if (shape.t === 'ellipse') return [shape, { ...shape, cx: B - shape.cx }];
  if (shape.t === 'rect') return [shape, { ...shape, x: B - shape.x - shape.w }];
  return [shape, { ...shape, flip: true }];
};

const FRONT = [
  e(30, 8, 6, 7.5, null),                                  /* head */
  r(26.5, 14, 7, 4.5, 2, 'traps'),                         /* neck */
  p('M19,20 L30,17.5 L41,20 L37,24 L30,22 L23,24 Z', 'traps'),
  ...pair(e(17.5, 26.5, 5.6, 5.2, 'frontDelt')),
  ...pair(e(13.6, 28, 3.4, 5, 'sideDelt')),
  ...pair(p('M29.4,23.5 L21.5,25.5 Q18.6,31 21.8,36.5 L29.4,35.8 Z', 'chest')),
  r(25, 37.5, 10, 17, 3, 'abs'),
  ...pair(e(22.2, 45, 2.6, 7, 'abs')),
  ...pair(e(15, 37.5, 4.1, 7.6, 'biceps')),
  ...pair(e(12.4, 51.5, 3.5, 9, 'forearms')),
  ...pair(e(11, 63, 3, 3.4, null)),                        /* hands */
  r(23, 54, 14, 7, 3, null),                               /* hips */
  ...pair(e(24, 72, 6.1, 14, 'quads')),
  ...pair(e(24.6, 87.5, 4.4, 3.2, null)),                  /* knees */
  ...pair(e(24.6, 99, 4.4, 10, 'calves')),
  ...pair(e(24.6, 112.5, 4, 3.4, null))                    /* feet */
];

const BACK = [
  e(30, 8, 6, 7.5, null),
  r(26.5, 14, 7, 4.5, 2, 'traps'),
  p('M20,19.5 L30,17.5 L40,19.5 L36.5,33 L30,38 L23.5,33 Z', 'traps'),
  ...pair(e(17.5, 26.5, 5.6, 5.2, 'rearDelt')),
  ...pair(e(13.6, 28, 3.4, 5, 'sideDelt')),
  ...pair(p('M23.8,26 Q19,34.5 21.8,45 L28.6,47 L29.2,30 Z', 'lats')),
  r(26, 45, 8, 9.5, 2.5, 'lowerBack'),
  ...pair(e(15, 37.5, 4.1, 7.6, 'triceps')),
  ...pair(e(12.4, 51.5, 3.5, 9, 'forearms')),
  ...pair(e(11, 63, 3, 3.4, null)),
  ...pair(e(25, 58.5, 5.6, 5.6, 'glutes')),
  ...pair(e(24, 74, 6.1, 13, 'hamstrings')),
  ...pair(e(24.6, 97, 4.8, 11, 'calves')),
  ...pair(e(24.6, 112.5, 4, 3.4, null))
];

function shapeSVG(s, cls) {
  const c = ` class="${cls}"`;
  if (s.t === 'ellipse') return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}"${c}/>`;
  if (s.t === 'rect') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.rx}"${c}/>`;
  const f = s.flip ? ` transform="matrix(-1 0 0 1 ${B} 0)"` : '';
  return `<path d="${s.d}"${f}${c}/>`;
}

function bodySVG(parts, dx, primary, secondary) {
  const inner = parts.map(s => {
    let cls = 'mm-idle';
    if (s.m && primary.includes(s.m)) cls = 'mm-primary';
    else if (s.m && secondary.includes(s.m)) cls = 'mm-secondary';
    else if (!s.m) cls = 'mm-neutral';
    return shapeSVG(s, cls);
  }).join('');
  return `<g transform="translate(${dx} 0)">${inner}</g>`;
}

/**
 * Returns the markup for a front+back muscle map.
 * `primary` and `secondary` are arrays of region keys from MUSCLE_NAMES.
 */
export function muscleMapSVG(primary = [], secondary = [], opts = {}) {
  const w = B * 2 + GAP;
  const labels = opts.labels === false ? '' :
    `<text x="${B / 2}" y="${H + 8}" class="mm-label">FRONT</text>` +
    `<text x="${B + GAP + B / 2}" y="${H + 8}" class="mm-label">BACK</text>`;
  const names = [...primary, ...secondary].map(k => MUSCLE_NAMES[k]).filter(Boolean).join(', ');
  return `<svg viewBox="0 0 ${w} ${H + 12}" class="muscle-map" role="img" ` +
    `aria-label="Muscles worked: ${names || 'none highlighted'}">` +
    bodySVG(FRONT, 0, primary, secondary) +
    bodySVG(BACK, B + GAP, primary, secondary) +
    labels + `</svg>`;
}

/** Legend rows: primary first, then secondary. */
export function muscleLegend(primary = [], secondary = []) {
  const row = (k, kind) =>
    `<li class="mm-row mm-row-${kind}"><span class="mm-swatch"></span>` +
    `<span class="mm-name">${MUSCLE_NAMES[k] || k}</span>` +
    `<span class="mm-kind">${kind === 'primary' ? 'Primary' : 'Secondary'}</span></li>`;
  return `<ul class="mm-legend">` +
    primary.map(k => row(k, 'primary')).join('') +
    secondary.map(k => row(k, 'secondary')).join('') + `</ul>`;
}
