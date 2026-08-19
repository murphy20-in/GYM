/* app.js — hash router and app shell.
 *
 * Hash routing (rather than the History API) is deliberate: GitHub Pages serves
 * static files with no rewrite rules, so a deep link like /progress would 404 on
 * refresh. Every route lives under one index.html.
 */

import { el, icon } from './ui.js';
import { mountTimerFab } from './timer.js';
import * as home from './views/home.js';
import * as workouts from './views/workouts.js';
import * as workoutMode from './views/workoutMode.js';
import * as detail from './views/detail.js';
import * as library from './views/library.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';

const NAV = [
  { href: '#/', label: 'Home', icon: 'home', match: p => p === '/' || p.startsWith('/home') },
  { href: '#/workouts', label: 'Workout', icon: 'dumbbell', match: p => p.startsWith('/workout') || p.startsWith('/day') },
  { href: '#/library', label: 'Exercises', icon: 'book', match: p => p.startsWith('/library') || p.startsWith('/exercise') },
  { href: '#/progress', label: 'Progress', icon: 'chart', match: p => p.startsWith('/progress') },
  { href: '#/settings', label: 'Settings', icon: 'gear', match: p => p.startsWith('/settings') }
];

const ROUTES = [
  { re: /^\/$/, view: home.view, params: () => ({}) },
  { re: /^\/home\/([\w-]+)$/, view: home.view, params: m => ({ day: m[1] }) },
  { re: /^\/workouts$/, view: workouts.weekView, params: () => ({}) },
  { re: /^\/day\/([\w-]+)$/, view: workouts.view, params: m => ({ id: m[1] }) },
  { re: /^\/workout\/([\w-]+)$/, view: workoutMode.view, params: m => ({ id: m[1] }) },
  { re: /^\/exercise\/([\w-]+)$/, view: detail.view, params: m => ({ id: m[1] }) },
  { re: /^\/library$/, view: library.view, params: () => ({}) },
  { re: /^\/progress$/, view: progress.view, params: () => ({}) },
  { re: /^\/settings$/, view: settings.view, params: () => ({}) }
];

const app = {
  go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  },
  /** Re-render the current route in place, after data changes elsewhere. */
  refreshChrome() { updateNav(); }
};

let current = null;
let viewHost, titleEl, eyebrowEl, backEl, navEl;

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { path: path || '/', query };
}

function updateNav() {
  const { path } = parseHash();
  for (const a of navEl.querySelectorAll('a')) {
    const item = NAV.find(n => n.href === a.getAttribute('href'));
    if (item?.match(path)) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function render() {
  const { path, query } = parseHash();
  const route = ROUTES.find(r => r.re.test(path));

  current?.destroy?.();
  current = null;

  let result;
  if (!route) {
    result = {
      title: 'Not found',
      node: el('div', { class: 'view empty' }, [
        el('p', { text: 'That page does not exist.' }),
        el('a', { class: 'btn', href: '#/', text: 'Go home' })
      ])
    };
  } else {
    const m = path.match(route.re);
    try {
      result = route.view({ ...route.params(m), ...query }, app);
    } catch (err) {
      console.error(err);
      result = {
        title: 'Something went wrong',
        node: el('div', { class: 'view empty' }, [
          el('p', { text: 'This screen failed to load.' }),
          el('a', { class: 'btn', href: '#/', text: 'Go home' })
        ])
      };
    }
  }

  current = result;
  titleEl.textContent = result.title || 'GYM';
  eyebrowEl.textContent = result.eyebrow || '';
  eyebrowEl.hidden = !result.eyebrow;
  document.title = `${result.title || 'GYM'} · Workout`;

  if (result.back) {
    backEl.hidden = false;
    backEl.setAttribute('href', result.back);
  } else {
    backEl.hidden = true;
  }

  viewHost.replaceChildren(result.node);
  updateNav();
  window.scrollTo(0, 0);
}

function buildShell() {
  navEl = el('nav', { class: 'nav', 'aria-label': 'Primary' },
    NAV.map(n => el('a', { href: n.href, html: `${icon(n.icon)}<span>${n.label}</span>` })));

  backEl = el('a', { class: 'btn btn-icon', href: '#/', 'aria-label': 'Back', html: icon('left'), hidden: true });
  eyebrowEl = el('p', { class: 'eyebrow' });
  titleEl = el('h1', {});
  viewHost = el('main', { id: 'view' });

  const bar = el('header', { class: 'topbar' }, [
    backEl,
    el('div', { class: 'grow' }, [eyebrowEl, titleEl])
  ]);

  document.body.appendChild(el('div', { class: 'app' }, [
    navEl,
    el('div', { class: 'main' }, [bar, viewHost])
  ]));
}

/* ---------- service worker ---------- */

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;   /* file:// cannot host a worker */
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { scope: './' })
      .catch(err => console.warn('Service worker registration failed:', err));
  });
}

/* ---------- boot ---------- */

buildShell();
mountTimerFab();
window.addEventListener('hashchange', render);
render();
registerSW();
