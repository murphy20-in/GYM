/* anatomy3d.js — interactive 3D muscle map.
 *
 * The body is generated from primitives rather than loaded from a model file.
 * That is deliberate: a downloadable human mesh carries licensing that cannot be
 * verified, whereas geometry built in code ships nothing, weighs a few KB, and
 * gives every muscle its own mesh — so highlighting is a material swap rather
 * than texture work. It also matches how the rest of this app draws bodies
 * (figure.js generates every exercise animation the same way).
 *
 * three.js is imported dynamically so it never touches first paint. If WebGL is
 * unavailable the caller falls back to the flat SVG muscle map.
 */

import { MUSCLE_NAMES } from './muscles.js';

const COLOUR = {
  idle: 0x2a2020,
  primary: 0xff1a1a,
  secondary: 0x8f2020,
  neutral: 0x1c1616,   /* head, hands, feet — not muscles */
  selected: 0xff6a4d
};

let THREE = null;

/** Load three.js once, on demand. */
async function loadThree() {
  if (!THREE) THREE = await import('./vendor/three.module.min.js');
  return THREE;
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

/* ---------- body construction ---------- */

/**
 * Every part: [muscleKey|null, geometry maker, position, rotation, scale]
 * Mirrored parts are declared once with `mirror: true`.
 */
function buildBody(T) {
  const parts = [];
  const add = (muscle, mesh) => { mesh.userData.muscle = muscle; parts.push(mesh); };

  const cap = (r, len) => new T.CapsuleGeometry(r, len, 4, 12);
  const box = (w, h, d, seg = 2) => new T.BoxGeometry(w, h, d, seg, seg, seg);
  const sph = r => new T.SphereGeometry(r, 16, 12);

  const mat = key => new T.MeshStandardMaterial({
    color: key ? COLOUR.idle : COLOUR.neutral,
    roughness: 0.72, metalness: 0.08
  });

  const put = (muscle, geo, [x, y, z], rot = [0, 0, 0], mirror = false) => {
    const make = sx => {
      const m = new T.Mesh(geo, mat(muscle));
      m.position.set(x * sx, y, z);
      m.rotation.set(rot[0], rot[1], rot[2] * sx);
      add(muscle, m);
    };
    make(1);
    if (mirror) make(-1);
  };

  /* --- head and neck --- */
  put(null, sph(0.62), [0, 7.15, 0]);
  put('traps', cap(0.3, 0.5), [0, 6.4, -0.05]);

  /* --- torso --- */
  put('chest', box(1.28, 1.05, 0.62), [0.66, 5.5, 0.5], [0, 0, 0.06], true);
  put('abs', box(1.5, 1.85, 0.55), [0, 4.05, 0.42]);
  put('lats', box(0.62, 1.9, 0.95), [1.18, 4.9, -0.15], [0, 0, 0.14], true);
  put('traps', box(1.9, 1.25, 0.5), [0, 5.85, -0.5]);
  put('lowerBack', box(1.3, 1.3, 0.45), [0, 4.1, -0.45]);

  /* --- shoulders: three heads, each its own mesh --- */
  put('frontDelt', sph(0.46), [1.52, 5.95, 0.34], [0, 0, 0], true);
  put('sideDelt', sph(0.5), [1.78, 5.95, 0], [0, 0, 0], true);
  put('rearDelt', sph(0.44), [1.52, 5.95, -0.36], [0, 0, 0], true);

  /* --- arms --- */
  put('biceps', cap(0.32, 1.15), [1.9, 4.9, 0.2], [0, 0, 0.1], true);
  put('triceps', cap(0.32, 1.2), [1.9, 4.9, -0.22], [0, 0, 0.1], true);
  put('forearms', cap(0.27, 1.35), [2.12, 3.25, 0], [0, 0, 0.07], true);
  put(null, sph(0.28), [2.24, 2.35, 0], [0, 0, 0], true);

  /* --- hips and legs --- */
  put('glutes', sph(0.68), [0.6, 2.85, -0.42], [0, 0, 0], true);
  put('quads', cap(0.5, 1.95), [0.64, 1.7, 0.16], [0, 0, 0.03], true);
  put('hamstrings', cap(0.44, 1.9), [0.64, 1.7, -0.3], [0, 0, 0.03], true);
  put('calves', cap(0.36, 1.5), [0.66, 0.0, -0.12], [0, 0, 0.02], true);
  put(null, box(0.52, 0.22, 0.95), [0.66, -0.95, 0.16], [0, 0, 0], true);

  return parts;
}

/**
 * Mount an interactive body.
 * @returns {Promise<null|{highlight,setVolumes,reset,face,destroy,element}>}
 *          null when WebGL is unavailable, so the caller can fall back.
 */
export async function mountAnatomy(container, opts = {}) {
  if (!webglAvailable()) return null;

  const T = await loadThree();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.reduceMotion === '1';

  const width = () => container.clientWidth || 320;
  const height = () => opts.height || 340;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, width() / height(), 0.1, 100);
  const HOME = { radius: 13.5, theta: 0, phi: 1.5, target: 3.1 };
  const view = { ...HOME };

  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width(), height(), false);
  renderer.domElement.style.cssText = 'width:100%;height:auto;display:block;touch-action:none;cursor:grab';
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D muscle map. Drag to rotate.');
  container.appendChild(renderer.domElement);

  /* red key light so the body sits in the app's palette without tinting the mesh */
  scene.add(new T.AmbientLight(0xffffff, 0.55));
  const key = new T.DirectionalLight(0xff6a5a, 1.15); key.position.set(4, 8, 6); scene.add(key);
  const rim = new T.DirectionalLight(0x6688ff, 0.35); rim.position.set(-5, 4, -6); scene.add(rim);

  const root = new T.Group();
  const parts = buildBody(T);
  for (const p of parts) root.add(p);
  scene.add(root);

  const byMuscle = {};
  for (const p of parts) {
    if (!p.userData.muscle) continue;
    (byMuscle[p.userData.muscle] || (byMuscle[p.userData.muscle] = [])).push(p);
  }

  function place() {
    camera.position.set(
      view.radius * Math.sin(view.phi) * Math.sin(view.theta),
      view.target + view.radius * Math.cos(view.phi),
      view.radius * Math.sin(view.phi) * Math.cos(view.theta)
    );
    camera.lookAt(0, view.target, 0);
  }

  let needsRender = true;
  const invalidate = () => { needsRender = true; };

  function frame() {
    if (raf === 0) return;
    if (spin && !reduced) { view.theta += 0.0035; invalidate(); }
    if (needsRender) { place(); renderer.render(scene, camera); needsRender = false; }
    raf = requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  let dragging = false, lastX = 0, lastY = 0, spin = !reduced && opts.autoRotate !== false;
  const dom = renderer.domElement;

  const onDown = e => {
    dragging = true; spin = false;
    const t = e.touches?.[0] || e;
    lastX = t.clientX; lastY = t.clientY;
    dom.style.cursor = 'grabbing';
    dom.setPointerCapture?.(e.pointerId);
  };
  const onMove = e => {
    if (!dragging) return;
    const t = e.touches?.[0] || e;
    view.theta -= (t.clientX - lastX) * 0.01;
    view.phi = Math.max(0.35, Math.min(2.65, view.phi - (t.clientY - lastY) * 0.008));
    lastX = t.clientX; lastY = t.clientY;
    invalidate();
  };
  const onUp = e => { dragging = false; dom.style.cursor = 'grab'; dom.releasePointerCapture?.(e?.pointerId); };
  const onWheel = e => {
    e.preventDefault();
    view.radius = Math.max(8, Math.min(26, view.radius + e.deltaY * 0.02));
    invalidate();
  };

  dom.addEventListener('pointerdown', onDown);
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerup', onUp);
  dom.addEventListener('pointercancel', onUp);
  dom.addEventListener('wheel', onWheel, { passive: false });

  /* tap to select a muscle */
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  let downAt = null;
  dom.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
  dom.addEventListener('pointerup', e => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 6 || !opts.onSelect) return;      /* a drag, not a tap */
    const r = dom.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(parts, false)[0];
    const muscle = hit?.object?.userData?.muscle || null;
    if (muscle) opts.onSelect(muscle, MUSCLE_NAMES[muscle] || muscle);
  });

  let raf = requestAnimationFrame(frame);

  /* keep the canvas crisp when the column resizes */
  const ro = new ResizeObserver(() => {
    renderer.setSize(width(), height(), false);
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
    invalidate();
  });
  ro.observe(container);

  /* ---------- public surface ---------- */

  function paintColours(fn) {
    for (const [muscle, meshes] of Object.entries(byMuscle)) {
      const colour = fn(muscle);
      for (const m of meshes) m.material.color.setHex(colour);
    }
    invalidate();
  }

  const api = {
    element: dom,

    /** Light the muscles an exercise trains. */
    highlight(primary = [], secondary = [], selected = null) {
      paintColours(m => selected === m ? COLOUR.selected
        : primary.includes(m) ? COLOUR.primary
        : secondary.includes(m) ? COLOUR.secondary
        : COLOUR.idle);
    },

    /**
     * Shade by training volume. Muscles with no logged work stay dark rather
     * than being given a floor colour that implies work that did not happen.
     */
    setVolumes(volumes) {
      const max = Math.max(1, ...Object.values(volumes || {}).map(v => v.sets || 0));
      paintColours(m => {
        const sets = volumes?.[m]?.sets || 0;
        if (!sets) return COLOUR.idle;
        const t = Math.min(1, sets / max);
        /* dark red -> hot red, so intensity reads without a legend */
        const r = Math.round(90 + t * 165), g = Math.round(18 + t * 8), b = Math.round(18 + t * 8);
        return (r << 16) | (g << 8) | b;
      });
    },

    face(side) {
      view.theta = side === 'back' ? Math.PI : 0;
      spin = false; invalidate();
    },

    reset() { Object.assign(view, HOME); spin = !reduced && opts.autoRotate !== false; invalidate(); },
    toggleSpin() { spin = !spin; invalidate(); return spin; },
    get spinning() { return spin; },

    destroy() {
      cancelAnimationFrame(raf); raf = 0;
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('wheel', onWheel);
      for (const p of parts) { p.geometry.dispose(); p.material.dispose(); }
      renderer.dispose();
      dom.remove();
    }
  };

  api.highlight(opts.primary || [], opts.secondary || []);
  return api;
}
