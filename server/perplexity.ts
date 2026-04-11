/**
 * Perplexity Sonar API wrapper
 * Uses OpenAI-compatible chat/completions endpoint
 */

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";
const PERPLEXITY_MODEL = "sonar-pro";

function getApiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY || "";
  if (!key) {
    console.warn("⚠️  PERPLEXITY_API_KEY not set");
  }
  return key;
}

export interface SonarMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SonarResponse {
  id: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  citations?: string[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Non-streaming Sonar chat completion
 */
export async function sonarChat(
  messages: SonarMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; citations: string[] }> {
  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${err}`);
  }

  const data: SonarResponse = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    citations: (data as any).citations || [],
  };
}

/**
 * Streaming Sonar chat completion — yields text chunks
 */
export async function* sonarStream(
  messages: SonarMessage[]
): AsyncGenerator<{ type: "text" | "done"; content: string; citations?: string[] }> {
  const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages,
      stream: true,
      temperature: 0.2,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let citations: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") {
        yield { type: "done", content: "", citations };
        return;
      }

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.citations) {
          citations = parsed.citations;
        }
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          yield { type: "text", content: delta };
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  yield { type: "done", content: "", citations };
}

/**
 * Simple web search query — ask Sonar a question, get a grounded answer
 */
export async function sonarSearch(query: string): Promise<{ answer: string; citations: string[] }> {
  const result = await sonarChat([
    { role: "user", content: query },
  ]);
  return { answer: result.content, citations: result.citations };
}

/**
 * Extract JSON from a response that may contain markdown fencing
 */
export function extractJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[1]); } catch {}
    }
    return null;
  }
}
