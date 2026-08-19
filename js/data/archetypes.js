/* archetypes.js — the movement vocabulary.
 *
 * Each archetype is a START pose, a FINISH pose and the equipment around them.
 * Exercises reference an archetype and may override the implement (barbell,
 * dumbbell, rope) or a pose detail, so "Barbell Bench Press" and "Flat Dumbbell
 * Press" share one set of kinematics without duplicating coordinates.
 *
 * Conventions: viewBox is 260 x 210, the floor sits at y = 190, angles are
 * degrees with 0 pointing right and 90 pointing up, and the figure faces right.
 */

const FLOOR = 190;
const floor = { type: 'floor', y: FLOOR };

/* legs of a supine bench position, reused by every flat-bench movement */
const benchLegs = { footAt: [188, 188], kneeBend: 1, foot: 0 };
const benchProps = [
  floor,
  { type: 'bench', angle: 0, at: [76, 152], len: 104, floor: FLOOR },
  { type: 'rig', segs: [[[62, 190], [62, 106]], [[62, 112], [76, 112]]], w: 6 }
];

export const ARCHETYPES = {

  /* ---------------- CHEST ---------------- */

  benchFlat: {
    view: 'side',
    phases: ['BAR AT CHEST', 'PRESS UP', 'LOCKOUT'],
    props: [...benchProps, { type: 'plate', fg: true, r: 15 }],
    arrow: { joint: 'wrist', bow: 0.12 },
    start: { hip: [150, 142], torso: 180, upper: -20, fore: 123, ...benchLegs },
    end:   { hip: [150, 142], torso: 180, upper: 88, fore: 88, ...benchLegs }
  },

  benchClose: {
    view: 'side',
    phases: ['BAR AT LOWER CHEST', 'PRESS', 'LOCKOUT'],
    props: [...benchProps, { type: 'plate', fg: true, r: 15 }],
    arrow: { joint: 'wrist', bow: 0.1 },
    start: { hip: [150, 142], torso: 180, upper: -48, fore: 108, ...benchLegs },
    end:   { hip: [150, 142], torso: 180, upper: 86, fore: 90, ...benchLegs }
  },

  benchIncline: {
    view: 'side',
    phases: ['STRETCHED', 'PRESS UP', 'LOCKOUT'],
    props: [
      floor,
      { type: 'bench', angle: 158, at: [152, 156], len: 78, floor: FLOOR },
      { type: 'bench', angle: -6, at: [152, 158], len: 44, floor: FLOOR },
      { type: 'plate', fg: true, r: 14 }
    ],
    arrow: { joint: 'wrist', bow: 0.14 },
    start: { hip: [150, 148], torso: 158, upper: -15, fore: 125, footAt: [192, 188], kneeBend: 1 },
    end:   { hip: [150, 148], torso: 158, upper: 68, fore: 70, footAt: [192, 188], kneeBend: 1 }
  },

  benchDecline: {
    view: 'side',
    phases: ['BAR AT LOWER CHEST', 'PRESS', 'LOCKOUT'],
    props: [
      floor,
      { type: 'bench', angle: 197, at: [176, 140], len: 104, floor: FLOOR },
      { type: 'plate', fg: true, r: 14 }
    ],
    arrow: { joint: 'wrist', bow: 0.12 },
    start: { hip: [166, 132], torso: 197, upper: -22, fore: 120, footAt: [200, 128], kneeBend: -1 },
    end:   { hip: [166, 132], torso: 197, upper: 82, fore: 84, footAt: [200, 128], kneeBend: -1 }
  },

  machinePress: {
    view: 'side',
    phases: ['HANDLES AT CHEST', 'PRESS FORWARD', 'ARMS EXTENDED'],
    props: [
      floor,
      { type: 'rig', segs: [[[186, 56], [186, 190]], [[186, 104], [160, 104]]], w: 6 },
      { type: 'stack', x: 202, y: 76, h: 84 },
      { type: 'bench', angle: -2, at: [84, 158], len: 52, floor: FLOOR },
      { type: 'support', at: [112, 156], angle: 100, len: 58 },
      { type: 'handles', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.1 },
    start: { hip: [110, 150], torso: 100, upper: -125, fore: 25, footAt: [160, 188], kneeBend: 1 },
    end:   { hip: [110, 150], torso: 100, upper: -6, fore: 4, footAt: [160, 188], kneeBend: 1 }
  },

  machineDecline: {
    view: 'side',
    phases: ['HANDLES AT LOWER CHEST', 'PRESS DOWN + FORWARD', 'EXTENDED'],
    props: [
      floor,
      { type: 'rig', segs: [[[190, 70], [190, 190]], [[190, 128], [162, 122]]], w: 6 },
      { type: 'stack', x: 206, y: 84, h: 76 },
      { type: 'bench', angle: -2, at: [84, 158], len: 52, floor: FLOOR },
      { type: 'support', at: [112, 156], angle: 96, len: 58 },
      { type: 'handles', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.1 },
    start: { hip: [110, 150], torso: 96, upper: -140, fore: 5, footAt: [160, 188], kneeBend: 1 },
    end:   { hip: [110, 150], torso: 96, upper: -26, fore: -18, footAt: [160, 188], kneeBend: 1 }
  },

  cableCrossover: {
    view: 'front',
    phases: ['ARMS HIGH + WIDE', 'SWEEP DOWN + IN', 'HANDS TOGETHER'],
    props: [
      floor,
      { type: 'rig', segs: [[[228, 34], [228, 190]], [[32, 34], [32, 190]]], w: 5 },
      { type: 'cable', from: [224, 40], to: 'near', handle: 'handle', fg: true },
      { type: 'cable', from: [36, 40], to: 'far', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wristR', bow: 0.3 },
    start: { hip: [130, 124], upper: 40, fore: 25, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: -115, fore: -95, upperScale: 0.5, foreScale: 0.5, thigh: -96, thighL: -84 }
  },

  cableFlyLow: {
    view: 'front',
    phases: ['ARMS LOW + WIDE', 'SWEEP UP + IN', 'HANDS TOGETHER HIGH'],
    props: [
      floor,
      { type: 'rig', segs: [[[228, 90], [228, 190]], [[32, 90], [32, 190]]], w: 5 },
      { type: 'cable', from: [224, 174], to: 'near', handle: 'handle', fg: true },
      { type: 'cable', from: [36, 174], to: 'far', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wristR', bow: -0.3 },
    start: { hip: [130, 124], upper: -52, fore: -42, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: 62, fore: 48, upperScale: 0.55, foreScale: 0.5, thigh: -96, thighL: -84 },
  },

  pecDeck: {
    view: 'front',
    phases: ['ARMS OPEN', 'SQUEEZE IN', 'ELBOWS TOGETHER'],
    props: [
      { type: 'block', x: 108, y: 142, w: 44, h: 12 },
      { type: 'rig', segs: [[[130, 148], [130, 190]], [[96, 190], [164, 190]]], w: 5 },
      { type: 'handles', fg: true }
    ],
    arrow: { joint: 'elbowR', bow: 0.3 },
    start: { hip: [130, 122], upper: 2, fore: 88, thigh: -84, thighL: -96 },
    end:   { hip: [130, 122], upper: 110, fore: 88, upperScale: 0.55, thigh: -84, thighL: -96 }
  },

  /* ---------------- TRICEPS ---------------- */

  pushdown: {
    view: 'side',
    phases: ['ELBOWS BENT', 'EXTEND DOWN', 'FULL LOCKOUT'],
    props: [
      floor,
      { type: 'rig', segs: [[[112, 34], [112, 190]]], w: 6 },
      { type: 'stack', x: 94, y: 74, h: 82 },
      { type: 'cable', from: [112, 40], to: 'near', handle: 'rope', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.14 },
    start: { hip: [150, 122], torso: 88, upper: -78, fore: 132, footAt: [156, 188], foot: 180, kneeBend: 1 },
    end:   { hip: [150, 122], torso: 88, upper: -82, fore: -92, footAt: [156, 188], foot: 180, kneeBend: 1 }
  },

  pushdownSingle: {
    view: 'side',
    phases: ['ELBOW BENT', 'EXTEND DOWN', 'LOCKOUT'],
    props: [
      floor,
      { type: 'rig', segs: [[[112, 34], [112, 190]]], w: 6 },
      { type: 'stack', x: 94, y: 74, h: 82 },
      { type: 'cable', from: [112, 40], to: 'near', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.14 },
    start: { hip: [150, 122], torso: 88, upper: -78, fore: 132, upperF: -88, foreF: -92, footAt: [156, 188], foot: 180, kneeBend: 1 },
    end:   { hip: [150, 122], torso: 88, upper: -82, fore: -92, upperF: -88, foreF: -92, footAt: [156, 188], foot: 180, kneeBend: 1 }
  },

  overheadCableExt: {
    view: 'side',
    phases: ['FOREARMS BEHIND HEAD', 'EXTEND', 'ARMS STRAIGHT'],
    props: [
      floor,
      { type: 'rig', segs: [[[58, 40], [58, 190]]], w: 6 },
      { type: 'cable', from: [62, 46], to: 'near', handle: 'rope', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.2 },
    start: { hip: [140, 124], torso: 80, upper: 55, fore: 175, footAt: [152, 188], footAtF: [118, 188], kneeBend: 1 },
    end:   { hip: [140, 124], torso: 80, upper: 58, fore: 50, footAt: [152, 188], footAtF: [118, 188], kneeBend: 1 }
  },

  overheadDbExt: {
    view: 'side',
    phases: ['DUMBBELL BEHIND HEAD', 'EXTEND UP', 'ARMS STRAIGHT'],
    props: [
      floor,
      { type: 'bench', angle: 0, at: [104, 158], len: 52, floor: FLOOR },
      { type: 'support', at: [110, 156], angle: 100, len: 54 },
      { type: 'dumbbell', single: true, across: true, fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.22 },
    start: { hip: [116, 150], torso: 96, upper: 92, fore: 172, footAt: [162, 188], kneeBend: 1 },
    end:   { hip: [116, 150], torso: 96, upper: 92, fore: 88, footAt: [162, 188], kneeBend: 1 }
  },

  skullcrusher: {
    view: 'side',
    phases: ['BAR NEAR FOREHEAD', 'EXTEND', 'ARMS STRAIGHT'],
    props: [...benchProps, { type: 'plate', fg: true, r: 12 }],
    arrow: { joint: 'wrist', bow: 0.24 },
    start: { hip: [150, 142], torso: 180, upper: 88, fore: 168, ...benchLegs },
    end:   { hip: [150, 142], torso: 180, upper: 88, fore: 88, ...benchLegs }
  },

  dip: {
    view: 'side',
    phases: ['ARMS STRAIGHT', 'LOWER', 'BOTTOM POSITION'],
    props: [
      floor,
      { type: 'rig', segs: [[[160, 100], [160, 190]], [[132, 190], [188, 190]]], w: 6 },
      { type: 'fixedBar', at: [152, 100] },
      { type: 'fixedBar', at: [138, 103] }
    ],
    arrow: { joint: 'hip', bow: 0.1 },
    start: { hip: [136, 102], torso: 82, handAt: [152, 100], elbowBend: -1, thigh: -50, shin: -150 },
    end:   { hip: [134, 132], torso: 76, handAt: [152, 100], elbowBend: -1, thigh: -50, shin: -150 }
  },

  /* ---------------- BACK ---------------- */

  deadlift: {
    view: 'side',
    phases: ['BAR ON FLOOR', 'DRIVE UP', 'LOCKOUT'],
    props: [floor, { type: 'plate', fg: true, r: 20 }],
    arrow: { joint: 'wrist', bow: 0.16 },
    start: { hip: [122, 150], torso: 45, upper: -88, fore: -90, footAt: [150, 188], kneeBend: 1, headTilt: -14 },
    end:   { hip: [132, 124], torso: 92, upper: -88, fore: -90, footAt: [150, 188], kneeBend: 1, headTilt: 0 }
  },

  rdl: {
    view: 'side',
    phases: ['STANDING', 'HINGE BACK', 'BAR AT SHIN'],
    props: [floor, { type: 'plate', fg: true, r: 17 }],
    arrow: { joint: 'wrist', bow: 0.16 },
    start: { hip: [132, 124], torso: 92, upper: -88, fore: -90, footAt: [150, 188], kneeBend: 1 },
    end:   { hip: [122, 132], torso: 50, upper: -88, fore: -90, footAt: [150, 188], kneeBend: 1, headTilt: -12 }
  },

  pulldown: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'PULL DOWN', 'BAR AT CHEST'],
    props: [
      floor,
      { type: 'rig', segs: [[[198, 22], [198, 190]], [[198, 26], [138, 26]]], w: 6 },
      { type: 'stack', x: 212, y: 60, h: 92 },
      { type: 'block', x: 86, y: 156, w: 46, h: 12 },
      { type: 'pad', at: 'knee', offset: [0, -15], w: 16, h: 6 },
      { type: 'cable', from: [140, 30], to: 'near', handle: 'bar', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.12 },
    start: { hip: [110, 146], torso: 96, handAt: [142, 66], elbowBend: -1, thigh: -14, shin: -86 },
    end:   { hip: [110, 146], torso: 100, handAt: [128, 104], elbowBend: -1, thigh: -14, shin: -86 }
  },

  pulldownClose: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'PULL TO CHEST', 'ELBOWS AT RIBS'],
    props: [
      floor,
      { type: 'rig', segs: [[[198, 22], [198, 190]], [[198, 26], [138, 26]]], w: 6 },
      { type: 'stack', x: 212, y: 60, h: 92 },
      { type: 'block', x: 86, y: 156, w: 46, h: 12 },
      { type: 'pad', at: 'knee', offset: [0, -15], w: 16, h: 6 },
      { type: 'cable', from: [140, 30], to: 'near', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.12 },
    start: { hip: [110, 146], torso: 96, handAt: [138, 62], elbowBend: -1, thigh: -14, shin: -86 },
    end:   { hip: [110, 146], torso: 102, handAt: [124, 112], elbowBend: -1, thigh: -14, shin: -86 }
  },

  pullup: {
    view: 'side',
    phases: ['DEAD HANG', 'PULL UP', 'CHIN OVER BAR'],
    props: [
      { type: 'rig', segs: [[[58, 32], [202, 32]], [[64, 32], [64, 192]], [[196, 32], [196, 192]]], w: 6 },
      { type: 'fixedBar', at: [130, 32] }
    ],
    arrow: { joint: 'hip', bow: 0.1 },
    start: { hip: [130, 124], torso: 92, handAt: [130, 32], elbowBend: 1, thigh: -100, shin: -125 },
    end:   { hip: [130, 108], torso: 94, handAt: [130, 32], elbowBend: 1, thigh: -100, shin: -125 }
  },

  bentRow: {
    view: 'side',
    phases: ['BAR HANGING', 'ROW TO TORSO', 'ELBOWS BACK'],
    props: [floor, { type: 'plate', fg: true, r: 17 }],
    arrow: { joint: 'wrist', bow: 0.18 },
    start: { hip: [124, 132], torso: 40, upper: -88, fore: -90, footAt: [150, 188], kneeBend: 1, headTilt: -10 },
    end:   { hip: [124, 132], torso: 40, upper: -160, fore: -70, footAt: [150, 188], kneeBend: 1, headTilt: -10 }
  },

  tBarRow: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'ROW', 'HANDLES AT RIBS'],
    props: [
      floor,
      { type: 'rig', segs: [[[214, 186], [150, 158]]], w: 7 },
      { type: 'plate', fg: true, r: 15 }
    ],
    arrow: { joint: 'wrist', bow: 0.18 },
    start: { hip: [122, 130], torso: 38, upper: -86, fore: -88, footAt: [148, 188], kneeBend: 1, headTilt: -8 },
    end:   { hip: [122, 130], torso: 38, upper: -158, fore: -66, footAt: [148, 188], kneeBend: 1, headTilt: -8 }
  },

  oneArmRow: {
    view: 'side',
    phases: ['ARM EXTENDED', 'ROW TO HIP', 'ELBOW HIGH'],
    props: [
      floor,
      { type: 'bench', angle: 0, at: [58, 152], len: 66, floor: FLOOR },
      { type: 'dumbbell', single: true, fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.2 },
    start: { hip: [110, 130], torso: 18, upper: -90, fore: -90, handAtF: [120, 150], footAt: [136, 188], footAtF: [106, 188], kneeBend: 1, headTilt: -6 },
    end:   { hip: [110, 130], torso: 18, upper: -150, fore: -60, handAtF: [120, 150], footAt: [136, 188], footAtF: [106, 188], kneeBend: 1, headTilt: -6 }
  },

  seatedRow: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'PULL TO ABDOMEN', 'SHOULDERS BACK'],
    props: [
      floor,
      { type: 'block', x: 82, y: 160, w: 46, h: 10 },
      { type: 'rig', segs: [[[186, 148], [186, 190]], [[172, 152], [188, 176]]], w: 6 },
      { type: 'stack', x: 202, y: 96, h: 70 },
      { type: 'cable', from: [182, 150], to: 'near', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.12 },
    start: { hip: [104, 150], torso: 80, handAt: [148, 128], elbowBend: -1, thigh: -20, shin: -25 },
    end:   { hip: [104, 150], torso: 100, handAt: [116, 132], elbowBend: -1, thigh: -20, shin: -25 }
  },

  chestSupportedRow: {
    view: 'side',
    phases: ['ARMS HANGING', 'ROW', 'ELBOWS BACK'],
    props: [
      floor,
      { type: 'support', at: [96, 174], angle: 32, len: 88 },
      { type: 'rig', segs: [[[96, 174], [96, 190]], [[170, 130], [170, 190]]], w: 6 },
      { type: 'dumbbell', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.18 },
    start: { hip: [104, 164], torso: 32, upper: -88, fore: -90, footAt: [76, 186], kneeBend: 1, headTilt: -6 },
    end:   { hip: [104, 164], torso: 32, upper: -166, fore: -88, footAt: [76, 186], kneeBend: 1, headTilt: -6 }
  },

  straightArmPulldown: {
    view: 'side',
    phases: ['ARMS FORWARD', 'SWEEP DOWN', 'BAR AT THIGHS'],
    props: [
      floor,
      { type: 'rig', segs: [[[200, 24], [200, 190]], [[200, 28], [180, 28]]], w: 6 },
      { type: 'cable', from: [182, 34], to: 'near', handle: 'bar', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.24 },
    start: { hip: [124, 124], torso: 78, handAt: [176, 66], elbowBend: -1, footAt: [142, 188], kneeBend: 1 },
    end:   { hip: [124, 124], torso: 72, handAt: [158, 124], elbowBend: -1, footAt: [142, 188], kneeBend: 1 }
  },

  /* ---------------- BICEPS ---------------- */

  curlStanding: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'CURL UP', 'FULL CONTRACTION'],
    props: [floor, { type: 'plate', fg: true, r: 13 }],
    arrow: { joint: 'wrist', bow: -0.3 },
    start: { hip: [130, 122], torso: 94, upper: -88, fore: -92, footAt: [140, 188], kneeBend: 1 },
    end:   { hip: [130, 122], torso: 94, upper: -80, fore: 40, footAt: [140, 188], kneeBend: 1 }
  },

  curlDumbbell: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'CURL UP', 'CONTRACTED'],
    props: [floor, { type: 'dumbbell', fg: true }],
    arrow: { joint: 'wrist', bow: -0.3 },
    start: { hip: [130, 122], torso: 94, upper: -88, fore: -92, footAt: [140, 188], kneeBend: 1 },
    end:   { hip: [130, 122], torso: 94, upper: -80, fore: 40, footAt: [140, 188], kneeBend: 1 }
  },

  curlAlternating: {
    view: 'side',
    phases: ['BOTH ARMS DOWN', 'CURL ONE ARM', 'ONE ARM CONTRACTED'],
    props: [floor, { type: 'dumbbell', fg: true }],
    arrow: { joint: 'wrist', bow: -0.3 },
    start: { hip: [130, 122], torso: 94, upper: -88, fore: -92, upperF: -88, foreF: -92, footAt: [140, 188], kneeBend: 1 },
    end:   { hip: [130, 122], torso: 94, upper: -80, fore: 40, upperF: -88, foreF: -92, footAt: [140, 188], kneeBend: 1 }
  },

  curlCable: {
    view: 'side',
    phases: ['ARMS EXTENDED', 'CURL UP', 'CONTRACTED'],
    props: [
      floor,
      { type: 'rig', segs: [[[210, 60], [210, 190]]], w: 6 },
      { type: 'stack', x: 224, y: 84, h: 76 },
      { type: 'cable', from: [206, 172], to: 'near', handle: 'bar', fg: true }
    ],
    arrow: { joint: 'wrist', bow: -0.3 },
    start: { hip: [124, 122], torso: 94, upper: -86, fore: -88, footAt: [134, 188], kneeBend: 1 },
    end:   { hip: [124, 122], torso: 94, upper: -78, fore: 42, footAt: [134, 188], kneeBend: 1 }
  },

  curlIncline: {
    view: 'side',
    phases: ['ARMS HANGING BACK', 'CURL UP', 'CONTRACTED'],
    props: [
      floor,
      { type: 'bench', angle: 118, at: [142, 160], len: 76, floor: FLOOR },
      { type: 'bench', angle: -6, at: [142, 160], len: 42, floor: FLOOR },
      { type: 'dumbbell', fg: true }
    ],
    arrow: { joint: 'wrist', bow: -0.28 },
    start: { hip: [140, 152], torso: 118, upper: -95, fore: -92, footAt: [186, 188], kneeBend: 1 },
    end:   { hip: [140, 152], torso: 118, upper: -88, fore: 45, footAt: [186, 188], kneeBend: 1 }
  },

  preacherCurl: {
    view: 'side',
    phases: ['ARMS EXTENDED ON PAD', 'CURL UP', 'CONTRACTED'],
    props: [
      floor,
      { type: 'block', x: 92, y: 148, w: 46, h: 10 },
      { type: 'support', at: [116, 98], angle: -40, len: 62 },
      { type: 'rig', segs: [[[150, 138], [150, 190]], [[104, 158], [104, 190]]], w: 6 },
      { type: 'plate', fg: true, r: 12 }
    ],
    arrow: { joint: 'wrist', bow: -0.26 },
    start: { hip: [116, 140], torso: 92, upper: -42, fore: -75, thigh: -20, shin: -85 },
    end:   { hip: [116, 140], torso: 92, upper: -42, fore: 62, thigh: -20, shin: -85 }
  },

  spiderCurl: {
    view: 'side',
    phases: ['ARMS HANGING', 'CURL UP', 'CONTRACTED'],
    props: [
      floor,
      { type: 'support', at: [102, 168], angle: 55, len: 84 },
      { type: 'rig', segs: [[[102, 168], [102, 190]], [[150, 100], [150, 190]]], w: 6 },
      { type: 'dumbbell', fg: true }
    ],
    arrow: { joint: 'wrist', bow: -0.26 },
    start: { hip: [110, 150], torso: 55, upper: -90, fore: -90, footAt: [72, 188], kneeBend: 1, headTilt: -8 },
    end:   { hip: [110, 150], torso: 55, upper: -88, fore: 60, footAt: [72, 188], kneeBend: 1, headTilt: -8 }
  },

  bayesianCurl: {
    view: 'side',
    phases: ['ARM BEHIND BODY', 'CURL UP', 'CONTRACTED'],
    props: [
      floor,
      { type: 'rig', segs: [[[42, 60], [42, 190]]], w: 6 },
      { type: 'cable', from: [46, 156], to: 'near', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wrist', bow: -0.3 },
    start: { hip: [136, 122], torso: 94, upper: -115, fore: -100, upperF: -112, foreF: -98, footAt: [146, 188], kneeBend: 1 },
    end:   { hip: [136, 122], torso: 94, upper: -118, fore: 50, upperF: -112, foreF: -98, footAt: [146, 188], kneeBend: 1 }
  },

  /* ---------------- QUADS ---------------- */

  squat: {
    view: 'side',
    phases: ['STANDING', 'DESCEND', 'BOTTOM POSITION'],
    props: [floor, { type: 'plate', at: 'neck', fg: true, r: 19 }],
    arrow: { joint: 'hip', bow: 0.12 },
    start: { hip: [130, 122], torso: 92, upper: -150, fore: 140, footAt: [142, 188], kneeBend: 1 },
    end:   { hip: [124, 158], torso: 76, upper: -150, fore: 140, footAt: [142, 188], kneeBend: 1 }
  },

  legPress: {
    view: 'side',
    phases: ['KNEES BENT', 'PRESS', 'LEGS EXTENDED'],
    props: [
      floor,
      { type: 'rig', segs: [[[104, 168], [206, 58]], [[112, 182], [214, 72]], [[96, 168], [96, 190]]], w: 5 },
      { type: 'support', at: [102, 160], angle: 152, len: 74 },
      { type: 'platform', angle: 128, len: 30, fg: true }
    ],
    arrow: { joint: 'ankle', bow: 0.1 },
    start: { hip: [96, 150], torso: 152, upper: -100, fore: -30, footAt: [128, 132], kneeBend: 1 },
    end:   { hip: [96, 150], torso: 152, upper: -100, fore: -30, footAt: [152, 114], kneeBend: 1 }
  },

  hackSquat: {
    view: 'side',
    phases: ['STANDING TALL', 'DESCEND', 'BOTTOM POSITION'],
    props: [
      floor,
      { type: 'rig', segs: [[[78, 190], [148, 70]], [[92, 190], [162, 70]]], w: 5 },
      { type: 'support', at: [126, 142], angle: 110, len: 68 },
      { type: 'pad', at: 'neck', offset: [8, -4], w: 10, h: 7 },
      { type: 'block', x: 116, y: 182, w: 58, h: 10 }
    ],
    arrow: { joint: 'hip', bow: 0.12 },
    start: { hip: [120, 128], torso: 110, upper: -30, fore: -60, footAt: [142, 182], kneeBend: 1 },
    end:   { hip: [104, 158], torso: 110, upper: -30, fore: -60, footAt: [142, 182], kneeBend: 1 }
  },

  splitSquat: {
    view: 'side',
    phases: ['TALL SPLIT STANCE', 'DESCEND', 'BOTTOM POSITION'],
    props: [
      floor,
      { type: 'bench', angle: 0, at: [56, 152], len: 50, floor: FLOOR },
      { type: 'dumbbell', fg: true }
    ],
    arrow: { joint: 'hip', bow: 0.12 },
    start: { hip: [128, 126], torso: 92, upper: -88, fore: -90, footAt: [152, 188], footAtF: [88, 150], kneeBend: 1 },
    end:   { hip: [126, 152], torso: 86, upper: -88, fore: -90, footAt: [152, 188], footAtF: [88, 150], kneeBend: 1 }
  },

  legExtension: {
    view: 'side',
    phases: ['SHINS DOWN', 'EXTEND', 'KNEES LOCKED OUT'],
    props: [
      floor,
      { type: 'block', x: 82, y: 156, w: 48, h: 12 },
      { type: 'support', at: [98, 158], angle: 96, len: 54 },
      { type: 'rig', segs: [[[106, 168], [106, 190]], [[138, 154], [138, 190]]], w: 6 },
      { type: 'pad', at: 'ankle', w: 8, h: 11, fg: true }
    ],
    arrow: { joint: 'ankle', bow: 0.26 },
    start: { hip: [104, 150], torso: 94, upper: -70, fore: -10, thigh: -8, shin: -88 },
    end:   { hip: [104, 150], torso: 94, upper: -70, fore: -10, thigh: -8, shin: 8 }
  },

  /* ---------------- CALVES ---------------- */

  calfStanding: {
    view: 'side',
    phases: ['HEELS BELOW STEP', 'RISE', 'FULL PLANTARFLEXION'],
    props: [
      floor,
      { type: 'block', x: 130, y: 180, w: 46, h: 10 },
      { type: 'rig', segs: [[[196, 60], [196, 190]], [[196, 66], [140, 66]]], w: 6 },
      { type: 'pad', at: 'neck', offset: [4, -6], w: 11, h: 7 }
    ],
    arrow: { joint: 'ankle', offset: [-12, 0], bow: 0.1 },
    start: { hip: [130, 124], torso: 92, upper: 40, fore: 20, footAt: [136, 190], foot: 40 },
    end:   { hip: [130, 106], torso: 92, upper: 40, fore: 20, footAt: [136, 172], foot: -35 }
  },

  calfSeated: {
    view: 'side',
    phases: ['HEELS DOWN', 'RISE', 'TOP CONTRACTION'],
    props: [
      floor,
      { type: 'block', x: 84, y: 158, w: 46, h: 10 },
      { type: 'block', x: 134, y: 178, w: 36, h: 12 },
      { type: 'pad', at: 'knee', offset: [0, -14], w: 14, h: 7 },
      { type: 'rig', segs: [[[150, 120], [150, 178]], [[150, 126], [122, 126]]], w: 6 }
    ],
    arrow: { joint: 'knee', bow: 0.12 },
    start: { hip: [104, 146], torso: 92, upper: -60, fore: -30, footAt: [140, 186], foot: 32 },
    end:   { hip: [104, 146], torso: 92, upper: -60, fore: -30, footAt: [140, 172], foot: -25 }
  },

  calfLegPress: {
    view: 'side',
    phases: ['ANKLES FLEXED', 'PUSH THROUGH TOES', 'FULL EXTENSION'],
    props: [
      floor,
      { type: 'rig', segs: [[[104, 168], [206, 58]], [[112, 182], [214, 72]], [[96, 168], [96, 190]]], w: 5 },
      { type: 'support', at: [102, 160], angle: 152, len: 74 },
      { type: 'platform', angle: 128, len: 30, fg: true }
    ],
    arrow: { joint: 'ankle', bow: 0.1 },
    start: { hip: [96, 150], torso: 152, upper: -100, fore: -30, footAt: [138, 126], foot: 62, kneeBend: 1 },
    end:   { hip: [96, 150], torso: 152, upper: -100, fore: -30, footAt: [151, 113], foot: 18, kneeBend: 1 }
  },

  calfSingle: {
    view: 'side',
    phases: ['HEEL BELOW STEP', 'RISE', 'TOP CONTRACTION'],
    props: [
      floor,
      { type: 'block', x: 130, y: 180, w: 46, h: 10 },
      { type: 'rig', segs: [[[196, 70], [196, 190]]], w: 6 },
      { type: 'dumbbell', single: true, fg: true }
    ],
    arrow: { joint: 'ankle', offset: [-12, 0], bow: 0.1 },
    start: { hip: [130, 124], torso: 92, upper: -88, fore: -92, thighF: -70, shinF: -170, footAt: [136, 190], foot: 40 },
    end:   { hip: [130, 106], torso: 92, upper: -88, fore: -92, thighF: -70, shinF: -170, footAt: [136, 172], foot: -35 }
  },

  donkeyCalf: {
    view: 'side',
    phases: ['HEELS DOWN', 'RISE', 'TOP CONTRACTION'],
    props: [
      floor,
      { type: 'block', x: 116, y: 180, w: 42, h: 10 },
      { type: 'rig', segs: [[[196, 140], [216, 140]], [[206, 140], [206, 190]]], w: 6 }
    ],
    arrow: { joint: 'ankle', offset: [-12, 0], bow: 0.1 },
    start: { hip: [130, 126], torso: 30, handAt: [199, 138], elbowBend: -1, footAt: [124, 190], foot: 40, headTilt: -8 },
    end:   { hip: [130, 114], torso: 27, handAt: [199, 138], elbowBend: -1, footAt: [124, 173], foot: -32, headTilt: -8 }
  },

  /* ---------------- HAMSTRINGS / GLUTES ---------------- */

  lyingLegCurl: {
    view: 'side',
    phases: ['LEGS STRAIGHT', 'CURL HEELS UP', 'FULL FLEXION'],
    props: [
      floor,
      { type: 'bench', angle: 0, at: [72, 152], len: 116, floor: FLOOR },
      { type: 'pad', at: 'ankle', w: 8, h: 11, fg: true },
      { type: 'rig', segs: [[[190, 140], [190, 190]]], w: 6 }
    ],
    arrow: { joint: 'ankle', bow: 0.24 },
    start: { hip: [150, 140], torso: 180, upper: 176, fore: 176, thigh: -2, shin: -2, foot: 20 },
    end:   { hip: [150, 140], torso: 180, upper: 176, fore: 176, thigh: -2, shin: 95, foot: 110 }
  },

  seatedLegCurl: {
    view: 'side',
    phases: ['LEGS FORWARD', 'CURL DOWN + BACK', 'FULL FLEXION'],
    props: [
      floor,
      { type: 'block', x: 78, y: 156, w: 46, h: 12 },
      { type: 'support', at: [94, 158], angle: 94, len: 54 },
      { type: 'pad', at: 'knee', offset: [4, -14], w: 14, h: 7 },
      { type: 'pad', at: 'ankle', w: 8, h: 11, fg: true },
      { type: 'rig', segs: [[[136, 190], [136, 152]]], w: 6 }
    ],
    arrow: { joint: 'ankle', bow: 0.2 },
    start: { hip: [100, 146], torso: 92, upper: -70, fore: -20, thigh: -6, shin: -6, foot: 30 },
    end:   { hip: [100, 146], torso: 92, upper: -70, fore: -20, thigh: -6, shin: -72, foot: -30 }
  },

  hipThrust: {
    view: 'side',
    phases: ['HIPS LOWERED', 'DRIVE UP', 'FULL EXTENSION'],
    props: [
      floor,
      { type: 'bench', angle: 0, at: [68, 148], len: 62, floor: FLOOR },
      { type: 'plate', at: 'hip', fg: true, r: 19 }
    ],
    arrow: { joint: 'hip', bow: 0.12 },
    start: { hip: [150, 166], torso: 152, upper: -50, fore: -80, footAt: [196, 188], kneeBend: 1 },
    end:   { hip: [154, 142], torso: 170, upper: -40, fore: -70, footAt: [196, 188], kneeBend: 1 }
  },

  pullThrough: {
    view: 'side',
    phases: ['HINGED FORWARD', 'DRIVE HIPS', 'STANDING TALL'],
    props: [
      floor,
      { type: 'rig', segs: [[[44, 60], [44, 190]]], w: 6 },
      { type: 'cable', from: [48, 176], to: 'near', handle: 'rope', fg: true }
    ],
    arrow: { joint: 'wrist', bow: 0.16 },
    start: { hip: [138, 142], torso: 45, handAt: [168, 152], elbowBend: -1, footAt: [154, 188], kneeBend: 1, headTilt: -10 },
    end:   { hip: [130, 126], torso: 90, handAt: [136, 126], elbowBend: -1, footAt: [154, 188], kneeBend: 1 }
  },

  /* ---------------- SHOULDERS ---------------- */

  overheadPress: {
    view: 'front',
    phases: ['BAR AT SHOULDERS', 'PRESS UP', 'LOCKOUT OVERHEAD'],
    props: [floor, { type: 'bar', fg: true, ext: 24 }],
    arrow: { joint: 'wristR', bow: 0.12 },
    start: { hip: [130, 124], upper: 0, fore: 90, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: 70, fore: 95, thigh: -96, thighL: -84 }
  },

  arnoldPress: {
    view: 'front',
    phases: ['PALMS IN, FRONT OF CHEST', 'ROTATE + PRESS', 'LOCKOUT'],
    props: [floor, { type: 'dumbbell', fg: true }],
    arrow: { joint: 'wristR', bow: 0.2 },
    start: { hip: [130, 124], upper: -115, fore: 75, upperScale: 0.6, foreScale: 0.75, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: 70, fore: 95, thigh: -96, thighL: -84 }
  },

  lateralRaise: {
    view: 'front',
    phases: ['ARMS AT SIDES', 'RAISE TO SIDE', 'SHOULDER HEIGHT'],
    props: [floor, { type: 'dumbbell', fg: true }],
    arrow: { joint: 'wristR', bow: 0.26 },
    start: { hip: [130, 124], upper: -80, fore: -88, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: 5, fore: 8, thigh: -96, thighL: -84 }
  },

  cableLateralRaise: {
    view: 'front',
    phases: ['ARM ACROSS BODY', 'RAISE OUT', 'SHOULDER HEIGHT'],
    props: [
      floor,
      { type: 'rig', segs: [[[26, 60], [26, 190]]], w: 5 },
      { type: 'cable', from: [30, 172], to: 'near', handle: 'handle', fg: true }
    ],
    arrow: { joint: 'wristR', bow: 0.26 },
    start: { hip: [130, 124], upper: -80, fore: -85, upperL: -100, foreL: -95, thigh: -96, thighL: -84 },
    end:   { hip: [130, 124], upper: 5, fore: 8, upperL: -100, foreL: -95, thigh: -96, thighL: -84 }
  },

  rearDeltFly: {
    view: 'front',
    phases: ['ARMS IN FRONT', 'SWEEP BACK', 'ARMS WIDE'],
    props: [
      { type: 'block', x: 108, y: 142, w: 44, h: 12 },
      { type: 'rig', segs: [[[130, 148], [130, 190]], [[96, 190], [164, 190]]], w: 5 },
      { type: 'handles', fg: true }
    ],
    arrow: { joint: 'wristR', bow: 0.24 },
    start: { hip: [130, 122], upper: -160, fore: -170, upperScale: 0.45, foreScale: 0.45, thigh: -84, thighL: -96 },
    end:   { hip: [130, 122], upper: 8, fore: 6, thigh: -84, thighL: -96 }
  }
};

export const ARCHETYPE_IDS = Object.keys(ARCHETYPES);
