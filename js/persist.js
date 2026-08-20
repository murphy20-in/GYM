/* persist.js — keep local data from being evicted.
 *
 * localStorage survives restarts, redeploys and reboots, but by default it is
 * "best-effort": a browser may discard it under storage pressure, and iOS
 * Safari clears script-writable storage for ordinary websites after 7 days
 * without a visit. The Storage API can upgrade the origin to "persistent",
 * which is exempt from automatic eviction.
 *
 * Adding the app to the home screen is what makes this reliable on iOS.
 */

const KEY_ASKED = 'gym.v1.persistAsked';

/** Ask the browser to make this origin's storage persistent. Safe to call often. */
export async function requestPersistence({ force = false } = {}) {
  if (!navigator.storage?.persist) return { supported: false, persisted: false };

  try {
    if (await navigator.storage.persisted()) return { supported: true, persisted: true };
    /* Only auto-ask once; a repeated prompt on every load would be hostile.
       An explicit request from Settings always goes through. */
    if (!force && localStorage.getItem(KEY_ASKED)) {
      return { supported: true, persisted: false, alreadyAsked: true };
    }
    localStorage.setItem(KEY_ASKED, '1');
    const granted = await navigator.storage.persist();
    return { supported: true, persisted: granted };
  } catch (err) {
    console.warn('Persistent storage request failed:', err);
    return { supported: true, persisted: false, error: String(err) };
  }
}

/** Current durability and space usage, for display in Settings. */
export async function storageStatus() {
  const out = { supported: false, persisted: false, usage: null, quota: null, installed: isInstalled() };
  if (!navigator.storage) return out;
  out.supported = true;
  try {
    if (navigator.storage.persisted) out.persisted = await navigator.storage.persisted();
    if (navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      out.usage = usage ?? null;
      out.quota = quota ?? null;
    }
  } catch { /* reporting is best-effort; never block the settings screen */ }
  return out;
}

/** Running as an installed app (home-screen / standalone) rather than a tab. */
export function isInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export const formatBytes = n => {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

/* ---------- backup reminder ---------- */

const KEY_EXPORT = 'gym.v1.lastExport';

export const markExported = () => localStorage.setItem(KEY_EXPORT, new Date().toISOString());

export function lastExport() {
  const raw = localStorage.getItem(KEY_EXPORT);
  if (!raw) return { never: true, days: null };
  const then = new Date(raw);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  return { never: false, days, date: then };
}
