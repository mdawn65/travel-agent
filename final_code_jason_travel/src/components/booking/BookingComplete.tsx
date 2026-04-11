"use client";

import { TravelPlan, TravelFormInput, UserSelections } from "@/types/travel";
import MonitorPanel from "./MonitorPanel";

interface BookingCompleteProps {
  plan: TravelPlan;
  formData: TravelFormInput;
  selections: UserSelections;
  onReset: () => void;
}

export default function BookingComplete({ plan, formData, selections, onReset }: BookingCompleteProps) {
  const outbound = plan.outboundFlights.find((f) => f.id === selections.outboundFlightId)!;
  const returnFlight = plan.returnFlights.find((f) => f.id === selections.returnFlightId)!;
  const hotel = plan.accommodations.find((a) => a.id === selections.accommodationId)!;
  const restaurants = plan.itinerary.flatMap((day) =>
    day.activities
      .filter((a) => a.type === "restaurant")
      .map((a) => ({ ...a, dayDate: day.date }))
  );
  const total = outbound.price + returnFlight.price + hotel.totalCost;

  return (
    <div className="w-full max-w-2xl mx-auto py-4 animate-fade-in">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 glow-green">
          <span className="text-4xl text-emerald-400">&#10003;</span>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500">Your trip to {formData.location} is all set</p>
      </div>

      <div className="space-y-3">
        {/* Flights */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="bg-blue-500/10 px-4 py-2 border-b border-white/5">
            <p className="font-semibold text-blue-400 text-sm">&#9992; Flights</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Outbound</p>
                <p className="font-medium text-gray-200">{outbound.airline} {outbound.flightNumber}</p>
                <p className="text-sm text-gray-500">{outbound.departureAirport} &rarr; {outbound.arrivalAirport}</p>
                <p className="text-sm text-gray-600">{outbound.departureTime} &middot; {outbound.cabin}</p>
              </div>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">Confirmed</span>
            </div>
            <div className="border-t border-white/5" />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Return</p>
                <p className="font-medium text-gray-200">{returnFlight.airline} {returnFlight.flightNumber}</p>
                <p className="text-sm text-gray-500">{returnFlight.departureAirport} &rarr; {returnFlight.arrivalAirport}</p>
                <p className="text-sm text-gray-600">{returnFlight.departureTime} &middot; {returnFlight.cabin}</p>
              </div>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">Confirmed</span>
            </div>
          </div>
        </div>

        {/* Hotel */}
        <div className="glass rounded-xl overflow-hidden">
          <div className="bg-purple-500/10 px-4 py-2 border-b border-white/5">
            <p className="font-semibold text-purple-400 text-sm">&#127976; Accommodation</p>
          </div>
          <div className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-200">{hotel.name}</p>
              <p className="text-sm text-gray-500">{hotel.area} &middot; <span className="text-yellow-500/80">{"★".repeat(Math.round(hotel.starRating))}</span></p>
              <p className="text-sm text-gray-600">{formData.departureDate} to {formData.returnDate} &middot; ${hotel.pricePerNight}/night</p>
            </div>
            <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">Confirmed</span>
          </div>
        </div>

        {/* Restaurants */}
        {restaurants.length > 0 && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="bg-orange-500/10 px-4 py-2 border-b border-white/5">
              <p className="font-semibold text-orange-400 text-sm">
                &#127860; Restaurant Reservations ({restaurants.length})
              </p>
            </div>
            <div className="divide-y divide-white/5">
              {restaurants.map((r, i) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${r.placeName}, ${formData.location}`
                )}`;
                return (
                  <div key={i} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{r.placeName}</p>
                      <p className="text-sm text-gray-500">{r.dayDate} at {r.time}</p>
                      <p className="text-xs text-gray-600">{r.address}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-medium">Reserved</span>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded-full font-medium hover:bg-blue-500/25 transition-colors"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        Map
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="glass rounded-xl p-6 text-center glow-purple">
          <p className="text-sm text-gray-400">Total Charged</p>
          <p className="text-3xl font-bold gradient-text">${total.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">Demo booking - no real charges made</p>
        </div>
      </div>

      {/* Monitor */}
      <div className="mt-6">
        <MonitorPanel formData={formData} plan={plan} selections={selections} />
      </div>

      <div className="flex justify-center mt-8 pb-8">
        <button
          onClick={onReset}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
        >
          Plan Another Trip
        </button>
      </div>
    </div>
  );
}
