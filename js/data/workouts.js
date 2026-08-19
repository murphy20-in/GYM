/* workouts.js — the weekly program.
 *
 * Days reference exercises by id only. An exercise that appears twice in the
 * week (Pec Deck, Rope Pushdown, Hammer Curl) points at the same definition,
 * so its form guidance and personal records are shared across both days.
 */

export const WEEK = [
  {
    id: 'mon', index: 1, name: 'Monday', short: 'MON',
    title: 'Chest + Triceps', focus: ['Chest', 'Triceps'],
    sections: [
      { name: 'Chest', exercises: ['barbell-bench-press', 'incline-dumbbell-press', 'machine-chest-press', 'cable-crossover', 'pec-deck'] },
      { name: 'Triceps', exercises: ['close-grip-bench-press', 'rope-pushdown', 'overhead-cable-extension', 'skull-crushers', 'single-arm-pushdown'] }
    ]
  },
  {
    id: 'tue', index: 2, name: 'Tuesday', short: 'TUE',
    title: 'Back + Biceps', focus: ['Back', 'Biceps'],
    sections: [
      { name: 'Back', exercises: ['deadlift', 'lat-pulldown', 'barbell-row', 'seated-cable-row', 'straight-arm-pulldown'] },
      { name: 'Biceps', exercises: ['barbell-curl', 'incline-dumbbell-curl', 'hammer-curl', 'preacher-curl', 'cable-curl'] }
    ]
  },
  {
    id: 'wed', index: 3, name: 'Wednesday', short: 'WED',
    title: 'Quads + Calves', focus: ['Quads', 'Calves'],
    sections: [
      { name: 'Quads', exercises: ['barbell-squat', 'leg-press', 'bulgarian-split-squat', 'leg-extension', 'hack-squat'] },
      { name: 'Calves', exercises: ['standing-calf-raise', 'seated-calf-raise', 'leg-press-calf-raise', 'single-leg-calf-raise', 'donkey-calf-raise'] }
    ]
  },
  {
    id: 'thu', index: 4, name: 'Thursday', short: 'THU',
    title: 'Chest + Triceps', focus: ['Chest', 'Triceps'],
    sections: [
      { name: 'Chest', exercises: ['incline-barbell-press', 'flat-dumbbell-press', 'decline-machine-press', 'low-to-high-cable-fly', 'pec-deck'] },
      { name: 'Triceps', exercises: ['dips', 'ez-bar-skull-crusher', 'rope-pushdown', 'dumbbell-overhead-extension', 'reverse-grip-pushdown'] }
    ]
  },
  {
    id: 'fri', index: 5, name: 'Friday', short: 'FRI',
    title: 'Back + Biceps', focus: ['Back', 'Biceps'],
    sections: [
      { name: 'Back', exercises: ['pull-ups', 't-bar-row', 'close-grip-lat-pulldown', 'chest-supported-row', 'one-arm-dumbbell-row'] },
      { name: 'Biceps', exercises: ['ez-bar-curl', 'spider-curl', 'alternating-dumbbell-curl', 'hammer-curl', 'bayesian-cable-curl'] }
    ]
  },
  {
    id: 'sat', index: 6, name: 'Saturday', short: 'SAT',
    title: 'Hamstrings/Glutes + Shoulders', focus: ['Hamstrings', 'Glutes', 'Shoulders'],
    sections: [
      { name: 'Hamstrings / Glutes', exercises: ['romanian-deadlift', 'lying-leg-curl', 'hip-thrust', 'seated-leg-curl', 'cable-pull-through'] },
      { name: 'Shoulders', exercises: ['overhead-press', 'dumbbell-lateral-raise', 'rear-delt-fly', 'arnold-press', 'cable-lateral-raise'] }
    ]
  },
  {
    id: 'sun', index: 0, name: 'Sunday', short: 'SUN',
    title: 'Rest / Recovery', focus: [], rest: true, sections: []
  }
];

/* Ordered Monday-first for the day strip; JS getDay() is Sunday-first. */
export const DAY_IDS = WEEK.map(d => d.id);
const BY_INDEX = Object.fromEntries(WEEK.map(d => [d.index, d]));

export const getDay = id => WEEK.find(d => d.id === id);

/** The program day for a JS Date (defaults to now). */
export function dayFor(date = new Date()) {
  return BY_INDEX[date.getDay()];
}

export function todayId() {
  return dayFor().id;
}

/** Flat list of exercise ids for a day, in the order they are performed. */
export function exercisesOf(day) {
  return (day.sections || []).flatMap(s => s.exercises);
}

export function exerciseCount(day) {
  return exercisesOf(day).length;
}

/** The next training day after `day`, skipping rest days. */
export function nextTrainingDay(day) {
  const start = DAY_IDS.indexOf(day.id);
  for (let i = 1; i <= 7; i++) {
    const d = WEEK[(start + i) % WEEK.length];
    if (!d.rest) return d;
  }
  return WEEK[0];
}

export function shiftDay(dayId, delta) {
  const i = DAY_IDS.indexOf(dayId);
  return WEEK[(i + delta + WEEK.length) % WEEK.length];
}
