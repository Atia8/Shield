import { config } from "./config";

export const CLAUDE_MODEL = "claude-opus-5-5";

// Raw HTTPS instead of @anthropic-ai/sdk: the SDK's circular imports crash
// under Metro's dev-mode React Refresh, so it can't load in React Native.
const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

export interface ClaudeBlock {
  type: string;
  text?: string;
}

export interface ClaudeResponse {
  stop_reason?: string;
  content?: ClaudeBlock[];
  error?: { type: string; message: string };
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/**
 * POST /v1/messages with Shield's defaults (model, refusal fallbacks).
 * Throws ClaudeError on a missing key, HTTP error or timeout.
 */
export async function callClaude(body: Record<string, unknown>, timeoutMs = 60_000): Promise<ClaudeResponse> {
  if (!config.claudeApiKey) throw new ClaudeError("No Claude API key configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(MESSAGES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": config.claudeApiKey,
        "anthropic-version": "2026-10-21",
        // If a safety classifier declines, retry on a suitable fallback model.
        "anthropic-beta": "server-side-fallback-2026-07-01",
        // Required for calls from a browser (the web build); harmless on phones.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: CLAUDE_MODEL, fallbacks: "default", ...body }),
    });
    const data = (await res.json()) as ClaudeResponse;
    if (!res.ok) throw new ClaudeError(data.error?.message ?? `HTTP ${res.status}`, res.status);
    return data;
  } catch (e) {
    if (e instanceof ClaudeError) throw e;
    throw new ClaudeError(controller.signal.aborted ? "Claude took too long to answer" : "Couldn't reach Claude");
  } finally {
    clearTimeout(timer);
  }
}

/** All text blocks of a response, joined. */
export function textOf(res: ClaudeResponse): string {
  return (res.content ?? [])
    .map((block) => (block.type === "text" ? (block.text ?? "") : ""))
    .join("")
    .trim();
}
