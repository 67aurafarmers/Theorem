[README.md](https://github.com/user-attachments/files/27111567/README.md)
# Theorem

Theorem is a static, mistake-first Algebra 1 tutoring website.

**Positioning:** Theorem finds the step you missed, fixes the exact skill, then makes you prove you learned it.

## Description

Theorem helps middle school and high school students learn by diagnosing the exact mistake pattern in their work instead of simply giving answers. The first live modules are:

- Two-step equations
- Combining like terms
- Distributive property

The site runs entirely in the browser using HTML, CSS, and JavaScript. It has no backend, no login, no paid API, no build step, no external dependencies, no ads, and no tracking.

## How to use

1. Open `index.html` in a browser.
2. Click **Start Diagnostic** or **Practice Algebra**.
3. Try a problem before seeing the answer.
4. Read the diagnosis if the answer is wrong.
5. Complete the short repair drill.
6. Prove mastery with a fresh problem.
7. Visit **Progress** or **Review** to see tracked mistake patterns.

## How to deploy on GitHub Pages

1. Create a new GitHub repository.
2. Add these files to the root of the repository:
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. Commit and push the files.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
6. Save. GitHub will publish the site as a GitHub Pages static site.

## Features

- Premium dark responsive interface
- Mobile-friendly layout
- Keyboard-usable controls
- Accessible labels and visible focus states
- Diagnostic tutoring loop
- No answer shown before an attempt
- Tiered hints
- Mistake diagnosis instead of generic wrong-answer feedback
- Short repair drills
- Fresh mastery problems
- Local progress with `localStorage`
- Tracks:
  - total attempts
  - total correct
  - accuracy
  - current streak
  - mistake categories
  - strongest skill
  - weakest skill
  - mastered skills
  - weak skills
  - recent attempts
- Review questions generated from weak areas
- Works on GitHub Pages with no build step

## Mistake categories

Theorem tracks these mistake patterns:

- `skipped_inverse_operation`
- `wrong_operation`
- `sign_error`
- `arithmetic_error`
- `combined_unlike_terms`
- `distribution_error`
- `variable_confusion`
- `incomplete_solution`
- `random_or_unclear`

## Safety and robustness

- User answers are not rendered as raw HTML.
- Bad input produces a helpful response instead of crashing.
- localStorage failures fall back to in-memory progress for the session.
- Repeated identical submissions do not spam progress.
- Coming-soon modules are visible but not fake-clickable.
- No personal data, emails, cookies, or external tracking are collected.

## Future improvements

- Add variables-on-both-sides equations.
- Add slope basics with graph-free and graph-based practice.
- Add word problem translation.
- Add a printable teacher summary.
- Add import/export for local progress.
- Add more adaptive sequencing based on repeated mistake patterns.
