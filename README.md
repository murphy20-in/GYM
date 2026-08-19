# GYM — Personal Workout Companion

A mobile-first, offline-capable gym workout visualizer with animated form guides for every exercise in your weekly split. Built for GitHub Pages — no backend, no API keys, no dependencies.

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
| **Progress dashboard** | Weekly completion, personal records, exercise history |
| **Rest timer** | Presets, auto-start after sets, vibration + audio alert |
| **Search & filter** | Instant search by name/muscle/equipment, muscle-group chips |
| **PWA / Offline** | Install to home screen, works fully offline via Service Worker |
| **localStorage persistence** | Sessions, PRs, settings survive browser restarts |
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
3. **Enable GitHub Pages**
   - Open the repo → **Settings** → **Pages** (left sidebar)
   - **Build and deployment** → **Source**: *GitHub Actions*
4. **Trigger the first deploy**
   - The workflow runs automatically on push to `main`
   - Or go to **Actions** → **Deploy to GitHub Pages** → **Run workflow**
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
│   ├── base.css            # Tokens, reset, shell, nav
│   ├── components.css      # Cards, buttons, figure, muscle map, timer
│   └── views.css           # Per-screen layouts
├── js/
│   ├── app.js              # Hash router, app shell
│   ├── ui.js               # DOM helpers, icons, animated figure component
│   ├── figure.js           # Forward-kinematics stick-figure engine
│   ├── muscles.js          # Anatomical muscle map (front + back)
│   ├── storage.js          # localStorage (sessions, PRs, settings)
│   ├── timer.js            # Rest timer (WebAudio + vibration)
│   ├── data/
│   │   ├── archetypes.js   # 27 movement archetypes (poses + equipment)
│   │   ├── exercises.js    # 57 exercise definitions
│   │   └── workouts.js     # Weekly program (7 days)
│   └── views/
│       ├── home.js         # Today's dashboard
│       ├── workouts.js     # Weekly schedule + day detail
│       ├── workoutMode.js  # One-exercise-at-a-time tracker
│       ├── detail.js       # Exercise detail (visual + form guide)
│       ├── library.js      # Full exercise library (search + filters)
│       ├── progress.js     # Weekly completion, PRs, history
│       ├── settings.js     # Profile, defaults, data export/import
│       └── setgrid.js      # Set/rep/weight/RPE logger
└── assets/
    └── icons/              # PWA icons (SVG + PNG)
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
archetypes.js (27 movement patterns)
    → drives figure.js animations
muscles.js (anatomical regions)
    → drives muscle-map highlighting
storage.js (localStorage)
    → persists sessions, PRs, settings
```

### Adding a New Exercise

1. Add an entry to `js/data/exercises.js` (copy an existing one as template)
2. If the movement pattern is new, add an archetype to `js/data/archetypes.js`
3. Reference the exercise ID in `js/data/workouts.js`
4. Done — it appears in the library, detail screen, and workout mode automatically

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
