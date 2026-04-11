import { NextRequest, NextResponse } from "next/server";

const SYSTEM_MESSAGE = `You are a friendly travel planning assistant. You help travelers refine their trip preferences through natural conversation.

Your role:
- Ask about dietary needs, accessibility requirements, specific interests
- Suggest activities, neighborhoods, or local experiences they might enjoy
- Help them think about things they might not have considered
- Be concise — 2-3 sentences per response, max

Keep responses short and conversational. Don't generate full itineraries — just help refine preferences.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing PERPLEXITY_API_KEY" },
      { status: 500 }
    );
  }

  let body: { messages: { role: string; content: string }[]; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const contextNote = body.context
    ? `\n\nTrip context: ${body.context}`
    : "";

  // Build clean alternating user/assistant messages (Perplexity requires this)
  const userMessages = body.messages.filter((m) => m.role === "user");
  const assistantMessages = body.messages.filter((m) => m.role === "assistant");

  const conversationMessages: { role: "user" | "assistant"; content: string }[] = [];
  for (let i = 0; i < userMessages.length; i++) {
    conversationMessages.push({ role: "user", content: userMessages[i].content });
    if (i < userMessages.length - 1 && assistantMessages[i]) {
      conversationMessages.push({ role: "assistant", content: assistantMessages[i].content });
    }
  }

  if (conversationMessages.length === 0) {
    conversationMessages.push({ role: "user", content: body.messages[body.messages.length - 1]?.content || "Hello" });
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: SYSTEM_MESSAGE + contextNote },
          ...conversationMessages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity chat error:", response.status, errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond. Please try again.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
