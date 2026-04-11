import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plane, Hotel, MapPin, ArrowLeft, Clock, Star, Users, Calendar,
  Wifi, Coffee, Utensils, Wind, Zap, Globe2, Info,
  AlertTriangle, CheckCircle2, RefreshCw, CalendarDays,
  DollarSign, Loader2, ChevronDown, ChevronUp, Sparkles,
  Bell, BellOff, CloudRain, Newspaper, Eye, EyeOff
} from "lucide-react";
import type { MonitorAlert } from "@shared/schema";
import type { Search } from "@shared/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "star fill-current" : "text-border"}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground font-body">{rating.toFixed(1)}</span>
    </span>
  );
}

function AmenityIcon({ amenity }: { amenity: string }) {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("wi-fi")) return <Wifi className="w-3 h-3" />;
  if (lower.includes("meal") || lower.includes("food") || lower.includes("breakfast")) return <Utensils className="w-3 h-3" />;
  if (lower.includes("usb") || lower.includes("charg")) return <Zap className="w-3 h-3" />;
  if (lower.includes("air") || lower.includes("wind")) return <Wind className="w-3 h-3" />;
  return <Coffee className="w-3 h-3" />;
}

function LoadingState({ destination }: { destination: string }) {
  const steps = [
    { icon: Plane, label: "Searching flights..." },
    { icon: Hotel, label: "Finding accommodations on Trivago..." },
    { icon: MapPin, label: "Discovering top attractions..." },
    { icon: CalendarDays, label: "Building day-by-day itinerary..." },
    { icon: AlertTriangle, label: "Checking for disruptions..." },
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Globe2 className="w-10 h-10 text-ocean animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">Planning your trip to</h2>
        <h3 className="font-display text-3xl font-bold text-ocean mb-6">{destination}</h3>
        <div className="space-y-3 mb-8">
          {steps.map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                i === activeStep
                  ? "bg-primary/10 border border-primary/30 text-foreground"
                  : i < activeStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground opacity-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${i === activeStep ? "text-ocean" : ""}`} />
              <span className="text-sm font-body">{label}</span>
              {i === activeStep && (
                <div className="ml-auto dot-loader">
                  <span /><span /><span />
                </div>
              )}
              {i < activeStep && <CheckCircle2 className="w-4 h-4 ml-auto text-green-500" />}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Our agentic AI is building your full trip plan...</p>
      </div>
    </div>
  );
}

// ─── Disruption Alert Bar ──────────────────────────────────────────────────────

function DisruptionAlertBar({ searchId, alertData: initialAlertData, flightNumber }: {
  searchId: number;
  alertData: any;
  flightNumber?: string;
}) {
  const [alertData, setAlertData] = useState(initialAlertData);
  const [isExpanded, setIsExpanded] = useState(false);

  const recheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/searches/${searchId}/check-disruptions`, {});
      return res.json();
    },
    onSuccess: (data) => {
      setAlertData(data);
      queryClient.invalidateQueries({ queryKey: ["/api/searches", searchId] });
    },
  });

  if (!alertData) return null;

  const alerts: any[] = alertData.alerts || [];
  const hasIssues = alerts.some((a: any) => a.type !== "normal");
  const highSeverity = alerts.some((a: any) => a.severity === "high");

  const barColor = highSeverity
    ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/30"
    : hasIssues
    ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30"
    : "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30";

  const iconColor = highSeverity ? "text-red-500" : hasIssues ? "text-amber-500" : "text-green-500";
  const AlertIcon = highSeverity || hasIssues ? AlertTriangle : CheckCircle2;

  const checkedAt = alertData.checkedAt ? new Date(alertData.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${barColor}`}>
      <div className="flex items-center justify-between gap-3">
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-alerts"
        >
          <AlertIcon className={`w-4 h-4 shrink-0 ${iconColor}`} />
          <span className="font-body font-semibold text-sm">
            {highSeverity ? "Flight disruption detected" : hasIssues ? "Minor disruptions detected" : "Your route looks clear"}
          </span>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-1">{alerts.length}</Badge>
          )}
          {checkedAt && (
            <span className="text-xs text-muted-foreground ml-auto">Checked {checkedAt}</span>
          )}
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-2 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 ml-2 shrink-0" />}
        </button>
        <Button
          data-testid="button-recheck-disruptions"
          size="sm"
          variant="ghost"
          onClick={() => recheckMutation.mutate()}
          disabled={recheckMutation.isPending}
          className="h-7 px-2 text-xs shrink-0"
        >
          {recheckMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {isExpanded && alerts.length > 0 && (
        <div className="mt-3 space-y-2">
          {alertData.airportStatus && (
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 mb-3">
              {alertData.airportStatus.origin && (
                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-2">
                  <div className="font-medium text-foreground mb-0.5">Origin Airport</div>
                  <div>{alertData.airportStatus.origin}</div>
                </div>
              )}
              {alertData.airportStatus.destination && (
                <div className="bg-white/50 dark:bg-white/5 rounded-lg p-2">
                  <div className="font-medium text-foreground mb-0.5">Destination Airport</div>
                  <div>{alertData.airportStatus.destination}</div>
                </div>
              )}
            </div>
          )}
          {alerts.map((alert: any, i: number) => (
            <div key={i} className="bg-white/60 dark:bg-white/5 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  alert.severity === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  alert.severity === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                } capitalize`}>{alert.type}</div>
                {alert.flight && <span className="text-xs text-muted-foreground">{alert.flight}</span>}
              </div>
              <p className="text-sm mt-1.5">{alert.message}</p>
              {alert.recommendation && (
                <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                  <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-ocean" />
                  {alert.recommendation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Itinerary Tab ─────────────────────────────────────────────────────────────

function BudgetBreakdown({ budget, search }: { budget: any; search: Search }) {
  if (!budget || !budget.totalEstimate) return null;

  const lineItems = [
    { label: `Flights (×${budget.numTravelers || search.travelers} travelers, round-trip)`, amount: (budget.flightCostPerPerson || 0) * (budget.numTravelers || search.travelers) * 2 },
    { label: `Hotel (${budget.numDays || 5} nights)`, amount: (budget.hotelCostPerNight || 0) * (budget.numDays || 5) * Math.ceil((budget.numTravelers || search.travelers) / 2) },
    { label: `Food & Dining (est.)`, amount: (budget.estimatedDailyFood || 60) * (budget.numDays || 5) * (budget.numTravelers || search.travelers) },
    { label: `Transport (est.)`, amount: (budget.estimatedDailyTransport || 20) * (budget.numDays || 5) * (budget.numTravelers || search.travelers) },
    { label: `Attractions (est.)`, amount: (budget.estimatedAttractions || 30) * (budget.numDays || 5) * (budget.numTravelers || search.travelers) },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-ocean" />
        Budget Estimate
      </h3>
      <div className="space-y-2 mb-4">
        {lineItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-body font-semibold">${item.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-border pt-3 mt-3 flex items-center justify-between">
          <span className="font-display font-bold">Total (estimated)</span>
          <span className="font-display text-2xl font-bold text-ocean">${budget.totalEstimate.toLocaleString()}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Estimates based on cheapest available flight + mid-range hotel. Actual costs may vary.</p>
    </div>
  );
}

function DayCard({ day, index }: { day: any; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const periods = [
    { key: "morning", label: "Morning", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10" },
    { key: "afternoon", label: "Afternoon", color: "text-ocean", bg: "bg-primary/5" },
    { key: "evening", label: "Evening", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/10" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        data-testid={`button-day-${day.day}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-display font-bold text-ocean">
            {day.day}
          </div>
          <div className="text-left">
            <div className="font-display font-bold text-base">{day.theme || `Day ${day.day}`}</div>
            {day.date && <div className="text-xs text-muted-foreground">{day.date}</div>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* Time slots */}
          {periods.map(({ key, label, color, bg }) => {
            const slot = day[key];
            if (!slot) return null;
            return (
              <div key={key} className={`rounded-xl p-3 ${bg}`}>
                <div className={`text-xs font-semibold uppercase tracking-wide ${color} mb-1.5`}>{label}</div>
                <div className="font-body font-semibold text-sm">{slot.activity}</div>
                {slot.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />{slot.location}
                  </div>
                )}
                {slot.durationHours && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />{slot.durationHours}h
                  </div>
                )}
                {slot.tip && (
                  <p className="text-xs text-muted-foreground mt-1.5 italic">{slot.tip}</p>
                )}
              </div>
            );
          })}

          {/* Meals */}
          {day.meals && (
            <div className="grid grid-cols-3 gap-2">
              {["breakfast", "lunch", "dinner"].map(meal => (
                day.meals[meal] ? (
                  <div key={meal} className="bg-muted rounded-xl p-2.5">
                    <div className="text-xs text-muted-foreground capitalize mb-0.5">{meal}</div>
                    <div className="text-xs font-medium leading-tight">{day.meals[meal]}</div>
                  </div>
                ) : null
              ))}
            </div>
          )}

          {/* Travel tip */}
          {day.travelTip && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{day.travelTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItineraryTab({ itinerary, search }: { itinerary: any; search: Search }) {
  if (!itinerary || (!itinerary.days?.length && !itinerary.budget)) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Itinerary data not available for this search.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BudgetBreakdown budget={itinerary.budget} search={search} />
      {itinerary.days?.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-ocean" />
            Day-by-Day Plan
          </h2>
          <div className="space-y-3">
            {itinerary.days.map((day: any, i: number) => (
              <DayCard key={i} day={day} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Flight Card ───────────────────────────────────────────────────────────────

function FlightCard({ flight, travelers }: { flight: any; travelers: number }) {
  const total = (flight.price * travelers).toLocaleString();
  return (
    <div
      data-testid={`card-flight-${flight.flightNumber}`}
      className="bg-card border border-border rounded-2xl p-5 card-hover"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-bold text-lg">{flight.airline}</span>
            <Badge variant="secondary" className="text-xs">{flight.flightNumber}</Badge>
          </div>
          <Badge
            className={`text-xs ${
              flight.class === "Business"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : flight.class === "Premium Economy"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {flight.class}
          </Badge>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-ocean">${flight.price.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">per person</div>
          {travelers > 1 && (
            <div className="text-xs text-muted-foreground">Total: ${total}</div>
          )}
        </div>
      </div>

      {/* Route display */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-center">
          <div className="font-body font-bold text-xl">{flight.departure}</div>
          <div className="text-xs text-muted-foreground">Departure</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs text-muted-foreground">{flight.duration}</div>
          <div className="w-full flex items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <Plane className="w-3.5 h-3.5 text-ocean rotate-90" />
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="text-xs text-muted-foreground">
            {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}${flight.stopCity ? ` via ${flight.stopCity}` : ""}`}
          </div>
        </div>
        <div className="text-center">
          <div className="font-body font-bold text-xl">{flight.arrival}</div>
          <div className="text-xs text-muted-foreground">Arrival</div>
        </div>
      </div>

      {/* Amenities */}
      {flight.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flight.amenities.map((a: string) => (
            <div key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
              <AmenityIcon amenity={a} />
              {a}
            </div>
          ))}
        </div>
      )}

      <Button
        data-testid={`button-book-flight-${flight.flightNumber}`}
        className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={() => window.open(`https://www.google.com/flights`, "_blank", "noopener")}
      >
        Select Flight
      </Button>
    </div>
  );
}

// ─── Accommodation Card ────────────────────────────────────────────────────────

function AccommodationCard({ hotel }: { hotel: any }) {
  const bookingUrl = hotel.bookingUrl ||
    `https://www.trivago.com/en-US/srl?search%5Bdest_id%5D=&search%5Bdest_type%5D=&search%5Bhotel_name%5D=${encodeURIComponent(hotel.name)}`;

  return (
    <div
      data-testid={`card-hotel-${hotel.name?.replace(/\s+/g, '-').toLowerCase()}`}
      className="bg-card border border-border rounded-2xl overflow-hidden card-hover"
    >
      <div
        className={`h-3 ${
          hotel.stars >= 5 ? "bg-amber-400" :
          hotel.stars >= 4 ? "bg-primary" :
          hotel.stars >= 3 ? "bg-secondary-foreground/30" :
          "bg-muted-foreground/30"
        }`}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">{hotel.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-xs">{hotel.type}</Badge>
              <div className="flex">
                {Array.from({ length: hotel.stars }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 star fill-current" />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-xl font-bold text-ocean">${hotel.pricePerNight}</div>
            <div className="text-xs text-muted-foreground">/ night</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{hotel.location}</span>
        </div>

        <Stars rating={hotel.rating} />
        <p className="text-xs text-muted-foreground mt-1">{hotel.reviewCount?.toLocaleString()} reviews</p>

        <p className="text-sm text-muted-foreground mt-3 mb-3">{hotel.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {hotel.amenities?.slice(0, 5).map((a: string) => (
            <div key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
              <AmenityIcon amenity={a} />
              {a}
            </div>
          ))}
        </div>

        <Button
          data-testid={`button-book-hotel-${hotel.name?.replace(/\s+/g, '-').toLowerCase()}`}
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          onClick={() => window.open(bookingUrl, "_blank", "noopener")}
        >
          View on Trivago
        </Button>
      </div>
    </div>
  );
}

// ─── Attraction Card ───────────────────────────────────────────────────────────

function AttractionCard({ attraction }: { attraction: any }) {
  const typeColors: Record<string, string> = {
    Landmark: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Museum: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    Nature: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Food & Drink": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Shopping: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
    Entertainment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Cultural: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div
      data-testid={`card-attraction-${attraction.name?.replace(/\s+/g, '-').toLowerCase()}`}
      className="bg-card border border-border rounded-2xl p-5 card-hover"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-bold text-base leading-tight mb-1">{attraction.name}</h3>
          <Badge className={`text-xs ${typeColors[attraction.type] || "bg-secondary text-secondary-foreground"}`}>
            {attraction.type}
          </Badge>
        </div>
        <div className="text-right shrink-0">
          {attraction.price === 0 ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Free</Badge>
          ) : (
            <div className="font-bold text-ocean">${attraction.price}</div>
          )}
        </div>
      </div>

      <Stars rating={attraction.rating} />

      <p className="text-sm text-muted-foreground mt-3 mb-3">{attraction.description}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{attraction.duration}</span>
        <span className="flex items-center gap-1"><Star className="w-3 h-3" />Best: {attraction.bestTime}</span>
      </div>

      {attraction.tips && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-400">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{attraction.tips}</span>
        </div>
      )}
    </div>
  );
}

// ─── Summary Panel ─────────────────────────────────────────────────────────────

function SummaryPanel({ summaryData, search }: { summaryData: any; search: Search }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-ocean" />
          About {search.destination}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{summaryData?.summary}</p>
        <div className="grid grid-cols-2 gap-3">
          {summaryData?.currency && (
            <div className="bg-muted rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Currency</div>
              <div className="font-body font-semibold text-sm">{summaryData.currency}</div>
            </div>
          )}
          {summaryData?.language && (
            <div className="bg-muted rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Language</div>
              <div className="font-body font-semibold text-sm">{summaryData.language}</div>
            </div>
          )}
          {summaryData?.bestSeason && (
            <div className="bg-muted rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Best Season</div>
              <div className="font-body font-semibold text-sm">{summaryData.bestSeason}</div>
            </div>
          )}
          {summaryData?.timezone && (
            <div className="bg-muted rounded-xl p-3">
              <div className="text-xs text-muted-foreground mb-0.5">Timezone</div>
              <div className="font-body font-semibold text-sm">{summaryData.timezone}</div>
            </div>
          )}
        </div>
      </div>

      {summaryData?.tips?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-coral" />
            Travel Tips
          </h3>
          <ul className="space-y-3">
            {summaryData.tips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-coral/10 text-coral flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


// ─── Signal icons & colors ────────────────────────────────────────────────────
const SIGNAL_META: Record<string, { icon: any; label: string; color: string }> = {
  weather: { icon: CloudRain,   label: "Weather",  color: "text-blue-500" },
  flight:  { icon: Plane,       label: "Flights",  color: "text-ocean" },
  news:    { icon: Newspaper,   label: "News",     color: "text-purple-500" },
};

const SEVERITY_STYLE: Record<string, string> = {
  ok:       "border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10",
  warning:  "border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/10",
  critical: "border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10",
};

const SEVERITY_DOT: Record<string, string> = {
  ok:       "bg-green-500",
  warning:  "bg-amber-500",
  critical: "bg-red-500",
};

// ─── Single Alert Row ─────────────────────────────────────────────────────────
function AlertRow({ alert }: { alert: MonitorAlert }) {
  const meta = SIGNAL_META[alert.signal] || SIGNAL_META.news;
  const Icon = meta.icon;
  const checkedAt = alert.checkedAt
    ? new Date(alert.checkedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`rounded-xl border p-3 ${SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.ok}`}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex flex-col items-center gap-1">
          <Icon className={`w-4 h-4 shrink-0 ${meta.color}`} />
          <div className={`w-2 h-2 rounded-full ${SEVERITY_DOT[alert.severity] || "bg-gray-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-body font-semibold text-sm">{alert.title}</span>
            {!alert.isRead && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">New</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{alert.body}</p>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <span className="text-xs text-muted-foreground/60">{checkedAt}</span>
            {alert.source && (
              <a
                href={alert.source.startsWith("http") ? alert.source : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ocean hover:underline truncate max-w-[160px]"
              >
                Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Monitor Panel ─────────────────────────────────────────────────────────────
function MonitorPanel({ search }: { search: any }) {
  const [isWatched, setIsWatched] = useState<boolean>(!!search.isWatched);
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [unread, setUnread] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Poll alerts every 8s when expanded
  const fetchAlerts = async () => {
    try {
      const res = await apiRequest("GET", `/api/searches/${search.id}/alerts`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setUnread(data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const interval = setInterval(fetchAlerts, 8000);
    return () => clearInterval(interval);
  }, [expanded]);

  const toggleWatch = async () => {
    try {
      const newVal = !isWatched;
      await apiRequest("POST", `/api/searches/${search.id}/watch`, { watch: newVal });
      setIsWatched(newVal);
      toast({
        title: newVal ? "Monitoring started" : "Monitoring stopped",
        description: newVal
          ? "We'll check weather, flights, and destination news daily."
          : "Daily monitoring has been disabled for this trip.",
      });
    } catch {
      toast({ title: "Error", description: "Could not update watch status.", variant: "destructive" });
    }
  };

  const runNow = async () => {
    setIsRunning(true);
    try {
      await apiRequest("POST", `/api/searches/${search.id}/monitor-now`, {});
      toast({ title: "Check started", description: "Checking weather, flights, and news. Results will appear shortly." });
      // Poll for new alerts
      let attempts = 0;
      const poll = setInterval(async () => {
        await fetchAlerts();
        attempts++;
        if (attempts >= 10) clearInterval(poll);
      }, 3000);
      setTimeout(() => { setIsRunning(false); }, 5000);
    } catch {
      setIsRunning(false);
      toast({ title: "Check failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const markRead = async () => {
    await apiRequest("POST", `/api/searches/${search.id}/alerts/read`, {});
    setUnread(0);
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const hasCritical = alerts.some(a => a.severity === "critical");
  const hasWarning  = alerts.some(a => a.severity === "warning");
  const statusColor = hasCritical ? "text-red-500" : hasWarning ? "text-amber-500" : "text-green-500";
  const StatusIcon  = hasCritical || hasWarning ? AlertTriangle : CheckCircle2;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button
          onClick={() => { setExpanded(!expanded); if (!expanded && unread > 0) markRead(); }}
          className="flex items-center gap-2.5 flex-1 text-left"
          data-testid="button-toggle-monitor"
        >
          <Bell className={`w-4 h-4 shrink-0 ${isWatched ? "text-ocean" : "text-muted-foreground"}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base">Trip Monitor</span>
              {unread > 0 && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                  {unread}
                </span>
              )}
              {alerts.length > 0 && (
                <StatusIcon className={`w-3.5 h-3.5 ${statusColor}`} />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isWatched
                ? "Monitoring weather, flights & news daily"
                : "Enable daily monitoring for this trip"}
            </p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {/* Check now */}
          <Button
            data-testid="button-monitor-now"
            size="sm"
            variant="outline"
            onClick={runNow}
            disabled={isRunning}
            className="h-8 px-3 text-xs gap-1.5"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Check now
          </Button>
          {/* Toggle watch */}
          <Button
            data-testid="button-toggle-watch"
            size="sm"
            onClick={toggleWatch}
            className={`h-8 px-3 text-xs gap-1.5 ${
              isWatched
                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/10 dark:text-red-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isWatched ? <><BellOff className="w-3.5 h-3.5" /> Stop</> : <><Bell className="w-3.5 h-3.5" /> Watch</>}
          </Button>
        </div>
      </div>

      {/* Signal summary strip */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-3 border-t border-border">
          {(["weather", "flight", "news"] as const).map(sig => {
            const latest = [...alerts].find(a => a.signal === sig);
            const meta = SIGNAL_META[sig];
            const Icon = meta.icon;
            return (
              <div
                key={sig}
                className={`flex items-center gap-2 px-4 py-2.5 ${sig !== "news" ? "border-r border-border" : ""}`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground">{meta.label}</div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[latest?.severity || "ok"]}`} />
                    <span className="text-xs text-foreground capitalize truncate">{latest?.severity || "ok"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alert history */}
      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No alerts yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Click "Check now" to run your first monitoring scan.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alert History</span>
                {unread > 0 && (
                  <button onClick={markRead} className="text-xs text-ocean hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              {alerts.map(alert => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          )}

          {/* What gets monitored */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">What the agent monitors</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: CloudRain, label: "Weather", desc: "Storms, heatwaves, travel conditions" },
                { icon: Plane,     label: "Flights",  desc: "Delays, cancellations, route changes" },
                { icon: Newspaper, label: "News",     desc: "Advisories, entry rules, safety alerts" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="bg-muted rounded-xl p-3">
                  <Icon className="w-4 h-4 text-ocean mb-1.5" />
                  <div className="font-body font-semibold text-xs">{label}</div>
                  <div className="text-xs text-muted-foreground leading-tight mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
            {isWatched && (
              <p className="text-xs text-muted-foreground/70 mt-3 text-center">
                Runs daily · You'll be notified when anything needs attention
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const searchId = parseInt(id || "0");

  const { data: search } = useQuery<Search>({
    queryKey: ["/api/searches", searchId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/searches/${searchId}`);
      return res.json();
    },
    refetchInterval: (query) => {
      const s = query.state.data as Search | undefined;
      if (!s || s.status === "pending" || s.status === "searching") return 2000;
      return false;
    },
  });

  if (!search || search.status === "pending" || search.status === "searching") {
    return <LoadingState destination={search?.destination || "your destination"} />;
  }

  if (search.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😞</div>
          <h2 className="font-display text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">We couldn't plan your trip. Please try again.</p>
          <Button onClick={() => setLocation("/")}>Try Again</Button>
        </div>
      </div>
    );
  }

  let flights: any[] = [];
  let accommodations: any[] = [];
  let attractions: any[] = [];
  let summaryData: any = {};
  let itinerary: any = {};
  let alertData: any = null;

  try { flights = JSON.parse(search.flightsData || "{}").flights || []; } catch {}
  try { accommodations = JSON.parse(search.accommodationsData || "{}").accommodations || []; } catch {}
  try { attractions = JSON.parse(search.attractionsData || "{}").attractions || []; } catch {}
  try { summaryData = JSON.parse(search.summary || "{}"); } catch {}
  try { itinerary = JSON.parse(search.itineraryData || "{}"); } catch {}
  try { alertData = JSON.parse(search.alertData || "null"); } catch {}

  const hasItinerary = itinerary?.days?.length > 0 || itinerary?.budget?.totalEstimate;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="gradient-hero text-white">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <Button
              data-testid="button-back"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-bold">{search.origin}</span>
                  <Plane className="w-4 h-4 opacity-60" />
                  <span className="font-display text-xl font-bold">{search.destination}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 text-xs mt-0.5">
                  {search.departureDate && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{search.departureDate}</span>
                  )}
                  {search.returnDate && (
                    <span>{search.returnDate}</span>
                  )}
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{search.travelers} traveler{search.travelers !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Disruption Alert Bar */}
        {alertData && (
          <DisruptionAlertBar
            searchId={searchId}
            alertData={alertData}
            flightNumber={flights[0]?.flightNumber}
          />
        )}

        {/* Monitor Panel */}
        <MonitorPanel search={search} />

        {/* Summary */}
        {summaryData?.summary && <SummaryPanel summaryData={summaryData} search={search} />}

        {/* Tabs */}
        <Tabs defaultValue={hasItinerary ? "itinerary" : "flights"} className="w-full">
          <TabsList className={`grid w-full mb-6 h-12 rounded-xl bg-muted p-1 ${hasItinerary ? "grid-cols-4" : "grid-cols-3"}`}>
            {hasItinerary && (
              <TabsTrigger value="itinerary" className="rounded-lg flex items-center gap-2 font-body font-medium" data-testid="tab-itinerary">
                <CalendarDays className="w-4 h-4" />
                Itinerary
              </TabsTrigger>
            )}
            <TabsTrigger value="flights" className="rounded-lg flex items-center gap-2 font-body font-medium" data-testid="tab-flights">
              <Plane className="w-4 h-4" />
              Flights
              <Badge variant="secondary" className="text-xs ml-1">{flights.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="hotels" className="rounded-lg flex items-center gap-2 font-body font-medium" data-testid="tab-hotels">
              <Hotel className="w-4 h-4" />
              Hotels
              <Badge variant="secondary" className="text-xs ml-1">{accommodations.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="rounded-lg flex items-center gap-2 font-body font-medium" data-testid="tab-attractions">
              <MapPin className="w-4 h-4" />
              Attractions
              <Badge variant="secondary" className="text-xs ml-1">{attractions.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {hasItinerary && (
            <TabsContent value="itinerary">
              <ItineraryTab itinerary={itinerary} search={search} />
            </TabsContent>
          )}

          <TabsContent value="flights">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Available Flights</h2>
              <span className="text-sm text-muted-foreground">{flights.length} options found</span>
            </div>
            {flights.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No flights found. Try adjusting your search.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flights.map((f: any, i: number) => (
                  <FlightCard key={i} flight={f} travelers={search.travelers} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hotels">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Accommodations</h2>
              <span className="text-sm text-muted-foreground">{accommodations.length} options found · via Trivago</span>
            </div>
            {accommodations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No hotels found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accommodations.map((h: any, i: number) => (
                  <AccommodationCard key={i} hotel={h} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attractions">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Things To Do</h2>
              <span className="text-sm text-muted-foreground">{attractions.length} attractions found</span>
            </div>
            {attractions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No attractions found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attractions.map((a: any, i: number) => (
                  <AttractionCard key={i} attraction={a} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground text-center">
          <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
          Results are web-grounded by Perplexity Sonar AI with Trivago hotel data. Prices and availability may vary — always verify with official booking sites before purchasing.
        </div>
      </div>
    </div>
  );
}
