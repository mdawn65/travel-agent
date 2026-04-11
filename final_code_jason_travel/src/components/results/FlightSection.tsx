"use client";

import { FlightOption } from "@/types/travel";

interface FlightSectionProps {
  label: string;
  flights: FlightOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function FlightSection({ label, flights, selectedId, onSelect }: FlightSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-100 mb-3">{label}</h3>
      <div className="space-y-2">
        {flights.map((flight) => {
          const isSelected = selectedId === flight.id;
          return (
            <button
              key={flight.id}
              onClick={() => onSelect(flight.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? "border-blue-500/50 bg-blue-500/10 glow-blue"
                  : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-100">{flight.airline}</span>
                  <span className="text-xs text-gray-500 font-mono">{flight.flightNumber}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-gray-400">{flight.cabin}</span>
                </div>
                <span className={`text-lg font-bold ${isSelected ? "text-blue-400" : "text-gray-200"}`}>
                  ${flight.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="text-center">
                  <p className="font-bold text-gray-200">{flight.departureTime}</p>
                  <p className="text-xs text-gray-500">{flight.departureAirport}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <p className="text-xs text-gray-500">{flight.duration}</p>
                  <div className="w-full h-px bg-white/10 relative my-1">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-500 rounded-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-500 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-600">
                    {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-200">{flight.arrivalTime}</p>
                  <p className="text-xs text-gray-500">{flight.arrivalAirport}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
