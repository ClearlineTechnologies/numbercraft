# Numbercraft validation

Validated locally on 21 September 2026.

## Mathematical engine

- 61 skills × 3 difficulty levels × 500 seeded samples = 91,500 generated questions.
- 45,624 distinct question keys in that sample.
- All answers finite; displayed exact answers accepted; incorrect neighbouring values rejected.
- Four-choice distractor generation yields distinct values and exactly one correct choice.
- 1,300 independent recalculations from visible question text for arithmetic, fractions, quadratics, calculus, determinants, triangle angles, Pythagoras, and curvature.
- Number/fraction parsing, equivalent fractions, invalid expressions, and review intervals passed.

## Game logic

- All 732 combinations of 61 skills, three difficulties, and four modes exercised through the session logic.
- Matching boards have three distinct answers and complete correctly.
- Comparison targets agree with the displayed number or fraction.
- Repeated submission cannot award XP twice.
- Invalid/wrong answers do not award a completed question.
- Assisted questions enter the retry queue and return after two intervening rounds.
- Early repetition cannot promote a fact through long-term review intervals.
- Difficulty recommendations, backup validation, save round-trip, and storage failure handling passed.
- Timed mode pause and automatic expiry passed.

## Browser checks

- Completed an eight-question arithmetic session, eight fraction comparisons, and all three matching boards.
- Checked a multiplication Recall Run, pause/resume, and ending the session.
- Completed an eight-question scheduled review, including exact fractions.
- Opened a calculus lesson and submitted a correct derivative answer.
- Reopening preserved XP and learning history.
- Invalid expressions were rejected; hints never auto-filled the answer.
- Desktop and 390px-wide phone layouts inspected; no horizontal overflow.
- Phone settings access and answer keypad checked.
- No JavaScript errors observed during these browser runs.

These checks validate the implemented question families and game behaviour. They do not establish an educational outcome or equivalence to a university course.
