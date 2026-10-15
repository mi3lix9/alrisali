// Claude Code PreToolUse hook (registered in .claude/settings.json).
// Exit code 2 blocks the tool call and shows stderr to the agent.
import {
  BYPASS_MESSAGE,
  findHookBypass,
} from "../../scripts/agent-guards/hook-bypass";

interface HookInput {
  tool_input?: { command?: unknown };
}

const input = (await Bun.stdin.json()) as HookInput;
const command = input.tool_input?.command;
const hit = typeof command === "string" ? findHookBypass(command) : undefined;

if (hit) {
  process.stderr.write(`Blocked: ${hit} ${BYPASS_MESSAGE}\n`);
  process.exit(2);
}
