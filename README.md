# Numbercraft

**[Play Numbercraft](https://clearlinetechnologies.github.io/numbercraft/)**

A hand-built, offline mathematics game. Open **Numbercraft.html** in a modern browser to play. No installation, account, school login, payment, or connection is needed.

The source also runs directly: open index.html with engine.js, app.js, and style.css beside it.

## Start playing

1. Choose **Start from the beginning**.
2. Read the short lesson and reveal the worked example one step at a time.
3. Choose **Try it myself**. Type your answer or use the keypad. It will never calculate an expression for you.
4. Finish a small session, then return later using **Review**.

Enter integers, decimals, or fractions such as 3/4. Equivalent fractions work. Use exact fractions for repeating decimals unless the question requests rounding. In circle questions that ask for k in kπ, enter the coefficient, not pi.

All lessons are open. Difficulty recommendations grow from Gentle to Steady and Stretch as you answer independently. Choose another level whenever you need. Skill bars fill after 20 unassisted answers; they represent practice, not permanent mastery.

## Four complete game modes

- **Answer Engine:** Supply the answer using the keyboard or the calculator-like keypad. Eight questions per session; unlimited time.
- **Signal Sort:** Calculate a question, then compare its result with a target. Eight questions per session.
- **Circuit Match:** Connect three questions to three answers. Three boards per session.
- **Recall Run:** An optional 90-second fluency challenge with pause and resume. It pauses when the tab is hidden or a lesson/settings dialog is open.

Each mode works across all 61 skills. Mix mode uses skills you have already practised in the chosen path; for a new path it starts with its first skill.

Hints and worked solutions are available during play. Solutions appear only when explicitly requested, and never fill your answer. Assisted questions receive practice credit and return for another attempt.

## Learning paths

**Arithmetic — 18 skills:** quantities, addition, subtraction, place value, equal groups, multiplication recall, division, remainders, order of operations, negatives, fractions of quantities, adding and multiplying fractions, decimals, percentages, ratios, powers and roots, mean and median.

**Algebra — 20 skills:** substitution, one-step and two-step equations, variables on both sides, expansion, linear functions, inequalities, simultaneous equations, quadratics, exponent laws, logarithms, sequences, function composition, combinations, probability, determinants, polynomial derivatives, definite polynomial integrals, limits, and eigenvalues of triangular matrices.

**Geometry — 23 skills:** shapes, perimeter, area, angles, triangles, polygons, circles, box and cylinder volumes, Pythagoras, coordinate distance and slope, similarity, trigonometric ratios, cosine rule, dot and cross products, planes, parabola focus, polar coordinates, and curvature at a parabola’s vertex.

The path reaches introductory university topics through specific problem families. It is not an exhaustive university curriculum, a formal course, or an academic-credit programme.

## Remembering and rewards

Questions are generated from mathematical constraints, not a fixed list. The test sample produced 45,624 distinct questions. All modes can draw from the full curriculum. Small counting, shape, and multiplication fact sets are intentionally finite and repeat.

Successful recalls are scheduled at increasing intervals: 1 minute, 10 minutes, 1 day, 3 days, 1 week, and 3 weeks. An early repeat does not advance a fact past its current interval. Mistakes return after two intervening questions when the session has room, and enter the review queue after 30 seconds. Reviews happen when you open the game; there are no notifications or background services.

Earn XP, 12 achievement badges, and five observatory upgrades at 1,000-XP intervals. There are no lives, paid unlocks, advertising, or streak penalties. Daily targets can be 5, 10, or 20 answered questions. Sound is optional.

## Keep your progress

Progress saves after each answered question in this browser. Private browsing, clearing browser storage, moving the HTML file, or changing browsers can separate or remove that save. File-based storage behaviour varies between browsers.

Use **Settings & saved progress → Export backup** to keep a portable JSON backup. Importing replaces the current browser save after confirmation. If browser storage is unavailable or full, the game continues for the session and displays **Session only · export a backup**.

There are no external requests, accounts, analytics, or remote saves. All artwork, game code, content, and styles are included locally.

## Files

- Numbercraft.html — self-contained game, ready to open.
- index.html — source entry point.
- style.css — responsive visual design.
- engine.js — mathematical generators and answer checking.
- app.js — game modes, lessons, progress, review, and rewards.

Keyboard: type in the answer box and press Enter to check. Tab moves through controls. Escape closes lessons and settings. Reduced motion and sound controls are in Settings.

## Development

No dependencies or package installation are required. With Node.js 20 or newer, run npm test to validate the generators and game logic. Run npm run build to regenerate the portable Numbercraft.html after editing the source. GitHub Pages serves index.html from the repository root.
