"use client";

import { useState } from "react";
import { ItineraryDay as ItineraryDayType } from "@/types/travel";
import { MapLink } from "./MapEmbed";

interface ItineraryDayProps {
  day: ItineraryDayType;
  destination: string;
}

const TYPE_COLORS: Record<string, string> = {
  restaurant: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  attraction: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  activity: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  shopping: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  transport: "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

export default function ItineraryDay({ day, destination }: ItineraryDayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dayCost = day.activities.reduce((sum, a) => sum + a.estimatedCost, 0);
  const restaurants = day.activities.filter((a) => a.type === "restaurant");

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-blue-500/15 text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
            {day.day}
          </span>
          <div>
            <p className="font-medium text-gray-200">Day {day.day}</p>
            <p className="text-sm text-gray-500">{day.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {restaurants.length > 0 && (
            <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">
              {restaurants.length} restaurant{restaurants.length > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-sm text-gray-400 font-medium">${dayCost.toLocaleString()}</span>
          <span className={`text-gray-500 transition-transform text-xs ${isOpen ? "rotate-180" : ""}`}>&#9660;</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="space-y-0">
            {day.activities.map((activity, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center w-14 flex-shrink-0">
                  <span className="text-[11px] font-mono font-bold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                    {activity.time}
                  </span>
                  {idx < day.activities.length - 1 && (
                    <div className="w-px flex-1 bg-white/5 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${TYPE_COLORS[activity.type] || TYPE_COLORS.activity}`}>
                          {activity.type}
                        </span>
                        <span className="text-[10px] text-gray-600">{activity.time} - {activity.endTime}</span>
                      </div>
                      <p className="font-medium text-gray-200 text-sm">{activity.activity}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-600">{activity.placeName}</span>
                        <MapLink placeName={activity.placeName} destination={destination} />
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${activity.placeName} ${destination}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 font-medium"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          YouTube
                        </a>
                        <a
                          href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(`${activity.placeName} ${destination}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 font-medium"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                          </svg>
                          Instagram
                        </a>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {activity.estimatedCost > 0 ? (
                        <span className="text-sm font-semibold text-blue-400">${activity.estimatedCost}</span>
                      ) : (
                        <span className="text-xs text-emerald-500 font-medium">Free</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
