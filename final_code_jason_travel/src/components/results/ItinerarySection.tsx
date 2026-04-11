"use client";

import { ItineraryDay as ItineraryDayType } from "@/types/travel";
import ItineraryDay from "./ItineraryDay";

interface ItinerarySectionProps {
  itinerary: ItineraryDayType[];
  destination: string;
}

export default function ItinerarySection({ itinerary, destination }: ItinerarySectionProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-100 mb-3 flex items-center gap-2">
        Day-by-Day Itinerary
        <span className="text-sm font-normal text-gray-500">({itinerary.length} days)</span>
      </h3>
      <div className="space-y-2">
        {itinerary.map((day) => (
          <ItineraryDay key={day.day} day={day} destination={destination} />
        ))}
      </div>
    </div>
  );
}
