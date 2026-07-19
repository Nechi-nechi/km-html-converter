# Claude Code Usage Review — km-html-converter

**Prepared:** 2026-07-19 · **Branch:** `claude/code-usage-analysis-adcaus`

This is the entry point. It covers three things:

1. **What I could and couldn't actually measure** (read this first — it changes how to read the rest)
2. **The habits and friction I can see from hard evidence**, and what to do about each
3. **The next step** — what else to point Claude at, where you're leaving leverage on the table

Everything I recommend is shipped as a real, reviewable file in this branch. Nothing here is hypothetical — the list is at the bottom.

---

## 0. Read this first: the data I had vs. the data you asked about

You asked me to run `/insights` and analyze your usage "as far back as insights goes … across all the Claude Code terminals I'm running." I need to be straight with you about what was possible:

- **There is no `/insights` command in this environment.** It isn't a built-in Claude Code command and it isn't an installed skill here. I checked the CLI, the skills manifest, and the commands directory. So I could not run it.
- **This is an ephemeral cloud container.** It was cloned fresh when the session started. The only transcript on disk is *this* session (~52 KB, created today). Your real history — every terminal, every past session — lives on your local machine at `C:/Users/nechi/...`, which this container cannot see.

So I could not retro-analyze months of sessions. **What I did instead** was mine the evidence that *is* here and is high-signal:

- Your **git history** (42 commits on `main`) — a fossil record of how you actually work
- Your **committed permission allowlist** (`.claude/settings.local.json`) — every command you approved, verbatim
- The **codebase itself** (`index.html`, 4,048 lines, 196 functions) — what you're building
- Your **connected MCP servers** (GitHub, Canva, TikTok/Instagram/YouTube transcripts, + others) — what your *other* work looks like

That turned out to be enough to draw real conclusions. But treat the "habits" below as **inferred from artifacts, not measured from telemetry.** If you want the true usage analysis, the closing section tells you exactly how to get it off your local machine.

---

## 1. What you're building (so the rest has context)

`index.html` is a single-file, zero-dependency vanilla-JS app: a **Word → Salesforce Knowledge HTML converter** for KM writers. Paste from Word, it strips MSO markup, rebuilds lists (native Word *and* Word Online), normalizes headings/tables/callouts to a fixed Salesforce style contract, flags anything needing manual review, and gives a live preview + editable output with tag-highlighting.

It's genuinely non-trivial: 196 functions, a custom undo stack, two different Word-list reconstruction paths, a highlight-mirror overlay synced to a textarea. And it's all in **one 4,048-line file with no CLAUDE.md and no tests.** Hold that thought.

---

## 2. Habits & friction — evidence → diagnosis → fix

### 2.1 Permission-prompt thrash (the biggest daily tax)

**Evidence.** Your `.claude/settings.local.json` allowlist contains entries like:

```
"Bash(git commit -m 'Phase 2 step 2.0: centralize #htmlOutput change side-effects in onHtmlChanged\\(\\) *)"
"Bash(git commit -q -m 'Phase 2 step 2.2: extract shared tag tokenizer scanTags\\(\\) *)"
"Bash(git commit -q -m 'Callouts absorb their bullet lists into the blockquote *)"
```

Each **individual commit message** is its own allowlist rule. And **four separate commits** on `main` are literally titled *"Update Claude Code local permission allowlist."*

**Diagnosis.** You're approving a prompt for essentially every commit, because the allowlist matches on the *exact message*, which is unique every time. The allowlist never actually helps — it just grows, and you keep committing the growth. This is pure friction, repeated dozens of times.

**Fix (shipped).** `docs/claude-code-review/proposed-settings.local.json` replaces the 17 brittle exact-match rules with a handful of pattern rules (`Bash(git commit *)`, `Bash(git add *)`, `Bash(git push *)`, `Bash(node -e *)`, `Bash(node --check *)`). One prompt each, forever. Also: **stop committing `settings.local.json`** — it's local-machine state (it even hardcodes `C:/Users/nechi/...` paths that mean nothing on another machine or in this container). Add it to `.gitignore`. There's a repo skill for exactly this — `/fewer-permission-prompts` — run it once and it does this scan for you.

### 2.2 A hand-run "deploy" step you do over and over

**Evidence.** In the allowlist:

```
"Bash(cp index.html \"C:/Users/nechi/Downloads/km-paste-to-html-converter.html\")"
"Bash(cp \"C:/Users/nechi/km-html-converter/index.html\" \"C:/Users/nechi/Downloads/km-paste-to-html-converter.html\" && wc -l ...)"
```

**Diagnosis.** Your real "ship it" action is: copy `index.html` to Downloads under a different filename (the name your KM users actually open). You do this by hand, repeatedly, and it's fiddly enough that you allowlisted two variants of it.

**Fix (shipped).** `/release` (`.claude/commands/release.md`) — one command that syntax-checks the file, copies it to the distribution name, and optionally commits + pushes. Turns a multi-step manual ritual into one word.

### 2.3 Editing on two surfaces → merge commits

**Evidence.** Commits `2a1462a Add files via upload`, `4ebb048 Delete index.html`, `759401b Update index.html`, `0a0a200 Update index.html` are GitHub **web-UI** edits. Then `d4d20ce Merge online repo history (README, screenshots) with local development` — a merge to reconcile the web edits with your local branch.

**Diagnosis.** You edit both locally (with Claude) and directly on GitHub.com, and periodically have to stitch the two histories back together. Every merge like that is a chance to silently clobber a fix.

**Fix (guidance, in `LESSONS.md`).** Pick one source of truth — local — and let Claude push. Use the web UI only for README/screenshot tweaks you'll never touch locally, or stop using it entirely. The `/release` command makes local→GitHub a single step so there's no reason to reach for the web editor.

### 2.4 No CLAUDE.md for a 4,000-line file

**Evidence.** No `CLAUDE.md` anywhere in the repo. The code has good *inline* section comments (`/* OUTPUT GRID */`, `/* PAIRED TEXT METRICS */`) — so you clearly hold a mental map — but none of it is written down for Claude.

**Diagnosis.** Every fresh session, Claude re-derives the architecture of a 196-function file from scratch before it can safely change anything. That's slow, and it's how a well-meaning edit breaks the highlight-mirror sync or the Word-Online list path.

**Fix (shipped).** A real `CLAUDE.md` at the repo root: the subsystem map (RTE toolbar, two Word-list rebuild paths, convert pipeline, highlight mirror, validation panel, undo stack), the invariants that must not break (`#htmlOutput`/`#htmlMirror` metric parity; the Salesforce style contract), and the actual dev loop.

### 2.5 "Testing" is a syntax check and your eyeballs

**Evidence.** Allowlist shows `node --check km-check.js`, `node --check /tmp/km-check.js`, and a probe for whether `jsdom` is available. There is no test file, no fixtures directory, no CI.

**Diagnosis.** For a tool whose *entire value is output fidelity*, the only automated safety net is "does the JS parse." Everything else is manual paste-and-look. That's why the git log is a long tail of regression fixes — *"reconvert collapsing Word Online content to plain text after edits,"* *"RTE Heading 2 converting to h3/Arial 16 instead of h2/Arial 18."* Those are exactly the bugs a fixture harness catches for free.

**Fix (shipped and running).** `/verify-conversion` plus a **working** regression suite under `tests/`: 10 real Word/Word-Online paste fixtures + 35 contract assertions, run headlessly against the real `convertHTML()` via jsdom. **45/45 pass**, and I proved it has teeth by injecting the exact historical bug (H2→16px) — the suite went red and pointed at the line, then I restored the file. The H2/H3 regression is now a one-line assertion, not a support ticket. (Building it surfaced a **stale contract**: the README says table headers have "no background fill," but the code fills them navy `#0A0E33` with white text and uses `0.5px` borders — I corrected the `salesforce-html` skill to match the code; the README still needs the same fix.)

### 2.6 The monolith itself

**Evidence.** 4,048 lines, one file, mid-refactor (you have a disciplined "Phase 2 step 2.0 / 2.1 / 2.2" sequence going).

**Diagnosis.** This is *not* a Claude-misuse — the phased refactor is good practice and you're doing it well. It's flagged only because file size is the root multiplier behind 2.4 and 2.5: no map + no tests + one giant file = every change is riskier than it needs to be. The two fixes above are what de-risk continuing the refactor.

**Fix (shipped).** `/checkpoint` (`.claude/commands/checkpoint.md`) formalizes the "Phase N step X.Y" commit style you already use, and reminds you to run `/verify-conversion` before each checkpoint so refactor steps stay provably behavior-preserving.

---

## 3. Broad themes (the "wide" view)

Pulled together, three patterns explain almost everything above:

1. **You re-do setup instead of banking it.** Permission prompts, the copy-to-Downloads step, re-explaining the architecture — all recurring costs you pay every session because nothing is captured as a reusable asset. *The entire fix category is: turn rituals into commands/skills/CLAUDE.md once.*
2. **You verify by looking, not by asserting.** Fine for a 200-line toy; expensive for a 4,000-line fidelity tool. The regression tail in your git log is the invoice. *Fix: fixtures + a verify command.*
3. **You use Claude as a code editor, but you have a content/media stack sitting idle.** See §4 — this is the biggest untapped area.

Full write-up with the reasoning is in `LESSONS.md`.

---

## 4. The next step — what else to use Claude for

You asked: *"Where am I not taking the next step? What else should I be using you for?"* Here's the honest answer, from strongest to most speculative.

### 4.1 You have a content pipeline connected and unused

Your session has **Canva**, **TikTok/Instagram/YouTube transcript** tools, and the **docx / pptx / xlsx / pdf** skills all wired up — but every scrap of evidence I have (git history, allowlist, the repo) is *code*. That's a whole second workshop you own and aren't running through Claude.

Concretely, the "next step" is to build the same kind of **repeatable asset** for content that `/release` is for code:
- **Transcript → deliverable**: pull a YouTube/TikTok transcript → have Claude turn it into a doc, a deck, or a Canva design. That's a one-command pipeline across four tools you already have.
- If KM writing is the day job, the converter tool solves the *last* mile (formatting). The *first* mile — turning source material into an article draft — is where Claude saves you far more time, and you're not using it there yet.

*(I've left this as a recommendation, not a built command, because I can't see enough of that workflow to build it blind. If you tell me what the actual content loop looks like, I'll build the pipeline command the same way I built `/release`.)*

### 4.2 Make the converter trustworthy, then extend it

Right now the ceiling on this tool is trust: without tests, you can't add features without fear of regressions. Do §2.5 (fixtures + `/verify-conversion`) **first**, and then the roadmap opens up:
- Real image handling (upload → hosted URL) instead of the `[Insert image here]` placeholder
- A round-trip test against a *real* Salesforce paste (your README already screenshots the round-trip — codify it as a fixture)
- Finish Phase 2 by actually splitting the monolith once tests guarantee behavior is preserved

### 4.3 Stop starting from zero

The meta-move: you clearly run many Claude Code sessions. Every asset in this branch (CLAUDE.md, the commands, the skill, the hook) is designed to be **reused across all of them**, not just this repo. The salesforce-html skill in particular is portable — any session, any tool, that needs to emit Salesforce-Knowledge HTML now has the exact contract. Build the library once; stop re-teaching Claude the same things.

---

## 5. Everything shipped in this branch (your review checklist)

| File | What it is | Why |
|---|---|---|
| `CLAUDE.md` | Project memory: architecture map + invariants + dev loop | §2.4 — stop re-deriving the codebase |
| `.claude/commands/release.md` | `/release` — check → copy to dist name → commit/push | §2.2 — kill the manual deploy |
| `.claude/commands/verify-conversion.md` | `/verify-conversion` — how to run the suite | §2.5 — regressions become assertions |
| `tests/` (run.mjs, assertions.mjs, lib/, 10 fixtures) | **Working** regression suite, 45/45 pass | §2.5 — built out, not just a doc |
| `.claude/commands/checkpoint.md` | `/checkpoint` — your "Phase N step X.Y" commit ritual, formalized | §2.6 — safe refactor steps |
| `.claude/skills/salesforce-html/SKILL.md` | The Salesforce-Knowledge HTML output contract | §4.3 — portable, reused everywhere |
| `.claude/hooks/check-syntax.sh` | Post-edit auto `node --check` on index.html | §2.5 — catch syntax breaks automatically |
| `docs/claude-code-review/proposed-settings.local.json` | Broadened permission patterns to replace the brittle list | §2.1 — end the prompt thrash |
| `docs/claude-code-review/LESSONS.md` | The broad themes, written out | §3 |

**Nothing here is applied for you** beyond being written to this branch — review each, keep what's useful, delete the rest. The two I'd apply today: the `CLAUDE.md` and the `proposed-settings.local.json`.
