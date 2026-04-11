"use client";

import { AccommodationOption } from "@/types/travel";

interface HotelSectionProps {
  accommodations: AccommodationOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function HotelSection({ accommodations, selectedId, onSelect }: HotelSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-100 mb-3">Accommodation</h3>
      <div className="space-y-2">
        {accommodations.map((hotel) => {
          const isSelected = selectedId === hotel.id;
          return (
            <button
              key={hotel.id}
              onClick={() => onSelect(hotel.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected
                  ? "border-blue-500/50 bg-blue-500/10 glow-blue"
                  : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-semibold text-gray-100">{hotel.name}</p>
                  <p className="text-sm text-gray-500">{hotel.area}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isSelected ? "text-blue-400" : "text-gray-200"}`}>
                    ${hotel.totalCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">${hotel.pricePerNight}/night</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-yellow-500/80 text-sm">
                  {"★".repeat(Math.round(hotel.starRating))}
                  <span className="text-gray-700">{"★".repeat(5 - Math.round(hotel.starRating))}</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {hotel.amenities.slice(0, 4).map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
