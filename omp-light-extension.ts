import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import type { AgentMessage } from "@oh-my-pi/pi-agent-core";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));
const LIGHT = process.env.OMP_LIGHT_PATH ?? join(EXTENSION_DIR, "omp-light");
const STATE_PATH = join(
	homedir(),
	"Library/Application Support/OmpTrafficLight/state.json",
);

const WAITING_PATTERNS: RegExp[] = [
	/等你/,
	/需要你/,
	/需要.*?(回复|确认|授权|登录|验证码|文件|截图|选择|提供|补充)/,
	/请.*?(回复|确认|授权|登录|提供|发我|补充|选择)/,
	/你.*?(确认|选择|提供|发我|补充).*?吗/,
	/要不要|可以吗|行不行|是否/,
	/我需要.*?(你|确认|授权|文件|截图|验证码)/,
	/blocked|waiting for user|permission|approval/i,
	/\?/,
	/？/,
];

function setLight(state: string): void {
	execFile(LIGHT, [state], { timeout: 3000 }, () => {});
}

function currentState(): string | undefined {
	try {
		const parsed: unknown = JSON.parse(readFileSync(STATE_PATH, "utf8"));
		if (
			parsed !== null &&
			typeof parsed === "object" &&
			"state" in parsed &&
			typeof parsed.state === "string"
		) {
			return parsed.state;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

function lastAssistantText(messages: AgentMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const msg = messages[i];
		if (msg.role !== "assistant") continue;
		const parts: string[] = [];
		for (const block of msg.content) {
			if (block.type === "text" && typeof block.text === "string") {
				parts.push(block.text);
			}
		}
		return parts.join("\n");
	}
	return "";
}

export default function (pi: ExtensionAPI): void {
	pi.setLabel("omp traffic light");

	pi.on("agent_start", async (_event, ctx) => {
		if (ctx.agent?.kind !== "main") return;
		setLight("working");
	});

	pi.on("tool_approval_requested", async (_event, ctx) => {
		if (ctx.agent?.kind !== "main") return;
		setLight("waiting");
	});

	pi.on("agent_end", async (event, ctx) => {
		if (ctx.agent?.kind !== "main") return;
		if (event.willContinue || event.awaitingAsyncWork) {
			setLight("working");
			return;
		}
		if (currentState() === "waiting") {
			setLight("waiting");
			return;
		}
		const tail = lastAssistantText(event.messages ?? []);
		const next = WAITING_PATTERNS.some((p) => p.test(tail)) ? "waiting" : "done";
		setLight(next);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		if (ctx.agent?.kind !== "main") return;
		setLight("idle");
	});
}
