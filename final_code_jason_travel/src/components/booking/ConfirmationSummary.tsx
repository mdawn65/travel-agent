"use client";

import { TravelPlan, TravelFormInput, UserSelections } from "@/types/travel";

interface ConfirmationSummaryProps {
  plan: TravelPlan;
  formData: TravelFormInput;
  selections: UserSelections;
  onBack: () => void;
  onProceedToPayment: () => void;
}

export default function ConfirmationSummary({
  plan,
  formData,
  selections,
  onBack,
  onProceedToPayment,
}: ConfirmationSummaryProps) {
  const outbound = plan.outboundFlights.find((f) => f.id === selections.outboundFlightId)!;
  const returnFlight = plan.returnFlights.find((f) => f.id === selections.returnFlightId)!;
  const hotel = plan.accommodations.find((a) => a.id === selections.accommodationId)!;
  const restaurants = plan.itinerary.flatMap((day) =>
    day.activities.filter((a) => a.type === "restaurant")
  );
  const total = outbound.price + returnFlight.price + hotel.totalCost;

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-100 mb-1 text-center">Review Your Trip</h2>
      <p className="text-gray-500 text-center mb-8 text-sm">
        {formData.origin} <span className="text-blue-400">&rarr;</span> {formData.location}
      </p>

      <div className="space-y-3">
        <div className="glass p-4 rounded-xl">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Outbound Flight</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-100">{outbound.airline} {outbound.flightNumber}</p>
              <p className="text-sm text-gray-500">
                {outbound.departureAirport} &rarr; {outbound.arrivalAirport} &middot; {outbound.departureTime}
              </p>
            </div>
            <p className="font-bold text-gray-200">${outbound.price.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-xl">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Return Flight</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-100">{returnFlight.airline} {returnFlight.flightNumber}</p>
              <p className="text-sm text-gray-500">
                {returnFlight.departureAirport} &rarr; {returnFlight.arrivalAirport} &middot; {returnFlight.departureTime}
              </p>
            </div>
            <p className="font-bold text-gray-200">${returnFlight.price.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-xl">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Accommodation</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-100">{hotel.name}</p>
              <p className="text-sm text-gray-500">{hotel.area} &middot; {"★".repeat(Math.round(hotel.starRating))}</p>
            </div>
            <p className="font-bold text-gray-200">${hotel.totalCost.toLocaleString()}</p>
          </div>
        </div>

        {restaurants.length > 0 && (
          <div className="glass p-4 rounded-xl border-orange-500/20">
            <p className="text-xs font-medium text-orange-400 uppercase mb-2">
              Restaurant Reservations ({restaurants.length})
            </p>
            <div className="space-y-1">
              {restaurants.map((r, i) => (
                <p key={i} className="text-sm text-gray-400">
                  {r.placeName} <span className="text-gray-600">&middot; {r.time}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="glass p-5 rounded-xl text-center glow-purple">
          <p className="text-sm text-gray-400">Total Estimated Cost</p>
          <p className="text-3xl font-bold gradient-text">${total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-3 justify-center mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onProceedToPayment}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
