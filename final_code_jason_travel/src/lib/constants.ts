import { TravelStyle } from "@/types/travel";

export const TRAVEL_STYLES: { value: TravelStyle; label: string; icon: string }[] = [
  { value: "luxury", label: "Luxury", icon: "👑" },
  { value: "adventure", label: "Adventure", icon: "🏔️" },
  { value: "cultural", label: "Cultural", icon: "🏛️" },
  { value: "relaxation", label: "Relaxation", icon: "🏖️" },
  { value: "backpacker", label: "Backpacker", icon: "🎒" },
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { value: "romantic", label: "Romantic", icon: "💕" },
];

export const BUDGET_PRESETS = [500, 1000, 2500, 5000, 10000];

export const STEP_LABELS = [
  "Destination",
  "Dates",
  "Budget",
  "Style",
  "Preferences",
];

export const LOADING_MESSAGES = [
  "Searching for the best flights...",
  "Finding accommodations...",
  "Crafting your perfect itinerary...",
  "Comparing prices across providers...",
  "Building your travel plan...",
];

export const BOOKING_STEPS_LABELS = {
  outbound_flight: "Outbound Flight",
  return_flight: "Return Flight",
  accommodation: "Accommodation",
  restaurant: "Restaurant Reservation",
} as const;
