import { NextRequest, NextResponse } from "next/server";
import { buildMessages, getTravelPlanSchema } from "@/lib/prompt";
import { TravelFormInput } from "@/types/travel";

export async function POST(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing PERPLEXITY_API_KEY" },
      { status: 500 }
    );
  }

  let body: TravelFormInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.origin || !body.location || !body.departureDate || !body.returnDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const messages = buildMessages(body);
  const jsonSchema = getTravelPlanSchema();

  console.log("=== GENERATE PLAN: Chat History ===");
  console.log(body.chatHistory || "(empty)");
  console.log("=== GENERATE PLAN: Full Prompt ===");
  console.log(messages[1].content);
  console.log("=== END ===");

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages,
        max_tokens: 12000,
        temperature: 0.5,
        stream: true,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "travel_plan",
            schema: jsonSchema,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limited. Please try again in a moment." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response body from AI service" },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to call Perplexity API:", error);
    return NextResponse.json(
      { error: "Failed to generate travel plan. Please try again." },
      { status: 500 }
    );
  }
}
