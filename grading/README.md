# Assignment 3 — Grading Setup

## Prerequisites

- **Python 3** (I'm on  3.14.3, but also I swear every time I install python it somehow goes weird, so, grain of salt) 
- **Node.js + npm**


## Disclaimer
I (and my close friend Jean Claude) wrote these tests to grade the functionality as best I could given a) it's largely front end features b) the code implementation and location varied wildly between students. I tried to update the tests as I came across alternative ways of implementing the required features, so it should have pretty good coverage at this point. I would still recommend manually checking the projects for any low/weird grades that are produced by these tests.

Also, I'm a backend engineer, front end testing is not my specialty and, quite frankly, weirds me out.

## Directory Structure

```
grading/
├── gradingScript.py          # Main grading script — run this
├── grades.csv                # Output: one row per student with pass/fail counts
├── submissions/              # Drop student folders here (see below)
├── grading-debug-runs/       # Full test output saved per run, timestamped
├── package.json              # Baseline package.json merged into each student project 
├── vite.config.js            # Vite/Vitest config injected into each student project
├── testSetup.js              # Vitest setup file injected into each student's src/
├── ecommerce.grading.test.js # Hidden grading tests for the e-commerce app
├── dashboard.grading.test.js # Hidden grading tests for the dashboard app
└── game.grading.test.js      # Hidden grading tests for the game app
```

## Submissions Format

Create one subfolder per student inside `submissions/`. The folder name becomes the student identifier in `grades.csv`. Each student folder *should* contain their three submitted zips (or extracted folders) named so that `ecommerce`, `dashboard`, and `game` appear somewhere in the filename. However, a lot of students will have zipped the files back up in a weird way. This script attempts to fix that as much as possible.

The script handles several messy submission structures:

- A single outer zip wrapping everything (unwrapped automatically, up to 6 layers deep)
- Zips with Windows-style backslash paths in filenames (repaired automatically)
- Deeply nested folders (e.g. `dashboard/dashboard/dashboard/src/`) — the script walks down to find `src/`
- Unclaimed zips with non-standard names are assigned to whichever app has no source yet

Example layout that works:

```
submissions/
└── Jane_Smith/
    ├── ecommerce.zip
    ├── dashboard.zip
    └── game.zip
```

## Running the Script

```bash
cd grading
python3 gradingScript.py
```

The script will:

1. Iterate over every subfolder in `submissions/`
2. For each student, locate the three app zips/folders
3. Unzip each app, inject the grading test file + support files, run `npm install` and `npx vitest run`
4. Parse the Vitest output for pass/fail counts and failed test names
5. Print a per-app summary to the terminal
6. Write final results to `grades.csv`

## What Gets Injected Into Each Student Project

| File | Destination | Purpose |
|---|---|---|
| `ecommerce.grading.test.js` | student's `src/` | Hidden grading tests |
| `dashboard.grading.test.js` | student's `src/` | Hidden grading tests |
| `game.grading.test.js` | student's `src/` | Hidden grading tests |
| `package.json` | student's project root | Merges any missing deps/devDeps/scripts into the student's copy |
| `vite.config.js` | student's project root | Overwrites config to ensure jsdom environment and correct setup file path |
| `testSetup.js` | student's `src/` | Configures `@testing-library/jest-dom` matchers and RTL cleanup |

The student's own `package.json` is not replaced — only missing keys are added.

## Output

**Terminal** — live pass/fail per app and failed test names as the script runs.

**`grades.csv`** — one row per student:

| Column | Description |
|---|---|
| `student` | Subfolder name from `submissions/` |
| `passed` | Total tests passed across all three apps |
| `total` | Total tests run |
| `failed_tests` | Semicolon-separated list of failed test names, prefixed with `[appname]` |

**`grading-debug-runs/`** — each run creates a timestamped subfolder (e.g. `20260620-143012/`) containing the fully expanded student projects with injected test files. Useful for debugging why a test failed — you can `cd` into any student's app folder and run `npx vitest run` manually.
