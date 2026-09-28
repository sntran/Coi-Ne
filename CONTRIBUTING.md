# Contributing to Coi Nè

## Language

Write all text in ASD-STE100 Simplified Technical English: documents, code comments, names, log text,
and commit messages. Use short sentences, the active voice, and one instruction in each sentence.
The Vietnamese text in `lang/vi.json` is not in this rule.

## Text in the app

Put all text for the user in `lang/vi.json` and `lang/en.json`. Each text has a key.
Do not put text in the HTML or the JavaScript. Each key must be in both files.

## Before a commit

1. Run `node tools/build-sw.js` after you add, remove, or change a file of the site.
2. Run `npm test`. All tests must pass.
3. Make small commits, one for each step.

## Rules for the games

- The child must be able to play without reading. Speak each instruction.
- Make all touch targets at least 80 px.
- Do not use timers, lives, scores that go down, or a "game over" screen.
- A wrong answer gets a soft "Thử lại nhé". Do not use a sound that means "wrong".
- Put the game rules in `js/logic/`. These modules must not use the DOM. Add tests for them.
