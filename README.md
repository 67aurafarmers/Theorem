# Theorem

Theorem is a static universal learning workspace for students.

**Core promise:** Upload or paste your material. Theorem finds the best way to teach it.

Theorem turns homework, notes, study material, worksheets, textbook sections, and code into guided learning sessions. It auto-detects the subject, chooses a study strategy, and creates active practice.

## Current Version

This version is fully static and GitHub Pages-compatible.

It uses:

- HTML
- CSS
- JavaScript
- `localStorage`

It does not use:

- a backend
- a database
- a paid API
- an exposed API key
- external dependencies
- fake login
- ads
- tracking

## Main Flow

1. Open Theorem.
2. Paste homework, notes, study material, or code.
3. Or upload a `.txt` / `.md` file.
4. Click **Build my learning session**.
5. Theorem auto-detects the subject.
6. Theorem chooses the best teaching strategy it can.
7. Theorem creates a guided learning session.
8. Progress saves locally in the browser.

There is no manual subject dropdown.

## Auto-Teaching Strategy Engine

Theorem uses a local function:

```text
chooseTeachingStrategy(text, detectedSubject)
