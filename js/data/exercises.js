/* exercises.js — the exercise database.
 *
 * One definition per movement, referenced by id from the weekly program, so an
 * exercise that appears on two days (Pec Deck, Rope Pushdown, Hammer Curl)
 * exists exactly once here.
 *
 * `archetype` points at the visual in archetypes.js. `primary` / `secondary`
 * are muscle-map region keys; `targetMuscles` is the human-readable version.
 */

const BASE_SAFETY = [
  'Start with a load you can control for every rep of the set.',
  'Keep the movement deliberate — no bouncing, swinging or dropping the weight.',
  'Stop the set if you feel sharp or unfamiliar pain, then reassess technique and load.',
  'Technique first, load second. Add weight only when the current weight moves cleanly.'
];

const RAW = [

  /* ==================== CHEST ==================== */
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Barbell + Bench',
    difficulty: 'Intermediate',
    archetype: 'benchFlat',
    primary: ['chest'], secondary: ['triceps', 'frontDelt'],
    targetMuscles: ['Pectoralis Major', 'Triceps Brachii', 'Anterior Deltoid'],
    tempo: '2s down · brief pause · drive up',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you press' },
    quickForm: [
      'Shoulder blades pulled back and down',
      'Feet flat, whole body tight',
      'Grip a little wider than shoulders',
      'Lower to the lower chest under control',
      'Elbows at roughly 45–75° from the torso',
      'Press up and slightly back'
    ],
    setup: [
      'Lie back so your eyes are under the bar.',
      'Pull your shoulder blades back and down into the bench and keep them there.',
      'Grip slightly wider than shoulder width with the bar over the base of your palms.'
    ],
    instructions: [
      'Unrack the bar and bring it over your shoulders with straight arms.',
      'Lower the bar under control to your lower chest, keeping your elbows moderately tucked.',
      'Touch the chest lightly, or stop just short if your shoulders prefer that range.',
      'Press the bar back up and slightly toward your face until your arms are straight.',
      'Reset your breath at the top and repeat.'
    ],
    formCues: [
      'Keep the shoulder blades retracted for the whole set.',
      'Wrists stacked over the elbows, not bent back.',
      'Push your feet into the floor to stay stable.',
      'Bar path is a shallow arc, not a straight vertical line.'
    ],
    commonMistakes: [
      'Elbows flared straight out to the sides.',
      'Bouncing the bar off the chest.',
      'Hips lifting off the bench.',
      'Letting the shoulders roll forward at the bottom.'
    ],
    safetyNotes: ['Use a spotter or safety pins when pressing near your limit.']
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Dumbbells + Incline Bench',
    difficulty: 'Beginner',
    archetype: 'benchIncline', implement: 'dumbbell',
    primary: ['chest'], secondary: ['frontDelt', 'triceps'],
    targetMuscles: ['Upper Pectoralis Major', 'Anterior Deltoid', 'Triceps Brachii'],
    tempo: '2s down · smooth press up',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you press' },
    quickForm: [
      'Bench set around 30–45°',
      'Shoulder blades set back',
      'Dumbbells over the upper chest',
      'Lower until you feel a stretch, not strain',
      'Elbows under the wrists',
      'Press up without clashing the bells'
    ],
    setup: [
      'Set the bench to roughly 30–45°.',
      'Sit with a dumbbell on each thigh, then kick them up as you lie back.',
      'Set your shoulder blades back against the pad before the first rep.'
    ],
    instructions: [
      'Start with the dumbbells over your upper chest, arms straight.',
      'Lower them under control until your upper arms are around chest level.',
      'Keep your forearms vertical so the wrists stay stacked over the elbows.',
      'Press back up and slightly inward until your arms are straight.'
    ],
    formCues: [
      'Chest stays lifted throughout.',
      'Lower to a stretch you can control, not the deepest possible range.',
      'Keep both dumbbells moving at the same speed.',
      'Head, upper back and glutes stay in contact with the bench.'
    ],
    commonMistakes: [
      'Bench angled too steeply, turning it into a shoulder press.',
      'Letting the elbows drift behind the body at the bottom.',
      'Banging the dumbbells together at the top.',
      'Arching hard off the bench to move heavier weight.'
    ]
  },
  {
    id: 'machine-chest-press',
    name: 'Machine Chest Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Chest Press Machine',
    difficulty: 'Beginner',
    archetype: 'machinePress',
    primary: ['chest'], secondary: ['triceps', 'frontDelt'],
    targetMuscles: ['Pectoralis Major', 'Triceps Brachii', 'Anterior Deltoid'],
    tempo: '2s back · 1s press',
    breathing: { eccentric: 'Inhale as the handles come back', concentric: 'Exhale as you press' },
    quickForm: [
      'Seat height puts handles at mid-chest',
      'Back and shoulders against the pad',
      'Handles level with the lower chest',
      'Press forward, do not shrug',
      'Control the return',
      'Stop just short of a locked-out slam'
    ],
    setup: [
      'Adjust the seat so the handles sit at mid-chest height.',
      'Sit tall with your back against the pad and feet flat on the floor.',
      'Take the handles with a full grip and set your shoulders down.'
    ],
    instructions: [
      'Press the handles forward until your arms are nearly straight.',
      'Keep your shoulders down and back against the pad.',
      'Return the handles under control until you feel a comfortable chest stretch.',
      'Pause briefly, then press again without letting the stack rest.'
    ],
    formCues: [
      'Keep your chest up and shoulders back the whole time.',
      'Push through the palms, not the fingertips.',
      'Elbows travel just below shoulder height.',
      'Same speed out and back.'
    ],
    commonMistakes: [
      'Seat set too low or too high, forcing awkward shoulder angles.',
      'Shoulders rolling forward as you press.',
      'Letting the weight stack crash on the return.',
      'Holding your breath through the whole set.'
    ]
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Cable Machine (high pulleys)',
    difficulty: 'Beginner',
    archetype: 'cableCrossover',
    primary: ['chest'], secondary: ['frontDelt'],
    targetMuscles: ['Pectoralis Major (sternal)', 'Anterior Deltoid'],
    tempo: '2s open · squeeze at the finish',
    breathing: { eccentric: 'Inhale as the arms open', concentric: 'Exhale as you bring them together' },
    quickForm: [
      'Pulleys set high',
      'Split stance, slight forward lean',
      'Soft, fixed elbow bend',
      'Sweep hands down and together',
      'Squeeze at the finish',
      'Open back out under control'
    ],
    setup: [
      'Set both pulleys high and select a light-to-moderate weight.',
      'Take a handle in each hand and step forward into a split stance.',
      'Lean forward slightly with your chest up and core braced.'
    ],
    instructions: [
      'Start with your arms open, hands high and out to the sides.',
      'Sweep your hands down and together in front of your hips, elbows softly bent.',
      'Squeeze your chest briefly where the hands meet.',
      'Let your arms open back out slowly until you feel a chest stretch.'
    ],
    formCues: [
      'The elbow angle stays roughly fixed — this is a sweep, not a press.',
      'Move from the shoulder joint, keeping the torso still.',
      'Keep tension on the cables at both ends of the range.',
      'Ribs down, no big lower-back arch.'
    ],
    commonMistakes: [
      'Going so heavy it turns into a press.',
      'Letting the arms straighten and lock at the finish.',
      'Rocking the torso to move the handles.',
      'Over-stretching at the top with a loose shoulder position.'
    ]
  },
  {
    id: 'pec-deck',
    name: 'Pec Deck',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Pec Deck Machine',
    difficulty: 'Beginner',
    archetype: 'pecDeck',
    primary: ['chest'], secondary: ['frontDelt'],
    targetMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
    tempo: '2s open · 1s squeeze',
    breathing: { eccentric: 'Inhale as the arms open', concentric: 'Exhale as you squeeze' },
    quickForm: [
      'Seat height puts elbows at chest level',
      'Back flat against the pad',
      'Forearms on the pads',
      'Squeeze elbows together',
      'Open only to a comfortable stretch',
      'Keep shoulders down'
    ],
    setup: [
      'Set the seat so your elbows sit at about chest height on the pads.',
      'Sit back with your whole back against the pad.',
      'Place your forearms on the pads with a light grip.'
    ],
    instructions: [
      'Bring the pads together in front of your chest by driving with the elbows.',
      'Hold the squeeze for about a second.',
      'Let the pads open back out slowly to a comfortable stretch.',
      'Stop the stretch before your shoulders roll forward.'
    ],
    formCues: [
      'Push with the forearms and elbows, not the hands.',
      'Keep the shoulders pulled back and down.',
      'Chest stays tall — do not collapse forward at the finish.',
      'Same tempo both directions.'
    ],
    commonMistakes: [
      'Opening too far and stressing the front of the shoulder.',
      'Using momentum and letting the stack bang.',
      'Shrugging the shoulders up during the squeeze.',
      'Gripping hard and turning it into an arm exercise.'
    ]
  },
  {
    id: 'incline-barbell-press',
    name: 'Incline Barbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell + Incline Bench',
    difficulty: 'Intermediate',
    archetype: 'benchIncline',
    primary: ['chest'], secondary: ['frontDelt', 'triceps'],
    targetMuscles: ['Upper Pectoralis Major', 'Anterior Deltoid', 'Triceps Brachii'],
    tempo: '2s down · drive up',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you press' },
    quickForm: [
      'Bench around 30–45°',
      'Shoulder blades set back',
      'Grip slightly wider than shoulders',
      'Lower to the upper chest',
      'Elbows moderately tucked',
      'Press straight up over the shoulders'
    ],
    setup: [
      'Set the bench to roughly 30–45° and position yourself under the bar.',
      'Set your shoulder blades back and down against the pad.',
      'Grip slightly wider than shoulder width.'
    ],
    instructions: [
      'Unrack and hold the bar over your upper chest with straight arms.',
      'Lower the bar under control toward the top of your chest, just below the collarbones.',
      'Keep the elbows moderately tucked rather than flared wide.',
      'Press the bar back up until your arms are straight.'
    ],
    formCues: [
      'Chest stays up and shoulder blades stay pinned.',
      'Wrists stacked over the elbows.',
      'Feet planted and driving into the floor.',
      'Control the descent — do not let the bar drop.'
    ],
    commonMistakes: [
      'Setting the bench too steep, shifting the work to the shoulders.',
      'Touching too low on the chest for the incline angle.',
      'Letting the elbows flare to 90°.',
      'Lifting the hips to help the bar up.'
    ],
    safetyNotes: ['Use a spotter or safety pins on heavy sets.']
  },
  {
    id: 'flat-dumbbell-press',
    name: 'Flat Dumbbell Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps', 'Front Delts'],
    equipment: 'Dumbbells + Flat Bench',
    difficulty: 'Beginner',
    archetype: 'benchFlat', implement: 'dumbbell',
    primary: ['chest'], secondary: ['triceps', 'frontDelt'],
    targetMuscles: ['Pectoralis Major', 'Triceps Brachii', 'Anterior Deltoid'],
    tempo: '2s down · smooth press',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you press' },
    quickForm: [
      'Shoulder blades back and down',
      'Dumbbells over the mid-chest',
      'Forearms vertical',
      'Lower to a controlled stretch',
      'Press up and slightly together',
      'Feet planted'
    ],
    setup: [
      'Sit on the bench with a dumbbell on each thigh.',
      'Kick the dumbbells up as you lie back, then set your shoulder blades.',
      'Start with the dumbbells over your mid-chest, arms straight.'
    ],
    instructions: [
      'Lower both dumbbells under control until your upper arms are about level with your torso.',
      'Keep the forearms vertical and the wrists stacked.',
      'Press back up and slightly inward until your arms are straight.',
      'Keep a small gap between the dumbbells at the top.'
    ],
    formCues: [
      'Both arms move at the same speed.',
      'Keep your chest up and shoulders back.',
      'Control the stretch — depth is individual.',
      'Set the dumbbells down safely on your thighs, not the floor overhead.'
    ],
    commonMistakes: [
      'Dropping the elbows far below the bench with a loose shoulder position.',
      'Letting the dumbbells drift toward the head.',
      'Clanging the dumbbells together each rep.',
      'Losing the shoulder-blade set once the set gets hard.'
    ]
  },
  {
    id: 'decline-machine-press',
    name: 'Decline Machine Press',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Triceps'],
    equipment: 'Decline Press Machine',
    difficulty: 'Beginner',
    archetype: 'machineDecline',
    primary: ['chest'], secondary: ['triceps', 'frontDelt'],
    targetMuscles: ['Lower Pectoralis Major', 'Triceps Brachii'],
    tempo: '2s back · 1s press',
    breathing: { eccentric: 'Inhale on the return', concentric: 'Exhale as you press' },
    quickForm: [
      'Seat set so handles sit at lower chest',
      'Back flat on the pad',
      'Press down and forward',
      'Elbows track slightly tucked',
      'Control the return',
      'Shoulders stay back'
    ],
    setup: [
      'Set the seat so the handles line up with your lower chest.',
      'Sit back with your shoulders and back against the pad.',
      'Grip the handles and set your shoulder blades down.'
    ],
    instructions: [
      'Press the handles forward and slightly down until your arms are nearly straight.',
      'Keep your shoulders pinned to the pad.',
      'Return under control to a comfortable stretch at the lower chest.',
      'Repeat without letting the stack rest between reps.'
    ],
    formCues: [
      'Think about pushing your lower chest into the handles.',
      'Elbows stay under the hands.',
      'Keep the neck relaxed against the pad.',
      'Even tempo out and back.'
    ],
    commonMistakes: [
      'Shrugging the shoulders forward on each press.',
      'Half-repping through the easiest part of the range.',
      'Letting the weight yank the arms back at the end of the set.',
      'Gripping so hard the forearms fatigue first.'
    ]
  },
  {
    id: 'low-to-high-cable-fly',
    name: 'Low-to-High Cable Fly',
    muscleGroup: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Cable Machine (low pulleys)',
    difficulty: 'Beginner',
    archetype: 'cableFlyLow',
    primary: ['chest'], secondary: ['frontDelt'],
    targetMuscles: ['Upper Pectoralis Major', 'Anterior Deltoid'],
    tempo: '2s down · squeeze up',
    breathing: { eccentric: 'Inhale as the arms lower', concentric: 'Exhale as you sweep up' },
    quickForm: [
      'Pulleys set low',
      'Split stance, chest tall',
      'Soft fixed elbow bend',
      'Sweep hands up and together',
      'Finish around upper-chest height',
      'Lower slowly under tension'
    ],
    setup: [
      'Set both pulleys at the lowest position and choose a light weight.',
      'Take a handle in each hand and step forward into a split stance.',
      'Stand tall with your chest up and arms down at your sides.'
    ],
    instructions: [
      'Sweep both hands up and inward toward the centre of your upper chest.',
      'Keep a soft, fixed bend in the elbows the whole way.',
      'Squeeze briefly where your hands meet.',
      'Lower your arms back down slowly, keeping tension on the cables.'
    ],
    formCues: [
      'Lead with the upper arms, not the hands.',
      'Keep the torso still — no rocking or leaning back.',
      'Finish at upper-chest height, not above the head.',
      'Light weight, clean path.'
    ],
    commonMistakes: [
      'Turning it into a front raise by going too high.',
      'Bending and straightening the elbows to move more weight.',
      'Leaning back to help the arms up.',
      'Rushing the lowering phase.'
    ]
  },

  /* ==================== TRICEPS ==================== */
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Chest', 'Front Delts'],
    equipment: 'Barbell + Bench',
    difficulty: 'Intermediate',
    archetype: 'benchClose',
    primary: ['triceps'], secondary: ['chest', 'frontDelt'],
    targetMuscles: ['Triceps Brachii', 'Pectoralis Major', 'Anterior Deltoid'],
    tempo: '2s down · press up',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you press' },
    quickForm: [
      'Grip about shoulder width',
      'Elbows tucked close to the ribs',
      'Lower to the lower chest',
      'Wrists stacked over elbows',
      'Press up in a straight line',
      'Shoulder blades stay set'
    ],
    setup: [
      'Lie back and grip the bar at roughly shoulder width — not narrower.',
      'Set your shoulder blades back and down.',
      'Plant your feet and brace your midsection.'
    ],
    instructions: [
      'Unrack the bar and hold it over your lower chest with straight arms.',
      'Lower the bar with your elbows tucked close to your sides.',
      'Touch lightly at the lower chest or just below.',
      'Press back up by straightening the elbows, keeping them tucked.'
    ],
    formCues: [
      'Keep the wrists straight — a very narrow grip strains them.',
      'Elbows travel forward and back, not out to the sides.',
      'Drive through the heel of the palm.',
      'Bar path stays close to vertical.'
    ],
    commonMistakes: [
      'Gripping far too narrow, which loads the wrists.',
      'Flaring the elbows once the set gets hard.',
      'Bouncing the bar off the chest.',
      'Letting the bar drift up toward the throat.'
    ],
    safetyNotes: ['Use a spotter or safety pins on heavy sets — the bar sits over your chest.']
  },
  {
    id: 'rope-pushdown',
    name: 'Rope Pushdown',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable Machine + Rope',
    difficulty: 'Beginner',
    archetype: 'pushdown',
    primary: ['triceps'], secondary: ['forearms'],
    targetMuscles: ['Triceps Brachii (all three heads)'],
    tempo: '1s down · 2s back up',
    breathing: { eccentric: 'Inhale as the rope returns', concentric: 'Exhale as you push down' },
    quickForm: [
      'Pulley set high',
      'Elbows pinned at your sides',
      'Slight forward lean',
      'Push down and slightly apart',
      'Full lockout, brief squeeze',
      'Control the rope back up'
    ],
    setup: [
      'Attach a rope to a high pulley and take one end in each hand.',
      'Stand a step back with a slight forward lean and soft knees.',
      'Tuck your elbows against your sides.'
    ],
    instructions: [
      'Start with your forearms around parallel to the floor and elbows tucked.',
      'Push the rope down by straightening the elbows, spreading the ends apart at the bottom.',
      'Hold the locked-out position for a moment.',
      'Let the rope come back up slowly until your forearms return to the start.'
    ],
    formCues: [
      'The upper arms do not move — only the forearms.',
      'Keep the shoulders down and away from the ears.',
      'Brace the core so the torso stays still.',
      'Squeeze the triceps rather than pushing with the body.'
    ],
    commonMistakes: [
      'Letting the elbows drift forward and away from the ribs.',
      'Leaning over the weight to force reps out.',
      'Cutting the range short at the top.',
      'Shrugging the shoulders on each rep.'
    ]
  },
  {
    id: 'overhead-cable-extension',
    name: 'Overhead Cable Extension',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable Machine + Rope',
    difficulty: 'Intermediate',
    archetype: 'overheadCableExt',
    primary: ['triceps'], secondary: [],
    targetMuscles: ['Triceps Brachii (long head)'],
    tempo: '2s stretch · 1s extend',
    breathing: { eccentric: 'Inhale as the hands come back', concentric: 'Exhale as you extend' },
    quickForm: [
      'Face away from the pulley',
      'Split stance, ribs down',
      'Upper arms beside the head',
      'Extend the elbows forward',
      'Feel the stretch behind the arm',
      'Keep elbows from flaring wide'
    ],
    setup: [
      'Attach a rope to a high pulley and face away from the machine.',
      'Take the rope overhead with your upper arms beside your head.',
      'Step into a split stance and lean slightly forward.'
    ],
    instructions: [
      'Let your forearms bend back behind your head into a stretch.',
      'Extend your elbows until your arms are straight, forward and slightly up.',
      'Keep your upper arms roughly in place beside your ears.',
      'Return under control until you feel the stretch again.'
    ],
    formCues: [
      'Keep the ribs down — do not arch the lower back.',
      'The elbows stay pointing forward, not out wide.',
      'Only the forearms move.',
      'Choose a weight that lets you control the stretch.'
    ],
    commonMistakes: [
      'Arching the lower back to compensate.',
      'Letting the elbows flare out to the sides.',
      'Moving the upper arms up and down with each rep.',
      'Going too heavy and losing the overhead position.'
    ],
    safetyNotes: ['If your shoulders feel pinched overhead, reduce the range or use the dumbbell version.']
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Barbell + Bench',
    difficulty: 'Intermediate',
    archetype: 'skullcrusher',
    primary: ['triceps'], secondary: [],
    targetMuscles: ['Triceps Brachii (long and lateral heads)'],
    tempo: '2s down · 1s extend',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you extend' },
    quickForm: [
      'Lie flat, arms over the shoulders',
      'Upper arms angled back slightly',
      'Bend only at the elbows',
      'Lower toward the forehead or just behind',
      'Extend without locking harshly',
      'Keep the wrists neutral'
    ],
    setup: [
      'Lie flat on the bench holding the bar over your shoulders with straight arms.',
      'Angle the upper arms slightly back toward your head.',
      'Set your feet and brace your midsection.'
    ],
    instructions: [
      'Bend at the elbows to lower the bar toward your forehead or just behind your head.',
      'Keep the upper arms still — only the forearms move.',
      'Stop where you can still control the bar.',
      'Extend the elbows to bring the bar back over your shoulders.'
    ],
    formCues: [
      'Elbows stay roughly shoulder width apart.',
      'Keep the wrists straight and the grip firm.',
      'Slow on the way down, controlled on the way up.',
      'Do not let the shoulders roll forward.'
    ],
    commonMistakes: [
      'Letting the elbows flare wide on each rep.',
      'Turning it into a pullover by swinging the upper arms.',
      'Lowering faster than you can control.',
      'Going heavy enough that the elbows feel strained.'
    ],
    safetyNotes: ['Elbow discomfort is common with a straight bar — switch to an EZ-bar or dumbbells if so.']
  },
  {
    id: 'single-arm-pushdown',
    name: 'Single-Arm Pushdown',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Cable Machine + Single Handle',
    difficulty: 'Beginner',
    archetype: 'pushdownSingle',
    primary: ['triceps'], secondary: ['forearms'],
    targetMuscles: ['Triceps Brachii (lateral head emphasis)'],
    tempo: '1s down · 2s up',
    breathing: { eccentric: 'Inhale on the return', concentric: 'Exhale as you push down' },
    quickForm: [
      'High pulley, single handle',
      'Elbow pinned to your side',
      'Stand square to the machine',
      'Push down to a full lockout',
      'Return slowly',
      'Match reps on both arms'
    ],
    setup: [
      'Attach a single handle to a high pulley.',
      'Grip it with one hand and tuck that elbow against your side.',
      'Stand tall with a slight forward lean and brace your core.'
    ],
    instructions: [
      'Start with the forearm around parallel to the floor.',
      'Push the handle down until the arm is fully straight.',
      'Hold the contraction briefly.',
      'Let the handle rise slowly back to the start, keeping the elbow tucked.'
    ],
    formCues: [
      'The free hand can rest on the hip for stability.',
      'Do not rotate the torso to help the arm.',
      'Keep the shoulder down and back.',
      'Same tempo on both sides.'
    ],
    commonMistakes: [
      'Twisting the body into the rep.',
      'Elbow drifting forward off the ribs.',
      'Using a much heavier weight on the stronger arm.',
      'Cutting the top of the range short.'
    ]
  },
  {
    id: 'dips',
    name: 'Dips',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Chest', 'Front Delts'],
    equipment: 'Parallel Bars / Dip Station',
    difficulty: 'Advanced',
    archetype: 'dip',
    primary: ['triceps'], secondary: ['chest', 'frontDelt'],
    targetMuscles: ['Triceps Brachii', 'Lower Pectoralis Major', 'Anterior Deltoid'],
    tempo: '2s down · press up',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you press up' },
    quickForm: [
      'Start with arms straight, shoulders down',
      'Torso close to upright for triceps',
      'Elbows tucked back, not flared',
      'Lower to a comfortable depth',
      'Press up to a straight-arm finish',
      'Keep the body tight'
    ],
    setup: [
      'Grip the bars and press up to a straight-arm support position.',
      'Pull your shoulders down away from your ears.',
      'Cross your ankles behind you and brace your midsection.'
    ],
    instructions: [
      'Lower yourself by bending the elbows, keeping them tucked back.',
      'Stay close to upright to bias the triceps; lean forward to bias the chest.',
      'Descend to around 90° at the elbow, or the deepest range your shoulders tolerate.',
      'Press back up until your arms are straight.'
    ],
    formCues: [
      'Shoulders stay down and back at the bottom.',
      'Control the descent rather than dropping.',
      'Keep the core braced so the body does not swing.',
      'Depth is individual — do not chase the deepest possible position.'
    ],
    commonMistakes: [
      'Sinking so deep the shoulders roll forward.',
      'Flaring the elbows wide.',
      'Bouncing out of the bottom.',
      'Adding weight before bodyweight reps are clean.'
    ],
    safetyNotes: ['If you feel pinching at the front of the shoulder, reduce depth or use an assisted dip machine.']
  },
  {
    id: 'ez-bar-skull-crusher',
    name: 'EZ-Bar Skull Crusher',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'EZ-Bar + Bench',
    difficulty: 'Intermediate',
    archetype: 'skullcrusher',
    primary: ['triceps'], secondary: [],
    targetMuscles: ['Triceps Brachii (long head emphasis)'],
    tempo: '2s down · 1s extend',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you extend' },
    quickForm: [
      'EZ-bar, angled grips',
      'Arms angled slightly back',
      'Bend only at the elbows',
      'Lower behind the forehead',
      'Keep upper arms still',
      'Extend smoothly'
    ],
    setup: [
      'Lie flat holding the EZ-bar on the angled grips, arms over your shoulders.',
      'Tilt the upper arms slightly back toward your head.',
      'Plant your feet and brace.'
    ],
    instructions: [
      'Lower the bar by bending the elbows, tracking toward or just behind the forehead.',
      'Keep the upper arms in the same position throughout.',
      'Stop at a depth you can control without the elbows drifting.',
      'Extend the elbows back to the start.'
    ],
    formCues: [
      'The angled grip is usually easier on the wrists than a straight bar.',
      'Elbows point up, roughly shoulder width.',
      'Control the eccentric — that is where the tension is.',
      'Keep the shoulder blades set on the bench.'
    ],
    commonMistakes: [
      'Swinging the upper arms to move the bar.',
      'Flaring the elbows outward.',
      'Letting the bar drift toward the chest, making it a press.',
      'Loading heavy enough that the elbows ache.'
    ],
    safetyNotes: ['Stop the set if you feel elbow-joint pain rather than muscle fatigue.']
  },
  {
    id: 'dumbbell-overhead-extension',
    name: 'Dumbbell Overhead Extension',
    muscleGroup: 'Triceps',
    secondaryMuscles: [],
    equipment: 'Dumbbell + Bench',
    difficulty: 'Beginner',
    archetype: 'overheadDbExt',
    primary: ['triceps'], secondary: [],
    targetMuscles: ['Triceps Brachii (long head)'],
    tempo: '2s down · 1s up',
    breathing: { eccentric: 'Inhale as the weight lowers', concentric: 'Exhale as you extend' },
    quickForm: [
      'Both hands on one dumbbell',
      'Sit tall, ribs down',
      'Upper arms beside the ears',
      'Lower behind the head',
      'Extend to straight arms',
      'Elbows stay pointing forward'
    ],
    setup: [
      'Sit on an upright bench and hold one dumbbell with both hands.',
      'Press it overhead so your arms are straight and upper arms beside your ears.',
      'Brace your core and keep the ribs down.'
    ],
    instructions: [
      'Lower the dumbbell behind your head by bending the elbows.',
      'Go to a comfortable stretch, keeping the upper arms still.',
      'Extend the elbows to press the dumbbell back overhead.',
      'Stop just short of a hard lockout and repeat.'
    ],
    formCues: [
      'Hold the dumbbell securely — cup one end with both palms.',
      'Keep the elbows from flaring wide.',
      'Head stays neutral, not pushed forward.',
      'Slow on the way down.'
    ],
    commonMistakes: [
      'Arching the lower back as the weight goes behind the head.',
      'Letting the elbows splay out.',
      'Choosing a dumbbell too heavy to control behind the head.',
      'Bouncing out of the bottom stretch.'
    ],
    safetyNotes: ['Have a partner hand you a heavy dumbbell, and lower it to your thigh at the end of the set.']
  },
  {
    id: 'reverse-grip-pushdown',
    name: 'Reverse-Grip Pushdown',
    muscleGroup: 'Triceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable Machine + Straight Bar',
    difficulty: 'Beginner',
    archetype: 'pushdown', implement: 'bar',
    primary: ['triceps'], secondary: ['forearms'],
    targetMuscles: ['Triceps Brachii (medial head emphasis)', 'Forearm Flexors'],
    tempo: '1s down · 2s up',
    breathing: { eccentric: 'Inhale on the return', concentric: 'Exhale as you push down' },
    quickForm: [
      'Underhand grip on a straight bar',
      'Elbows pinned at your sides',
      'Wrists neutral, not curled',
      'Push down to a full lockout',
      'Return slowly',
      'Lighter weight than rope pushdowns'
    ],
    setup: [
      'Attach a straight bar to a high pulley and take an underhand grip.',
      'Stand tall with the elbows tucked at your sides.',
      'Brace your core and lean forward slightly.'
    ],
    instructions: [
      'Start with the forearms around parallel to the floor.',
      'Straighten the elbows to push the bar down toward your thighs.',
      'Keep the wrists firm and neutral.',
      'Let the bar rise back slowly to the start.'
    ],
    formCues: [
      'Use a lighter weight than the rope version — the grip is the limiter.',
      'Elbows stay tucked the whole set.',
      'Keep the shoulders down.',
      'Focus on squeezing at the bottom.'
    ],
    commonMistakes: [
      'Loading so heavy the wrists bend back.',
      'Letting the elbows travel forward.',
      'Leaning into the bar to push it down.',
      'Rushing the return.'
    ]
  },

  /* ==================== BACK ==================== */
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscleGroup: 'Back',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Traps'],
    equipment: 'Barbell',
    difficulty: 'Advanced',
    archetype: 'deadlift',
    primary: ['lowerBack', 'glutes', 'hamstrings'], secondary: ['lats', 'traps', 'quads', 'forearms'],
    targetMuscles: ['Erector Spinae', 'Gluteus Maximus', 'Hamstrings', 'Latissimus Dorsi', 'Trapezius'],
    tempo: 'Controlled up · controlled down',
    breathing: { eccentric: 'Inhale and brace before the pull', concentric: 'Exhale at the top' },
    quickForm: [
      'Bar over mid-foot',
      'Grip just outside the shins',
      'Chest up, back flat',
      'Take the slack out of the bar',
      'Push the floor away',
      'Stand tall — do not lean back'
    ],
    setup: [
      'Stand with the bar over your mid-foot, feet about hip width.',
      'Hinge and grip the bar just outside your shins.',
      'Drop your hips until your shins touch the bar, lift your chest and flatten your back.'
    ],
    instructions: [
      'Brace your midsection and pull the slack out of the bar before it moves.',
      'Drive through the floor with your legs, keeping the bar against your legs.',
      'Once the bar passes the knees, drive the hips forward to stand tall.',
      'Lower by pushing the hips back first, then bending the knees once the bar passes them.'
    ],
    formCues: [
      'Keep the bar in contact with your legs the whole way.',
      'Shoulders slightly in front of the bar at the start.',
      'Squeeze the lats to keep the bar close.',
      'Finish standing tall — no exaggerated lean-back at the top.'
    ],
    commonMistakes: [
      'Rounding the lower back under load.',
      'Hips shooting up before the bar leaves the floor.',
      'Letting the bar drift away from the shins.',
      'Jerking the bar off the floor instead of building tension first.'
    ],
    safetyNotes: [
      'Reset your position between reps rather than bouncing off the floor.',
      'Reduce the load immediately if your back rounds — this is a heavy full-body lift.'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Lat Pulldown Machine',
    difficulty: 'Beginner',
    archetype: 'pulldown',
    primary: ['lats'], secondary: ['biceps', 'rearDelt', 'forearms'],
    targetMuscles: ['Latissimus Dorsi', 'Biceps Brachii', 'Rhomboids', 'Lower Trapezius'],
    tempo: '1s pull · 2s return',
    breathing: { eccentric: 'Inhale as the bar rises', concentric: 'Exhale as you pull down' },
    quickForm: [
      'Thigh pads snug',
      'Grip wider than shoulders',
      'Chest up, slight lean back',
      'Pull the elbows down to the ribs',
      'Bar to the upper chest',
      'Control the bar all the way up'
    ],
    setup: [
      'Set the thigh pads so your legs are held down firmly.',
      'Take a grip a bit wider than shoulder width.',
      'Sit tall with your chest up and lean back slightly.'
    ],
    instructions: [
      'Start with your arms straight and shoulders reaching up.',
      'Pull your elbows down and toward your ribs, bringing the bar to your upper chest.',
      'Squeeze the shoulder blades down and back at the bottom.',
      'Let the bar rise back up slowly until your arms are straight again.'
    ],
    formCues: [
      'Lead with the elbows, not the hands.',
      'Keep the chest tall throughout the pull.',
      'Torso lean stays roughly constant — do not rock.',
      'Feel the stretch at the top without letting the shoulders roll forward.'
    ],
    commonMistakes: [
      'Leaning far back and turning it into a row.',
      'Pulling the bar behind the neck.',
      'Yanking the weight and letting it snap back up.',
      'Gripping so wide the range shortens.'
    ]
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    archetype: 'bentRow',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelt', 'lowerBack'],
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Trapezius', 'Biceps Brachii'],
    tempo: '1s pull · 2s lower',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you row' },
    quickForm: [
      'Hinge to around 45° or lower',
      'Neutral spine, braced core',
      'Bar hangs under the shoulders',
      'Pull toward the belly button',
      'Elbows drive back',
      'Lower under control'
    ],
    setup: [
      'Stand with feet hip width and grip the bar slightly wider than shoulders.',
      'Hinge at the hips with a flat back until your torso is around 45° or lower.',
      'Let the bar hang with straight arms and brace your midsection.'
    ],
    instructions: [
      'Pull the bar toward your lower ribs or belly button.',
      'Drive the elbows back and squeeze the shoulder blades together.',
      'Lower the bar under control until your arms are straight again.',
      'Keep the torso angle fixed for every rep.'
    ],
    formCues: [
      'The torso does not rise and fall with each rep.',
      'Keep the neck in line with the spine — look at the floor ahead.',
      'Squeeze the lats rather than pulling with the arms.',
      'Brace as if bracing for a punch.'
    ],
    commonMistakes: [
      'Standing up as you row to heave the weight.',
      'Rounding the lower back.',
      'Pulling to the chest and flaring the elbows wide.',
      'Using so much momentum the bar swings.'
    ],
    safetyNotes: ['Stop the set if your lower back rounds or fatigues before your back muscles do.']
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Cable Row Machine',
    difficulty: 'Beginner',
    archetype: 'seatedRow',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelt'],
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Trapezius', 'Biceps Brachii'],
    tempo: '1s pull · 2s return',
    breathing: { eccentric: 'Inhale as the handle returns', concentric: 'Exhale as you row' },
    quickForm: [
      'Feet on the plate, knees soft',
      'Sit tall, chest up',
      'Reach forward without rounding',
      'Pull the handle to the abdomen',
      'Squeeze the shoulder blades',
      'Return slowly'
    ],
    setup: [
      'Sit with your feet on the platform and a slight bend in the knees.',
      'Take the handle and sit up tall with your chest lifted.',
      'Set your shoulders down and brace your core.'
    ],
    instructions: [
      'Let your arms reach forward and allow a small controlled stretch through the upper back.',
      'Pull the handle to your abdomen, driving the elbows back past your ribs.',
      'Squeeze the shoulder blades together for a moment.',
      'Return the handle forward slowly until your arms are straight.'
    ],
    formCues: [
      'Keep the torso close to upright — a small lean is fine, rocking is not.',
      'Elbows stay close to the body.',
      'Chest stays tall on the return.',
      'Move the weight with your back, not your lower back.'
    ],
    commonMistakes: [
      'Rocking back and forth with the torso.',
      'Rounding the lower back on the stretch.',
      'Shrugging the shoulders during the pull.',
      'Letting the stack slam on the return.'
    ]
  },
  {
    id: 'straight-arm-pulldown',
    name: 'Straight-Arm Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Triceps (long head)'],
    equipment: 'Cable Machine + Straight Bar',
    difficulty: 'Beginner',
    archetype: 'straightArmPulldown',
    primary: ['lats'], secondary: ['triceps', 'abs'],
    targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Triceps (long head)'],
    tempo: '2s down · 2s up',
    breathing: { eccentric: 'Inhale as the arms rise', concentric: 'Exhale as you sweep down' },
    quickForm: [
      'High pulley, straight bar',
      'Hinge forward slightly',
      'Arms straight with a soft elbow',
      'Sweep the bar to the thighs',
      'Feel the lats, not the triceps',
      'Return with control'
    ],
    setup: [
      'Attach a straight bar to a high pulley and grip it at shoulder width.',
      'Step back and hinge forward slightly with a flat back.',
      'Start with arms extended forward and up, feeling a stretch under the arms.'
    ],
    instructions: [
      'Keep the elbows almost straight and sweep the bar down toward your thighs.',
      'Squeeze the lats at the bottom of the sweep.',
      'Let the bar travel back up slowly to the stretched position.',
      'Keep the torso angle constant throughout.'
    ],
    formCues: [
      'Elbow angle stays fixed — this is a shoulder-extension movement.',
      'Think about pushing the bar down with your armpits.',
      'Ribs down, core braced.',
      'Light weight and full range beats heavy and short.'
    ],
    commonMistakes: [
      'Bending the elbows and turning it into a pushdown.',
      'Standing straight up and shortening the range.',
      'Rocking the torso to move the bar.',
      'Using a load that pulls you out of position at the top.'
    ]
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Forearms'],
    equipment: 'Pull-Up Bar',
    difficulty: 'Advanced',
    archetype: 'pullup',
    primary: ['lats'], secondary: ['biceps', 'traps', 'forearms', 'abs'],
    targetMuscles: ['Latissimus Dorsi', 'Biceps Brachii', 'Lower Trapezius', 'Rhomboids'],
    tempo: 'Controlled up · 2s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you pull up' },
    quickForm: [
      'Grip slightly wider than shoulders',
      'Start from a controlled dead hang',
      'Pull the shoulder blades down first',
      'Drive the elbows down to the ribs',
      'Chin over the bar',
      'Lower all the way under control'
    ],
    setup: [
      'Grip the bar with palms facing away, slightly wider than shoulder width.',
      'Hang with straight arms and let the shoulders settle, then pull them down.',
      'Brace the core and cross the ankles behind you.'
    ],
    instructions: [
      'Begin by pulling your shoulder blades down and back.',
      'Drive your elbows down toward your ribs to lift your chest to the bar.',
      'Clear the bar with your chin without craning your neck.',
      'Lower yourself under control until your arms are straight again.'
    ],
    formCues: [
      'Think of pulling the bar down to you rather than yourself up to it.',
      'Keep the body tight — no kicking or swinging.',
      'Full range: dead hang to chin over bar.',
      'Use an assisted machine or bands if you cannot yet control the descent.'
    ],
    commonMistakes: [
      'Kipping and swinging to generate momentum.',
      'Only doing half reps from a bent-arm start.',
      'Shrugging at the top instead of pulling the shoulders down.',
      'Dropping fast from the top.'
    ],
    safetyNotes: ['Build up gradually — a controlled negative is safer than a swinging rep.']
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'T-Bar Row / Landmine',
    difficulty: 'Intermediate',
    archetype: 'tBarRow',
    primary: ['lats', 'traps'], secondary: ['biceps', 'rearDelt', 'lowerBack'],
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Middle Trapezius', 'Biceps Brachii'],
    tempo: '1s pull · 2s lower',
    breathing: { eccentric: 'Inhale as the weight lowers', concentric: 'Exhale as you row' },
    quickForm: [
      'Feet planted either side of the bar',
      'Hinge with a flat back',
      'Neutral grip on the handles',
      'Pull the handles to the lower ribs',
      'Elbows drive back and in',
      'Lower to a full stretch'
    ],
    setup: [
      'Stand over the bar with feet planted and knees slightly bent.',
      'Hinge forward with a flat back and take the handles.',
      'Brace your core and set your shoulders down.'
    ],
    instructions: [
      'Start with the arms straight and the weight hanging.',
      'Row the handles up toward your lower ribs, driving the elbows back.',
      'Squeeze the mid-back at the top of the pull.',
      'Lower the weight under control to a full stretch.'
    ],
    formCues: [
      'Keep the torso angle fixed for the whole set.',
      'Neutral grip keeps the shoulders comfortable.',
      'Chest stays proud, lower back neutral.',
      'Do not let the plates rest on the floor between reps if you want continuous tension.'
    ],
    commonMistakes: [
      'Standing up with each rep to lift the weight.',
      'Rounding the back to reach a deeper stretch.',
      'Jerking the weight up with the hips.',
      'Loading more plates than your position can hold.'
    ],
    safetyNotes: ['If your lower back fatigues first, switch to the chest-supported row.']
  },
  {
    id: 'close-grip-lat-pulldown',
    name: 'Close-Grip Lat Pulldown',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps'],
    equipment: 'Lat Pulldown + V-Handle',
    difficulty: 'Beginner',
    archetype: 'pulldownClose',
    primary: ['lats'], secondary: ['biceps', 'traps', 'forearms'],
    targetMuscles: ['Latissimus Dorsi', 'Teres Major', 'Biceps Brachii'],
    tempo: '1s pull · 2s return',
    breathing: { eccentric: 'Inhale as the handle rises', concentric: 'Exhale as you pull down' },
    quickForm: [
      'V-handle or close neutral grip',
      'Thigh pads snug',
      'Chest up, small lean back',
      'Pull the handle to the sternum',
      'Elbows drive down to the ribs',
      'Full stretch at the top'
    ],
    setup: [
      'Attach a close neutral grip handle and secure the thigh pads.',
      'Sit tall with your chest up.',
      'Take the handle with straight arms and set your shoulders down.'
    ],
    instructions: [
      'Pull the handle down toward the middle of your chest.',
      'Keep the elbows tracking down close to your sides.',
      'Squeeze the lats briefly at the bottom.',
      'Let the handle rise slowly to a full stretch overhead.'
    ],
    formCues: [
      'The close grip allows a longer range — use all of it.',
      'Keep the chest lifted rather than curling forward.',
      'Lead with the elbows.',
      'Avoid rocking the torso for extra reps.'
    ],
    commonMistakes: [
      'Leaning back excessively.',
      'Pulling with the biceps and forgetting the back.',
      'Letting the weight pull you off the seat at the top.',
      'Short, choppy reps.'
    ]
  },
  {
    id: 'chest-supported-row',
    name: 'Chest-Supported Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Incline Bench + Dumbbells',
    difficulty: 'Beginner',
    archetype: 'chestSupportedRow',
    primary: ['traps', 'lats'], secondary: ['biceps', 'rearDelt'],
    targetMuscles: ['Rhomboids', 'Middle Trapezius', 'Latissimus Dorsi', 'Posterior Deltoid'],
    tempo: '1s pull · 2s lower',
    breathing: { eccentric: 'Inhale as the weights lower', concentric: 'Exhale as you row' },
    quickForm: [
      'Chest flat on an incline pad',
      'Arms hanging straight down',
      'Row the elbows up and back',
      'Squeeze the shoulder blades',
      'Lower to a full stretch',
      'No body English — the pad prevents it'
    ],
    setup: [
      'Set a bench to around 30–45° and lie chest-down on the pad.',
      'Let the dumbbells hang straight down from your shoulders.',
      'Keep your head neutral and feet stable.'
    ],
    instructions: [
      'Row both dumbbells up toward your hips, driving the elbows back.',
      'Squeeze the shoulder blades together at the top.',
      'Lower the dumbbells slowly until the arms are straight.',
      'Keep your chest in contact with the pad on every rep.'
    ],
    formCues: [
      'The pad removes momentum — use lighter weight than a bent-over row.',
      'Do not lift the chest off the pad to finish a rep.',
      'Elbows travel close to the body.',
      'Pause briefly at the top of each rep.'
    ],
    commonMistakes: [
      'Peeling the chest off the pad to heave the weight.',
      'Shrugging the shoulders toward the ears.',
      'Short range at the bottom.',
      'Going too heavy and losing the squeeze.'
    ]
  },
  {
    id: 'one-arm-dumbbell-row',
    name: 'One-Arm Dumbbell Row',
    muscleGroup: 'Back',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Dumbbell + Bench',
    difficulty: 'Beginner',
    archetype: 'oneArmRow',
    primary: ['lats'], secondary: ['biceps', 'traps', 'rearDelt'],
    targetMuscles: ['Latissimus Dorsi', 'Rhomboids', 'Biceps Brachii'],
    tempo: '1s pull · 2s lower',
    breathing: { eccentric: 'Inhale as the dumbbell lowers', concentric: 'Exhale as you row' },
    quickForm: [
      'One hand and knee on the bench',
      'Back flat, hips square',
      'Dumbbell hangs straight down',
      'Row toward the hip, not the shoulder',
      'Elbow travels back',
      'Full stretch at the bottom'
    ],
    setup: [
      'Place one hand and the same-side knee on the bench.',
      'Set your back flat and roughly parallel to the floor, hips square.',
      'Let the dumbbell hang straight down from the working shoulder.'
    ],
    instructions: [
      'Row the dumbbell up toward your hip, driving the elbow back past your ribs.',
      'Keep your torso still — no twisting to get the weight higher.',
      'Squeeze the lat briefly at the top.',
      'Lower the dumbbell under control to a full stretch.'
    ],
    formCues: [
      'Pull toward the hip rather than straight up to the shoulder.',
      'Shoulders stay level with each other.',
      'Neck stays in line with the spine.',
      'Match the reps and load on both sides.'
    ],
    commonMistakes: [
      'Rotating the torso to lift a heavier dumbbell.',
      'Rounding the back at the bottom of the stretch.',
      'Yanking the weight up with the arm only.',
      'Letting the shoulder shrug at the top.'
    ]
  },

  /* ==================== BICEPS ==================== */
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Barbell',
    difficulty: 'Beginner',
    archetype: 'curlStanding',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii', 'Brachialis', 'Forearm Flexors'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you curl' },
    quickForm: [
      'Grip about shoulder width',
      'Elbows at your sides',
      'Stand tall, ribs down',
      'Curl without swinging',
      'Squeeze at the top',
      'Lower all the way down'
    ],
    setup: [
      'Stand with feet hip width and hold the bar with an underhand shoulder-width grip.',
      'Let the bar hang at arm’s length with the elbows at your sides.',
      'Brace your core and set your shoulders back.'
    ],
    instructions: [
      'Curl the bar up by bending the elbows, keeping the upper arms still.',
      'Bring the bar to around chest height and squeeze the biceps.',
      'Lower the bar slowly until your arms are fully straight.',
      'Pause briefly at the bottom before the next rep.'
    ],
    formCues: [
      'The elbows stay pinned — they should not swing forward.',
      'Keep the wrists neutral, not curled back.',
      'No leaning back to start the rep.',
      'Control the lowering phase.'
    ],
    commonMistakes: [
      'Swinging the torso to throw the bar up.',
      'Letting the elbows drift forward at the top.',
      'Stopping short of a full extension at the bottom.',
      'Using a load that requires body momentum.'
    ]
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells + Incline Bench',
    difficulty: 'Beginner',
    archetype: 'curlIncline',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii (long head emphasis)', 'Brachialis'],
    tempo: '1s up · 3s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you curl' },
    quickForm: [
      'Bench at roughly 45–60°',
      'Sit back with arms hanging behind',
      'Elbows stay put',
      'Curl without lifting the shoulder',
      'Squeeze at the top',
      'Slow, full stretch at the bottom'
    ],
    setup: [
      'Set a bench to roughly 45–60° and sit back against it.',
      'Let both dumbbells hang straight down, slightly behind your torso.',
      'Keep your shoulders back on the pad.'
    ],
    instructions: [
      'Curl the dumbbells up by bending the elbows, keeping the upper arms still.',
      'Squeeze the biceps at the top without letting the elbows swing forward.',
      'Lower slowly back to the stretched hanging position.',
      'Keep your back in contact with the pad throughout.'
    ],
    formCues: [
      'The stretch at the bottom is the point — do not cut it short.',
      'Shoulders stay down and back.',
      'Wrists stay neutral.',
      'Lighter weight than standing curls is normal here.'
    ],
    commonMistakes: [
      'Lifting the shoulders off the pad to help.',
      'Swinging the arms forward at the top.',
      'Skipping the full stretch at the bottom.',
      'Setting the bench too upright.'
    ]
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    archetype: 'curlDumbbell', implement: 'neutral',
    primary: ['biceps', 'forearms'], secondary: [],
    targetMuscles: ['Brachialis', 'Brachioradialis', 'Biceps Brachii'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you curl' },
    quickForm: [
      'Neutral grip — palms facing each other',
      'Elbows at your sides',
      'Stand tall, no swinging',
      'Curl to shoulder height',
      'Keep the wrist straight',
      'Lower under control'
    ],
    setup: [
      'Stand with a dumbbell in each hand, palms facing your thighs.',
      'Set the elbows at your sides and brace your core.',
      'Keep the shoulders back and down.'
    ],
    instructions: [
      'Curl the dumbbells up keeping the palms facing each other throughout.',
      'Bring them to around shoulder height without the elbows travelling forward.',
      'Squeeze briefly at the top.',
      'Lower slowly until the arms are straight.'
    ],
    formCues: [
      'The neutral grip works the brachialis and forearm more than a supinated curl.',
      'Wrists stay firm and straight — no cocking.',
      'Alternate arms or curl both together, but keep the tempo consistent.',
      'No hip swing.'
    ],
    commonMistakes: [
      'Rocking the body to start each rep.',
      'Letting the elbows drift forward.',
      'Rotating the wrists on the way up.',
      'Short range at the bottom.'
    ]
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Preacher Bench + EZ-Bar',
    difficulty: 'Beginner',
    archetype: 'preacherCurl',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii (short head emphasis)', 'Brachialis'],
    tempo: '1s up · 3s down',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you curl' },
    quickForm: [
      'Armpits on top of the pad',
      'Upper arms flat on the pad',
      'Underhand grip, shoulder width',
      'Curl to the top without shrugging',
      'Lower slowly — do not drop',
      'Stop just short of a locked elbow'
    ],
    setup: [
      'Set the seat so your armpits rest over the top edge of the pad.',
      'Place both upper arms flat on the pad with an underhand grip on the bar.',
      'Sit tall with your chest against the pad.'
    ],
    instructions: [
      'Curl the bar up toward your shoulders by bending the elbows.',
      'Stop before the forearms pass vertical, where tension drops off.',
      'Lower the bar slowly until the arms are nearly straight.',
      'Keep the upper arms flat on the pad the whole time.'
    ],
    formCues: [
      'The bottom position is the most stretched and vulnerable — control it.',
      'Do not lift the elbows off the pad to finish a rep.',
      'Keep the wrists neutral.',
      'Use a weight that lets you control a slow negative.'
    ],
    commonMistakes: [
      'Dropping the bar fast at the bottom and jolting the elbow.',
      'Standing up out of the seat to complete reps.',
      'Elbows sliding down the pad.',
      'Going far too heavy on a strict movement.'
    ],
    safetyNotes: ['Never let the bar free-fall at the bottom — the stretched elbow position needs control.']
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Cable Machine + Bar',
    difficulty: 'Beginner',
    archetype: 'curlCable',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii', 'Brachialis'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you curl' },
    quickForm: [
      'Low pulley, bar attachment',
      'Stand a step back for constant tension',
      'Elbows at your sides',
      'Curl up, squeeze',
      'Resist on the way down',
      'Tension never drops'
    ],
    setup: [
      'Attach a bar to a low pulley and take an underhand grip.',
      'Stand a step back from the machine so the cable stays taut.',
      'Set the elbows at your sides and stand tall.'
    ],
    instructions: [
      'Curl the bar up toward your shoulders, keeping the upper arms still.',
      'Squeeze the biceps at the top.',
      'Lower the bar slowly, resisting the pull of the cable.',
      'Stop just short of letting the stack rest between reps.'
    ],
    formCues: [
      'Cables keep tension at both ends of the range — use that.',
      'Elbows stay pinned to your sides.',
      'Do not lean back as you curl.',
      'Keep the shoulders down.'
    ],
    commonMistakes: [
      'Standing too close so tension disappears at the bottom.',
      'Leaning back to move a heavier stack.',
      'Letting the elbows swing forward.',
      'Rushing the eccentric.'
    ]
  },
  {
    id: 'ez-bar-curl',
    name: 'EZ-Bar Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'EZ-Bar',
    difficulty: 'Beginner',
    archetype: 'curlStanding',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii', 'Brachialis', 'Brachioradialis'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you curl' },
    quickForm: [
      'Hands on the angled grips',
      'Elbows at your sides',
      'Stand tall, core braced',
      'Curl without swinging',
      'Squeeze at the top',
      'Full extension at the bottom'
    ],
    setup: [
      'Grip the EZ-bar on the angled sections with palms up.',
      'Stand with feet hip width, elbows at your sides.',
      'Brace your core and set the shoulders back.'
    ],
    instructions: [
      'Curl the bar up by bending the elbows only.',
      'Squeeze the biceps near the top of the range.',
      'Lower the bar under control until the arms are straight.',
      'Keep the torso still for every rep.'
    ],
    formCues: [
      'The angled grip is usually kinder to the wrists than a straight bar.',
      'Upper arms stay vertical.',
      'No hip drive.',
      'Slow eccentric on every rep.'
    ],
    commonMistakes: [
      'Rocking the body to start the curl.',
      'Bending the wrists back under load.',
      'Half reps at the bottom.',
      'Letting the elbows travel forward at the top.'
    ]
  },
  {
    id: 'spider-curl',
    name: 'Spider Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: [],
    equipment: 'Incline Bench + Dumbbells',
    difficulty: 'Intermediate',
    archetype: 'spiderCurl',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii (short head emphasis)', 'Brachialis'],
    tempo: '1s up · 3s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you curl' },
    quickForm: [
      'Chest against a steep incline pad',
      'Arms hang straight down',
      'Curl up without swinging',
      'Squeeze hard at the top',
      'Lower slowly to a full stretch',
      'Upper arms stay vertical'
    ],
    setup: [
      'Set a bench to a steep incline and lie chest-down against the pad.',
      'Let both arms hang straight down from the shoulders.',
      'Keep your chest on the pad and feet stable.'
    ],
    instructions: [
      'Curl the dumbbells up toward your shoulders, keeping the upper arms vertical.',
      'Squeeze the biceps hard at the top of the range.',
      'Lower slowly until the arms are completely straight.',
      'Keep the chest in contact with the pad throughout.'
    ],
    formCues: [
      'Hanging arms mean zero momentum — expect to use lighter weight.',
      'Do not let the upper arms swing back.',
      'Full lockout at the bottom of each rep.',
      'Steady tempo, no bouncing.'
    ],
    commonMistakes: [
      'Lifting the chest off the pad.',
      'Swinging the upper arms to start the rep.',
      'Cutting the range short at the bottom.',
      'Choosing dumbbells too heavy for a strict curl.'
    ]
  },
  {
    id: 'alternating-dumbbell-curl',
    name: 'Alternating Dumbbell Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: ['Forearms'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    archetype: 'curlAlternating',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii', 'Brachialis'],
    tempo: '1s up · 2s down per arm',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you curl' },
    quickForm: [
      'One arm at a time',
      'Elbows at your sides',
      'Rotate the palm up as you curl',
      'Squeeze at the top',
      'Lower fully before switching',
      'Torso stays still'
    ],
    setup: [
      'Stand with a dumbbell in each hand, palms facing your thighs.',
      'Set your elbows at your sides and brace your core.',
      'Keep the shoulders back and down.'
    ],
    instructions: [
      'Curl one dumbbell up, rotating the palm to face up as you go.',
      'Squeeze the biceps at the top of the rep.',
      'Lower that arm fully under control.',
      'Repeat on the other side, alternating for the whole set.'
    ],
    formCues: [
      'The non-working arm stays relaxed and still at your side.',
      'Do not lean away from the working arm.',
      'Rotate smoothly rather than flicking the wrist.',
      'Equal reps and tempo on both sides.'
    ],
    commonMistakes: [
      'Swinging the torso side to side.',
      'Letting the resting arm partly curl too.',
      'Elbows drifting forward.',
      'Rushing to alternate before the arm is fully extended.'
    ]
  },
  {
    id: 'bayesian-cable-curl',
    name: 'Bayesian Cable Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: [],
    equipment: 'Cable Machine + Single Handle',
    difficulty: 'Intermediate',
    archetype: 'bayesianCurl',
    primary: ['biceps'], secondary: ['forearms'],
    targetMuscles: ['Biceps Brachii (long head emphasis)'],
    tempo: '1s up · 3s down',
    breathing: { eccentric: 'Inhale as the arm extends back', concentric: 'Exhale as you curl' },
    quickForm: [
      'Low pulley, single handle',
      'Face away from the machine',
      'Step forward so the arm sits behind you',
      'Elbow stays behind the torso',
      'Curl up, squeeze',
      'Lower to a deep stretch'
    ],
    setup: [
      'Attach a single handle to a low pulley and face away from the machine.',
      'Take the handle and step forward until your arm is drawn behind your body.',
      'Stand in a slight split stance with the elbow fixed behind your torso.'
    ],
    instructions: [
      'Let the cable pull your arm back into a stretched position.',
      'Curl the handle up toward your shoulder without moving the upper arm.',
      'Squeeze the biceps at the top.',
      'Lower slowly back into the stretch, keeping the elbow behind you.'
    ],
    formCues: [
      'The stretched start is the whole point of this variation.',
      'Keep the shoulder from rolling forward under the stretch.',
      'Upper arm stays behind the torso throughout.',
      'Use a lighter load than a standing curl.'
    ],
    commonMistakes: [
      'Letting the elbow drift forward and losing the stretch.',
      'Leaning forward to muscle the weight up.',
      'Rushing the eccentric, which is the most loaded part.',
      'Standing too close to the stack so tension disappears.'
    ],
    safetyNotes: ['Ease into the stretched position — do not bounce out of the bottom.']
  },

  /* ==================== QUADS ==================== */
  {
    id: 'barbell-squat',
    name: 'Barbell Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'Barbell + Rack',
    difficulty: 'Advanced',
    archetype: 'squat',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lowerBack', 'abs', 'calves'],
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Adductors', 'Erector Spinae'],
    tempo: '2s down · drive up',
    breathing: { eccentric: 'Inhale and brace at the top', concentric: 'Exhale as you drive up' },
    quickForm: [
      'Bar settled on the upper back',
      'Feet shoulder width, toes slightly out',
      'Big breath, brace the core',
      'Sit down and slightly back',
      'Knees track over the toes',
      'Drive up through the whole foot'
    ],
    setup: [
      'Set the bar at upper-chest height and grip it, then settle it on your upper back.',
      'Unrack it and step back into a shoulder-width stance with toes slightly turned out.',
      'Take a big breath, brace your midsection and set your chest tall.'
    ],
    instructions: [
      'Begin by bending the knees and hips together, sitting down and slightly back.',
      'Descend until your thighs reach roughly parallel, or the depth you can hold position at.',
      'Keep your knees tracking in line with your toes.',
      'Drive back up through the whole foot until you are standing tall.'
    ],
    formCues: [
      'Brace before every rep, not just the first.',
      'Keep the bar over your mid-foot throughout.',
      'Chest and hips rise together out of the bottom.',
      'Depth is individual — controlled and consistent beats deep and wobbly.'
    ],
    commonMistakes: [
      'Knees collapsing inward on the way up.',
      'Hips shooting up first, turning it into a good morning.',
      'Rounding the lower back at the bottom.',
      'Rising onto the toes as you descend.'
    ],
    safetyNotes: [
      'Set the safety bars in the rack at a height that catches a failed rep.',
      'Learn the movement with light loads before adding weight.'
    ]
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Leg Press Machine',
    difficulty: 'Beginner',
    archetype: 'legPress',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'calves'],
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Adductors'],
    tempo: '2s down · press up',
    breathing: { eccentric: 'Inhale as the platform comes down', concentric: 'Exhale as you press' },
    quickForm: [
      'Feet mid-platform, shoulder width',
      'Back and hips flat on the seat',
      'Lower until knees reach around 90°',
      'Do not let the hips curl off the pad',
      'Press through the whole foot',
      'Stop just short of locking the knees'
    ],
    setup: [
      'Sit with your back and hips flat against the pad.',
      'Place your feet about shoulder width in the middle of the platform.',
      'Release the safety handles and take the weight with your legs.'
    ],
    instructions: [
      'Lower the platform under control until your knees reach roughly 90°.',
      'Stop before your hips or lower back curl off the seat.',
      'Press the platform back up through your whole foot.',
      'Stop just short of locking the knees out hard.'
    ],
    formCues: [
      'Knees track in line with the toes.',
      'Keep the heels down on the platform.',
      'Head and back stay against the pad.',
      'Depth is limited by your hips staying flat, not by the machine.'
    ],
    commonMistakes: [
      'Lowering so deep the lower back rounds off the seat.',
      'Snapping the knees into a hard lockout.',
      'Letting the knees cave inward.',
      'Placing the hands on the knees instead of the handles.'
    ],
    safetyNotes: ['Engage the safety catches before getting out of the machine.']
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Dumbbells + Bench',
    difficulty: 'Intermediate',
    archetype: 'splitSquat',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'],
    targetMuscles: ['Quadriceps', 'Gluteus Maximus', 'Adductors'],
    tempo: '2s down · drive up',
    breathing: { eccentric: 'Inhale as you descend', concentric: 'Exhale as you drive up' },
    quickForm: [
      'Rear foot on the bench behind you',
      'Front foot far enough forward',
      'Torso tall or slightly leaning',
      'Lower straight down',
      'Front knee tracks over the foot',
      'Drive through the front heel'
    ],
    setup: [
      'Stand a stride length in front of a bench and place the top of one foot on it.',
      'Set the front foot far enough forward that the knee stays over the mid-foot at the bottom.',
      'Hold a dumbbell in each hand and stand tall.'
    ],
    instructions: [
      'Lower straight down by bending the front knee and letting the back knee drop.',
      'Descend until the front thigh is around parallel to the floor.',
      'Keep most of your weight on the front foot.',
      'Drive back up through the front foot without pushing off the rear leg.'
    ],
    formCues: [
      'A small forward torso lean is fine and often more comfortable.',
      'Hips stay square — do not rotate toward the working leg.',
      'The rear leg balances; the front leg works.',
      'Do all reps on one side, then switch.'
    ],
    commonMistakes: [
      'Standing too close to the bench, forcing the front knee far forward.',
      'Pushing off the rear foot to complete the rep.',
      'Wobbling because the stance is too narrow side-to-side.',
      'Rushing the descent and losing balance.'
    ],
    safetyNotes: ['Practise bodyweight first — this is a balance-demanding movement.']
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroup: 'Quads',
    secondaryMuscles: [],
    equipment: 'Leg Extension Machine',
    difficulty: 'Beginner',
    archetype: 'legExtension',
    primary: ['quads'], secondary: [],
    targetMuscles: ['Quadriceps (all four heads)', 'Rectus Femoris'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as the legs lower', concentric: 'Exhale as you extend' },
    quickForm: [
      'Knee joint lined up with the machine pivot',
      'Ankle pad just above the feet',
      'Back against the pad',
      'Extend smoothly to straight',
      'Brief squeeze at the top',
      'Lower under control'
    ],
    setup: [
      'Adjust the seat so your knee joint lines up with the machine pivot.',
      'Set the ankle pad to rest just above your feet.',
      'Sit back with your whole back against the pad and hold the handles.'
    ],
    instructions: [
      'Extend both knees smoothly until your legs are straight.',
      'Squeeze the quads briefly at the top.',
      'Lower the pad under control back to the start.',
      'Stop just before the weight stack rests between reps.'
    ],
    formCues: [
      'Smooth and controlled — no kicking into the lockout.',
      'Keep your hips down on the seat.',
      'Toes relaxed, drive from the thighs.',
      'Same speed up and down.'
    ],
    commonMistakes: [
      'Swinging the weight up with a jerk.',
      'Lifting the hips off the seat at the top.',
      'Setting the pad too high on the shin.',
      'Letting the stack crash on every rep.'
    ],
    safetyNotes: ['If your knees feel irritated, reduce the load and shorten the top range slightly.']
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    muscleGroup: 'Quads',
    secondaryMuscles: ['Glutes'],
    equipment: 'Hack Squat Machine',
    difficulty: 'Intermediate',
    archetype: 'hackSquat',
    primary: ['quads'], secondary: ['glutes', 'hamstrings'],
    targetMuscles: ['Quadriceps', 'Gluteus Maximus'],
    tempo: '2s down · drive up',
    breathing: { eccentric: 'Inhale as you descend', concentric: 'Exhale as you drive up' },
    quickForm: [
      'Back flat against the pad',
      'Shoulders under the pads',
      'Feet shoulder width on the platform',
      'Descend under control',
      'Knees track over the toes',
      'Drive up through the whole foot'
    ],
    setup: [
      'Step into the machine with your back flat on the pad and shoulders under the pads.',
      'Place your feet about shoulder width, mid-platform.',
      'Release the safeties and brace your core.'
    ],
    instructions: [
      'Lower yourself by bending the knees and hips, keeping your back on the pad.',
      'Descend until your thighs are around parallel, or as deep as you can hold position.',
      'Keep the knees tracking in line with the toes.',
      'Drive back up through the whole foot to the starting position.'
    ],
    formCues: [
      'Back stays flat on the pad — do not let the hips curl off at the bottom.',
      'Heels stay planted.',
      'Controlled descent; the machine makes it easy to drop too fast.',
      'Foot position changes the feel — find what your knees like.'
    ],
    commonMistakes: [
      'Bouncing out of the bottom.',
      'Letting the knees cave inward.',
      'Heels lifting off the platform.',
      'Loading heavier than the depth you can control.'
    ],
    safetyNotes: ['Know where the safety handles are before you start the set.']
  },

  /* ==================== CALVES ==================== */
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Calf Raise Machine / Step',
    difficulty: 'Beginner',
    archetype: 'calfStanding',
    primary: ['calves'], secondary: [],
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    tempo: '1s up · 1s pause · 2s down',
    breathing: { eccentric: 'Inhale as the heels lower', concentric: 'Exhale as you rise' },
    quickForm: [
      'Balls of the feet on the step',
      'Legs straight but not locked hard',
      'Let the heels drop below the step',
      'Rise as high as you can',
      'Pause at the top',
      'Lower slowly'
    ],
    setup: [
      'Place the balls of your feet on the step with your heels hanging off.',
      'Set the shoulder pads snug and stand tall with straight legs.',
      'Brace your core and keep the hips under your shoulders.'
    ],
    instructions: [
      'Let your heels drop below the step until you feel a calf stretch.',
      'Rise up onto your toes as high as you can.',
      'Pause for a moment at the top.',
      'Lower slowly back into the stretch.'
    ],
    formCues: [
      'Straight legs bias the gastrocnemius.',
      'Full range — stretch at the bottom, full rise at the top.',
      'Do not bounce out of the bottom.',
      'Keep the ankles tracking straight rather than rolling out.'
    ],
    commonMistakes: [
      'Bouncing quickly through partial reps.',
      'Bending the knees to help the movement.',
      'Rushing the eccentric.',
      'Only rising halfway at the top.'
    ]
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Seated Calf Raise Machine',
    difficulty: 'Beginner',
    archetype: 'calfSeated',
    primary: ['calves'], secondary: [],
    targetMuscles: ['Soleus', 'Gastrocnemius'],
    tempo: '1s up · 1s pause · 2s down',
    breathing: { eccentric: 'Inhale as the heels lower', concentric: 'Exhale as you rise' },
    quickForm: [
      'Knees under the pad at about 90°',
      'Balls of the feet on the platform',
      'Heels drop for a stretch',
      'Push up onto the toes',
      'Pause at the top',
      'Lower slowly'
    ],
    setup: [
      'Sit with the balls of your feet on the platform and knees under the pad.',
      'Adjust the pad so it sits snugly on your lower thighs.',
      'Release the safety catch and take the weight.'
    ],
    instructions: [
      'Let your heels drop below the platform into a stretch.',
      'Push through the balls of your feet to raise the heels as high as possible.',
      'Hold the top position briefly.',
      'Lower slowly back into the stretch.'
    ],
    formCues: [
      'The bent knee shifts emphasis to the soleus.',
      'Do not slide the feet forward on the platform.',
      'Full stretch, full contraction, every rep.',
      'Keep the tempo slow — calves respond to controlled reps.'
    ],
    commonMistakes: [
      'Fast partial reps with no stretch.',
      'Letting the pad slide up the thigh.',
      'Pushing with the hands on the pad.',
      'Bouncing at the bottom.'
    ]
  },
  {
    id: 'leg-press-calf-raise',
    name: 'Leg Press Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Leg Press Machine',
    difficulty: 'Beginner',
    archetype: 'calfLegPress',
    primary: ['calves'], secondary: [],
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    tempo: '1s up · 1s pause · 2s down',
    breathing: { eccentric: 'Inhale as the ankles flex', concentric: 'Exhale as you push' },
    quickForm: [
      'Balls of the feet on the low edge of the platform',
      'Legs almost straight, knees soft',
      'Push the platform with the toes only',
      'Let the ankles flex back for a stretch',
      'Pause at full extension',
      'Keep the safeties within reach'
    ],
    setup: [
      'Sit in the leg press and place the balls of your feet on the lower edge of the platform.',
      'Press the platform out until your legs are almost straight, with the knees soft.',
      'Keep the safety catches in reach.'
    ],
    instructions: [
      'Push the platform away using only your ankles until your toes are fully pointed.',
      'Hold the top position for a moment.',
      'Let the platform come back slowly, allowing the ankles to flex into a stretch.',
      'Keep the knees in the same position throughout — only the ankles move.'
    ],
    formCues: [
      'The knees stay almost straight; do not turn it into a leg press.',
      'Feet stay firmly on the platform — never let them slip.',
      'Slow eccentric for the stretch.',
      'Moderate load and full range beats heavy partials.'
    ],
    commonMistakes: [
      'Bending and straightening the knees each rep.',
      'Placing the feet too high so they can slide off.',
      'Bouncing quickly with a very short range.',
      'Locking the knees hard under load.'
    ],
    safetyNotes: ['Keep the feet securely on the platform and the safety catches within reach for the whole set.']
  },
  {
    id: 'single-leg-calf-raise',
    name: 'Single-Leg Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Step + Optional Dumbbell',
    difficulty: 'Beginner',
    archetype: 'calfSingle',
    primary: ['calves'], secondary: [],
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    tempo: '1s up · 1s pause · 2s down',
    breathing: { eccentric: 'Inhale as the heel lowers', concentric: 'Exhale as you rise' },
    quickForm: [
      'One foot on the step, other tucked back',
      'Hold something for balance',
      'Drop the heel below the step',
      'Rise as high as possible',
      'Pause at the top',
      'Match the reps on both sides'
    ],
    setup: [
      'Stand with the ball of one foot on a step and the other foot tucked behind.',
      'Hold a rack or handle with one hand for balance.',
      'Optionally hold a dumbbell in the free hand.'
    ],
    instructions: [
      'Let your heel drop below the step into a stretch.',
      'Rise onto the ball of your foot as high as you can.',
      'Pause briefly at the top.',
      'Lower slowly, then repeat before switching sides.'
    ],
    formCues: [
      'Use the support hand for balance only, not to pull yourself up.',
      'Keep the working leg straight but not locked hard.',
      'Ankle tracks straight — do not roll outward.',
      'Same reps and tempo on each side.'
    ],
    commonMistakes: [
      'Pulling up on the rack to complete reps.',
      'Bending the knee to cheat the rise.',
      'Short range at the bottom.',
      'Doing more reps on the stronger side.'
    ]
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    muscleGroup: 'Calves',
    secondaryMuscles: [],
    equipment: 'Step + Support / Donkey Machine',
    difficulty: 'Beginner',
    archetype: 'donkeyCalf',
    primary: ['calves'], secondary: [],
    targetMuscles: ['Gastrocnemius', 'Soleus'],
    tempo: '1s up · 1s pause · 2s down',
    breathing: { eccentric: 'Inhale as the heels lower', concentric: 'Exhale as you rise' },
    quickForm: [
      'Balls of the feet on the step',
      'Hinge forward, hands on a support',
      'Back flat, hips high',
      'Let the heels drop',
      'Rise onto the toes',
      'Slow, full range reps'
    ],
    setup: [
      'Place the balls of your feet on a step with your heels hanging off.',
      'Hinge forward at the hips and rest your hands or forearms on a support.',
      'Keep your back flat and legs mostly straight.'
    ],
    instructions: [
      'Let your heels drop below the step into a full stretch.',
      'Push through the balls of your feet to raise your heels as high as possible.',
      'Pause at the top for a moment.',
      'Lower slowly back into the stretch.'
    ],
    formCues: [
      'The hinged position gives a strong stretch on the calves.',
      'Keep the back flat, not rounded.',
      'Support the upper body with your arms, not your lower back.',
      'Full range on every rep.'
    ],
    commonMistakes: [
      'Rounding the back while hinged.',
      'Bouncing quickly through partials.',
      'Bending the knees to help.',
      'Letting the ankles roll outward.'
    ]
  },

  /* ==================== HAMSTRINGS / GLUTES ==================== */
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    archetype: 'rdl',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'lats', 'forearms'],
    targetMuscles: ['Hamstrings', 'Gluteus Maximus', 'Erector Spinae'],
    tempo: '3s down · drive up',
    breathing: { eccentric: 'Inhale as you hinge down', concentric: 'Exhale as you stand up' },
    quickForm: [
      'Start standing tall, bar at the thighs',
      'Soft knees — then keep that angle',
      'Push the hips back, not down',
      'Bar stays against the legs',
      'Lower until the hamstrings stretch',
      'Drive the hips forward to stand'
    ],
    setup: [
      'Stand holding the bar at arm length against your thighs, feet hip width.',
      'Unlock the knees slightly and keep that knee angle for the whole rep.',
      'Set your shoulders back and brace your midsection.'
    ],
    instructions: [
      'Push your hips back and let the bar slide down the front of your legs.',
      'Keep your back flat as your torso hinges forward.',
      'Stop when you feel a strong hamstring stretch — usually around mid-shin.',
      'Drive the hips forward to stand tall again.'
    ],
    formCues: [
      'This is a hip hinge, not a squat — the knees barely move.',
      'Keep the bar in contact with your legs the whole way.',
      'Squeeze the lats to stop the bar drifting forward.',
      'Range is set by your hamstring flexibility, not by touching the floor.'
    ],
    commonMistakes: [
      'Rounding the lower back to reach lower.',
      'Bending the knees and turning it into a deadlift.',
      'Letting the bar drift away from the shins.',
      'Hyperextending the back at the top.'
    ],
    safetyNotes: ['Stop the descent as soon as your back would need to round to go further.']
  },
  {
    id: 'lying-leg-curl',
    name: 'Lying Leg Curl',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Calves'],
    equipment: 'Lying Leg Curl Machine',
    difficulty: 'Beginner',
    archetype: 'lyingLegCurl',
    primary: ['hamstrings'], secondary: ['calves', 'glutes'],
    targetMuscles: ['Hamstrings (biceps femoris, semitendinosus)', 'Gastrocnemius'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as the legs straighten', concentric: 'Exhale as you curl' },
    quickForm: [
      'Knees just off the end of the pad',
      'Ankle pad on the lower calf',
      'Hips stay down on the pad',
      'Curl the heels toward the glutes',
      'Squeeze at the top',
      'Lower slowly'
    ],
    setup: [
      'Lie face down with your knees just past the edge of the pad.',
      'Set the ankle pad to sit on your lower calves, above the heels.',
      'Grip the handles and keep your hips down.'
    ],
    instructions: [
      'Curl your heels up toward your glutes by bending the knees.',
      'Squeeze the hamstrings at the top of the range.',
      'Lower your legs slowly until they are almost straight.',
      'Keep your hips pressed into the pad the whole time.'
    ],
    formCues: [
      'Do not let the hips lift — that is the most common cheat here.',
      'Pointing or flexing the toes changes the feel; find what works for you.',
      'Slow the eccentric down.',
      'Keep the neck relaxed on the pad.'
    ],
    commonMistakes: [
      'Lifting the hips off the pad to swing the weight up.',
      'Jerking the pad up with momentum.',
      'Letting the stack drop fast on the return.',
      'Setting the pad too high on the calf.'
    ],
    safetyNotes: ['Hamstrings cramp easily — warm up before jumping to a heavy set.']
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings', 'Quads'],
    equipment: 'Barbell + Bench',
    difficulty: 'Intermediate',
    archetype: 'hipThrust',
    primary: ['glutes'], secondary: ['hamstrings', 'quads', 'abs'],
    targetMuscles: ['Gluteus Maximus', 'Gluteus Medius', 'Hamstrings'],
    tempo: '1s up · 1s squeeze · 2s down',
    breathing: { eccentric: 'Inhale as the hips lower', concentric: 'Exhale as you drive up' },
    quickForm: [
      'Shoulder blades on the bench edge',
      'Bar over the hips with a pad',
      'Feet flat, shins vertical at the top',
      'Drive the hips up',
      'Ribs down, squeeze the glutes',
      'Lower under control'
    ],
    setup: [
      'Sit on the floor with your upper back against a bench and roll the bar over your hips.',
      'Use a pad on the bar and set your feet flat, about shoulder width.',
      'Position your feet so your shins are vertical at the top of the movement.'
    ],
    instructions: [
      'Drive through your heels and push your hips up toward the ceiling.',
      'Finish with your torso roughly parallel to the floor and glutes squeezed.',
      'Keep your ribs down and chin slightly tucked at the top.',
      'Lower your hips under control without resting the bar on the floor.'
    ],
    formCues: [
      'Push the floor away with your heels.',
      'Squeeze the glutes rather than arching the lower back.',
      'The chin stays tucked so the neck stays neutral.',
      'Full lockout at the top, controlled descent.'
    ],
    commonMistakes: [
      'Over-arching the lower back at the top instead of squeezing the glutes.',
      'Feet placed too far away, turning it into a hamstring exercise.',
      'Bouncing the bar off the floor.',
      'Pushing through the toes rather than the heels.'
    ],
    safetyNotes: ['Always use a bar pad — the bar sits directly over the hip bones.']
  },
  {
    id: 'seated-leg-curl',
    name: 'Seated Leg Curl',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: ['Calves'],
    equipment: 'Seated Leg Curl Machine',
    difficulty: 'Beginner',
    archetype: 'seatedLegCurl',
    primary: ['hamstrings'], secondary: ['calves'],
    targetMuscles: ['Hamstrings', 'Gastrocnemius'],
    tempo: '1s curl · 2s return',
    breathing: { eccentric: 'Inhale as the legs extend', concentric: 'Exhale as you curl' },
    quickForm: [
      'Knee pivot lined up with the machine',
      'Thigh pad locked snug',
      'Back against the seat',
      'Curl the heels down and back',
      'Squeeze at the bottom',
      'Return slowly'
    ],
    setup: [
      'Sit with your back against the pad and line your knees up with the machine pivot.',
      'Lock the thigh pad down snugly across your legs.',
      'Set the ankle pad against the back of your lower calves.'
    ],
    instructions: [
      'Curl your heels down and back by bending the knees.',
      'Squeeze the hamstrings at the end of the range.',
      'Let your legs extend back slowly to the start.',
      'Keep your back against the seat throughout.'
    ],
    formCues: [
      'The seated position gives the hamstrings a longer stretch than the lying version.',
      'Keep the hips down in the seat.',
      'Control the return — do not let the pad snap back.',
      'Grip the handles to stay anchored.'
    ],
    commonMistakes: [
      'Lifting the hips off the seat.',
      'Leaving the thigh pad loose.',
      'Rushing the eccentric.',
      'Using momentum from the torso.'
    ]
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull-Through',
    muscleGroup: 'Glutes',
    secondaryMuscles: ['Hamstrings'],
    equipment: 'Cable Machine + Rope',
    difficulty: 'Beginner',
    archetype: 'pullThrough',
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack'],
    targetMuscles: ['Gluteus Maximus', 'Hamstrings', 'Erector Spinae'],
    tempo: '2s hinge · drive up',
    breathing: { eccentric: 'Inhale as you hinge back', concentric: 'Exhale as you stand tall' },
    quickForm: [
      'Rope on a low pulley, face away',
      'Rope passes between your legs',
      'Soft knees, hinge at the hips',
      'Push the hips back',
      'Drive the hips forward to stand',
      'Squeeze the glutes at the top'
    ],
    setup: [
      'Attach a rope to a low pulley and face away from the machine.',
      'Take the rope between your legs and step forward until the cable is taut.',
      'Stand with feet shoulder width and knees slightly bent.'
    ],
    instructions: [
      'Push your hips back and let the rope travel between your legs.',
      'Keep your back flat and let the torso hinge forward.',
      'Drive your hips forward to stand tall, squeezing the glutes.',
      'Finish upright without leaning back.'
    ],
    formCues: [
      'This is a hinge — the arms just hold the rope.',
      'Feel the stretch in the hamstrings at the bottom.',
      'Ribs stay down at lockout.',
      'Do not squat the movement.'
    ],
    commonMistakes: [
      'Turning it into a squat by bending the knees.',
      'Pulling with the arms instead of hinging.',
      'Rounding the lower back at the bottom.',
      'Leaning back hard at the top.'
    ]
  },

  /* ==================== SHOULDERS ==================== */
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    archetype: 'overheadPress',
    primary: ['frontDelt', 'sideDelt'], secondary: ['triceps', 'traps', 'abs'],
    targetMuscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps Brachii', 'Upper Trapezius'],
    tempo: '2s down · press up',
    breathing: { eccentric: 'Inhale as the bar lowers', concentric: 'Exhale as you press' },
    quickForm: [
      'Bar resting on the front delts',
      'Grip just outside the shoulders',
      'Squeeze glutes and brace',
      'Move the head back slightly',
      'Press straight up',
      'Finish with the bar over the mid-foot'
    ],
    setup: [
      'Take the bar at shoulder height with a grip just outside your shoulders.',
      'Rest the bar on your front delts with the elbows slightly in front of the bar.',
      'Stand with feet hip width, glutes squeezed and core braced.'
    ],
    instructions: [
      'Move your head back slightly to clear a path for the bar.',
      'Press the bar straight up past your face.',
      'As the bar clears your head, push your head through so the bar finishes over your mid-foot.',
      'Lower the bar under control back to your front delts.'
    ],
    formCues: [
      'Squeeze the glutes to stop the lower back arching.',
      'Bar path stays close to vertical.',
      'Full lockout with the biceps beside the ears.',
      'Keep the wrists stacked over the elbows.'
    ],
    commonMistakes: [
      'Leaning back excessively and pressing from the lower back.',
      'Pressing the bar forward around the face.',
      'Flaring the elbows straight out to the sides.',
      'Losing the brace and letting the ribs flare.'
    ],
    safetyNotes: ['Press in a rack with the pins set if you are working close to your limit.']
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Traps'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    archetype: 'lateralRaise',
    primary: ['sideDelt'], secondary: ['traps'],
    targetMuscles: ['Lateral Deltoid', 'Supraspinatus', 'Upper Trapezius'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you raise' },
    quickForm: [
      'Light dumbbells, elbows slightly bent',
      'Stand tall, core braced',
      'Raise out to the sides',
      'Stop around shoulder height',
      'Lead with the elbows',
      'Lower slowly'
    ],
    setup: [
      'Stand with a dumbbell in each hand at your sides, palms facing in.',
      'Keep a slight bend in the elbows and brace your core.',
      'Set the shoulders down away from the ears.'
    ],
    instructions: [
      'Raise both dumbbells out to your sides.',
      'Stop at around shoulder height with the elbows slightly above the hands.',
      'Pause briefly at the top.',
      'Lower slowly back to your sides.'
    ],
    formCues: [
      'Lead with the elbows, not the hands.',
      'Small weights work here — this is a small muscle.',
      'Do not shrug the shoulders up as you raise.',
      'Keep the torso still; no swinging.'
    ],
    commonMistakes: [
      'Swinging the weights up with body momentum.',
      'Raising far above shoulder height and shrugging.',
      'Going so heavy the traps take over.',
      'Dropping the weights back down with no control.'
    ]
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear-Delt Fly',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Upper Back'],
    equipment: 'Reverse Pec Deck / Dumbbells',
    difficulty: 'Beginner',
    archetype: 'rearDeltFly',
    primary: ['rearDelt'], secondary: ['traps'],
    targetMuscles: ['Posterior Deltoid', 'Rhomboids', 'Middle Trapezius'],
    tempo: '1s out · 2s back',
    breathing: { eccentric: 'Inhale as the arms come together', concentric: 'Exhale as you open' },
    quickForm: [
      'Chest against the pad, or hinged forward',
      'Slight elbow bend, held fixed',
      'Sweep the arms out and back',
      'Squeeze the rear delts',
      'Stop at shoulder height',
      'Return slowly'
    ],
    setup: [
      'Sit facing the pad with your chest against it, or hinge forward holding dumbbells.',
      'Take the handles with a slight bend in the elbows.',
      'Set your shoulders down and brace your core.'
    ],
    instructions: [
      'Sweep your arms out and back in a wide arc.',
      'Stop when your arms reach roughly shoulder height and in line with the body.',
      'Squeeze the rear delts and upper back briefly.',
      'Return slowly to the start without letting the weight rest.'
    ],
    formCues: [
      'The elbow angle stays fixed throughout.',
      'Think about pulling your arms apart rather than heaving the weight.',
      'Keep the neck relaxed.',
      'Light weight, strict form — this is a small muscle.'
    ],
    commonMistakes: [
      'Using heavy weight and turning it into a row.',
      'Shrugging the shoulders up.',
      'Lifting the chest off the pad to swing the weight.',
      'Bending and straightening the elbows to cheat.'
    ]
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Triceps'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    archetype: 'arnoldPress',
    primary: ['frontDelt', 'sideDelt'], secondary: ['triceps', 'traps'],
    targetMuscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps Brachii'],
    tempo: '2s down · press up',
    breathing: { eccentric: 'Inhale as you lower and rotate in', concentric: 'Exhale as you press' },
    quickForm: [
      'Start with palms facing you at chest height',
      'Rotate the palms out as you press',
      'Press to a straight-arm finish',
      'Reverse the rotation on the way down',
      'Ribs down, core braced',
      'Smooth rotation, no jerking'
    ],
    setup: [
      'Sit or stand tall holding a dumbbell in each hand at chest height, palms facing you.',
      'Keep the elbows in front of the body.',
      'Brace your core and keep the ribs down.'
    ],
    instructions: [
      'Press the dumbbells up while rotating your palms to face forward.',
      'Finish with the arms straight overhead and palms facing away.',
      'Lower under control, rotating the palms back toward you.',
      'Return to the starting position at chest height.'
    ],
    formCues: [
      'The rotation happens gradually through the press, not all at once.',
      'Keep the wrists stacked over the elbows.',
      'Do not arch the lower back to finish the press.',
      'Lighter than a standard shoulder press — the rotation adds demand.'
    ],
    commonMistakes: [
      'Rotating the wrists abruptly at the end of the press.',
      'Arching the lower back at lockout.',
      'Letting the elbows flare wide at the bottom.',
      'Going too heavy to control the rotation.'
    ],
    safetyNotes: ['Skip or modify this one if the rotation under load bothers your shoulders.']
  },
  {
    id: 'cable-lateral-raise',
    name: 'Cable Lateral Raise',
    muscleGroup: 'Shoulders',
    secondaryMuscles: ['Traps'],
    equipment: 'Cable Machine + Single Handle',
    difficulty: 'Beginner',
    archetype: 'cableLateralRaise',
    primary: ['sideDelt'], secondary: ['traps'],
    targetMuscles: ['Lateral Deltoid', 'Supraspinatus'],
    tempo: '1s up · 2s down',
    breathing: { eccentric: 'Inhale as you lower', concentric: 'Exhale as you raise' },
    quickForm: [
      'Low pulley, single handle',
      'Cable crosses in front of the body',
      'Slight elbow bend',
      'Raise out to shoulder height',
      'Lead with the elbow',
      'Lower slowly against the cable'
    ],
    setup: [
      'Set a handle on the lowest pulley and stand side-on to the machine.',
      'Take the handle with the far hand so the cable crosses in front of your body.',
      'Stand tall with a slight bend in the working elbow.'
    ],
    instructions: [
      'Raise your arm out to the side against the cable.',
      'Stop at around shoulder height.',
      'Pause briefly at the top.',
      'Lower slowly, resisting the cable all the way down.'
    ],
    formCues: [
      'The cable keeps tension at the bottom where dumbbells lose it.',
      'Do not lean away from the machine to help the arm up.',
      'Shoulder stays down — no shrugging.',
      'Match the load and reps on both sides.'
    ],
    commonMistakes: [
      'Leaning hard to counterbalance a heavy stack.',
      'Raising above shoulder height and shrugging.',
      'Bending the elbow more to shorten the lever.',
      'Letting the stack pull the arm down fast.'
    ]
  }
];

/* ---------- normalisation ---------- */

function normalise(ex) {
  return Object.assign({ secondaryMuscles: [], secondary: [], safetyNotes: [], difficulty: 'Beginner' }, ex, {
    /* exercise-specific warnings first, then the rules that apply to everything */
    safety: [...(ex.safetyNotes || []), ...BASE_SAFETY],
    visualAsset: `archetype:${ex.archetype}`,
    searchText: [ex.name, ex.muscleGroup, ex.equipment, ...(ex.secondaryMuscles || []), ...(ex.targetMuscles || [])]
      .join(' ').toLowerCase()
  });
}

export const EXERCISES = RAW.map(normalise);
export const BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));
export const getExercise = id => BY_ID[id];

/** Filter chips, ordered the way the program trains them. */
export const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves'];

export function searchExercises(query, group) {
  const q = (query || '').trim().toLowerCase();
  return EXERCISES.filter(e => {
    if (group && group !== 'All' && e.muscleGroup !== group) return false;
    return !q || e.searchText.includes(q);
  });
}
