# Lessons

A lesson is a **mechanism** (mekanizëm), not a complaint. "Be more careful" is not a lesson.
"Open the reference PNG before coding a band" is. Format: what shipped → why it failed → the hard stop.
Lessons that apply to every project go to the brain (`docs/lessons.md` there) via the senior dev.

## Core rule

Matching the reference's mood, palette or fonts is not a fidelity pass. Same structure, our brand.
Details: `.cursor/rules/reference-fidelity.mdc`.

## From the practice runs (Sept 2026) — already turned into rules

| Shipped | Why it failed | Hard stop now |
|---|---|---|
| Every band failed the first fidelity check | rows said "split hero", no measurements | `/refs` measures the live page; row has numbers |
| Lighthouse "High" on `next dev` | dev build measured | `/qa` measures production builds only |
| Reserve button called nothing | no phone / WhatsApp number in the brief | `/kickoff` round 2 asks the numbers; `/build shell` refuses empty ones |
| `#reserve` hidden under the sticky header | no scroll-padding | `site-chrome.mdc` |
| Footer under the sticky bar | padding only on `main` | `site-chrome.mdc` |
| Honeypot returned 400 to bots | validation ran before the trap | honeypot first, silent success |
| `git push` failed | no remote in a practice project | skills check for a remote and skip |
| `Cannot find module 'playwright'` in `/qa` | not installed | `@playwright/test` in `/scaffold` |
| Scaffold chose vinext / workerd 500 on Windows | server build for a brochure site | static export is the default (ADR 0006) |

## This project

| Date | Shipped | Why it failed | Hard stop |
|---|---|---|---|
| | | | |
