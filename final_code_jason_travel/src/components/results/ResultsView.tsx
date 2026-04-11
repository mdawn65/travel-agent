"use client";

import { useState } from "react";
import { TravelPlan, TravelFormInput, UserSelections } from "@/types/travel";
import FlightSection from "./FlightSection";
import HotelSection from "./HotelSection";
import ItinerarySection from "./ItinerarySection";

interface ResultsViewProps {
  plan: TravelPlan;
  formData: TravelFormInput;
  onReset: () => void;
  onConfirm: (selections: UserSelections) => void;
}

type Tab = "outbound" | "return" | "hotel" | "itinerary";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "outbound", label: "Departure", icon: "&#9992;" },
  { key: "return", label: "Return", icon: "&#9992;" },
  { key: "hotel", label: "Hotel", icon: "&#127976;" },
  { key: "itinerary", label: "Itinerary", icon: "&#128197;" },
];

export default function ResultsView({ plan, formData, onReset, onConfirm }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("outbound");
  const [selections, setSelections] = useState<UserSelections>({
    outboundFlightId: null,
    returnFlightId: null,
    accommodationId: null,
  });

  const allSelected =
    selections.outboundFlightId && selections.returnFlightId && selections.accommodationId;

  const selectedOutbound = plan.outboundFlights.find((f) => f.id === selections.outboundFlightId);
  const selectedReturn = plan.returnFlights.find((f) => f.id === selections.returnFlightId);
  const selectedHotel = plan.accommodations.find((a) => a.id === selections.accommodationId);
  const total =
    (selectedOutbound?.price || 0) +
    (selectedReturn?.price || 0) +
    (selectedHotel?.totalCost || 0);

  const tabStatus = (tab: Tab) => {
    if (tab === "outbound") return selections.outboundFlightId ? "done" : "pending";
    if (tab === "return") return selections.returnFlightId ? "done" : "pending";
    if (tab === "hotel") return selections.accommodationId ? "done" : "pending";
    return "info";
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-1">
          {formData.origin} <span className="text-blue-400">&rarr;</span> {formData.location}
        </h2>
        <p className="text-sm text-gray-500">
          {formData.departureDate} to {formData.returnDate}
          {formData.budget ? ` \u00b7 $${formData.budget.toLocaleString()} budget` : ""}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 overflow-x-auto">
        {TABS.map((tab) => {
          const status = tabStatus(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {status === "done" && <span className="text-emerald-400 text-xs">&#10003;</span>}
              <span dangerouslySetInnerHTML={{ __html: tab.icon }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === "outbound" && (
          <FlightSection
            label="Outbound Flight"
            flights={plan.outboundFlights}
            selectedId={selections.outboundFlightId}
            onSelect={(id) => {
              setSelections((s) => ({ ...s, outboundFlightId: id }));
              if (!selections.returnFlightId) setTimeout(() => setActiveTab("return"), 300);
            }}
          />
        )}
        {activeTab === "return" && (
          <FlightSection
            label="Return Flight"
            flights={plan.returnFlights}
            selectedId={selections.returnFlightId}
            onSelect={(id) => {
              setSelections((s) => ({ ...s, returnFlightId: id }));
              if (!selections.accommodationId) setTimeout(() => setActiveTab("hotel"), 300);
            }}
          />
        )}
        {activeTab === "hotel" && (
          <HotelSection
            accommodations={plan.accommodations}
            selectedId={selections.accommodationId}
            onSelect={(id) => {
              setSelections((s) => ({ ...s, accommodationId: id }));
              setTimeout(() => setActiveTab("itinerary"), 300);
            }}
          />
        )}
        {activeTab === "itinerary" && (
          <ItinerarySection itinerary={plan.itinerary} destination={formData.location} />
        )}
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 glass-strong mt-8 rounded-t-2xl -mx-4 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            {total > 0 && (
              <p className="text-sm text-gray-400">
                Total: <span className="text-xl font-bold text-white">${total.toLocaleString()}</span>
              </p>
            )}
            {!allSelected && (
              <p className="text-xs text-gray-600 mt-0.5">Select flight and hotel to continue</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="px-5 py-2.5 border border-white/10 text-gray-400 rounded-xl font-medium hover:bg-white/5 transition-colors text-sm"
            >
              Start Over
            </button>
            <button
              onClick={() => onConfirm(selections)}
              disabled={!allSelected}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all text-sm"
            >
              Confirm &amp; Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
