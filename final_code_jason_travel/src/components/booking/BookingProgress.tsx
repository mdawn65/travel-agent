"use client";

import { useEffect, useState } from "react";
import { TravelPlan, UserSelections, BookingStep } from "@/types/travel";

interface BookingProgressProps {
  plan: TravelPlan;
  selections: UserSelections;
  onComplete: () => void;
}

export default function BookingProgress({ plan, selections, onComplete }: BookingProgressProps) {
  const outbound = plan.outboundFlights.find((f) => f.id === selections.outboundFlightId)!;
  const returnFlight = plan.returnFlights.find((f) => f.id === selections.returnFlightId)!;
  const hotel = plan.accommodations.find((a) => a.id === selections.accommodationId)!;
  const restaurants = plan.itinerary.flatMap((day) =>
    day.activities.filter((a) => a.type === "restaurant")
  );

  const allSteps: BookingStep[] = [
    { type: "outbound_flight", status: "pending" },
    { type: "return_flight", status: "pending" },
    { type: "accommodation", status: "pending" },
    ...restaurants.map((r) => ({
      type: "restaurant" as const,
      name: r.placeName,
      status: "pending" as const,
    })),
  ];

  const [steps, setSteps] = useState<BookingStep[]>(allSteps);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (currentIdx >= steps.length) {
      setTimeout(onComplete, 800);
      return;
    }

    setSteps((prev) =>
      prev.map((s, i) => (i === currentIdx ? { ...s, status: "booking" as const } : s))
    );

    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => (i === currentIdx ? { ...s, status: "done" as const } : s))
      );
      setCurrentIdx((prev) => prev + 1);
    }, 1500 + Math.random() * 1000);

    return () => clearTimeout(timer);
  }, [currentIdx, steps.length, onComplete]);

  const getStepLabel = (step: BookingStep) => {
    switch (step.type) {
      case "outbound_flight": return `${outbound.airline} ${outbound.flightNumber}`;
      case "return_flight": return `${returnFlight.airline} ${returnFlight.flightNumber}`;
      case "accommodation": return hotel.name;
      case "restaurant": return step.name;
    }
  };

  const getStepCategory = (step: BookingStep) => {
    switch (step.type) {
      case "outbound_flight": return "Outbound Flight";
      case "return_flight": return "Return Flight";
      case "accommodation": return "Hotel Booking";
      case "restaurant": return "Restaurant Reservation";
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8 animate-fade-in">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4 animate-float">&#9992;</div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Booking Your Trip</h2>
        <p className="text-gray-500 text-sm">Processing reservations one by one...</p>
      </div>

      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
              step.status === "done"
                ? "glass border-emerald-500/20 glow-green"
                : step.status === "booking"
                ? "glass border-blue-500/30 glow-blue"
                : "bg-white/2 border border-white/5 opacity-40"
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {step.status === "done" && <span className="text-emerald-400 text-xl">&#10003;</span>}
              {step.status === "booking" && (
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              )}
              {step.status === "pending" && <div className="w-2.5 h-2.5 bg-gray-700 rounded-full" />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wider">{getStepCategory(step)}</p>
              <p className={`font-medium text-sm ${
                step.status === "done" ? "text-emerald-300" : step.status === "booking" ? "text-blue-300" : "text-gray-600"
              }`}>
                {getStepLabel(step)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              {step.status === "done" && <span className="text-xs font-medium text-emerald-400">Confirmed</span>}
              {step.status === "booking" && <span className="text-xs font-medium text-blue-400">Booking...</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{steps.filter((s) => s.status === "done").length}/{steps.length}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${(steps.filter((s) => s.status === "done").length / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
