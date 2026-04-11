import { TravelPlan } from "@/types/travel";

export function parsePlan(raw: string): TravelPlan {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1]);
    } else {
      throw new Error("Failed to parse travel plan response");
    }
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.outboundFlights) || obj.outboundFlights.length === 0) {
    throw new Error("Invalid plan: missing outbound flights");
  }
  if (!Array.isArray(obj.returnFlights) || obj.returnFlights.length === 0) {
    throw new Error("Invalid plan: missing return flights");
  }
  if (!Array.isArray(obj.accommodations) || obj.accommodations.length === 0) {
    throw new Error("Invalid plan: missing accommodations");
  }
  if (!Array.isArray(obj.itinerary) || obj.itinerary.length === 0) {
    throw new Error("Invalid plan: missing itinerary");
  }

  // Add IDs to flights and accommodations
  const plan = obj as unknown as TravelPlan;
  plan.outboundFlights.forEach((f, i) => (f.id = `ob-${i}`));
  plan.returnFlights.forEach((f, i) => (f.id = `rt-${i}`));
  plan.accommodations.forEach((a, i) => (a.id = `acc-${i}`));

  return plan;
}
