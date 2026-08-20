/* analytics.js — comprehensive analytics dashboard.
 *
 * Day / Week / Month / Year views with weight, workout, nutrition, habit,
 * body measurement, and strength analytics.
 */

import { el, icon } from '../ui.js';
import { weightChart } from '../chart.js';
import { WEEK, dayFor, exercisesOf } from '../data/workouts.js';
import { getExercise } from '../data/exercises.js';
import * as store from '../storage.js';

const PERIODS = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
let activePeriod = 'WEEK';
let activeTab = 'overview';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'chart' },
  { id: 'weight', label: 'Weight', icon: 'scale' },
  { id: 'workout', label: 'Strength', icon: 'dumbbell' },
  { id: 'body', label: 'Body', icon: 'book' },
  { id: 'nutrition', label: 'Nutrition', icon: 'meal' },
  { id: 'habits', label: 'Habits', icon: 'habit' }
];

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  const askedPeriod = String(params.period || '').toUpperCase();
  if (PERIODS.includes(askedPeriod)) activePeriod = askedPeriod;
  const askedTab = params.tab || '';
  if (TABS.some(t => t.id === askedTab)) activeTab = askedTab;

  function paint() {
    const settings = store.getSettings();
    const units = settings.units;
    container.replaceChildren();

    /* Period selector */
    container.appendChild(el('div', { class: 'chips', role: 'group', 'aria-label': 'Time period' },
      PERIODS.map(p => el('button', {
        class: 'chip', type: 'button', text: p, 'aria-pressed': String(p === activePeriod),
        onclick: () => { activePeriod = p; paint(); }
      }))));

    /* Tab selector */
    container.appendChild(el('div', { class: 'chips', role: 'group', 'aria-label': 'Analytics category', style: 'margin-top:8px' },
      TABS.map(t => el('button', {
        class: 'chip', type: 'button', html: `${icon(t.icon)}<span>${t.label}</span>`, 'aria-pressed': String(t.id === activeTab),
        onclick: () => { activeTab = t.id; paint(); }
      }))));

    if (activePeriod === 'DAY') renderDay(settings, units);
    if (activePeriod === 'WEEK') renderWeek(settings, units);
    if (activePeriod === 'MONTH') renderMonth(settings, units);
    if (activePeriod === 'YEAR') renderYear(settings, units);
  }

  function renderDay(settings, units) {
    const b = store.dailyBreakdown();
    const w = store.weightsOn();
    const goal = store.weightGoal();
    const log = store.getDayLog();
    const plan = store.getMealPlan();
    const habits = store.getHabits();

    /* Overview cards */
    if (activeTab === 'overview') {
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', text: 'Weight' }),
        el('div', { class: 'big-metric' }, [
          el('strong', { text: goal.current != null ? String(goal.current) : '—' }),
          el('span', { text: units })
        ]),
        goal.current != null ? el('div', { class: 'bar', style: 'margin-top:8px' }, [el('i', { style: `width:${goal.pct}%` })]) : null,
        goal.current != null ? el('p', { class: 'dim', style: 'margin-top:6px;font-size:12px',
          text: goal.remaining > 0 ? `${goal.remaining} ${units} to target` : 'Within target range' }) : null
      ]));

      container.appendChild(el('section', { class: 'card accent-workout' }, [
        el('p', { class: 'eyebrow', text: 'Workout' }),
        el('div', { class: 'big-metric' }, [
          el('strong', { text: b.workout.applicable ? `${b.workout.done}/${b.workout.total}` : 'Rest' }),
          el('span', { text: b.workout.applicable ? 'exercises' : '' })
        ]),
        b.workout.applicable ? el('div', { class: 'bar', style: 'margin-top:8px' }, [el('i', { style: `width:${Math.round(b.workout.value*100)}%` })]) : null
      ]));

      container.appendChild(el('section', { class: 'card accent-nutrition' }, [
        el('p', { class: 'eyebrow', text: 'Nutrition' }),
        el('div', { class: 'big-metric' }, [
          el('strong', { text: `≈ ${b.nutrition.kcal}` }),
          el('span', { text: ` / ${plan.reduce((n,m)=>n+m.kcal,0)} kcal` })
        ]),
        el('p', { class: 'dim', style: 'margin-top:4px;font-size:12px', text: `≈ ${b.nutrition.protein} / ${plan.reduce((n,m)=>n+m.protein,0)} g protein` })
      ]));

      container.appendChild(el('section', { class: 'card accent-habits' }, [
        el('p', { class: 'eyebrow', text: 'Habits' }),
        el('div', { class: 'big-metric' }, [
          el('strong', { text: `${b.habits.done}` }),
          el('span', { text: ` / ${b.habits.total} tracked` })
        ]),
        el('div', { class: 'bar', style: 'margin-top:8px' }, [el('i', { style: `width:${Math.round(b.habits.value*100)}%` })])
      ]));

      /* Session delta if workout day */
      if (!b.day.rest && (w.checkin || w.checkout)) {
        const delta = (w.checkout?.kg ?? 0) - (w.checkin?.kg ?? 0);
        if (w.checkin && w.checkout) {
          container.appendChild(el('section', { class: 'card accent-weight' }, [
            el('p', { class: 'eyebrow', text: 'Session Weight Change' }),
            el('p', { class: 'delta-value', text: `${delta > 0 ? '+' : ''}${Math.round(delta*10)/10} ${units}` }),
            el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45',
              text: 'Session weight changes are usually influenced by hydration, food, glycogen and fluid loss. Use your longer-term weight trend to evaluate actual weight-loss progress.' })
          ]));
        }
      }
    }

    if (activeTab === 'weight') renderWeightTab(settings, units, 'DAY');
    if (activeTab === 'workout') renderWorkoutTab(settings, units, 'DAY');
    if (activeTab === 'body') renderBodyTab(settings, units, 'DAY');
    if (activeTab === 'nutrition') renderNutritionTab(settings, units, 'DAY');
    if (activeTab === 'habits') renderHabitsTab(settings, units, 'DAY');
  }

  function renderWeek(settings, units) {
    const w = store.weekBreakdown();
    const goal = store.weightGoal();
    const stats = store.weightStats('7D');
    const streak = store.getWorkoutStreaks();

    if (activeTab === 'overview') {
      container.appendChild(el('section', { class: 'card accent-progress' }, [
        el('p', { class: 'eyebrow', text: 'Weekly Score' }),
        el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${w.score}%` })]),
        el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${w.score}%` })]),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:16px' }, [
          statBox('Workouts', `${w.workouts.done}/${w.workouts.total}`),
          statBox('Meals', `${w.meals.done}/${w.meals.total}`),
          statBox('Weigh-ins', `${w.weighIns.done}/${w.weighIns.total}`),
          statBox('Habits', `${w.habitAdherence}%`)
        ])
      ]));

      /* Day bars */
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Daily Breakdown' }),
        el('div', { style: 'margin-top:10px' }, w.days.map(d => el('div', { class: `weekbar${d.isToday ? ' today' : ''}` }, [
          el('span', { class: 'd', text: d.day.short }),
          d.day.rest && !d.workout.applicable && d.score === 0
            ? el('span', { class: 'dim', style: 'font-size:12px;letter-spacing:.1em', text: 'REST' })
            : el('div', { class: 'bar bar-sm' }, [el('i', { style: `width:${d.future ? 0 : d.score}%` })]),
          el('span', { class: 'p', text: d.future ? '—' : `${d.score}%` })
        ])))
      ]));

      /* Weight trend */
      if (stats) {
        const series = store.weightSeries('7D');
        container.appendChild(el('section', { class: 'card accent-weight' }, [
          el('p', { class: 'eyebrow', text: '7-Day Weight Trend' }),
          weightChart(series, store.movingAverage(series), { target: goal.target, unit: units }),
          el('div', { class: 'stat-row stat-4', style: 'margin-top:12px' }, [
            statBox('Current', stats.current), statBox('Avg', stats.average),
            statBox('Low', stats.lowest), statBox('High', stats.highest)
          ])
        ]));
      }

      /* Streaks */
      container.appendChild(el('section', { class: 'card accent-workout' }, [
        el('p', { class: 'eyebrow', text: 'Streaks' }),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Current', streak.current),
          statBox('Best', streak.longest),
          statBox('Weight Log', w.weighIns.done > 0 ? 'Active' : 'None'),
          statBox('Workout', w.workouts.done > 0 ? 'Active' : 'None')
        ])
      ]));
    }

    if (activeTab === 'weight') renderWeightTab(settings, units, 'WEEK');
    if (activeTab === 'workout') renderWorkoutTab(settings, units, 'WEEK');
    if (activeTab === 'body') renderBodyTab(settings, units, 'WEEK');
    if (activeTab === 'nutrition') renderNutritionTab(settings, units, 'WEEK');
    if (activeTab === 'habits') renderHabitsTab(settings, units, 'WEEK');
  }

  function renderMonth(settings, units) {
    const m = store.monthBreakdown();
    const stats = store.weightStats('30D');
    const streak = store.getWorkoutStreaks();

    if (activeTab === 'overview') {
      container.appendChild(el('section', { class: 'card accent-progress' }, [
        el('p', { class: 'eyebrow', text: m.monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }),
        el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${m.score}%` })]),
        el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${m.score}%` })]),
        el('div', { style: 'margin-top:18px' }, [
          consistency('Workout', m.workoutConsistency),
          consistency('Nutrition', m.nutritionConsistency),
          consistency('Habits', m.habitConsistency),
          consistency('Weight Log', m.weightConsistency)
        ])
      ]));

      /* Calendar */
      const lead = (m.monthStart.getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push(el('span', { class: 'cal-cell empty' }));
      for (const d of m.days) {
        const state = d.future ? 'future'
          : d.score >= 80 ? 'strong'
          : d.score > 0 ? 'partial'
          : d.day.rest ? 'rest' : 'none';
        cells.push(el('span', {
          class: `cal-cell ${state}`,
          title: `${d.date}: ${d.future ? 'upcoming' : d.score + '%'}`,
          text: String(Number(d.date.slice(-2)))
        }));
      }

      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Calendar' }),
        el('div', { class: 'cal-head', style: 'margin-top:12px' },
          ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => el('span', { text: d }))),
        el('div', { class: 'cal-grid' }, cells),
        el('p', { class: 'dim', style: 'font-size:11px;margin-top:8px',
          text: '● 80%+ · ◐ partial · ○ rest · dim = future' })
      ]));

      /* Weight trend */
      if (stats) {
        const series = store.weightSeries('30D');
        container.appendChild(el('section', { class: 'card accent-weight' }, [
          el('p', { class: 'eyebrow', text: '30-Day Weight Trend' }),
          weightChart(series, store.movingAverage(series), { target: goal.target, unit: units }),
          el('div', { class: 'stat-row stat-4', style: 'margin-top:12px' }, [
            statBox('Current', stats.current), statBox('Avg', stats.average),
            statBox('Low', stats.lowest), statBox('High', stats.highest)
          ])
        ]));
      }
    }

    if (activeTab === 'weight') renderWeightTab(settings, units, 'MONTH');
    if (activeTab === 'workout') renderWorkoutTab(settings, units, 'MONTH');
    if (activeTab === 'body') renderBodyTab(settings, units, 'MONTH');
    if (activeTab === 'nutrition') renderNutritionTab(settings, units, 'MONTH');
    if (activeTab === 'habits') renderHabitsTab(settings, units, 'MONTH');
  }

  function renderYear(settings, units) {
    const y = store.yearBreakdown();
    const stats = store.weightStats('1Y');
    const goal = store.weightGoal();
    const streak = store.getWorkoutStreaks();
    const rate = store.getWeightLossRate();
    const projection = store.getGoalProjection();

    if (activeTab === 'overview') {
      container.appendChild(el('section', { class: 'card accent-progress' }, [
        el('p', { class: 'eyebrow', text: String(y.year) }),
        el('div', { class: 'score-line', style: 'margin-top:8px' }, [el('strong', { text: `${y.score}%` })]),
        el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${y.score}%` })]),
        el('div', { style: 'margin-top:18px' }, [yearBars(y.months)]),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:18px' }, [
          statBox('Workouts', y.workouts),
          statBox('Meals', y.meals),
          statBox('Habit Adherence', `${y.habitAdherence}%`),
          statBox('Weight Change', y.weightChange == null ? '—' : `${y.weightChange > 0 ? '+' : ''}${y.weightChange} ${units}`)
        ]),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Best Workout Streak', y.bestWorkoutStreak),
          statBox('Best Habit Streak', y.bestHabitStreak),
          statBox('Current Streak', streak.current),
          statBox('Longest Streak', streak.longest)
        ]),
        rate != null ? el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
          statBox('Weight Loss Rate', `${rate > 0 ? '+' : ''}${rate} ${units}/week`),
          statBox('Trend', rate < 0 ? '▼ Down' : rate > 0 ? '▲ Up' : '→ Stable')
        ]) : null,
        projection ? el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
          statBox('Target Projection', `${projection.weeks} weeks`),
          statBox('Est. Date', projection.dateStr)
        ]) : null
      ]));

      /* Weight chart for year */
      if (stats) {
        const series = store.weightSeries('1Y');
        container.appendChild(el('section', { class: 'card accent-weight' }, [
          el('p', { class: 'eyebrow', text: 'Yearly Weight Trend' }),
          weightChart(series, store.movingAverage(series), { target: goal.target, unit: units }),
          el('div', { class: 'stat-row stat-4', style: 'margin-top:12px' }, [
            statBox('Current', stats.current), statBox('Avg', stats.average),
            statBox('Low', stats.lowest), statBox('High', stats.highest)
          ])
        ]));
      }

      /* Transformation timeline */
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Transformation Timeline' }),
        el('p', { class: 'dim', style: 'font-size:12px;margin:8px 0', text: 'Milestones reached this year' }),
        el('div', { class: 'milestones', style: 'display:flex;gap:12px;flex-wrap:wrap;margin-top:8px' },
          store.getMilestones().map(m => {
            const reached = goal.current != null && goal.current <= m;
            return el('div', { class: `milestone-dot${reached ? ' reached' : ''}`, style: 'display:flex;flex-direction:column;align-items:center;gap:4px' }, [
              el('div', { style: 'width:40px;height:40px;border-radius:50%;border:2px solid ' + (reached ? 'var(--accent)' : 'var(--line)') + ';background:' + (reached ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center' },
                reached ? icon('check') : el('span', { style: 'font-weight:800;color:var(--text-3)', text: `${m}` })),
              el('span', { style: 'font-size:11px;color:var(--text-3)', text: `${m} ${units}` })
            ]);
          })
        )
      ]));
    }

    if (activeTab === 'weight') renderWeightTab(settings, units, 'YEAR');
    if (activeTab === 'workout') renderWorkoutTab(settings, units, 'YEAR');
    if (activeTab === 'body') renderBodyTab(settings, units, 'YEAR');
    if (activeTab === 'nutrition') renderNutritionTab(settings, units, 'YEAR');
    if (activeTab === 'habits') renderHabitsTab(settings, units, 'YEAR');
  }

  /* ---------- Tab renderers ---------- */

  function renderWeightTab(settings, units, period) {
    const rangeMap = { DAY: '7D', WEEK: '7D', MONTH: '30D', YEAR: '1Y' };
    const range = rangeMap[period] || '30D';
    const stats = store.weightStats(range);
    const goal = store.weightGoal();
    const series = store.weightSeries(range);

    if (activePeriod === 'DAY') {
      /* Day weight detail */
      const w = store.weightsOn();
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', text: "Today's Weigh-ins" }),
        el('div', { class: 'check-pair', style: 'margin-top:10px' }, [
          checkSlot('Check-in', w.checkin, units),
          checkSlot('Check-out', w.checkout, units)
        ]),
        w.checkin && w.checkout ? el('div', { class: 'session-delta', style: 'margin-top:16px' }, [
          el('p', { class: 'eyebrow', text: 'Session Change' }),
          el('p', { class: 'delta-value', text: `${((w.checkout.kg - w.checkin.kg) > 0 ? '+' : '')}${Math.round((w.checkout.kg - w.checkin.kg)*10)/10} ${units}` }),
          el('p', { class: 'dim', style: 'font-size:12px;line-height:1.45',
            text: 'Session weight changes are usually influenced by hydration, food, glycogen and fluid loss. Use your longer-term weight trend to evaluate actual weight-loss progress.' })
        ]) : null
      ]));
    } else {
      /* Chart + stats */
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', text: `${period} Weight Trend` }),
        stats ? weightChart(series, store.movingAverage(series), { target: goal.target, unit: units })
          : el('div', { class: 'empty' }, [el('p', { text: 'No weight data in this period.' })]),
        stats ? el('div', { class: 'stat-row stat-4', style: 'margin-top:12px' }, [
          statBox('Current', stats.current), statBox('Average', stats.average),
          statBox('Lowest', stats.lowest), statBox('Highest', stats.highest)
        ]) : null
      ]));
    }

    /* Goal progress */
    if (goal.current != null) {
      container.appendChild(el('section', { class: 'card accent-weight' }, [
        el('p', { class: 'eyebrow', text: 'Goal Progress' }),
        el('div', { class: 'weight-grid' }, [
          metric('Current', String(goal.current), units),
          metric('Target', String(goal.target), units),
          metric('Remaining', goal.remaining != null ? String(goal.remaining) : '—', units)
        ]),
        el('div', { class: 'bar', style: 'margin-top:12px' }, [el('i', { style: `width:${goal.pct}%` })]),
        el('p', { class: 'dim', style: 'font-size:12px;margin-top:8px', text: `${goal.pct}% toward target` })
      ]));
    }

    /* Weight loss rate & projection */
    const rate = store.getWeightLossRate();
    const projection = store.getGoalProjection();
    if (rate != null || projection) {
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Trend Analysis' }),
        rate != null ? el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
          statBox('Weekly Rate', `${rate > 0 ? '+' : ''}${rate} ${units}/week`),
          statBox('Direction', rate < 0 ? '▼ Losing' : rate > 0 ? '▲ Gaining' : '→ Stable')
        ]) : null,
        projection ? el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
          statBox('Est. to Target', `${projection.weeks} weeks`),
          statBox('Est. Date', projection.dateStr)
        ]) : null,
        rate == null && !projection ? el('p', { class: 'dim', style: 'margin-top:10px', text: 'Not enough data for trend analysis. Log more weigh-ins.' }) : null
      ]));
    }

    /* Milestones */
    container.appendChild(el('section', { class: 'card' }, [
      el('p', { class: 'eyebrow', text: 'Milestones' }),
      el('div', { class: 'milestones', style: 'display:flex;gap:12px;flex-wrap:wrap;margin-top:8px' },
        store.getMilestones().map(m => {
          const reached = goal.current != null && goal.current <= m;
          const isTarget = m === goal.target;
          return el('div', { class: `milestone-dot${reached ? ' reached' : ''}`, style: 'display:flex;flex-direction:column;align-items:center;gap:4px' }, [
            el('div', { style: 'width:44px;height:44px;border-radius:50%;border:2px solid ' + (reached ? 'var(--accent)' : 'var(--line)') + ';background:' + (reached ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center' },
              reached ? icon('check') : el('span', { style: 'font-weight:800;color:var(--text-3)', text: `${m}` })),
            el('span', { style: 'font-size:11px;color:var(--text-3)', text: `${m} ${units}` }),
            isTarget && el('span', { class: 'tag tag-accent', style: 'font-size:9px;margin-top:2px', text: 'Primary' })
          ]);
        })
      )
    ]));
  }

  function renderWorkoutTab(settings, units, period) {
    const sessions = store.allSessions ? store.allSessions() : {};
    const prs = store.getAllPRs();
    const exercises = Object.keys(prs).map(id => ({ id, pr: prs[id] }));

    if (activePeriod === 'DAY') {
      const day = dayFor();
      const ids = exercisesOf(day);
      const prog = store.sessionProgress(day.id, ids);
      const session = sessions[store.sessionKey(day.id)];
      const mins = session?.startedAt && session?.endedAt ? Math.round((session.endedAt - session.startedAt)/60000) : null;
      const volume = session ? Object.values(session.ex||{}).flatMap(e=>e.sets.filter(s=>s.done)).reduce((sum,s)=>sum+(Number(s.weight)||0)*(Number(s.reps)||0),0) : 0;

      container.appendChild(el('section', { class: 'card accent-workout' }, [
        el('p', { class: 'eyebrow', text: "Today's Session" }),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Exercises', `${prog.done}/${prog.total}`),
          statBox('Duration', mins ? `${mins}m` : '—'),
          statBox('Volume', volume ? `${Math.round(volume)} ${units}` : '—'),
          statBox('Adherence', `${prog.total ? Math.round((prog.done/prog.total)*100) : 0}%`)
        ])
      ]));
    } else {
      /* Period workout stats */
      const rangeMap = { WEEK: '7D', MONTH: '30D', YEAR: '1Y' };
      const days = period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : 365;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      const cutoffKey = store.dateKey(cutoff);

      let workoutDays = 0, totalEx = 0, totalSets = 0, totalVolume = 0, totalDuration = 0;
      for (const [key, s] of Object.entries(sessions)) {
        const [date] = key.split('|');
        if (date >= cutoffKey && s.endedAt) {
          workoutDays++;
          const entries = Object.values(s.ex||{});
          const doneEx = entries.filter(e=>e.done);
          totalEx += doneEx.length;
          const sets = entries.flatMap(e=>e.sets.filter(x=>x.done));
          totalSets += sets.length;
          totalVolume += sets.reduce((sum,x)=>sum+(Number(x.weight)||0)*(Number(x.reps)||0),0);
          if (s.startedAt) totalDuration += Math.round((s.endedAt - s.startedAt)/60000);
        }
      }

      container.appendChild(el('section', { class: 'card accent-workout' }, [
        el('p', { class: 'eyebrow', text: `${period} Strength Summary` }),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Sessions', workoutDays),
          statBox('Exercises', totalEx),
          statBox('Sets', totalSets),
          statBox('Volume', `${Math.round(totalVolume)} ${units}`)
        ]),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Avg Duration', workoutDays ? `${Math.round(totalDuration/workoutDays)}m` : '—'),
          statBox('Avg Volume/Session', workoutDays ? `${Math.round(totalVolume/workoutDays)} ${units}` : '—'),
          statBox('Avg Sets/Session', workoutDays ? `${Math.round(totalSets/workoutDays)}` : '—'),
          statBox('Frequency', `${workoutDays}/${days} days`)
        ])
      ]));

      /* PRs this period */
      const periodPRs = exercises.filter(e => {
        if (!e.pr.best) return false;
        const prDate = new Date(e.pr.best.date + 'T12:00:00');
        return prDate >= cutoff;
      });

      if (periodPRs.length) {
        container.appendChild(el('section', { class: 'card' }, [
          el('p', { class: 'eyebrow', text: `New PRs (${period})` }),
          ...periodPRs.slice(0, 10).map(({id, pr}) => {
            const ex = getExercise(id);
            return el('div', { class: 'pr-row', style: 'border-bottom:1px solid var(--line-soft);padding:12px 0' }, [
              el('span', { class: 'nm', text: ex?.name || id }),
              el('span', { class: 'v best', text: `${pr.best.weight} ${units} × ${pr.best.reps}` }),
              el('span', { class: 'dim', style: 'font-size:11px', text: pr.best.date })
            ]);
          })
        ]));
      }

      /* Exercise frequency */
      const exFreq = {};
      for (const [key, s] of Object.entries(sessions)) {
        const [date] = key.split('|');
        if (date >= cutoffKey && s.endedAt) {
          for (const [exId, entry] of Object.entries(s.ex||{})) {
            if (entry.done) exFreq[exId] = (exFreq[exId] || 0) + 1;
          }
        }
      }
      const topEx = Object.entries(exFreq).sort((a,b)=>b[1]-a[1]).slice(0, 8);
      if (topEx.length) {
        container.appendChild(el('section', { class: 'card' }, [
          el('p', { class: 'eyebrow', text: 'Most Performed Exercises' }),
          ...topEx.map(([id, count]) => {
            const ex = getExercise(id);
            return el('div', { class: 'row-between', style: 'padding:8px 0;border-bottom:1px solid var(--line-soft)' }, [
              el('span', { class: 'grow', text: ex?.name || id }),
              el('span', { class: 'tag', text: `${count}x` })
            ]);
          })
        ]));
      }
    }
  }

  function renderBodyTab(settings, units, period) {
    const measurements = store.getMeasurements();
    const stats = store.getMeasurementsStats();
    const photos = []; // Would need async, placeholder for now

    if (!measurements.length && !photos.length) {
      container.appendChild(el('section', { class: 'card empty' }, [
        el('p', { text: 'No body measurements recorded yet.' }),
        el('p', { style: 'font-size:13px', text: 'Track waist, chest, arms, legs in Settings or add a measurement entry.' })
      ]));
      return;
    }

    if (stats) {
      const keys = Object.keys(stats).filter(k => stats[k] != null);
      container.appendChild(el('section', { class: 'card' }, [
        el('p', { class: 'eyebrow', text: 'Measurements' }),
        el('div', { class: 'stat-row', style: 'margin-top:10px;grid-template-columns:repeat(auto-fill,minmax(120px,1fr))' },
          keys.map(k => {
            const s = stats[k];
            return el('div', { class: 'stat' }, [
              el('b', { text: s.current + ' cm' }),
              el('span', { text: k.charAt(0).toUpperCase() + k.slice(1) }),
              s.change != null && el('span', { class: s.change < 0 ? 'tag tag-accent' : 'tag', style: 'font-size:10px;margin-top:4px', text: `${s.change > 0 ? '+' : ''}${s.change} cm` })
            ]);
          })
        )
      ]));

      /* Detail per measurement */
      for (const k of keys) {
        const s = stats[k];
        container.appendChild(el('section', { class: 'card', style: 'margin-top:12px' }, [
          el('p', { class: 'eyebrow', text: k.charAt(0).toUpperCase() + k.slice(1) }),
          el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
            statBox('Current', `${s.current} cm`),
            statBox('Previous', s.previous ? `${s.previous} cm` : '—'),
            statBox('30-Day', s.change30 != null ? `${s.change30 > 0 ? '+' : ''}${s.change30} cm` : '—'),
            statBox('All-Time', `${s.changeAll > 0 ? '+' : ''}${s.changeAll} cm`)
          ])
        ]));
      }
    }
  }

  function renderNutritionTab(settings, units, period) {
    const plan = store.getMealPlan();
    const targets = store.getTargets();

    if (period === 'DAY') {
      const b = store.dailyBreakdown();
      const kcalPct = targets.kcal ? Math.min(100, (b.nutrition.kcal / targets.kcal) * 100) : 0;
      const protPct = targets.protein ? Math.min(100, (b.nutrition.protein / targets.protein) * 100) : 0;

      container.appendChild(el('section', { class: 'card accent-nutrition' }, [
        el('p', { class: 'eyebrow', text: "Today's Nutrition" }),
        el('div', { class: 'macro-row', style: 'margin-top:12px' }, [
          el('div', {}, [
            el('p', { class: 'macro-value', text: `≈ ${b.nutrition.kcal} / ${targets.kcal}` }),
            el('p', { class: 'dim', style: 'font-size:11px', text: 'kcal' }),
            el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${kcalPct}%` })])
          ]),
          el('div', {}, [
            el('p', { class: 'macro-value', text: `≈ ${b.nutrition.protein} / ${targets.protein}` }),
            el('p', { class: 'dim', style: 'font-size:11px', text: 'g protein' }),
            el('div', { class: 'bar bar-sm', style: 'margin-top:6px' }, [el('i', { style: `width:${protPct}%` })])
          ])
        ]),
        el('div', { class: 'meal-toggles', style: 'margin-top:14px' }, plan.map(meal => {
          const log = store.getDayLog();
          const done = !!log.meals[meal.id];
          return el('button', {
            class: `meal-toggle${done ? ' done' : ''}`, type: 'button',
            'aria-pressed': String(done),
            onclick: () => { store.setMeal(meal.id, !done); paint(); }
          }, [
            el('span', { class: 'tick', html: done ? icon('check') : '' }),
            el('span', { class: 'grow', text: meal.name }),
            el('span', { class: 'dim', style: 'font-size:11.5px', text: `≈${meal.kcal} kcal` })
          ]);
        }))
      ]));
    } else {
      const days = period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : 365;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      const cutoffKey = store.dateKey(cutoff);

      let totalKcal = 0, totalProtein = 0, mealsDone = 0, daysWithData = 0;
      const allDays = store.allDays ? store.allDays() : {};
      for (const [date, log] of Object.entries(allDays)) {
        if (date >= cutoffKey) {
          const b = store.dailyBreakdown(new Date(date + 'T12:00:00'));
          if (b.nutrition.done > 0 || b.workout.done > 0 || b.habits.done > 0 || b.weight.value > 0) {
            daysWithData++;
            totalKcal += b.nutrition.kcal;
            totalProtein += b.nutrition.protein;
            mealsDone += b.nutrition.done;
          }
        }
      }

      const avgKcal = daysWithData ? Math.round(totalKcal / daysWithData) : 0;
      const avgProtein = daysWithData ? Math.round(totalProtein / daysWithData) : 0;
      const avgMeals = daysWithData ? (mealsDone / daysWithData).toFixed(1) : 0;

      container.appendChild(el('section', { class: 'card accent-nutrition' }, [
        el('p', { class: 'eyebrow', text: `${period} Nutrition Average` }),
        el('div', { class: 'stat-row stat-4', style: 'margin-top:10px' }, [
          statBox('Avg Calories', `≈ ${avgKcal} kcal`),
          statBox('Target', `≈ ${targets.kcal} kcal`),
          statBox('Avg Protein', `≈ ${avgProtein} g`),
          statBox('Target', `≈ ${targets.protein} g`)
        ]),
        el('div', { class: 'stat-row', style: 'margin-top:10px' }, [
          statBox('Avg Meals/Day', `${avgMeals} / ${plan.length}`),
          statBox('Days Tracked', daysWithData)
        ])
      ]));
    }
  }

  function renderHabitsTab(settings, units, period) {
    const habits = store.getHabits();
    const days = period === 'WEEK' ? 7 : period === 'MONTH' ? 30 : 365;
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    const cutoffKey = store.dateKey(cutoff);

    if (period === 'DAY') {
      const b = store.dailyBreakdown();
      const log = store.getDayLog();

      container.appendChild(el('section', { class: 'card accent-habits' }, [
        el('p', { class: 'eyebrow', text: "Today's Habits" }),
        el('div', { class: 'row-between', style: 'margin-top:10px' }, [
          el('span', { text: 'Tracked' }),
          el('span', { class: 'dim', text: `${b.habits.done} / ${b.habits.total}` })
        ]),
        el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${Math.round(b.habits.value*100)}%` })]),
        ...habits.map(h => {
          const entry = log.habits[h.id];
          return el('div', { class: 'row-between', style: 'padding:8px 0;border-bottom:1px solid var(--line-soft)' }, [
            el('span', { class: 'grow', text: h.name }),
            el('span', { class: entry?.tracked ? 'tag tag-accent' : 'tag', text: entry?.tracked ? String(entry.value) : 'Not tracked' })
          ]);
        })
      ]));
    } else {
      /* Period habit summary */
      const habitSummaries = habits.map(h => {
        const totals = store.habitTotals(h.id);
        const streaks = store.habitStreaks(h.id);
        return { habit: h, totals, streaks };
      });

      container.appendChild(el('section', { class: 'card accent-habits' }, [
        el('p', { class: 'eyebrow', text: `${period} Habit Summary` }),
        ...habitSummaries.map(({habit, totals, streaks}) => {
          if (habit.type === 'yesno') return null;
          return el('div', { class: 'stat-row stat-4', style: 'margin-top:10px;padding:12px 0;border-bottom:1px solid var(--line-soft)' }, [
            statBox(`${habit.name} - Today`, totals.day),
            statBox('Week', totals.week),
            statBox('Month', totals.month),
            statBox('Avg/Tracked Day', totals.average)
          ]);
        })
      ]));
    }
  }

  /* ---------- Helpers ---------- */

  function checkSlot(label, entry, units) {
    return el('button', {
      class: `check-slot${entry ? ' filled' : ''}`, type: 'button',
      onclick: () => { /* placeholder */ }
    }, [
      el('span', { class: 'eyebrow', text: label }),
      el('strong', { text: entry ? `${entry.kg}` : '—' }),
      el('span', { class: 'dim', style: 'font-size:11px', text: entry ? `${units} · ${entry.time}` : 'not recorded' })
    ]);
  }

  function metric(label, value, unit) {
    return el('div', { class: 'weight-metric' }, [
      el('p', { class: 'eyebrow', text: label }),
      el('p', { class: 'wm-value' }, [el('strong', { text: value }), el('span', { text: unit })])
    ]);
  }

  function statBox(label, value) {
    return el('div', { class: 'stat' }, [
      el('b', { text: String(value) }),
      el('span', { text: label })
    ]);
  }

  function consistency(label, value) {
    return el('div', { style: 'margin-bottom:12px' }, [
      el('div', { class: 'row-between' }, [
        el('span', { style: 'font-size:13px', text: label }),
        el('span', { class: 'dim', style: 'font-size:13px', text: `${value}%` })
      ]),
      el('div', { class: 'bar bar-sm', style: 'margin-top:5px' }, [el('i', { style: `width:${value}%` })])
    ]);
  }

  function yearBars(months) {
    const rows = document.createElement('div');
    rows.className = 'year-bars';
    for (const m of months) {
      const row = document.createElement('div');
      row.className = 'year-row' + (m.active ? '' : ' idle');
      row.innerHTML =
        `<span class="ym">${m.label}</span>` +
        `<span class="bar bar-sm"><i style="width:${m.score}%"></i></span>` +
        `<span class="yv">${m.active ? m.score + '%' : '—'}</span>`;
      rows.appendChild(row);
    }
    return rows;
  }

  paint();
  return { title: 'Analytics', eyebrow: 'Dashboard', node: container };
}