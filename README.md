# Theorem

Theorem is a static universal learning workspace for students.

Core promise:

> Theorem turns any homework, notes, or study material into a guided tutoring session. You try first. It checks what it can, questions what it can’t, and helps you master the material.

## What it does

Theorem lets students paste or upload `.txt` / `.md` material, then creates a guided study session.

Supported session types:

* **Math exact-check mode**

  * Two-step equations
  * Combining like terms
  * Distributive property
  * Answer checking
  * Mistake diagnosis
  * Hint levels
  * Repair drills
  * No answer before attempt

* **Concept tutor mode**

  * Science
  * History / Social Studies
  * English / Reading
  * Foreign Language
  * General Study
  * Summaries
  * Likely key terms
  * Flashcards
  * Quiz prompts
  * Teach-back checks
  * Self-check rubrics

* **Code tutor mode**

  * What the code appears to do
  * Important lines
  * Possible bugs or edge cases
  * Explain-this-line prompts
  * Modification challenge
  * Test case suggestions

## Honesty rule

Theorem does not use an AI API and does not pretend to perfectly understand all material.

For supported Algebra 1 patterns, it can check answers exactly.

For open-ended subjects, it says things like:

* “Based on the text you pasted…”
* “Theorem found these likely key ideas…”
* “Check this against your class notes.”

It guides active recall instead of pretending to be a perfect grader.

## Files

* `index.html` — app structure
* `style.css` — warm premium responsive interface
* `script.js` — learning engines, math checking, progress tracking, navigation
* `README.md` — project notes

## How to use locally

1. Download or clone the project.
2. Open `index.html` in a browser.
3. Paste homework, notes, study material, or code into the Learn Workspace.
4. Choose a subject or leave it on Auto-detect.
5. Click **Build learning session**.

No install step is required.

## Deploy on GitHub Pages

1. Create a GitHub repository.
2. Upload these files to the repository root:

   * `index.html`
   * `style.css`
   * `script.js`
   * `README.md`
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose:

   * Source: `Deploy from a branch`
   * Branch: `main`
   * Folder: `/root`
5. Save.
6. Open the GitHub Pages URL.

## Local progress

Theorem saves progress in `localStorage` using:

```text
theoremProgressV2
```

Tracked locally:

* learning sessions created
* subject sessions
* materials imported
* supported math problems imported
* unsupported problems
* math problems attempted
* correct answers
* mistake categories
* concept quizzes completed
* flashcards reviewed
* teach-back attempts
* weak subjects
* weak terms
* recent attempts

No account, backend, cookies, ads, or analytics are used.

## Supported math formats

Examples:

```text
2x + 5 = 17
3x - 4 = 11
5x + 2 = 27
3x + 2x + 5
4x + x + 7
6x - 2x + 9
3(x + 4)
2(x + 5)
5(x - 2)
```

Accepted equation answers include:

```text
6
x = 6
X=6
6.0
```

## Upload support

Currently supported:

* `.txt`
* `.md`

Not supported yet:

* images
* PDFs
* OCR
* handwriting recognition

If a user uploads an image or PDF, Theorem explains that image and PDF upload is coming later.

## Accessibility and safety

* Keyboard-friendly navigation
* Visible focus states
* High-contrast text
* Labeled inputs
* Mobile responsive layout
* No raw user material rendered with `innerHTML`
* Pasted text is rendered with `textContent`
* Local-only storage
* No password or login collection

## Future improvements

* More Algebra topics
* Geometry and statistics support
* Better concept extraction
* Import from PDFs using client-side parsing
* Optional accounts for cross-device progress
* Safe future sign-in options:

  * Google sign-in
  * email magic link
  * passkeys
