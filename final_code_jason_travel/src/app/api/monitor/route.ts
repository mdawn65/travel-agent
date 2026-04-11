import { NextRequest, NextResponse } from "next/server";

const SYSTEM_MESSAGE = `You are a travel monitoring assistant. Given a traveler's trip details, check for important updates they should know about.

Check these 3 categories:

1. WEATHER: Current and forecasted weather at the destination during their travel dates. Flag extreme heat, cold, storms, typhoons, heavy rain, or any weather that could disrupt travel.

2. FLIGHTS: Any known airline disruptions, strikes, airport closures, or common delay patterns for their routes/airlines. Check if their airline has recent operational issues.

3. LOCAL NEWS: Safety advisories, protests, festivals/events that could affect their trip, public transit strikes, natural disasters, health advisories, or any local situation a traveler should know about.

For each alert, assign a severity:
- "critical": Immediate action needed (flight cancelled, dangerous weather, safety threat)
- "warning": Should be aware and may need to adjust plans
- "info": Good to know but no action needed

If there is nothing notable, still return at least 1-2 "info" level items (like general weather forecast or a local event happening).

Return valid JSON matching the schema exactly.`;

const alertSchema = {
  type: "object" as const,
  properties: {
    type: { type: "string" as const, enum: ["weather", "flight", "news"] },
    severity: { type: "string" as const, enum: ["info", "warning", "critical"] },
    title: { type: "string" as const },
    description: { type: "string" as const },
    action: { type: "string" as const },
  },
  required: ["type", "severity", "title", "description", "action"],
  additionalProperties: false,
};

const monitorSchema = {
  type: "object" as const,
  properties: {
    alerts: { type: "array" as const, items: alertSchema },
  },
  required: ["alerts"],
  additionalProperties: false,
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing PERPLEXITY_API_KEY" },
      { status: 500 }
    );
  }

  let body: {
    destination: string;
    origin: string;
    departureDate: string;
    returnDate: string;
    airline?: string;
    flightNumber?: string;
    returnAirline?: string;
    returnFlightNumber?: string;
    hotel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userMessage = `Monitor this upcoming trip:
- Traveling from: ${body.origin}
- Destination: ${body.destination}
- Dates: ${body.departureDate} to ${body.returnDate}
- Outbound flight: ${body.airline || "N/A"} ${body.flightNumber || ""}
- Return flight: ${body.returnAirline || "N/A"} ${body.returnFlightNumber || ""}
- Hotel: ${body.hotel || "N/A"}

Today's date: ${new Date().toISOString().split("T")[0]}

Search for current weather forecasts, flight disruption news, and local news/events at ${body.destination}. Provide real, current information.`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2000,
        temperature: 0.5,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "monitor_result",
            schema: monitorSchema,
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Monitor API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to check travel updates" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "No response" }, { status: 502 });
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      destination: body.destination,
      alerts: parsed.alerts || [],
    });
  } catch (error) {
    console.error("Monitor error:", error);
    return NextResponse.json(
      { error: "Failed to check travel updates" },
      { status: 500 }
    );
  }
}
