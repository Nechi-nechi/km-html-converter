# Lessons — the broad themes

The "wide" companion to `00-REPORT.md`. Three themes explain almost every specific
friction point I found. Each is stated as a habit, then the principle, then the move.

---

## Theme 1 — Bank your setup; stop re-paying it

**The habit.** Recurring costs you pay every session because nothing gets captured:
- A fresh permission prompt for essentially every commit (the allowlist matched exact
  messages, so it never actually helped — and you committed the growing list four times).
- Copying `index.html` to its distribution filename by hand, repeatedly.
- Claude re-deriving a 4,000-line architecture from scratch each session (no CLAUDE.md).

**The principle.** In Claude Code, anything you do more than twice should become an
asset: a slash command, a skill, a hook, or a line in CLAUDE.md. The asset is written
once and pays out every session after. Re-doing setup is the single most common way to
leave time on the table.

**The move.** Every time you catch yourself re-typing a command, re-approving a prompt,
or re-explaining the codebase — stop and capture it. This branch does the first round for
you: `/release`, `/checkpoint`, `/verify-conversion`, the `salesforce-html` skill, the
syntax hook, `CLAUDE.md`. Keep adding to the pile.

---

## Theme 2 — Verify by asserting, not by looking

**The habit.** For a tool whose entire job is output fidelity, the only automated check
was `node --check` (does the JS parse). Everything else was paste-into-the-app-and-look.
The git log is the receipt: a long tail of fidelity regressions — H2 rendering as h3/16px,
Word Online content collapsing to plain text on reconvert, callouts mishandling bullets.
Every one of those is a bug a fixture would have caught before it shipped.

**The principle.** Manual verification doesn't scale and doesn't stick. A regression you
fix by eye today comes back in three commits. A regression you fix with a fixture stays
fixed — the fixture is a tripwire forever. This matters *most* for exactly the kind of tool
you're building: deterministic input→output transformation, where "correct" is checkable.

**The move.** `/verify-conversion` bootstraps a fixtures harness (real Word-paste input +
expected Salesforce output, diffed headlessly via jsdom). Rule going forward: **every
conversion bug you fix gets a fixture before you close it.** Your bug list becomes your
test suite. This is also what unblocks finishing the Phase 2 refactor safely — you can't
confidently split a monolith you can't regression-test.

---

## Theme 3 — You're a power user of half your toolbox

**The habit.** Every artifact I can see — git history, permission allowlist, the repo — is
code. Meanwhile your session has **Canva**, **TikTok/Instagram/YouTube transcript** tooling,
and the **docx / pptx / xlsx / pdf** skills all connected and, as far as I can tell, unused
through Claude.

**The principle.** Claude Code is not just a code editor with a terminal — it's an
orchestrator across every tool you connect. The highest-leverage workflows are usually the
ones that chain tools you'd otherwise operate by hand one at a time: transcript → draft →
deck → design, all in one pass.

**The move.** Pick one real content loop you currently do manually and make it a command,
the same way `/release` made your deploy one word. The strongest candidate, given you build
KM tooling: the *authoring* side of KM articles (source material → reviewed draft), not just
the *formatting* side your converter already handles. Tell Claude what that loop looks like
and it gets built. (See `00-REPORT.md` §4 for the specifics.)

---

## One-line version

1. **Capture rituals as assets** — commands, skills, hooks, CLAUDE.md.
2. **Turn bugs into fixtures** — assert fidelity, don't eyeball it.
3. **Use the whole toolbox** — orchestrate content the way you orchestrate code.
