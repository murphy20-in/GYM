# GYM — Personal Gym Operating System

A mobile-first, offline-capable gym companion: animated form guides for every exercise in your weekly split, plus body-weight, nutrition and habit tracking. Built for GitHub Pages — no backend, no API keys, no dependencies, and nothing leaves your device.

**Live demo:** `https://<your-username>.github.io/<repo-name>/`

---

## Features

| Feature | Description |
|---------|-------------|
| **Animated exercise visuals** | SVG stick-figure animations generated at runtime (forward kinematics) — no external assets, no hotlinking |
| **Complete 6-day program** | Chest/Triceps, Back/Biceps, Quads/Calves ×2, Hamstrings-Glutes/Shoulders |
| **57 unique exercises** | Each with setup, execution, form cues, common mistakes, breathing, safety |
| **Muscle map** | Front + back anatomical silhouette with primary/secondary highlighting |
| **Workout mode** | One exercise at a time, set/rep/weight/RPE logging, big touch targets |
| **Gym check-in / check-out** | Weigh in before and after a session; the difference is labelled session weight change, never fat loss |
| **Weight trend engine** | Causal exponentially-weighted trend, windowed rate of change, confidence rating, milestones, projections |
| **Nutrition tracking** | Your 3-meal plan with per-meal completion and approximate kcal / protein totals |
| **Habit tracking** | Yes/no, count, quantity and duration habits, streaks and 30-day trends; private habits stay collapsed |
| **Daily progress score** | Workout + nutrition + habits + weight-*recording*, with configurable weighting |
| **Day / Week / Month / Year** | Per-day bars, a month calendar, a 12-month rollup and lifetime totals |
| **Progress dashboard** | Weekly completion, personal records, exercise history |
| **Rest timer** | Presets, auto-start after sets, vibration + audio alert |
| **Search & filter** | Instant search by name/muscle/equipment, muscle-group chips |
| **PWA / Offline** | Install to home screen, works fully offline via Service Worker |
| **IndexedDB persistence** | Versioned schema, verified migration, and a rollback snapshot before any destructive operation |
| **Export / import / scoped reset** | Full JSON backup with a validated import preview, and reset one data type at a time |
| **Strength progression** | Estimated 1RM (Epley), heaviest / most reps / best set / best session records, and trend vs the previous session |
| **Set types** | Warm-up, working, drop and failure. Warm-ups are logged but never counted toward volume or records |
| **Previous values** | One tap copies last session's weight, reps and RPE into the grid |
| **Plate calculator** | Per-side loading for a target weight, with a configurable bar |
| **Muscle distribution** | Sets and volume per muscle group, and planned vs actual against the program |
| **Reports** | Monthly report and year in review, navigable back through previous periods |
| **3D anatomy** | Interactive muscle map: rotate, zoom, front/back, tap to identify. Lazy-loaded, never on first paint |
| **Body composition** | 14 circumferences plus body fat, left/right separately, with 30- and 90-day change |
| **Progress photos** | Front / side / back, with side-by-side date comparison. Stored on-device in IndexedDB |
| **Data quality** | Missing weigh-ins, implausible values and partial sessions are reported, never silently corrected |
| **Dark-mode UI** | High contrast, large text, 44px minimum tap targets |

---

## Quick Start (GitHub Pages)

1. **Create a new repository** on GitHub (public or private)
2. **Upload this project** — drag the folder contents into the repo, or:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. **Pages enables itself**
   - The workflow passes `enablement: true` to `actions/configure-pages`, so the
     first successful run switches Pages on with the *GitHub Actions* source.
     No Settings changes are needed.
   - If your org blocks that, do it by hand instead:
     **Settings** → **Pages** → **Build and deployment** → **Source**: *GitHub Actions*
4. **Trigger the first deploy**
   - The workflow runs automatically on push to `main`
   - Or go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**
   - Watch it under the **Actions** tab; the deploy step prints the live URL
5. **Open the generated URL** on your phone
   - It will look like: `https://<your-username>.github.io/<repo-name>/`
6. **Add to Home Screen** (iOS Safari / Android Chrome)
   - Tap the share/menu button → **Add to Home Screen**
   - The app now launches full-screen like a native app

---

## Local Development

```bash
# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8000
# or
php -S localhost:8000
```

Then open `http://localhost:8000` — the Service Worker won't register on `localhost` by design, but everything else works.

---

## Project Structure

```
gym-workout-app/
├── index.html              # App shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (precaches everything)
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment
├── css/
│   ├── base.css            # Tokens, reset, shell, nav, grain
│   ├── components.css      # Cards, buttons, figure, muscle map, timer
│   ├── views.css           # Per-screen layouts
│   ├── tracking.css        # Dashboard, weight, nutrition, habits, calendar
│   ├── editorial.css       # Red/black poster layer, display type
│   └── mindset.css         # Mindset screen
├── js/
│   ├── app.js              # Hash router, app shell
│   ├── ui.js               # DOM helpers, icons, animated figure component
│   ├── figure.js           # Forward-kinematics stick-figure engine
│   ├── muscles.js          # Anatomical muscle map (front + back)
│   ├── storage.js          # Domain layer: sessions, records, weight, meals, habits, scoring
│   ├── db.js               # IndexedDB: documents, photos, backups
│   ├── persist.js          # Storage durability + backup reminders
│   ├── anatomy3d.js        # Procedural 3D muscle map (lazy)
│   ├── timer.js            # Rest timer (WebAudio + vibration)
│   ├── chart.js            # SVG weight-trend chart + year bars (no library)
│   ├── data/
│   │   ├── archetypes.js   # 53 movement archetypes (poses + equipment)
│   │   ├── exercises.js    # 57 exercise definitions
│   │   ├── workouts.js     # Weekly program (7 days)
│   │   ├── plan.js         # Meal plan, habit defaults, milestones, score weights
│   │   └── schema.js       # Schema version, validators, import inspection
│   └── views/
│       ├── dashboard.js    # "Today" — weight, workout, nutrition, habits, score
│       ├── daystrip.js     # Shared Mon–Sun selector
│       ├── weighin.js      # Check-in / check-out capture sheet
│       ├── analytics.js    # Weight / workout / strength / body / nutrition / habits
│       ├── report.js       # Monthly report and year in review
│       ├── sessions.js     # Gym session history
│       ├── backfill.js     # Log a day that already happened
│       ├── bodyAnalytics.js# Measurements, photos, transformation timeline
│       ├── plates.js       # Plate calculator
│       ├── mindset.js      # Mindset poster
│       ├── nutrition.js    # Meal plan + completion
│       ├── habits.js       # Habit tracking, streaks, custom habits
│       ├── workouts.js     # Weekly schedule + day detail
│       ├── workoutMode.js  # One-exercise-at-a-time tracker
│       ├── detail.js       # Exercise detail (visual + form guide)
│       ├── library.js      # Full exercise library (search + filters)
│       ├── progress.js     # Day / week / month / year adherence + records
│       ├── settings.js     # Profile, goal, plan, habits, data management
│       └── setgrid.js      # Set/rep/weight/RPE logger
│   └── vendor/             # three.js (lazy-loaded, MIT — see THREE-LICENSE.txt)
└── assets/
    ├── icons/              # PWA icons (SVG + PNG)
    └── img/                # Red-graded imagery (WebP)
```

---

## How It Works

### Exercise Visuals (The Core Feature)

Every exercise uses an **archetype** — a reusable movement pattern defined by:
- Start pose (joint angles)
- End pose (joint angles)
- Equipment props (bench, barbell, cable, etc.)
- Range-of-motion arrow

The `figure.js` engine interpolates between poses using forward kinematics, so the limbs move in anatomically plausible arcs. Exercises sharing a movement pattern (e.g., all flat bench presses) reuse one archetype — they only differ in the implement shown (barbell vs dumbbell).

This means:
- **Zero external dependencies** — no GIFs, no YouTube embeds, no CDN
- **Tiny bundle** — the entire visual system is ~450 lines of vanilla JS
- **Works offline** — everything is precached by the Service Worker
- **Respects `prefers-reduced-motion`** — holds a readable mid-frame

### Data Flow

```
workouts.js (weekly program)
    → references exercise IDs
exercises.js (57 definitions)
    → references archetype IDs
archetypes.js (53 movement patterns)
    → drives figure.js animations
muscles.js (anatomical regions)
    → drives muscle-map highlighting
plan.js (meal plan, habits, milestones)
    → drives nutrition + habit tracking
storage.js (localStorage)
    → persists sessions, PRs, weight, meals, habits, settings
    → computes daily / weekly / monthly / yearly progress
```

### Adding a New Exercise

1. Add an entry to `js/data/exercises.js` (copy an existing one as template)
2. If the movement pattern is new, add an archetype to `js/data/archetypes.js`
3. Reference the exercise ID in `js/data/workouts.js`
4. Done — it appears in the library, detail screen, and workout mode automatically

---

## How the numbers are calculated

Every metric has one formula, applied consistently:

| Metric | Formula |
|--------|---------|
| **Volume** | `sum(weight × reps)` over completed **working** sets. Warm-ups excluded; a set with no weight adds nothing |
| **Trend weight** | Causal exponentially-weighted average of daily readings, half-life 7 days, decaying on elapsed days so gaps do not distort it |
| **Rate of change** | Least-squares fit over the last 21 days of **raw** readings. Fitting the smoothed line instead would inherit its lag and report a plateau as a loss |
| **Estimated 1RM** | Epley: `w × (1 + reps/30)`. Labelled an estimate everywhere — it is never a tested max |
| **Muscle distribution** | A set counts fully for the exercise's primary muscles, half for its secondaries |
| **Workout adherence** | completed planned sessions ÷ planned sessions |
| **Meal adherence** | completed meals ÷ planned meals |

**Trend quality** (`GOOD` / `FAIR` / `NOT ENOUGH DATA`) is derived from sample
count, density and scatter. Goal projections are withheld below the threshold,
because a projection built on a two-week line is false precision.

---

## Storage

Core data lives in **IndexedDB**, hydrated into memory at boot so every view can
read synchronously. Writes update memory and flush asynchronously, plus on
tab-hide and pagehide so a backgrounded phone cannot lose an entry.

The migration from localStorage snapshots to a backup store first, writes in one
transaction, verifies every document byte-for-byte, and only then records the
schema version. localStorage is never cleared, so a bad upgrade is recoverable,
and private mode falls back to it silently.

Imports are validated against a schema before anything is written, with a
preview showing record counts and exactly what would be skipped.

---

## How Progress Is Measured

Four things are tracked separately, on purpose — rolling them into one
"fat loss %" would invent a number the data cannot support.

| Metric | What it means |
|--------|---------------|
| **Workout progress** | Exercises completed out of those scheduled |
| **Nutrition adherence** | Meals marked complete out of the plan |
| **Habit adherence** | Days a habit met its own aim (0 cigarettes, 8 glasses of water…) |
| **Weight tracking** | Whether a measurement was **recorded** — never whether it went down |

The **daily score** blends workout 30% / nutrition 30% / habits 25% /
weight-recording 15% (all configurable in Settings). Two rules are deliberate:

- A **heavier reading can never lower your score.** Body weight moves with
  hydration, food and glycogen; only recording it counts.
- On rest days the workout share is **redistributed**, not counted as a miss.

Averages only include days that actually have data, so a year does not read as
"18%" simply because you started tracking in July.

### Weight goal

Your target is a **range** (default 70–75 kg) with a primary target (72.5 kg).
The starting weight is captured at your first weigh-in and is editable in
Settings. Milestones tick off as the current weight passes them, and remaining
weight never displays as negative.

---

## Privacy

Everything is stored in `localStorage` on the device. There is no account, no
server, no analytics and no third-party requests — the app is entirely static
files, which is also why it works offline. Habit data in particular never
leaves the device.

Because it is local-only, clearing browser data erases it. Use
**Settings → Export my data** to keep a JSON backup, and **Import** to restore
it on another device.

---

## Customization

### Settings (in-app)

| Setting | Purpose |
|---------|---------|
| **Name** | Shown in greeting on home screen |
| **Primary goal** | Adjusts rep/rest suggestions shown alongside sets |
| **Training experience** | For your reference |
| **Units** | `kg` or `lb` — used everywhere |
| **Default sets** | Rows shown in the set logger |
| **Default reps** | Placeholder in reps field |
| **Rest timer** | Default rest length (auto-start after a set) |
| **Starting weight** | Captured at your first weigh-in; editable afterwards |
| **Target weight & range** | Primary target inside a low/high range (default 70–75 kg) |
| **Daily calories / protein** | Leave blank to total the meal plan automatically |
| **Meal plan** | Rename meals, edit items, adjust approximate kcal and protein |
| **Habits** | Make a habit private or open; add and remove from the Habits screen |
| **Daily score weighting** | Rebalance workout / nutrition / habits / weight-recording |
| **Export · Import · Reset** | JSON backup, restore, and per-data-type resets |

### Changing the Program

Edit `js/data/workouts.js`:
- `WEEK` array — 7 day objects, each with `sections` containing exercise IDs
- `rest: true` marks a rest day (skipped in workout mode)
- Reorder, add, or remove days/exercises as needed

### Exercise Form Guidance

Each exercise in `exercises.js` contains:
- `quickForm` — 6 lines readable in 5–10 seconds
- `setup` / `instructions` — detailed steps
- `formCues` — good-form checkmarks
- `commonMistakes` — watch-out warnings
- `breathing` — eccentric/concentric cues
- `safetyNotes` — exercise-specific + universal rules

---

## Browser Support

| Feature | Minimum |
|---------|---------|
| ES Modules | Chrome 61, Firefox 60, Safari 11, Edge 79 |
| Service Worker | Chrome 40, Firefox 44, Safari 11.1 |
| `localStorage` | All modern browsers |
| `navigator.vibrate` | Android Chrome, iOS 13+ (no-op if unsupported) |
| WebAudio (timer beep) | All modern browsers |

The app gracefully degrades: no animation on reduced-motion, no vibration on unsupported platforms, timer works without audio.

---

## License

MIT — use it, modify it, share it.

---

## Acknowledgements

- Exercise selection & form guidance based on standard resistance-training practice
- Anatomical regions simplified for clarity — not a medical reference
- Built with vanilla HTML/CSS/JS — zero framework dependencies
