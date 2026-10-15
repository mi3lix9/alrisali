// omp tool_call hook (auto-discovered from .omp/hooks/pre/): block bash commands
// that skip the repo's git hooks. Mirrors the Claude Code guard in .claude/hooks.
import {
  BYPASS_MESSAGE,
  findHookBypass,
} from "../../../scripts/agent-guards/hook-bypass";

interface ToolCallEvent {
  toolName: string;
  input: Record<string, unknown>;
}

interface HookApi {
  on: (
    event: "tool_call",
    handler: (
      event: ToolCallEvent
    ) => { block: true; reason: string } | undefined
  ) => void;
}

const hook = (pi: HookApi): void => {
  pi.on("tool_call", (event) => {
    if (event.toolName !== "bash") {
      return;
    }
    const { command } = event.input;
    const hit =
      typeof command === "string" ? findHookBypass(command) : undefined;
    return hit
      ? { block: true, reason: `${hit} ${BYPASS_MESSAGE}` }
      : undefined;
  });
};

export default hook;
