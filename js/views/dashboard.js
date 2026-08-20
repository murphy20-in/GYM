/* dashboard.js — "Today".
 *
 * Ordered around the real day rather than around the data model: weight first
 * (it is the first thing measured at the gym), then the workout, then nutrition,
 * then habits, then the score that summarises all of it. Private habits are
 * collapsed behind their own control and never surface a value here.
 */

import { el, icon, greeting } from '../ui.js';
import { dayFor, exercisesOf, nextTrainingDay } from '../data/workouts.js';
import * as store from '../storage.js';
import { BY_ID as EX_INDEX } from '../data/exercises.js';
import { MUSCLE_NAMES } from '../muscles.js';
import { dayStrip } from './daystrip.js';
import { weighInSheet, checkPair } from './weighin.js';

const pct = n => `${Math.round(n)}%`;

export function view(params, app) {
  const settings = store.getSettings();
  const day = dayFor();
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const b = store.dailyBreakdown();
    const goal = store.weightGoal();
    const plan = store.getMealPlan();
    const targets = store.getTargets();
    const habits = store.getHabits();
    const log = store.getDayLog();
    const w = store.weightsOn();

    container.replaceChildren();

    /* ---------- poster hero ----------
       Date, split and current weight at display scale over a red-graded
       photograph. Numbers stay the hero; the image is atmosphere. */
    const now = new Date();
    const goalNow = store.weightGoal();
    const bProg = b;
    const hero = el('section', { class: 'poster' }, [
      el('div', { class: 'poster-bg', style: `background-image:url('assets/img/shoulder.webp')` }),
      el('p', { class: 'kicker', text: `${greeting()}, ${(settings.name || 'athlete').toUpperCase()}` }),
      el('div', { class: 'stack-date' }, [
        el('span', { class: 'day-num', text: String(now.getDate()) }),
        el('span', { class: 'month', html:
          `${now.toLocaleDateString(undefined, { month: 'long' }).toUpperCase()}<br>${now.getFullYear()}` })
      ]),
      el('p', { class: 'display split', text: day.rest ? 'REST / RECOVERY' : day.title }),
      el('div', { class: 'rule' }),
      el('div', { class: 'metric-row' }, [
        el('div', { class: 'metric' }, [
          el('b', { text: goalNow.current != null ? `${goalNow.current}` : '—' }),
          el('span', { text: `Scale ${settings.units}` })
        ]),
        el('div', { class: 'metric' }, [
          el('b', { text: goalNow.trendWeight != null ? `${goalNow.trendWeight}` : '—' }),
          el('span', { text: `Trend ${settings.units}` })
        ]),
        el('div', { class: 'metric' }, [
          el('b', { text: goalNow.remaining != null ? `${goalNow.remaining}` : '—' }),
          el('span', { text: `To target` })
        ]),
        el('div', { class: 'metric' }, [
          el('b', { text: `${bProg.score}%` }),
          el('span', { text: 'Today' })
        ])
      ]),
      el('p', { class: 'tagline', text: day.rest ? 'Recovery is the work too.' : 'The work continues.' })
    ]);
    container.appendChild(hero);

    /* ---------- weight ---------- */
    const weightCard = el('section', { class: 'card accent-weight' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Weight' }),
        el('a', { class: 'link-more', href: '#/weight', text: 'Journey →' })
      ]),
      goal.current == null
        ? el('div', { class: 'stack', style: 'margin-top:10px' }, [
            el('p', { class: 'muted', text: 'No weigh-in yet. Record one to start your trend.' }),
            el('button', {
              class: 'btn btn-primary btn-block', type: 'button', text: 'LOG WEIGHT',
              onclick: () => weighInSheet('manual', { onSaved: paint })
            })
          ])
        : el('div', {}, [
            el('div', { class: 'big-metric' }, [
              el('strong', { text: String(goal.current) }),
              el('span', { text: settings.units })
            ]),
            el('div', { class: 'row-between', style: 'margin-top:8px' }, [
              el('span', { class: 'dim', style: 'font-size:12.5px',
                text: goal.trendWeight != null ? `Trend ${goal.trendWeight} ${settings.units}` : '' }),
              (() => {
                const r = store.getWeightLossRate();
                return el('span', {
                  class: r != null && r < -0.05 ? 'tag tag-accent' : 'tag',
                  text: r == null ? 'Trend building' : `${r > 0 ? '+' : ''}${r} ${settings.units}/wk`
                });
              })()
            ]),
            el('div', { class: 'row-between', style: 'margin-top:12px' }, [
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `Start ${goal.start} ${settings.units}` }),
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `Target ${goal.target} ${settings.units}` })
            ]),
            el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${goal.pct}%` })]),
            el('p', { style: 'margin-top:8px;font-size:13.5px',
              text: goal.remaining > 0
                ? `${goal.remaining} ${settings.units} to target · ${goal.lost > 0 ? goal.lost + ' lost so far' : 'trend building'}`
                : 'You are within your target range.' })
          ])
    ]);
    container.appendChild(weightCard);

    /* ---------- workout ---------- */
    const ids = exercisesOf(day);
    const needsCheckIn = !day.rest && !w.checkin;
    const workoutCard = el('section', { class: 'card accent-workout' }, [
      el('p', { class: 'eyebrow', text: day.rest ? 'Today' : "Today's workout" }),
      el('h2', { style: 'font-size:22px;margin-top:4px', text: day.rest ? 'Rest / Recovery' : day.title }),
      day.rest
        ? el('div', { class: 'stack', style: 'margin-top:10px' }, [
            el('p', { class: 'muted', style: 'font-size:14px', text: 'Recovery is part of the program.' }),
            el('p', { class: 'dim', style: 'font-size:13px',
              text: `Next: ${nextTrainingDay(day).name} — ${nextTrainingDay(day).title}` })
          ])
        : el('div', {}, [
            el('div', { class: 'row-between', style: 'margin-top:12px' }, [
              el('span', { class: 'dim', style: 'font-size:12.5px', text: `${b.workout.done} / ${b.workout.total} exercises` }),
              el('span', { class: 'dim', style: 'font-size:12.5px', text: pct(b.workout.value * 100) })
            ]),
            el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.workout.value * 100}%` })]),
            needsCheckIn
              ? el('button', {
                  class: 'btn btn-primary btn-lg btn-block', style: 'margin-top:14px', type: 'button',
                  html: `${icon('timer')}<span>GYM CHECK-IN</span>`,
                  onclick: () => weighInSheet('checkin', { dayId: day.id, onSaved: paint })
                })
              : el('a', {
                  class: 'btn btn-primary btn-lg btn-block', style: 'margin-top:14px',
                  href: `#/workout/${day.id}`,
                  html: `${icon('play')}<span>${b.workout.done ? 'CONTINUE WORKOUT' : 'START WORKOUT'}</span>`
                }),
            el('a', { class: 'btn btn-ghost btn-block', style: 'margin-top:8px', href: `#/day/${day.id}`, text: 'View exercise list' })
          ])
    ]);
    container.appendChild(workoutCard);

    /* check-in / check-out pair once a session is under way */
    if (!day.rest && (w.checkin || w.checkout)) {
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', style: 'margin-bottom:10px', text: 'Session weigh-ins' }),
        checkPair(day.id, paint)
      ]));
    }

    /* ---------- nutrition ---------- */
    const kcalPct = targets.kcal ? Math.min(100, (b.nutrition.kcal / targets.kcal) * 100) : 0;
    const protPct = targets.protein ? Math.min(100, (b.nutrition.protein / targets.protein) * 100) : 0;

    container.appendChild(el('section', { class: 'card accent-nutrition' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Nutrition' }),
        el('a', { class: 'link-more', href: '#/nutrition', text: 'Meals →' })
      ]),
      el('div', { class: 'macro-row', style: 'margin-top:12px' }, [
        el('div', {}, [
          el('p', { class: 'macro-value', text: `≈ ${b.nutrition.kcal} / ${targets.kcal}` }),
          el('p', { class: 'dim', style: 'font-size:11.5px', text: 'kcal' }),
          el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${kcalPct}%` })])
        ]),
        el('div', {}, [
          el('p', { class: 'macro-value', text: `≈ ${b.nutrition.protein} / ${targets.protein}` }),
          el('p', { class: 'dim', style: 'font-size:11.5px', text: 'g protein' }),
          el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${protPct}%` })])
        ])
      ]),
      el('div', { class: 'meal-toggles', style: 'margin-top:14px' }, plan.map(meal => {
        const done = !!log.meals[meal.id];
        return el('button', {
          class: `meal-toggle${done ? ' done' : ''}`, type: 'button',
          'aria-pressed': String(done),
          'aria-label': `${meal.name}, ${done ? 'completed' : 'not completed'}`,
          onclick: () => { store.setMeal(meal.id, !done); paint(); }
        }, [
          el('span', { class: 'tick', html: done ? icon('check') : '' }),
          el('span', { class: 'grow', text: meal.name }),
          el('span', { class: 'dim', style: 'font-size:11.5px', text: `≈${meal.kcal}` })
        ]);
      }))
    ]));

    /* ---------- habits ---------- */
    const publicHabits = habits.filter(h => !h.private);
    const privateHabits = habits.filter(h => h.private);
    const privateTracked = privateHabits.filter(h => log.habits[h.id]?.tracked).length;

    container.appendChild(el('section', { class: 'card accent-habits' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: "Today's habits" }),
        el('a', { class: 'link-more', href: '#/habits', text: 'All →' })
      ]),
      publicHabits.length
        ? el('ul', { class: 'habit-mini', style: 'margin-top:10px' }, publicHabits.map(h => {
            const entry = log.habits[h.id];
            return el('li', {}, [
              el('span', { class: 'grow', text: h.name }),
              el('span', {
                class: entry?.tracked ? 'tag tag-accent' : 'tag',
                text: entry?.tracked ? formatValue(h, entry) : 'Not tracked'
              })
            ]);
          }))
        : el('p', { class: 'dim', style: 'font-size:13px;margin-top:8px', text: 'No open habits yet.' }),
      privateHabits.length ? el('a', {
        class: 'btn btn-ghost btn-block', style: 'margin-top:12px', href: '#/habits',
        text: settings.hidePrivate
          ? `🔒 Private habits · ${privateTracked} / ${privateHabits.length} tracked`
          : `Private habits · ${privateTracked} / ${privateHabits.length} tracked`
      }) : null
    ]));

    /* ---------- daily progress ---------- */
    container.appendChild(el('section', { class: 'card accent-progress' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Daily progress' }),
        el('a', { class: 'link-more', href: '#/progress', text: 'Week · Month · Year →' })
      ]),
      el('div', { class: 'score-line', style: 'margin-top:10px' }, [
        el('strong', { text: pct(b.score) })
      ]),
      el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${b.score}%` })]),
      el('ul', { class: 'score-parts', style: 'margin-top:14px' }, [
        part('Workout', b.workout.applicable ? `${b.workout.done} / ${b.workout.total}` : 'Rest day', b.workout.applicable ? b.workout.value : null),
        part('Meals', `${b.nutrition.done} / ${b.nutrition.total}`, b.nutrition.value),
        part('Weight', b.weight.expected === 2
          ? `${(b.weight.checkIn ? 1 : 0) + (b.weight.checkOut ? 1 : 0)} / 2 recorded`
          : (b.weight.value ? 'Recorded' : 'Not recorded'), b.weight.value),
        part('Habits', `${b.habits.done} / ${b.habits.total} tracked`, b.habits.value)
      ]),
      el('p', { class: 'dim', style: 'font-size:12px;margin-top:12px;line-height:1.45',
        text: 'Weight counts as recorded, not as a number going down. Weight fluctuates naturally — the trend is what matters.' })
    ]));

    /* ---------- FOCUS / Smart Insights ---------- */
    const insights = generateInsights(b, goal, w, log, habits, plan, targets);
    if (insights.length > 0) {
      container.appendChild(el('section', { class: 'card accent-progress' }, [
        el('div', { class: 'row-between' }, [
          el('p', { class: 'eyebrow', text: 'Focus' }),
          el('a', { class: 'link-more', href: '#/analytics', text: 'All →' })
        ]),
        el('ul', { class: 'focus-list', style: 'margin-top:10px' }, insights.slice(0, 4).map((insight, i) => 
          el('li', { class: 'focus-item' }, [
            el('span', { class: 'focus-num', text: String(i + 1) }),
            el('div', { class: 'focus-text' }, [
              el('strong', { text: insight.title }),
              el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:2px;line-height:1.4', text: insight.detail })
            ])
          ])
        ))
      ]));
    }

    /* ---------- week at a glance ---------- */
    container.appendChild(el('div', {}, [
      el('div', { class: 'section-title' }, [el('h2', { text: 'This week' })]),
      dayStrip(day.id, id => app.go(`#/day/${id}`))
    ]));
  }

  function part(label, detail, value) {
    return el('li', {}, [
      el('span', { class: 'grow', text: label }),
      el('span', { class: 'dim', style: 'font-size:12.5px', text: detail }),
      el('span', {
        class: 'part-dot' + (value == null ? ' na' : value >= 1 ? ' full' : value > 0 ? ' part' : ''),
        role: 'img',
        /* colour alone must not carry the state (a11y) — the glyph and the
           label say the same thing */
        'aria-label': value == null ? 'not applicable' : value >= 1 ? 'complete' : value > 0 ? 'partly complete' : 'not started',
        text: value == null ? '–' : value >= 1 ? '✓' : value > 0 ? '·' : ''
      })
    ]);
  }

  paint();

  return { title: 'Today', eyebrow: day.rest ? 'Rest day' : day.title, node: container };
}

function formatValue(habit, entry) {
  if (habit.type === 'yesno') return entry.value ? 'Yes' : 'No';
  const v = Number(entry.value) || 0;
  if (habit.type === 'duration') return `${v} h`;
  return habit.unit ? `${v}` : String(v);
}

/* ---------- Smart Insights Generator ---------- */

/**
 * Focus items, derived only from logged data.
 * Every statement quotes the numbers behind it so it can be checked, and
 * nothing is emitted when the data does not support it.
 */
function generateInsights(breakdown, goal, weights, log, habits, plan, targets) {
  const insights = [];

  /* 0. Data quality outranks everything: analytics built on gaps mislead, so
     say so before offering conclusions drawn from them. */
  const dq = store.dataQuality();
  const severe = dq.findings.find(f => f.severity === 'high');
  if (severe) {
    insights.push({ title: 'Check your data', detail: `${severe.label}. ${severe.detail}` });
  }

  /* 0b. Trend confidence, so a young trend is not read as a verdict. */
  const q = store.trendQuality();
  if (q.level === 'INSUFFICIENT' && store.getWeights().length > 0) {
    insights.push({ title: 'Weight trend', detail: `${q.note} ${q.n} weigh-ins so far — the trend sharpens quickly once you log most days.` });
  }

  /* 0c. Muscle balance: which prescribed work is actually being done. */
  try {
    const from = new Date(); from.setDate(from.getDate() - 28);
    const pva = store.plannedVsActual(from, new Date(), EX_INDEX)
      .filter(r => r.planned >= 4 && r.ratio != null)
      .sort((a, b) => a.ratio - b.ratio);
    const weakest = pva[0];
    if (weakest && weakest.ratio < 60) {
      insights.push({
        title: 'Training balance',
        detail: `${MUSCLE_NAMES[weakest.muscle] || weakest.muscle} has received ${weakest.actual} of the ${weakest.planned} sets your program prescribes over the last four weeks.`
      });
    }
  } catch { /* balance needs a month of data; silence is correct without it */ }

  const today = store.dateKey();
  const weekAgo = store.dateKey(new Date(Date.now() - 7 * 86400000));
  const monthAgo = store.dateKey(new Date(Date.now() - 30 * 86400000));

  /* 1. Workout consistency */
  if (!breakdown.day.rest) {
    const w = store.weekBreakdown();
    if (w.workouts.total > 0 && w.workouts.done < w.workouts.total) {
      insights.push({
        title: 'Consistency',
        detail: `You've completed ${w.workouts.done} of ${w.workouts.total} planned workouts this week. ${w.workouts.total - w.workouts.done} remaining.`
      });
    } else if (w.workouts.done === w.workouts.total && w.workouts.total > 0) {
      insights.push({
        title: 'Consistency',
        detail: `Perfect week so far — ${w.workouts.done}/${w.workouts.total} workouts completed.`
      });
    }
  }

  /* 2. Protein adherence */
  const proteinPct = targets.protein ? (breakdown.nutrition.protein / targets.protein) * 100 : 100;
  if (proteinPct < 80 && breakdown.nutrition.done > 0) {
    insights.push({
      title: 'Protein',
      detail: `Daily protein is at ${Math.round(proteinPct)}% of target (${breakdown.nutrition.protein}/${targets.protein}g). Add a protein-rich meal or shake.`
    });
  } else if (proteinPct >= 100 && breakdown.nutrition.done > 0) {
    insights.push({
      title: 'Protein',
      detail: `Protein target hit — ${breakdown.nutrition.protein}g/${targets.protein}g.`
    });
  }

  /* 3. Weight trend */
  if (goal.current != null) {
    const rate = store.getWeightLossRate();
    if (rate != null) {
      if (rate < -0.2) {
        insights.push({
          title: 'Weight Trend',
          detail: `Your trend is ${rate} kg/week over the last three weeks — moving toward target. Keep the routine consistent.`
        });
      } else if (rate > 0.2) {
        insights.push({
          title: 'Weight Trend',
          detail: `Your trend is +${rate} kg/week over the last three weeks. Worth reviewing nutrition adherence and weigh-in consistency.`
        });
      } else {
        insights.push({
          title: 'Weight Trend',
          detail: `7-day trend is stable (${rate} kg/week). Consistency will reveal direction.`
        });
      }
    } else {
      insights.push({
        title: 'Weight Trend',
        detail: 'Not enough weigh-in data for a trend. Log check-in and check-out weights each session.'
      });
    }
  }

  /* 4. Habit tracking */
  const smokingHabit = habits.find(h => h.id === 'smoking');
  if (smokingHabit) {
    const totals = store.habitTotals('smoking');
    if (totals.week > 0) {
      const prevWeekTotals = getPrevWeekHabitTotal('smoking');
      if (prevWeekTotals > 0) {
        const change = totals.week - prevWeekTotals;
        if (change < 0) {
          insights.push({
            title: 'Smoking',
            detail: `Down ${Math.abs(change)} cigarettes vs last week (${totals.week} this week). Trend improving.`
          });
        } else if (change > 0) {
          insights.push({
            title: 'Smoking',
            detail: `Up ${change} cigarettes vs last week (${totals.week} this week). Consider a reset.`
          });
        }
      }
    }
  }

  /* 5. Session completion reminder */
  if (!breakdown.day.rest && breakdown.workout.done < breakdown.workout.total && weights.checkin) {
    insights.push({
      title: 'Session',
      detail: `${breakdown.workout.total - breakdown.workout.done} exercises remaining. Finish strong.`
    });
  }

  /* 6. Check-out reminder */
  if (!breakdown.day.rest && weights.checkin && !weights.checkout && breakdown.workout.done === breakdown.workout.total) {
    insights.push({
      title: 'Check-Out',
      detail: 'Workout complete — record your check-out weight to finish the session.'
    });
  }

  /* 7. Streak */
  const streak = store.getWorkoutStreaks();
  if (streak.current >= 7) {
    insights.push({
      title: 'Streak',
      detail: `${streak.current} day workout streak — building momentum.`
    });
  }

  /* Limit to top 3 */
  return insights.slice(0, 3);
}

function getPrevWeekHabitTotal(habitId) {
  const allDays = store.allDays();
  const twoWeeksAgo = store.dateKey(new Date(Date.now() - 14 * 86400000));
  const weekAgo = store.dateKey(new Date(Date.now() - 7 * 86400000));
  let total = 0;
  for (const [date, log] of Object.entries(allDays)) {
    if (date >= twoWeeksAgo && date < weekAgo) {
      const entry = log.habits?.[habitId];
      if (entry?.tracked) total += Number(entry.value) || 0;
    }
  }
  return total;
}
