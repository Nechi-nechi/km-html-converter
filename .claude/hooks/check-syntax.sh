#!/usr/bin/env bash
# PostToolUse hook: after any edit to index.html, syntax-check the inline <script>.
# Catches broken JS the moment it's introduced instead of at manual test time.
#
# Wire it up in .claude/settings.json (NOT settings.local.json, which is gitignored):
#
#   "hooks": {
#     "PostToolUse": [
#       { "matcher": "Edit|Write",
#         "hooks": [ { "type": "command", "command": "bash .claude/hooks/check-syntax.sh" } ] }
#     ]
#   }
#
# The hook reads the tool payload on stdin; it only acts when index.html was touched.
set -euo pipefail

payload="$(cat)"
# Only run when index.html is the edited file (cheap substring check; avoids a JSON dep).
case "$payload" in
  *index.html*) : ;;
  *) exit 0 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
file="$root/index.html"
[ -f "$file" ] || exit 0

# Extract the inline script and syntax-check it.
script="$(mktemp /tmp/km-check.XXXXXX.js)"
trap 'rm -f "$script"' EXIT
sed -n '/<script>/,/<\/script>/p' "$file" | sed '1d;$d' > "$script"

if ! node --check "$script" 2>/tmp/km-check.err; then
  echo "⚠️  index.html inline script has a syntax error:" >&2
  cat /tmp/km-check.err >&2
  # Exit 2 surfaces the message back to Claude so it can fix before continuing.
  exit 2
fi
exit 0
