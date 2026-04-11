export type TravelStyle =
  | "luxury"
  | "adventure"
  | "cultural"
  | "relaxation"
  | "backpacker"
  | "family"
  | "romantic";

export interface TravelFormInput {
  origin: string;
  location: string;
  departureDate: string;
  returnDate: string;
  budget?: number;
  style?: TravelStyle;
  chatHistory: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// --- Flight ---

export interface FlightOption {
  id: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  stops: number;
  duration: string;
  cabin: string;
  price: number;
}

// --- Accommodation ---

export interface AccommodationOption {
  id: string;
  name: string;
  starRating: number;
  area: string;
  amenities: string[];
  pricePerNight: number;
  totalCost: number;
  bookingUrl: string;
}

// --- Itinerary ---

export interface Activity {
  time: string;
  endTime: string;
  activity: string;
  description: string;
  estimatedCost: number;
  placeName: string;
  address: string;
  type: "attraction" | "restaurant" | "transport" | "activity" | "shopping";
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}

// --- Plan ---

export interface TravelPlan {
  outboundFlights: FlightOption[];
  returnFlights: FlightOption[];
  accommodations: AccommodationOption[];
  itinerary: ItineraryDay[];
}

// --- Selections ---

export interface UserSelections {
  outboundFlightId: string | null;
  returnFlightId: string | null;
  accommodationId: string | null;
}

// --- Booking ---

export interface CardInfo {
  cardNumber: string;
  expiry: string;
  cvc: string;
  name: string;
}

export type BookingStep =
  | { type: "outbound_flight"; status: "pending" | "booking" | "done" }
  | { type: "return_flight"; status: "pending" | "booking" | "done" }
  | { type: "accommodation"; status: "pending" | "booking" | "done" }
  | { type: "restaurant"; name: string; status: "pending" | "booking" | "done" };

export type WizardPhase = "input" | "loading" | "results" | "confirm" | "card" | "booking" | "complete";

// --- Monitor ---

export interface MonitorAlert {
  type: "weather" | "flight" | "news";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  action?: string;
}

export interface MonitorResult {
  checkedAt: string;
  destination: string;
  alerts: MonitorAlert[];
}
