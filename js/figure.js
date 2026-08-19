/* figure.js — Forward-kinematics stick-figure engine.
 *
 * Every exercise visual is generated, not downloaded: a pose is a small set of
 * joint ANGLES, and the renderer solves the limb positions. Animating between a
 * START pose and a FINISH pose therefore interpolates rotation, which produces
 * anatomically plausible arcs instead of points sliding in straight lines.
 *
 * Retained-mode rendering: the node list has a stable shape across frames, so
 * nodes are created once and only changed attributes are written afterwards.
 */

export const VB = { w: 260, h: 210 };

/* Segment lengths, in viewBox units. Roughly 7.5-head proportions. */
const SEG = {
  torso: 50, neckLen: 9, headR: 10.5,
  upper: 27, fore: 26,
  thigh: 34, shin: 33, foot: 14,
  shoulderW: 15, hipW: 10
};

const RAD = Math.PI / 180;
const pt = (from, ang, len) => [from[0] + len * Math.cos(ang * RAD), from[1] - len * Math.sin(ang * RAD)];
const add = (p, dx, dy) => [p[0] + dx, p[1] + dy];
const lerp = (a, b, t) => a + (b - a) * t;
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/* Two-bone IK. Returns the two segment angles that put the chain end on
 * `target`. `bend` picks which way the middle joint breaks (+1 / -1).
 * Used wherever the hands or feet are anchored to the world — a squat pivots
 * around planted feet, a pull-up around a fixed bar — so the contact point must
 * not drift while the body moves. */
function ik(root, target, L1, L2, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1];
  const d = Math.min(Math.hypot(dx, dy), (L1 + L2) * 0.999) || 0.001;
  const base = Math.atan2(-dy, dx) / RAD;
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const a = Math.acos(Math.min(1, Math.max(-1, cosA))) / RAD;
  const first = base + bend * a;
  const joint = pt(root, first, L1);
  const second = Math.atan2(-(target[1] - joint[1]), target[0] - joint[0]) / RAD;
  return [first, second];
}

/* ---------- pose interpolation ---------- */

/** Blend two pose descriptors. Numbers and [x,y] anchors lerp; anything else snaps at the midpoint. */
export function lerpPose(a, b, t) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k], vb = b[k];
    if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
    else if (Array.isArray(va) && Array.isArray(vb)) out[k] = va.map((v, i) => lerp(v, vb[i], t));
    else out[k] = (t < 0.5 ? va : vb) ?? va ?? vb;
  }
  return out;
}

/* ---------- kinematics ---------- */

/* A pose for the side view is authored as angles in degrees, where 0 points
 * right and 90 points straight up. `f` suffixed angles drive the far-side limb;
 * they default to the near limb so a symmetric movement needs no extra data. */
function solveSide(p) {
  const hip = p.hip;
  const neck = pt(hip, p.torso, SEG.torso);
  const headBase = pt(neck, p.torso + (p.headTilt || 0), SEG.neckLen);
  const head = pt(headBase, p.torso + (p.headTilt || 0), SEG.headR * 0.75);

  const shoulder = neck;
  /* `handAt` anchors the hand to the world (bar, handle, floor) and solves back. */
  let uAng = p.upper, fAng = p.fore;
  if (p.handAt) [uAng, fAng] = ik(shoulder, p.handAt, SEG.upper, SEG.fore, p.elbowBend ?? -1);
  const elbow = pt(shoulder, uAng, SEG.upper * (p.upperScale || 1));
  const wrist = p.handAt || pt(elbow, fAng, SEG.fore * (p.foreScale || 1));

  /* `footAt` plants the foot so the hip can travel without the foot sliding. */
  let tAng = p.thigh, sAng = p.shin;
  if (p.footAt) [tAng, sAng] = ik(hip, p.footAt, SEG.thigh, SEG.shin, p.kneeBend ?? 1);
  const knee = pt(hip, tAng, SEG.thigh);
  const ankle = p.footAt || pt(knee, sAng, SEG.shin);
  const toe = pt(ankle, p.foot ?? 0, SEG.foot);

  /* Far limbs are drawn from an offset origin so the near limb stays readable. */
  const dx = p.depth ?? -7, dy = 3;
  const shoulderF = add(shoulder, dx, dy);
  const handF = p.handAtF || (p.handAt ? add(p.handAt, dx, dy) : null);
  let uF = p.upperF ?? uAng, fF = p.foreF ?? fAng;
  if (handF && (p.upperF === undefined)) [uF, fF] = ik(shoulderF, handF, SEG.upper, SEG.fore, p.elbowBend ?? -1);
  const elbowF = pt(shoulderF, uF, SEG.upper * (p.upperScale || 1));
  const wristF = handF && (p.upperF === undefined) ? handF : pt(elbowF, fF, SEG.fore * (p.foreScale || 1));
  const hipF = add(hip, dx, dy);
  const footF = p.footAtF || (p.footAt ? add(p.footAt, dx, 0) : null);
  let tF = p.thighF ?? tAng, sF = p.shinF ?? sAng;
  if (footF && (p.thighF === undefined)) [tF, sF] = ik(hipF, footF, SEG.thigh, SEG.shin, p.kneeBend ?? 1);
  const kneeF = pt(hipF, tF, SEG.thigh);
  const ankleF = footF && (p.thighF === undefined) ? footF : pt(kneeF, sF, SEG.shin);
  const toeF = pt(ankleF, p.footF ?? p.foot ?? 0, SEG.foot);

  return {
    view: 'side', hip, neck, head, headBase, shoulder, elbow, wrist, knee, ankle, toe,
    shoulderF, elbowF, wristF, hipF, kneeF, ankleF, toeF,
    hands: [wrist, wristF], feet: [ankle, ankleF]
  };
}

/* Front view: the right side is authored and the left is mirrored, unless the
 * movement is genuinely asymmetric (alternating curls), which sets `*L` angles. */
function solveFront(p) {
  const hip = p.hip;
  const torsoLen = SEG.torso * (p.torsoScale || 1);
  const lean = p.lean || 0;
  const neck = pt(hip, 90 + lean, torsoLen);
  const headBase = pt(neck, 90 + lean, SEG.neckLen);
  const head = pt(headBase, 90 + lean, SEG.headR * 0.75);

  const sw = SEG.shoulderW * (p.shoulderScale || 1);
  const shoulderR = add(neck, sw, 2), shoulderL = add(neck, -sw, 2);
  const hipR = add(hip, SEG.hipW, 0), hipL = add(hip, -SEG.hipW, 0);

  const uR = p.upper, fR = p.fore;
  const uL = p.upperL ?? 180 - p.upper, fL = p.foreL ?? 180 - p.fore;

  const us = SEG.upper * (p.upperScale || 1), fs = SEG.fore * (p.foreScale || 1);
  const elbowR = pt(shoulderR, uR, us), wristR = pt(elbowR, fR, fs);
  const elbowL = pt(shoulderL, uL, us), wristL = pt(elbowL, fL, fs);

  const stance = p.stance ?? 0;
  const kneeR = pt(hipR, p.thigh ?? -90 + stance, SEG.thigh);
  const ankleR = pt(kneeR, p.shin ?? -90, SEG.shin);
  const kneeL = pt(hipL, p.thighL ?? -90 - stance, SEG.thigh);
  const ankleL = pt(kneeL, p.shinL ?? -90, SEG.shin);

  return {
    view: 'front', hip, neck, head, headBase,
    shoulderR, shoulderL, elbowR, elbowL, wristR, wristL,
    hipR, hipL, kneeR, kneeL, ankleR, ankleL,
    shoulder: shoulderR, elbow: elbowR, wrist: wristR,
    hands: [wristR, wristL], feet: [ankleR, ankleL]
  };
}

export function solve(pose) {
  return (pose.view === 'front' ? solveFront : solveSide)(pose);
}

/* ---------- node list helpers ---------- */

const n = (tag, attrs, cls) => ({ tag, attrs, cls });
const line = (a, b, cls, w) => n('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-width': w }, cls);
const circ = (c, r, cls) => n('circle', { cx: c[0], cy: c[1], r }, cls);
const rect = (x, y, w, h, cls, rx = 3) => n('rect', { x, y, width: w, height: h, rx }, cls);

/** Curved arrow between two points; `bow` bends it, sign picks the side. */
function arrow(a, b, bow = 0.28, cls = 'fx-arrow') {
  const m = mid(a, b);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const c = [m[0] - dy * bow, m[1] + dx * bow];
  return n('path', { d: `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`, 'marker-end': 'url(#fx-head)' }, cls);
}

/* ---------- equipment props ---------- */
/* Each prop is a function (points, options, phase) -> node list. Props that read
 * `P` follow the body; props that ignore it are static gym furniture. */

const PLATE_R = 13;

const PROPS = {
  floor: (P, o) => [n('line', { x1: 0, y1: o.y ?? 190, x2: VB.w, y2: o.y ?? 190, 'stroke-width': 2 }, 'fx-floor')],

  /* Bench drawn at an angle; `y` is the seat end, `len` the pad length. */
  bench: (P, o) => {
    const a = o.angle ?? 0, base = o.at ?? [70, 150], len = o.len ?? 110;
    const far = pt(base, a, len);
    const out = [n('line', { x1: base[0], y1: base[1], x2: far[0], y2: far[1], 'stroke-width': 9 }, 'fx-pad')];
    out.push(line([base[0], base[1] + 2], [base[0], (o.floor ?? 190)], 'fx-frame', 5));
    out.push(line([far[0], far[1] + 2], [far[0], (o.floor ?? 190)], 'fx-frame', 5));
    return out;
  },

  /* Vertical/angled machine upright + optional weight stack. */
  frame: (P, o) => {
    const a = o.a, b = o.b;
    return [line(a, b, 'fx-frame', o.w ?? 6)];
  },

  stack: (P, o) => {
    const x = o.x, y = o.y ?? 70, h = o.h ?? 70, w = o.w ?? 22;
    const out = [rect(x - w / 2, y, w, h, 'fx-frame-fill')];
    for (let i = 0; i < 4; i++) out.push(line([x - w / 2 + 2, y + 10 + i * 14], [x + w / 2 - 2, y + 10 + i * 14], 'fx-frame', 2));
    return out;
  },

  /* Barbell seen end-on (side view) — a plate at each hand. */
  plate: (P, o) => {
    const h = (o.at && Array.isArray(P[o.at])) ? P[o.at] : P.hands[0];
    const c = o.offset ? add(h, o.offset[0], o.offset[1]) : h;
    const r = o.r ?? PLATE_R;
    return [circ(c, r, 'fx-plate'), circ(c, r * 0.38, 'fx-plate-hub')];
  },

  /* Barbell seen across (front view) — a bar through both hands with plates. */
  bar: (P, o) => {
    const a = P.hands[1], b = P.hands[0];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, ext = o.ext ?? 26;
    const A = [a[0] - ux * ext, a[1] - uy * ext], B = [b[0] + ux * ext, b[1] + uy * ext];
    return [
      line(A, B, 'fx-bar', 4),
      n('ellipse', { cx: A[0], cy: A[1], rx: 4, ry: 13, transform: `rotate(${Math.atan2(dy, dx) / RAD} ${A[0]} ${A[1]})` }, 'fx-plate'),
      n('ellipse', { cx: B[0], cy: B[1], rx: 4, ry: 13, transform: `rotate(${Math.atan2(dy, dx) / RAD} ${B[0]} ${B[1]})` }, 'fx-plate')
    ];
  },

  /* Dumbbell at one or both hands. `single` shows only the near hand. */
  dumbbell: (P, o) => {
    const hands = o.single ? [P.hands[0]] : P.hands;
    const out = [];
    for (const h of hands) {
      if (P.view === 'front' || o.across) {
        out.push(rect(h[0] - 4, h[1] - 11, 8, 22, 'fx-plate', 2));
      } else {
        out.push(circ(h, 9, 'fx-plate'), circ(h, 3.4, 'fx-plate-hub'));
      }
    }
    return out;
  },

  /* Cable: pulley box at a fixed anchor, cable to the working hand, then a handle. */
  cable: (P, o) => {
    const anchor = o.from;
    const hand = o.to === 'far' ? P.hands[1] : P.hands[0];
    const target = o.offset ? add(hand, o.offset[0], o.offset[1]) : hand;
    const out = [
      rect(anchor[0] - 9, anchor[1] - 9, 18, 18, 'fx-frame-fill'),
      circ(anchor, 5, 'fx-pulley'),
      line(anchor, target, 'fx-cable', 2)
    ];
    if (o.handle === 'rope') {
      const d = Math.atan2(target[1] - anchor[1], target[0] - anchor[0]);
      out.push(line(target, [target[0] + Math.cos(d - 0.5) * 17, target[1] + Math.sin(d - 0.5) * 17], 'fx-cable', 3));
      out.push(line(target, [target[0] + Math.cos(d + 0.5) * 17, target[1] + Math.sin(d + 0.5) * 17], 'fx-cable', 3));
    } else if (o.handle === 'bar') {
      out.push(circ(target, 8, 'fx-plate'));
    } else {
      out.push(rect(target[0] - 6, target[1] - 4, 12, 8, 'fx-plate', 3));
    }
    return out;
  },

  /* Machine handle/lever that tracks the hands (chest press, pec deck, row). */
  handles: (P, o) => {
    const out = [];
    for (const h of (o.single ? [P.hands[0]] : P.hands)) out.push(circ(h, 7, 'fx-plate'), circ(h, 2.6, 'fx-plate-hub'));
    return out;
  },

  /* Foot platform / sled that tracks the feet (leg press, hack squat, calf). */
  platform: (P, o) => {
    const f = P.feet[0];
    const a = o.angle ?? 90;
    const A = pt(f, a, o.len ?? 26), B = pt(f, a + 180, o.len ?? 26);
    return [line(A, B, 'fx-pad', 8)];
  },

  /* Static block/step (calf raises) or box. */
  block: (P, o) => [rect(o.x, o.y, o.w ?? 40, o.h ?? 14, 'fx-frame-fill', 2)],

  /* Ankle/thigh pad that tracks a joint (leg extension, leg curl, preacher pad). */
  pad: (P, o) => {
    const j = P[o.at] || P.hands[0];
    const c = o.offset ? add(j, o.offset[0], o.offset[1]) : j;
    return [rect(c[0] - (o.w ?? 9), c[1] - (o.h ?? 7), (o.w ?? 9) * 2, (o.h ?? 7) * 2, 'fx-pad-fill', 4)];
  },

  /* Fixed pad the body rests against (preacher bench, chest support, seat back). */
  support: (P, o) => {
    const a = o.angle ?? 0, base = o.at, len = o.len ?? 60;
    const far = pt(base, a, len);
    return [n('line', { x1: base[0], y1: base[1], x2: far[0], y2: far[1], 'stroke-width': 9 }, 'fx-pad')];
  },

  /* Fixed overhead bar (pull-ups) or dip bars. */
  fixedBar: (P, o) => [circ(o.at, 6, 'fx-plate'), circ(o.at, 2, 'fx-plate-hub')],

  rig: (P, o) => {
    const out = [];
    for (const seg of o.segs) out.push(line(seg[0], seg[1], 'fx-frame', o.w ?? 6));
    return out;
  }
};

/* ---------- full frame build ---------- */

function bodyNodes(P) {
  const out = [];
  if (P.view === 'front') {
    /* far-side limbs first so the near side overlaps them */
    out.push(line(P.shoulderL, P.elbowL, 'fx-limb', 7), line(P.elbowL, P.wristL, 'fx-limb', 6.4));
    out.push(line(P.hipL, P.kneeL, 'fx-limb', 8), line(P.kneeL, P.ankleL, 'fx-limb', 7));
    out.push(line(P.hipR, P.kneeR, 'fx-limb', 8), line(P.kneeR, P.ankleR, 'fx-limb', 7));
    out.push(n('path', {
      d: `M ${P.shoulderL[0]} ${P.shoulderL[1]} L ${P.shoulderR[0]} ${P.shoulderR[1]} L ${P.hipR[0]} ${P.hipR[1]} L ${P.hipL[0]} ${P.hipL[1]} Z`
    }, 'fx-torso'));
    out.push(line(P.shoulderR, P.elbowR, 'fx-limb', 7), line(P.elbowR, P.wristR, 'fx-limb', 6.4));
    out.push(line(P.neck, P.headBase, 'fx-limb', 6));
    out.push(circ(P.head, SEG.headR, 'fx-head'));
    for (const j of [P.elbowR, P.elbowL, P.kneeR, P.kneeL]) out.push(circ(j, 2.6, 'fx-joint'));
  } else {
    out.push(line(P.shoulderF, P.elbowF, 'fx-limb fx-far', 6.4), line(P.elbowF, P.wristF, 'fx-limb fx-far', 5.8));
    out.push(line(P.hipF, P.kneeF, 'fx-limb fx-far', 7.4), line(P.kneeF, P.ankleF, 'fx-limb fx-far', 6.4));
    out.push(line(P.ankleF, P.toeF, 'fx-limb fx-far', 5));
    out.push(line(P.hip, P.neck, 'fx-torso-line', 15));
    out.push(line(P.hip, P.knee, 'fx-limb', 8), line(P.knee, P.ankle, 'fx-limb', 7));
    out.push(line(P.ankle, P.toe, 'fx-limb', 5.6));
    out.push(line(P.neck, P.headBase, 'fx-limb', 6));
    out.push(circ(P.head, SEG.headR, 'fx-head'));
    out.push(line(P.shoulder, P.elbow, 'fx-limb', 7), line(P.elbow, P.wrist, 'fx-limb', 6.4));
    for (const j of [P.elbow, P.knee, P.hip]) out.push(circ(j, 2.8, 'fx-joint'));
  }
  return out;
}

/**
 * Build the complete node list for one animation frame.
 * `spec` is an archetype: { view, start, end, props, arrow, ghost }.
 */
export function frameNodes(spec, t) {
  const pose = lerpPose(spec.start, spec.end, t);
  if (spec.view) { pose.view = spec.view; }
  const P = solve(pose);
  const nodes = [];

  /* background furniture (bench, rig, floor) */
  for (const p of spec.props || []) {
    if (!p.fg) nodes.push(...(PROPS[p.type] ? PROPS[p.type](P, p) : []));
  }

  /* the end-position ghost, so a still frame still communicates the range */
  if (spec.ghost !== false) {
    const G = solve(Object.assign({}, spec.end, spec.view ? { view: spec.view } : {}));
    for (const nd of bodyNodes(G)) nodes.push(Object.assign({}, nd, { cls: (nd.cls || '') + ' fx-ghost' }));
  }

  nodes.push(...bodyNodes(P));

  /* foreground equipment (held implements) */
  for (const p of spec.props || []) {
    if (p.fg) nodes.push(...(PROPS[p.type] ? PROPS[p.type](P, p) : []));
  }

  /* range-of-motion arrow, drawn between the two positions of the working joint */
  if (spec.arrow) {
    const key = spec.arrow.joint || 'wrist';
    const A = solve(Object.assign({}, spec.start, spec.view ? { view: spec.view } : {}));
    const B = solve(Object.assign({}, spec.end, spec.view ? { view: spec.view } : {}));
    const from = spec.arrow.at ? spec.arrow.at : (Array.isArray(A[key]) ? A[key] : A.hands[0]);
    const to = spec.arrow.to ? spec.arrow.to : (Array.isArray(B[key]) ? B[key] : B.hands[0]);
    const off = spec.arrow.offset || [0, 0];
    nodes.push(arrow(add(from, off[0], off[1]), add(to, off[0], off[1]), spec.arrow.bow ?? 0.28));
  }
  return nodes;
}

/* ---------- retained-mode painter ---------- */

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createStage(svg) {
  svg.setAttribute('viewBox', `0 0 ${VB.w} ${VB.h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.innerHTML =
    `<defs><marker id="fx-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">` +
    `<path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>`;
  const layer = document.createElementNS(SVG_NS, 'g');
  svg.appendChild(layer);
  let cache = [];

  return function paint(nodes) {
    /* create/replace only when the node shape actually changes */
    for (let i = 0; i < nodes.length; i++) {
      const spec = nodes[i];
      let el = cache[i];
      if (!el || el.tagName !== spec.tag) {
        const fresh = document.createElementNS(SVG_NS, spec.tag);
        if (el) layer.replaceChild(fresh, el); else layer.appendChild(fresh);
        cache[i] = el = fresh;
        el.__cls = null;
      }
      const cls = spec.cls || '';
      if (el.__cls !== cls) { el.setAttribute('class', cls); el.__cls = cls; }
      for (const k in spec.attrs) {
        const v = spec.attrs[k];
        const s = typeof v === 'number' ? (Math.round(v * 100) / 100) : v;
        if (el.__a !== undefined && el.__a[k] === s) continue;
        el.setAttribute(k, s);
        (el.__a || (el.__a = {}))[k] = s;
      }
    }
    while (cache.length > nodes.length) layer.removeChild(cache.pop());
  };
}

/* Eased ping-pong drive: hold at start, move, hold at finish, return. */
export function phaseOf(t, spec) {
  if (t < 0.04) return spec.phases?.[0] || 'START';
  if (t > 0.96) return spec.phases?.[2] || 'FINISH';
  return spec.phases?.[1] || 'MOVE';
}

const easeInOut = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

/**
 * Animate an archetype into an <svg>. Returns a controller.
 * Respects prefers-reduced-motion by holding a static, readable mid/end frame.
 */
export function animate(svg, spec, opts = {}) {
  const paint = createStage(svg);
  const period = opts.period || 3200;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, running = false, t0 = 0, manual = null, onPhase = opts.onPhase;

  function draw(t) {
    paint(frameNodes(spec, t));
    if (onPhase) onPhase(phaseOf(t, spec), t);
  }

  function tick(now) {
    if (!running) return;
    if (!t0) t0 = now;
    const cycle = ((now - t0) % period) / period;
    /* 0 -> 1 -> 0 with brief holds at each end */
    const raw = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
    draw(easeInOut(Math.min(1, Math.max(0, (raw - 0.06) / 0.88))));
    raf = requestAnimationFrame(tick);
  }

  const api = {
    play() { if (reduced) { draw(0.5); return api; } running = true; t0 = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); return api; },
    pause() { running = false; cancelAnimationFrame(raf); return api; },
    seek(t) { manual = t; running = false; cancelAnimationFrame(raf); draw(t); return api; },
    get playing() { return running; },
    reduced,
    destroy() { running = false; cancelAnimationFrame(raf); }
  };
  reduced ? draw(0.5) : api.play();
  return api;
}
