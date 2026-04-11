"use client";

import { useState } from "react";
import { MonitorResult, MonitorAlert, TravelFormInput, TravelPlan, UserSelections } from "@/types/travel";

interface MonitorPanelProps {
  formData: TravelFormInput;
  plan: TravelPlan;
  selections: UserSelections;
}

const SEVERITY_STYLES: Record<MonitorAlert["severity"], { bg: string; border: string; icon: string; text: string; badge: string }> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "&#9888;",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "&#9888;",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "&#8505;",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-400",
  },
};

const TYPE_ICONS: Record<MonitorAlert["type"], string> = {
  weather: "&#9748;",
  flight: "&#9992;",
  news: "&#128240;",
};

const TYPE_LABELS: Record<MonitorAlert["type"], string> = {
  weather: "Weather",
  flight: "Flight",
  news: "Local News",
};

export default function MonitorPanel({ formData, plan, selections }: MonitorPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<MonitorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outbound = plan.outboundFlights.find((f) => f.id === selections.outboundFlightId);
  const returnFlight = plan.returnFlights.find((f) => f.id === selections.returnFlightId);
  const hotel = plan.accommodations.find((a) => a.id === selections.accommodationId);

  const runMonitor = async () => {
    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const res = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: formData.location,
          origin: formData.origin,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate,
          airline: outbound?.airline,
          flightNumber: outbound?.flightNumber,
          returnAirline: returnFlight?.airline,
          returnFlightNumber: returnFlight?.flightNumber,
          hotel: hotel?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch updates");
      }

      const data: MonitorResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = result?.alerts.filter((a) => a.severity === "critical").length || 0;
  const warningCount = result?.alerts.filter((a) => a.severity === "warning").length || 0;

  return (
    <div>
      {/* Trigger button */}
      <button
        onClick={runMonitor}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 glass rounded-xl font-medium text-sm hover:bg-white/8 transition-all disabled:opacity-50 border border-white/10"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="text-gray-300">
          {loading ? "Checking..." : "Run Cron Job"}
        </span>
        {!loading && (
          <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
            Weather / Flight / News
          </span>
        )}
      </button>

      {/* Results panel */}
      {isOpen && (
        <div className="mt-4 glass rounded-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-200">Trip Monitor</h3>
              {result && (
                <span className="text-[10px] text-gray-500">
                  Checked {new Date(result.checkedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
                  {criticalCount} critical
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  {warningCount} warning
                </span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Checking weather, flights, and local news...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 text-center">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button
                onClick={runMonitor}
                className="text-xs text-blue-400 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Alerts */}
          {result && !loading && (
            <div className="divide-y divide-white/5">
              {result.alerts.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-emerald-400 text-lg mb-1">&#10003; All clear</p>
                  <p className="text-sm text-gray-500">No issues detected for your trip</p>
                </div>
              )}
              {result.alerts
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((alert, i) => {
                  const style = SEVERITY_STYLES[alert.severity];
                  return (
                    <div key={i} className={`p-4 ${style.bg}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <span
                            className={`text-lg ${style.text}`}
                            dangerouslySetInnerHTML={{ __html: TYPE_ICONS[alert.type] }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.badge}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase">
                              {TYPE_LABELS[alert.type]}
                            </span>
                          </div>
                          <p className={`font-medium text-sm ${style.text}`}>{alert.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{alert.description}</p>
                          {alert.action && (
                            <p className="text-xs text-gray-300 mt-2 flex items-center gap-1">
                              <span className="text-blue-400">&#10148;</span> {alert.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Email simulation note */}
          {result && !loading && result.alerts.some((a) => a.severity !== "info") && (
            <div className="px-4 py-3 border-t border-white/5 bg-white/2">
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                In production, these alerts would be emailed to you automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
