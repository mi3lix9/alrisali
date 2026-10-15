// Shared by the Claude Code and omp agent guards: detect shell commands that skip
// the repo's git hooks. Agent-side only; the GitHub ruleset on main is the real gate.

const BYPASS_PATTERNS: readonly [RegExp, string][] = [
  [/--no-verify\b/u, "--no-verify"],
  [
    /\bgit\b[^\n;&|]*\bcommit\b[^\n;&|]*\s-[a-zA-Z]*n[a-zA-Z]*\b/u,
    "git commit -n",
  ],
  [/\bLEFTHOOK(?:_EXCLUDE)?=/u, "LEFTHOOK env override"],
  [/core\.hooksPath/u, "core.hooksPath override"],
  [/\.git\/hooks/u, "touching .git/hooks"],
  [/\blefthook\s+uninstall\b/u, "lefthook uninstall"],
];

export const BYPASS_MESSAGE =
  "skips the repo's git hooks. Fix the failing check instead; hooks are mandatory (see lefthook.yml).";

export const findHookBypass = (command: string): string | undefined =>
  BYPASS_PATTERNS.find(([pattern]) => pattern.test(command))?.[1];
