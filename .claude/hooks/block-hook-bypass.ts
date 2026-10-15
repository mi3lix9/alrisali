// Claude Code PreToolUse hook: refuse shell commands that skip the git hooks.
// Exit code 2 blocks the tool call and shows stderr to the agent.
// Hooks are client-side; the GitHub ruleset on main is the real enforcement.

interface HookInput {
  tool_input?: { command?: unknown };
}

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

const input = (await Bun.stdin.json()) as HookInput;
const command = input.tool_input?.command;

if (typeof command === "string") {
  const hit = BYPASS_PATTERNS.find(([pattern]) => pattern.test(command));
  if (hit) {
    process.stderr.write(
      `Blocked: ${hit[1]} skips the repo's git hooks. Fix the failing check instead; hooks are mandatory (see lefthook.yml).\n`
    );
    process.exit(2);
  }
}
