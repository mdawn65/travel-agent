# Travel Agent - Full Build Prompt

Build an AI-powered travel planning web application from scratch. The app collects user travel preferences through a step-by-step wizard, calls the Perplexity API to generate a real-time travel plan with multiple options, lets the user select their preferred flights and hotel, and then simulates a complete booking flow including restaurant reservations — all with a single credit card entry.

---

## Tech Stack

- **Next.js** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Perplexity API** (`sonar-pro` model) with structured JSON output and streaming
- No database, no auth — stateless single-session app
- Environment variable: `PERPLEXITY_API_KEY`

---

## Architecture Overview

### User Flow (7 Phases)

1. **Input** — 5-step form wizard:
   - Step 1: Origin + Destination (with city autocomplete dropdown — search by city name, country, or IATA airport code from a curated list of ~90 major world cities)
   - Step 2: Departure date + Return date
   - Step 3: Budget (preset buttons: $500, $1,000, $2,500, $5,000, $10,000 + custom input)
   - Step 4: Travel style (card selector: Luxury, Adventure, Cultural, Relaxation, Backpacker, Family, Romantic)
   - Step 5: Optional preferences textarea (dietary needs, accessibility, interests, etc.)

2. **Loading** — Animated overlay with rotating status messages ("Searching for the best flights...", "Finding accommodations...", etc.), animated plane icon, and indeterminate progress bar. Cancel button available.

3. **Results** — Tabbed selection interface with 4 tabs:
   - **Outbound Flight** — 3-4 flight options with different airlines/prices. User clicks to select one.
   - **Return Flight** — 3-4 options. Auto-advances to next tab after selection.
   - **Hotel** — 3-4 accommodation options from budget to luxury.
   - **Itinerary** — Day-by-day timed schedule with Google Maps integration.
   - Bottom bar shows running total and "Confirm & Book" button (disabled until all 3 selections made).

4. **Confirm** — Review summary showing selected outbound flight, return flight, hotel, and all restaurant reservations from the itinerary. "Proceed to Payment" button.

5. **Card** — Credit card input form with a live-updating visual card preview (dark gradient card showing number, name, expiry). Fields: card number (auto-formatted with spaces), cardholder name, expiry (MM/YY), CVC. Demo disclaimer banner. Validation: 16 digits, valid expiry format, 3+ digit CVC, non-empty name.

6. **Booking** — Sequential fake booking animation. Each item is booked one-by-one with a 1.5-2.5 second delay per item:
   - Outbound flight → Return flight → Hotel → Each restaurant reservation
   - Visual states: pending (gray dot) → booking (spinning loader) → done (green checkmark)
   - Progress bar fills as steps complete
   - When all done, auto-advances to complete phase

7. **Complete** — Success screen with green checkmark. Shows all confirmed bookings:
   - Flights with airline, flight number, route, time, cabin class — each marked "Confirmed"
   - Hotel with name, star rating, area, dates, price — marked "Confirmed"
   - All restaurant reservations with name, date, time, address — each marked "Reserved" with a "View on Map" link that opens Google Maps search for that restaurant
   - Total charged amount with "Demo booking - no real charges made" disclaimer
   - "Plan Another Trip" button

---

## Data Model

```typescript
// Form input
TravelFormInput: { origin, location, departureDate, returnDate, budget, style, preferences }

// AI generates:
FlightOption: { id, airline, flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, stops, duration, cabin, price }
AccommodationOption: { id, name, starRating, area, amenities[], pricePerNight, totalCost, bookingUrl }
Activity: { time, endTime, activity, description, estimatedCost, placeName, address, type }
  // type: "attraction" | "restaurant" | "transport" | "activity" | "shopping"
ItineraryDay: { day, date, activities[] }
TravelPlan: { outboundFlights[], returnFlights[], accommodations[], itinerary[] }

// User selections
UserSelections: { outboundFlightId, returnFlightId, accommodationId }
CardInfo: { cardNumber, expiry, cvc, name }
BookingStep: { type: "outbound_flight" | "return_flight" | "accommodation" | "restaurant", status: "pending" | "booking" | "done", name? }
WizardPhase: "input" | "loading" | "results" | "confirm" | "card" | "booking" | "complete"
```

---

## API Design

### `POST /api/generate-plan`

- Receives `TravelFormInput` as JSON body
- Validates required fields (origin, location, dates, budget, style)
- Calls Perplexity API at `https://api.perplexity.ai/chat/completions` with:
  - Model: `sonar-pro`
  - `max_tokens: 12000`
  - `temperature: 0.5`
  - `stream: true`
  - `response_format: { type: "json_schema", json_schema: { name: "travel_plan", schema: <schema>, strict: true } }`
- Passes through the SSE stream directly to the client
- Error handling for missing API key (500), rate limiting (429), API errors (502)

### Prompt Engineering

**System message:** Expert travel planner that uses real airline names, real hotel names, real restaurant names, realistic pricing. Generates:
- 3-4 outbound flight options (mix of budget to premium)
- 3-4 return flight options
- 3-4 accommodation options (mix of budget to luxury)
- Day-by-day timed itinerary ordered by geographic proximity (route optimization), with at least one restaurant per day, using real place names and addresses findable on Google Maps

**User message:** Includes all form inputs. Specifies that:
- Flights need airline, flightNumber, cabin, airports with IATA codes, times
- Hotels need bookingUrl formatted as `https://www.booking.com/search?ss=<hotel name>`
- Itinerary activities must have HH:MM time format, endTime, real placeName, full street address
- Activity types: attraction, restaurant, transport, activity, shopping
- Free activities use estimatedCost: 0

---

## Client-Side Streaming

The `useStreamingPlan` hook:
1. POSTs to `/api/generate-plan`
2. Reads the SSE stream using `ReadableStream.getReader()`
3. Buffers incomplete lines (a `data:` line may split across chunks)
4. Parses each `data: {...}` line, extracts `choices[0].delta.content`
5. Accumulates all content tokens into a single JSON string
6. On stream completion, parses the accumulated JSON and validates structure
7. Auto-generates IDs: flights get `ob-0`, `ob-1`, `rt-0`, `rt-1`, accommodations get `acc-0`, `acc-1`

---

## Google Maps Integration

- **Per-activity Map link:** Each itinerary activity has a small "Map" link that opens `https://www.google.com/maps/search/?api=1&query=<placeName, destination>` in a new tab
- **Daily route map:** Each expanded day shows an embedded Google Maps iframe with the day's stops as a route: `https://www.google.com/maps/dir/Place1/Place2/Place3/?output=embed`
- **Booking complete:** Restaurant reservations show "View on Map" button linking to Google Maps search for each restaurant

No Google Maps API key needed — uses embed URLs and search links only.

---

## City Autocomplete

A curated list of ~90 major cities worldwide (Tokyo, Seoul, Paris, New York, etc.) with:
- City name, country, IATA airport code
- Search function filters by name, country, or code (case-insensitive)
- Returns up to 8 matches
- Dropdown shows city name, country, and airport code badge
- Click-outside closes dropdown
- Used for both Origin and Destination fields

---

## Key Component Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, Geist font, metadata
│   ├── page.tsx                      # Landing page with header + TravelWizard
│   ├── globals.css                   # Tailwind + loading-bar keyframe animation
│   └── api/generate-plan/route.ts    # Perplexity API proxy with streaming
├── types/travel.ts                   # All TypeScript interfaces
├── lib/
│   ├── prompt.ts                     # AI prompt + JSON schema
│   ├── parsePlan.ts                  # Response parser with validation + ID generation
│   ├── constants.ts                  # Travel styles, budget presets, step labels
│   └── cities.ts                     # City database + search function
├── hooks/
│   ├── useWizard.ts                  # useReducer-based form + phase state
│   └── useStreamingPlan.ts           # Streaming fetch + SSE parsing
├── components/
│   ├── TravelWizard.tsx              # Main orchestrator — renders correct phase
│   ├── CityAutocomplete.tsx          # City search input with dropdown
│   ├── StepIndicator.tsx             # 5-step progress bar
│   ├── LoadingOverlay.tsx            # Animated loading state
│   ├── steps/
│   │   ├── LocationStep.tsx          # Origin + Destination with autocomplete
│   │   ├── DatesStep.tsx             # Date pickers with night count
│   │   ├── BudgetStep.tsx            # Preset buttons + custom input
│   │   ├── StyleStep.tsx             # Visual card grid selector
│   │   └── PreferencesStep.tsx       # Optional textarea
│   ├── results/
│   │   ├── ResultsView.tsx           # 4-tab selection interface
│   │   ├── FlightSection.tsx         # Flight option cards with selection
│   │   ├── HotelSection.tsx          # Hotel option cards with selection
│   │   ├── ItinerarySection.tsx      # Day list wrapper
│   │   ├── ItineraryDay.tsx          # Expandable day with timeline + map
│   │   └── MapEmbed.tsx              # Google Maps iframe + link helpers
│   └── booking/
│       ├── ConfirmationSummary.tsx    # Pre-payment review
│       ├── CardForm.tsx              # Credit card input with live preview
│       ├── BookingProgress.tsx       # Sequential booking animation
│       └── BookingComplete.tsx       # Final success with map links
```

---

## State Management

No external library. Uses React `useReducer` (wizard) and `useState` (streaming, selections).

**useWizard** manages:
- `currentStep` (0-4)
- `formData` (partial TravelFormInput)
- `phase` (WizardPhase)

**useStreamingPlan** manages:
- `status` ("idle" | "streaming" | "complete" | "error")
- `plan` (TravelPlan | null)
- `error` (string | null)
- AbortController ref for cancellation

**TravelWizard** (orchestrator):
- Holds `selections` state (UserSelections)
- Syncs streaming status → wizard phase (complete → results, error → input)
- Calculates total cost from selections
- Routes to correct phase component

---

## Booking Simulation Details

The `BookingProgress` component:
1. Builds an array of BookingStep items from selections + all restaurant activities in the itinerary
2. Uses a `currentIdx` state that advances through the array
3. Each step: sets status to "booking" → waits 1.5-2.5s (random) → sets to "done" → advances index
4. Visual: pending items are grayed out, current item has blue border + spinner, done items are green with checkmark
5. Progress bar width = `(doneCount / totalSteps) * 100%`
6. When all done, calls `onComplete` after 800ms delay → transitions to "complete" phase

---

## Styling Notes

- Clean white background, blue-50 gradient header
- Blue-600 as primary action color
- Cards use rounded-xl with border-2, selected state uses blue-500 border + blue-50 bg
- Loading animation: custom `@keyframes loading-bar` that sweeps left-to-right infinitely
- Credit card preview: dark gradient (gray-800 → gray-900), yellow-400 chip, monospace font
- Responsive: step labels hidden on mobile (show only numbers), tabs scrollable on small screens
- Geist Sans + Geist Mono fonts from Google Fonts

---

## Setup Instructions

```bash
npx create-next-app@latest travel_agent --typescript --tailwind --app --src-dir --eslint --use-npm --import-alias "@/*"
cd travel_agent
```

Create `.env.local`:
```
PERPLEXITY_API_KEY=your_key_here
```

Then implement all files as described above and run with `npm run dev`.
