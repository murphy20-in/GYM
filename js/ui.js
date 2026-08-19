/* ui.js — DOM helpers, icons, the exercise figure component, sheets and toasts. */

import { animate, frameNodes, VB } from './figure.js';
import { ARCHETYPES } from './data/archetypes.js';

/* ---------- DOM ---------- */

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

export const frag = (children) => {
  const f = document.createDocumentFragment();
  for (const c of children) if (c) f.appendChild(c);
  return f;
};

export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- icons ---------- */

const ICON_PATHS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  dumbbell: '<path d="M4 9v6M8 6v12M16 6v12M20 9v6M8 12h8"/>',
  book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M18 7h2v13H7"/>',
  chart: '<path d="M4 20h16"/><path d="M7 20v-6M12 20V6M17 20v-9"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6a2 2 0 0 1 2 2v.5l1.6.9.5-.3a2 2 0 0 1 2.7.7l.4.7a2 2 0 0 1-.7 2.7l-.5.3v1.8l.5.3a2 2 0 0 1 .7 2.7l-.4.7a2 2 0 0 1-2.7.7l-.5-.3-1.6.9v.5a2 2 0 0 1-2 2h-.8a2 2 0 0 1-2-2v-.5l-1.6-.9-.5.3a2 2 0 0 1-2.7-.7l-.4-.7a2 2 0 0 1 .7-2.7l.5-.3v-1.8l-.5-.3a2 2 0 0 1-.7-2.7l.4-.7a2 2 0 0 1 2.7-.7l.5.3 1.6-.9v-.5a2 2 0 0 1 2-2z"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 4.5v15M16 4.5v15"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M4 12.5l5.5 5.5L20 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  reset: '<path d="M4 12a8 8 0 1 1 2.4 5.7"/><path d="M4 19v-6h6"/>'
};

export function icon(name, cls = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
    `stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

/* ---------- svg serialisation (thumbnails) ---------- */

const attrStr = a => Object.entries(a)
  .map(([k, v]) => `${k}="${typeof v === 'number' ? Math.round(v * 100) / 100 : esc(v)}"`).join(' ');

/** Static markup for one frame — list thumbnails must not animate. */
export function figureThumb(archetypeId, t = 0.62) {
  const spec = ARCHETYPES[archetypeId];
  if (!spec) return '';
  const nodes = frameNodes({ ...spec, ghost: false, arrow: null }, t);
  const body = nodes.map(n => `<${n.tag} ${attrStr(n.attrs)} class="${n.cls || ''}"/>`).join('');
  return `<svg viewBox="0 0 ${VB.w} ${VB.h}" aria-hidden="true" focusable="false">${body}</svg>`;
}

/* ---------- animated figure ---------- */

/** Large exercise visual: animated figure, play/pause, scrub, phase label. */
export function exerciseFigure(exercise, opts = {}) {
  const spec = ARCHETYPES[exercise.archetype];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `${exercise.name}: animated figure moving from ${spec.phases[0].toLowerCase()} to ${spec.phases[2].toLowerCase()}`);

  const phaseLabel = el('span', { class: 'phase', text: spec.phases[0] });
  const scrub = el('input', {
    type: 'range', min: 0, max: 1000, value: 0, class: 'scrub',
    'aria-label': 'Scrub through the movement'
  });
  const playBtn = el('button', {
    class: 'play-btn', type: 'button', 'aria-label': 'Pause animation', html: icon('pause')
  });

  const node = el('div', {}, [
    el('div', { class: 'figure' }, [svg]),
    el('div', { class: 'figure-bar' }, [playBtn, phaseLabel, scrub])
  ]);

  const ctrl = animate(svg, spec, {
    period: opts.period || 3400,
    onPhase: (p, t) => {
      phaseLabel.textContent = p;
      if (ctrl && ctrl.playing) scrub.value = Math.round(t * 1000);
      opts.onPhase?.(p, t);
    }
  });

  function setPlaying(on) {
    if (on) ctrl.play(); else ctrl.pause();
    playBtn.innerHTML = icon(on ? 'pause' : 'play');
    playBtn.setAttribute('aria-label', on ? 'Pause animation' : 'Play animation');
  }

  playBtn.addEventListener('click', () => setPlaying(!ctrl.playing));
  scrub.addEventListener('input', () => {
    ctrl.seek(Number(scrub.value) / 1000);
    playBtn.innerHTML = icon('play');
    playBtn.setAttribute('aria-label', 'Play animation');
  });

  /* reduced motion: hold a readable mid-position and let the user scrub */
  if (ctrl.reduced) { setPlaying(false); scrub.value = 500; }

  return {
    node,
    phases: spec.phases,
    destroy() { ctrl.destroy(); },
    pause() { setPlaying(false); },
    resume() { if (!ctrl.reduced) setPlaying(true); }
  };
}

/** START -> MOVE -> FINISH ladder that follows the animation. */
export function phaseLadder(exercise) {
  const spec = ARCHETYPES[exercise.archetype];
  const steps = spec.phases.map((p, i) =>
    el('div', { class: 'phase-step', dataset: { phase: p } }, [
      el('b', { text: String(i + 1) }),
      el('span', { text: p })
    ]));
  const node = el('div', { class: 'phases' }, steps);
  return {
    node,
    highlight(phase) { for (const s of steps) s.classList.toggle('on', s.dataset.phase === phase); }
  };
}

/* ---------- toast ---------- */

let toastTimer = null;
export function toast(message, iconName = 'check') {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const t = el('div', {
    class: 'toast', role: 'status', 'aria-live': 'polite',
    html: icon(iconName) + `<span>${esc(message)}</span>`
  });
  document.body.appendChild(t);
  toastTimer = setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 240);
  }, 1900);
}

/* ---------- bottom sheet ---------- */

export function sheet(title, content, opts = {}) {
  const backdrop = el('div', { class: 'sheet-backdrop' });
  const panel = el('div', {
    class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1'
  }, [
    el('div', { class: 'sheet-grip' }),
    el('div', { class: 'row-between', style: 'margin-bottom:14px' }, [
      el('h2', { style: 'font-size:18px', text: title }),
      el('button', { class: 'btn-icon', type: 'button', 'aria-label': 'Close', html: icon('close'), onclick: () => close() })
    ]),
    content
  ]);

  const lastFocus = document.activeElement;
  function close() {
    backdrop.remove(); panel.remove();
    document.removeEventListener('keydown', onKey);
    lastFocus?.focus?.();
    opts.onClose?.();
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop, panel);
  panel.focus();
  return { close, panel };
}

/* ---------- formatting ---------- */

export const pad2 = n => String(n).padStart(2, '0');
export const mmss = s => `${pad2(Math.floor(Math.max(0, s) / 60))}:${pad2(Math.max(0, s) % 60)}`;

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function relativeDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const today = new Date();
  const days = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - then) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export const minutesBetween = (a, b) => (!a || !b) ? null : Math.max(1, Math.round((b - a) / 60000));

/* ---------- exercise card ---------- */

export function exerciseCard(ex, opts = {}) {
  return el('button', {
    class: `ex-card${opts.done ? ' done' : ''}`,
    type: 'button',
    'aria-label': `${ex.name}. ${ex.muscleGroup}. ${opts.done ? 'Completed. ' : ''}View form.`,
    onclick: opts.onClick
  }, [
    el('div', { class: 'ex-thumb', html: figureThumb(ex.archetype) }),
    el('div', { class: 'grow' }, [
      el('div', { class: 'ex-name', text: ex.name }),
      el('div', { class: 'ex-meta', text: `${ex.muscleGroup} · ${ex.equipment}` })
    ]),
    el('span', { class: 'ex-index', html: opts.done ? icon('check') : String(opts.index ?? '') })
  ]);
}
