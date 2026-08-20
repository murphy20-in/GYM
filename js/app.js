/* app.js — hash router and app shell.
 *
 * Hash routing (rather than the History API) is deliberate: GitHub Pages serves
 * static files with no rewrite rules, so a deep link like /progress would 404 on
 * refresh. Every route lives under one index.html.
 */

import { el, icon } from './ui.js';
import { mountTimerFab } from './timer.js';
import { requestPersistence } from './persist.js';
import * as store from './storage.js';
import * as dashboard from './views/dashboard.js';
import * as workouts from './views/workouts.js';
import * as nutrition from './views/nutrition.js';
import * as habits from './views/habits.js';
import * as sessions from './views/sessions.js';
import * as backfill from './views/backfill.js';
import * as report from './views/report.js';
import * as workoutMode from './views/workoutMode.js';
import * as detail from './views/detail.js';
import * as library from './views/library.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';
import * as analytics from './views/analytics.js';
import * as mindset from './views/mindset.js';
import * as bodyAnalytics from './views/bodyAnalytics.js';

/* Five destinations only: six or more shrinks each target below a comfortable
   thumb width at 360px. The exercise library and settings live in the top bar,
   which is present on every screen. */
const NAV = [
  { href: '#/', label: 'Today', icon: 'home', match: p => p === '/' },
  { href: '#/workouts', label: 'Workout', icon: 'dumbbell', match: p => p.startsWith('/workout') || p.startsWith('/day') || p.startsWith('/library') || p.startsWith('/exercise') || p.startsWith('/workouts') },
  { href: '#/analytics', label: 'Analytics', icon: 'chart', match: p => p.startsWith('/analytics') || p === '/weight' },
  { href: '#/body', label: 'Body', icon: 'book', match: p => p.startsWith('/body') },
  { href: '#/progress', label: 'Progress', icon: 'scale', match: p => p.startsWith('/progress') },
  { href: '#/settings', label: 'Settings', icon: 'gear', match: p => p.startsWith('/settings') }
];

const ROUTES = [
  { re: /^\/$/, view: dashboard.view, params: () => ({}) },
  /* older links pointed at #/home/:day before the dashboard replaced it */
  { re: /^\/home\/([\w-]+)$/, redirect: m => `#/day/${m[1]}` },
  { re: /^\/weight$/, redirect: () => '#/analytics?tab=weight' },
  { re: /^\/nutrition$/, view: nutrition.view, params: () => ({}) },
  { re: /^\/habits$/, view: habits.view, params: () => ({}) },
  { re: /^\/sessions$/, view: sessions.view, params: () => ({}) },
  { re: /^\/backfill$/, view: backfill.view, params: () => ({}) },
  { re: /^\/report$/, view: report.view, params: () => ({}) },
  { re: /^\/workouts$/, view: workouts.weekView, params: () => ({}) },
  { re: /^\/day\/([\w-]+)$/, view: workouts.view, params: m => ({ id: m[1] }) },
  { re: /^\/workout\/([\w-]+)$/, view: workoutMode.view, params: m => ({ id: m[1] }) },
  { re: /^\/exercise\/([\w-]+)$/, view: detail.view, params: m => ({ id: m[1] }) },
  { re: /^\/library$/, view: library.view, params: () => ({}) },
  { re: /^\/progress$/, view: progress.view, params: () => ({}) },
  { re: /^\/settings$/, view: settings.view, params: () => ({}) },
  { re: /^\/analytics$/, view: analytics.view, params: () => ({}) },
  { re: /^\/mindset$/, view: mindset.view, params: () => ({}) },
  { re: /^\/body$/, view: bodyAnalytics.view, params: () => ({}) }
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

  if (route?.redirect) { location.replace(route.redirect(path.match(route.re))); return; }

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
    el('div', { class: 'grow' }, [eyebrowEl, titleEl]),
    el('div', { class: 'topbar-actions' }, [
      el('a', { class: 'btn btn-icon', href: '#/library', 'aria-label': 'Exercise library', html: icon('search') }),
      el('a', { class: 'btn btn-icon', href: '#/settings', 'aria-label': 'Settings', html: icon('gear') })
    ])
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

function applyMotionPreference() {
  try {
    const reduced = store.getSettings().reduceMotion;
    document.documentElement.dataset.reduceMotion = reduced ? '1' : '0';
  } catch { document.documentElement.dataset.reduceMotion = '0'; }
}

/** Shown while the database is being read, so the first paint is never blank. */
function bootSplash() {
  const splash = el('div', { class: 'boot-splash', role: 'status', 'aria-live': 'polite' }, [
    el('div', { class: 'boot-mark' }),
    el('p', { class: 'boot-text', text: 'Loading your data…' })
  ]);
  document.body.appendChild(splash);
  return () => splash.remove();
}

async function boot() {
  const done = bootSplash();
  try {
    /* Reads must not begin until the store is hydrated, or the first render
       would show an empty profile and then flicker into the real data. */
    await store.hydrate();
  } catch (err) {
    console.error('Could not open local storage:', err);
  }
  done();

  applyMotionPreference();
  window.addEventListener('gym:settings', applyMotionPreference);

  buildShell();
  mountTimerFab();
  window.addEventListener('hashchange', render);
  render();
  registerSW();

  /* Ask the browser to keep this data out of automatic eviction. Best-effort:
     it is a no-op where unsupported, and only prompts once. */
  requestPersistence();

  /* A pending write must not be lost to a backgrounded tab or a closed app. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.flushNow();
  });
  window.addEventListener('pagehide', () => store.flushNow());
}

boot();
