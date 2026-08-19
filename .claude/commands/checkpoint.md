---
description: Commit the current work as a verified checkpoint in the "Phase N step X.Y" style used by this repo.
---

# /checkpoint

Formalizes the disciplined refactor-commit style already in this repo's history
("Phase 2 step 2.0: centralize #htmlOutput change side-effects…", "Phase 2 step 2.2:
extract shared tag tokenizer scanTags()").

Steps:

1. **Verify behavior is preserved.** Run `/verify-conversion` (or at minimum
   `node --check` on the inline script). If it fails, STOP and report — a checkpoint
   must not commit a regression. If no fixtures exist yet, say so and proceed only after
   confirming the change is a pure refactor.
2. **Show what changed.** `git status` + a short `git diff --stat` summary so the user
   sees the scope before it's committed.
3. **Commit.** Use `$ARGUMENTS` as the subject if given. Otherwise propose a subject in
   the repo's style: `Phase <N> step <X.Y>: <what>` for refactor steps, or a plain
   imperative subject for fixes/features. Keep it to one line unless the change needs a body.
4. Do **not** push unless asked — `/release` handles publishing.

The point of a checkpoint is that each one is independently correct: verified, scoped,
and described. Small verified steps beat big unverified ones for a 4,000-line single file.
