import { useState } from "react";
import { Plane, Hotel, MapPin, Calendar, DollarSign, Star, Clock, ChevronDown, ChevronUp, ExternalLink, Globe2, Info, Utensils, Wifi, Coffee, Wind, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TripPlan {
  destination: string;
  origin: string;
  dates: { departure: string; return: string };
  travelers: number;
  summary: string;
  flights: any[];
  hotels: any[];
  attractions: any[];
  itinerary: any[];
  budget: { flights: number; hotels: number; activities: number; food: number; total: number };
  citations: string[];
}

function AmenityIcon({ amenity }: { amenity: string }) {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("wi-fi")) return <Wifi className="w-3 h-3" />;
  if (lower.includes("meal") || lower.includes("food") || lower.includes("breakfast")) return <Utensils className="w-3 h-3" />;
  if (lower.includes("usb") || lower.includes("charg")) return <Zap className="w-3 h-3" />;
  return <Coffee className="w-3 h-3" />;
}

export default function TripCard({ trip }: { trip: TripPlan }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex gap-3">
      {/* Agent avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-coral flex items-center justify-center shrink-0 mt-1">
        <span className="text-white text-sm">✨</span>
      </div>

      <div className="flex-1 bg-card border border-border rounded-2xl rounded-tl-md overflow-hidden">
        {/* Trip header */}
        <div className="bg-gradient-to-r from-ocean/10 to-primary/10 p-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-xl font-bold">{trip.destination}</h3>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5" /> From {trip.origin}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {trip.dates.departure} → {trip.dates.return}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> ~${trip.budget.total.toLocaleString()} total
                </span>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {/* Budget breakdown pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { label: "Flights", value: trip.budget.flights, icon: "✈️" },
              { label: "Hotels", value: trip.budget.hotels, icon: "🏨" },
              { label: "Activities", value: trip.budget.activities, icon: "🎯" },
              { label: "Food", value: trip.budget.food, icon: "🍽️" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/60 dark:bg-white/10 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1">
                <span>{icon}</span>
                <span className="text-muted-foreground">{label}:</span>
                <span className="font-semibold">${value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {expanded && (
          <div className="p-4">
            {/* Summary */}
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{trip.summary}</p>

            {/* Tabs */}
            <Tabs defaultValue="itinerary" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-10 rounded-lg bg-muted p-0.5 mb-4">
                <TabsTrigger value="itinerary" className="rounded-md text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Itinerary
                </TabsTrigger>
                <TabsTrigger value="flights" className="rounded-md text-xs flex items-center gap-1">
                  <Plane className="w-3 h-3" /> Flights
                </TabsTrigger>
                <TabsTrigger value="hotels" className="rounded-md text-xs flex items-center gap-1">
                  <Hotel className="w-3 h-3" /> Hotels
                </TabsTrigger>
                <TabsTrigger value="attractions" className="rounded-md text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Places
                </TabsTrigger>
              </TabsList>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary">
                <div className="space-y-4">
                  {trip.itinerary.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Itinerary not available</p>
                  ) : (
                    trip.itinerary.map((day: any) => (
                      <div key={day.day} className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-ocean text-white text-xs font-bold flex items-center justify-center">
                            {day.day}
                          </span>
                          <span className="font-display font-semibold text-sm">{day.title}</span>
                        </div>
                        <div className="divide-y divide-border/50">
                          {day.activities?.map((act: any, i: number) => (
                            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                              <span className="text-xs text-muted-foreground font-mono w-12 shrink-0 mt-0.5">
                                {act.time}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{act.activity}</p>
                                {act.tip && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">💡 {act.tip}</p>
                                )}
                              </div>
                              {act.cost > 0 && (
                                <span className="text-xs text-muted-foreground shrink-0">${act.cost}</span>
                              )}
                              <ActivityBadge type={act.type} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Flights Tab */}
              <TabsContent value="flights">
                <div className="space-y-3">
                  {trip.flights.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No flights found</p>
                  ) : (
                    trip.flights.map((f: any, i: number) => (
                      <div key={i} className="border border-border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold">{f.airline}</span>
                            <Badge variant="secondary" className="text-xs">{f.flightNumber}</Badge>
                          </div>
                          <span className="font-display font-bold text-ocean text-lg">${f.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{f.departure}</span>
                          <span className="flex-1 border-t border-dashed border-border mx-2" />
                          <Plane className="w-3 h-3 text-ocean" />
                          <span className="flex-1 border-t border-dashed border-border mx-2" />
                          <span className="font-mono">{f.arrival}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span><Clock className="w-3 h-3 inline mr-1" />{f.duration}</span>
                          <span>{f.stops === 0 ? "Direct" : `${f.stops} stop(s)`}</span>
                          <span>{f.class}</span>
                        </div>
                        {f.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {f.amenities.map((a: string) => (
                              <span key={a} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                                <AmenityIcon amenity={a} /> {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Hotels Tab */}
              <TabsContent value="hotels">
                <div className="space-y-3">
                  {trip.hotels.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hotels found</p>
                  ) : (
                    trip.hotels.map((h: any, i: number) => (
                      <div key={i} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-display font-bold text-sm">{h.name}</h4>
                          <div className="text-right">
                            <span className="font-display font-bold text-ocean">${h.pricePerNight}</span>
                            <span className="text-xs text-muted-foreground">/night</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: h.stars || 0 }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 star fill-current" />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {h.rating?.toFixed(1)} · {h.reviewCount?.toLocaleString()} reviews
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {h.location}
                        </p>
                        <p className="text-xs text-muted-foreground">{h.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Attractions Tab */}
              <TabsContent value="attractions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trip.attractions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 col-span-2">No attractions found</p>
                  ) : (
                    trip.attractions.map((a: any, i: number) => (
                      <div key={i} className="border border-border rounded-xl p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-display font-bold text-sm">{a.name}</h4>
                          {a.price === 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">Free</Badge>
                          ) : (
                            <span className="text-sm font-bold text-ocean">${a.price}</span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs mb-1">{a.type}</Badge>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span><Clock className="w-3 h-3 inline mr-0.5" />{a.duration}</span>
                          <span>Best: {a.bestTime}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Citations */}
            {trip.citations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mb-2">
                  <Globe2 className="w-3 h-3" /> Sources
                </p>
                <div className="flex flex-wrap gap-1">
                  {trip.citations.slice(0, 5).map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ocean hover:underline flex items-center gap-0.5 bg-muted rounded px-1.5 py-0.5"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {new URL(url).hostname.replace("www.", "")}
                    </a>
                  ))}
                  {trip.citations.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{trip.citations.length - 5} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    transport: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    sightseeing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    food: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    hotel: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span className={`text-[10px] rounded-full px-1.5 py-0.5 shrink-0 ${colors[type] || colors["free"]}`}>
      {type}
    </span>
  );
}
