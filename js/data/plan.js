/* plan.js — nutrition plan, habit definitions and weight milestones.
 *
 * These are the *defaults*. Everything here can be overridden per-user from
 * Settings and is then stored in gym.v1.settings, so editing the plan never
 * requires a code change.
 *
 * Calorie and protein figures are deliberate estimates. They are rendered with
 * a "≈" everywhere in the UI — portion sizes, cooking losses and food variation
 * make anything more precise false confidence.
 */

export const MEAL_PLAN = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    kcal: 730,
    protein: 40,
    items: [
      '50 g oats',
      '250 ml toned milk',
      '30 g peanut butter',
      '10 g chia seeds',
      '10 g honey',
      '3 whole eggs'
    ]
  },
  {
    id: 'lunch',
    name: 'Lunch',
    kcal: 760,
    protein: 58,
    items: [
      '150 g chicken breast',
      '100 g raw rice',
      '200 g curd',
      '100–150 g vegetables',
      '10 g ghee'
    ]
  },
  {
    id: 'dinner',
    name: 'Dinner',
    kcal: 710,
    protein: 37,
    items: [
      '4 whole eggs',
      '200 g cooked rice',
      '200 g curd',
      '100–150 g vegetables',
      '10 g oil/ghee'
    ]
  }
];

export const DAILY_TARGETS = {
  kcal: MEAL_PLAN.reduce((n, m) => n + m.kcal, 0),      /* ≈ 2200 */
  protein: MEAL_PLAN.reduce((n, m) => n + m.protein, 0) /* ≈ 135 */
};

/* Habit tracking types:
 *   yesno    — did it happen at all
 *   count    — how many times (cigarettes)
 *   quantity — how much of a target (glasses of water)
 *   duration — hours (sleep)
 *
 * `lowerIsBetter` marks habits the user is reducing. It only affects the
 * separate "adherence" figure — never the daily score, which counts *recording*
 * a habit, not the value recorded. Nothing here is framed as pass/fail.
 */
export const DEFAULT_HABITS = [
  { id: 'smoking', name: 'Smoking', type: 'count', unit: 'cigarettes', private: true, lowerIsBetter: true },
  { id: 'pornography', name: 'Pornography', type: 'yesno', private: true, lowerIsBetter: true },
  { id: 'masturbation', name: 'Masturbation', type: 'yesno', private: true, lowerIsBetter: true },
  { id: 'water', name: 'Water', type: 'quantity', unit: 'glasses', target: 8, private: false },
  { id: 'sleep', name: 'Sleep', type: 'duration', unit: 'hours', target: 7.5, private: false }
];

export const HABIT_TYPES = [
  { id: 'yesno', label: 'Yes / No', hint: 'Did it happen today' },
  { id: 'count', label: 'Count', hint: 'How many times' },
  { id: 'quantity', label: 'Quantity', hint: 'Amount against a target' },
  { id: 'duration', label: 'Duration', hint: 'Hours' }
];

/** Weight milestones, descending. 70 is the low end of the range, not "the" goal. */
export const MILESTONES = [90, 85, 80, 75, 72.5, 70];

/** Default share of the daily score. Configurable in Settings. */
export const SCORE_WEIGHTS = {
  workout: 30,
  nutrition: 30,
  habits: 25,
  weight: 15
};

export const TARGET_RANGE = { min: 70, max: 75, default: 72.5 };
