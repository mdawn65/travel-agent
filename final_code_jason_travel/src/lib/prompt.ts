import { TravelFormInput } from "@/types/travel";

const flightOptionSchema = {
  type: "object" as const,
  properties: {
    airline: { type: "string" as const },
    flightNumber: { type: "string" as const },
    departureAirport: { type: "string" as const },
    arrivalAirport: { type: "string" as const },
    departureTime: { type: "string" as const },
    arrivalTime: { type: "string" as const },
    stops: { type: "number" as const },
    duration: { type: "string" as const },
    cabin: { type: "string" as const },
    price: { type: "number" as const },
  },
  required: [
    "airline", "flightNumber", "departureAirport", "arrivalAirport",
    "departureTime", "arrivalTime", "stops", "duration", "cabin", "price",
  ],
  additionalProperties: false,
};

const accommodationSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const },
    starRating: { type: "number" as const },
    area: { type: "string" as const },
    amenities: { type: "array" as const, items: { type: "string" as const } },
    pricePerNight: { type: "number" as const },
    totalCost: { type: "number" as const },
    bookingUrl: { type: "string" as const },
  },
  required: ["name", "starRating", "area", "amenities", "pricePerNight", "totalCost", "bookingUrl"],
  additionalProperties: false,
};

const activitySchema = {
  type: "object" as const,
  properties: {
    time: { type: "string" as const },
    endTime: { type: "string" as const },
    activity: { type: "string" as const },
    description: { type: "string" as const },
    estimatedCost: { type: "number" as const },
    placeName: { type: "string" as const },
    address: { type: "string" as const },
    type: { type: "string" as const, enum: ["attraction", "restaurant", "transport", "activity", "shopping"] },
  },
  required: ["time", "endTime", "activity", "description", "estimatedCost", "placeName", "address", "type"],
  additionalProperties: false,
};

const itineraryDaySchema = {
  type: "object" as const,
  properties: {
    day: { type: "number" as const },
    date: { type: "string" as const },
    activities: { type: "array" as const, items: activitySchema },
  },
  required: ["day", "date", "activities"],
  additionalProperties: false,
};

export function getTravelPlanSchema() {
  return {
    type: "object" as const,
    properties: {
      outboundFlights: { type: "array" as const, items: flightOptionSchema },
      returnFlights: { type: "array" as const, items: flightOptionSchema },
      accommodations: { type: "array" as const, items: accommodationSchema },
      itinerary: { type: "array" as const, items: itineraryDaySchema },
    },
    required: ["outboundFlights", "returnFlights", "accommodations", "itinerary"],
    additionalProperties: false,
  };
}

const SYSTEM_MESSAGE = `You are an expert travel planner. You create detailed, practical travel plans with real airline names, real hotel names, real restaurant names, and realistic pricing.

Given origin, destination, dates, and optionally budget and travel style, produce:

1. OUTBOUND FLIGHTS: 3-4 different flight options (mix of budget to premium) from origin to destination
2. RETURN FLIGHTS: 3-4 different flight options from destination back to origin
3. ACCOMMODATIONS: 3-4 hotel/hostel options (mix of budget to premium)
4. ITINERARY: A day-by-day schedule with timed activities. IMPORTANT:
   - Order activities by geographic proximity to minimize travel time (route optimization)
   - Include specific times (e.g. "09:00", "12:30")
   - Include at least one restaurant per day (type: "restaurant")
   - Provide real place names and addresses that can be found on Google Maps
   - Each activity needs placeName (name of the venue/place) and address (street address in the destination city)

All prices in USD. Use REAL airlines, hotels, and restaurants that actually exist.`;

export function buildMessages(input: TravelFormInput) {
  const budgetLine = input.budget ? `- Budget: $${input.budget} USD` : "- Budget: Not specified (provide a range of options)";
  const styleLine = input.style ? `- Style: ${input.style}` : "- Style: Not specified (provide a balanced mix)";

  const userMessage = `Plan a trip:
- From: ${input.origin}
- To: ${input.location}
- Depart: ${input.departureDate}
- Return: ${input.returnDate}
${budgetLine}
${styleLine}
- Conversation with AI Travel Assistant:
${input.chatHistory || "No conversation — use general best practices."}

IMPORTANT: Carefully incorporate ALL preferences, dietary needs, interests, and suggestions from the conversation above into the itinerary, restaurant choices, and activity selections.

Requirements:
1. Provide 3-4 outbound flight options and 3-4 return flight options with different airlines and price points. Include flightNumber (e.g. "KE123"), cabin class, departure/arrival times, airports with IATA codes.
2. Provide 3-4 accommodation options ranging from budget to luxury. For bookingUrl, use "https://www.booking.com/search?ss=" followed by the hotel name URL-encoded.
3. Create a day-by-day itinerary for each day of the trip:
   - Each activity must have a specific time (HH:MM format) and endTime
   - Order activities to minimize travel between locations (route-optimized)
   - Include lunch and dinner restaurants (type: "restaurant") with real restaurant names
   - Use real place names and full street addresses in ${input.location}
   - Activity types: "attraction", "restaurant", "transport", "activity", "shopping"
   - For free activities use estimatedCost: 0`;

  return [
    { role: "system" as const, content: SYSTEM_MESSAGE },
    { role: "user" as const, content: userMessage },
  ];
}
