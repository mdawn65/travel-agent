"use client";

import { useState, useCallback } from "react";
import { useWizard } from "@/hooks/useWizard";
import { useStreamingPlan } from "@/hooks/useStreamingPlan";
import { TravelFormInput, TravelStyle, UserSelections, CardInfo } from "@/types/travel";
import { TRAVEL_STYLES, BUDGET_PRESETS } from "@/lib/constants";
import CityAutocomplete from "./CityAutocomplete";
import ChatBox from "./ChatBox";
import LoadingOverlay from "./LoadingOverlay";
import ResultsView from "./results/ResultsView";
import ConfirmationSummary from "./booking/ConfirmationSummary";
import CardForm from "./booking/CardForm";
import BookingProgress from "./booking/BookingProgress";
import BookingComplete from "./booking/BookingComplete";

export default function TravelWizard() {
  const wizard = useWizard();
  const streaming = useStreamingPlan();
  const [selections, setSelections] = useState<UserSelections>({
    outboundFlightId: null,
    returnFlightId: null,
    accommodationId: null,
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const isFormValid =
    (wizard.formData.origin || "").trim().length > 0 &&
    (wizard.formData.location || "").trim().length > 0 &&
    (wizard.formData.departureDate || "").length > 0 &&
    (wizard.formData.returnDate || "").length > 0 &&
    (wizard.formData.returnDate || "") > (wizard.formData.departureDate || "");

  const handleSubmit = () => {
    if (!isFormValid) return;
    const input: TravelFormInput = {
      origin: wizard.formData.origin || "",
      location: wizard.formData.location || "",
      departureDate: wizard.formData.departureDate || "",
      returnDate: wizard.formData.returnDate || "",
      budget: wizard.formData.budget || undefined,
      style: (wizard.formData.style as TravelStyle) || undefined,
      chatHistory: wizard.formData.chatHistory || "",
    };
    wizard.setPhase("loading");
    streaming.generate(input);
  };

  if (streaming.status === "complete" && wizard.phase === "loading") {
    wizard.setPhase("results");
  }
  if (streaming.status === "error" && wizard.phase === "loading") {
    wizard.setPhase("input");
  }

  const handleReset = () => {
    wizard.reset();
    streaming.cancel();
    setSelections({ outboundFlightId: null, returnFlightId: null, accommodationId: null });
  };

  const handleConfirm = (sel: UserSelections) => {
    setSelections(sel);
    wizard.setPhase("confirm");
  };

  const handlePayment = (_card: CardInfo) => {
    wizard.setPhase("booking");
  };

  const handleConversationUpdate = useCallback(
    (summary: string) => {
      wizard.updateField("chatHistory", summary);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const formData = wizard.formData as TravelFormInput;

  const getTotal = () => {
    if (!streaming.plan) return 0;
    const ob = streaming.plan.outboundFlights.find((f) => f.id === selections.outboundFlightId);
    const rt = streaming.plan.returnFlights.find((f) => f.id === selections.returnFlightId);
    const ht = streaming.plan.accommodations.find((a) => a.id === selections.accommodationId);
    return (ob?.price || 0) + (rt?.price || 0) + (ht?.totalCost || 0);
  };

  // Build chat context from filled form fields
  const chatContext = [
    wizard.formData.origin && `From: ${wizard.formData.origin}`,
    wizard.formData.location && `To: ${wizard.formData.location}`,
    wizard.formData.departureDate && `Depart: ${wizard.formData.departureDate}`,
    wizard.formData.returnDate && `Return: ${wizard.formData.returnDate}`,
    wizard.formData.budget && `Budget: $${wizard.formData.budget}`,
    wizard.formData.style && `Style: ${wizard.formData.style}`,
  ]
    .filter(Boolean)
    .join(", ");

  // --- Non-input phases ---
  if (wizard.phase === "loading") {
    return <LoadingOverlay onCancel={() => { streaming.cancel(); wizard.setPhase("input"); }} />;
  }
  if (wizard.phase === "results" && streaming.plan) {
    return <ResultsView plan={streaming.plan} formData={formData} onReset={handleReset} onConfirm={handleConfirm} />;
  }
  if (wizard.phase === "confirm" && streaming.plan) {
    return <ConfirmationSummary plan={streaming.plan} formData={formData} selections={selections} onBack={() => wizard.setPhase("results")} onProceedToPayment={() => wizard.setPhase("card")} />;
  }
  if (wizard.phase === "card") {
    return <CardForm total={getTotal()} onBack={() => wizard.setPhase("confirm")} onSubmit={handlePayment} />;
  }
  if (wizard.phase === "booking" && streaming.plan) {
    return <BookingProgress plan={streaming.plan} selections={selections} onComplete={() => wizard.setPhase("complete")} />;
  }
  if (wizard.phase === "complete" && streaming.plan) {
    return <BookingComplete plan={streaming.plan} formData={formData} selections={selections} onReset={handleReset} />;
  }

  // --- Single-page input form ---
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      {streaming.error && (
        <div className="mb-6 p-4 glass rounded-xl border-red-500/30 text-red-400 text-center text-sm">
          {streaming.error}
          <button onClick={() => streaming.cancel()} className="ml-2 underline hover:no-underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Form */}
        <div className="lg:col-span-3 glass rounded-2xl p-6 glow-blue">
          {/* Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <CityAutocomplete
              value={wizard.formData.origin || ""}
              onChange={(v) => wizard.updateField("origin", v)}
              placeholder="e.g., Seoul, South Korea"
              label="From"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>}
              autoFocus
            />
            <CityAutocomplete
              value={wizard.formData.location || ""}
              onChange={(v) => wizard.updateField("location", v)}
              placeholder="e.g., Tokyo, Japan"
              label="To"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Departure</label>
              <input
                type="date"
                value={wizard.formData.departureDate || ""}
                min={minDate}
                onChange={(e) => wizard.updateField("departureDate", e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Return</label>
              <input
                type="date"
                value={wizard.formData.returnDate || ""}
                min={wizard.formData.departureDate || minDate}
                onChange={(e) => wizard.updateField("returnDate", e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all text-gray-100 text-sm"
              />
            </div>
          </div>

          {/* Budget (optional) */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Budget <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() =>
                    wizard.updateField("budget", wizard.formData.budget === preset ? 0 : preset)
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    wizard.formData.budget === preset
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={wizard.formData.budget || ""}
                onChange={(e) => wizard.updateField("budget", Number(e.target.value))}
                placeholder="Or enter custom amount"
                min={0}
                className="w-full pl-7 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all text-gray-100 text-sm placeholder-gray-600"
              />
            </div>
          </div>

          {/* Travel style (optional) */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Travel Style <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() =>
                    wizard.updateField(
                      "style",
                      wizard.formData.style === style.value ? ("" as TravelStyle) : style.value
                    )
                  }
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    wizard.formData.style === style.value
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/5 bg-white/2 hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{style.icon}</span>
                  <span className={`text-[10px] font-medium ${
                    wizard.formData.style === style.value ? "text-blue-400" : "text-gray-500"
                  }`}>
                    {style.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.99]"
          >
            Generate Travel Plan
          </button>
        </div>

        {/* Right: AI Chat */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 glow-purple flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-300">AI Travel Assistant</h3>
          </div>
          <ChatBox
            context={chatContext}
            onConversationUpdate={handleConversationUpdate}
          />
        </div>
      </div>
    </div>
  );
}
