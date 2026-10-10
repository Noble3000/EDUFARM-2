// Provider-agnostic AI gateway (OpenAI-compatible chat API).
// No SDK needed: plain fetch. Keys stay server-side; browsers never see them.

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chat(messages: ChatMessage[], opts?: { maxTokens?: number }) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey || !model) {
    throw new Error("AI is not configured yet (AI_API_KEY / AI_MODEL missing).");
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts?.maxTokens ?? 800,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    throw new Error(`AI provider error (${res.status}). Try again in a moment.`);
  }
  const json = await res.json();
  const text: string | undefined = json.choices?.[0]?.message?.content;
  if (!text?.trim()) throw new Error("Empty AI response. Try again.");
  const usage = json.usage?.total_tokens ?? 0;
  return { text: text.trim(), tokens: usage };
}
