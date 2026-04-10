import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, MapPin, ArrowLeft, Clock, Star, Users, Calendar, DollarSign, Wifi, Coffee, Utensils, Wind, Zap, Globe2, Info } from "lucide-react";
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
    { icon: Hotel, label: "Finding accommodations..." },
    { icon: MapPin, label: "Discovering attractions..." },
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center max-w-md">
        {/* Animated globe */}
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
                  ? "text-muted-foreground line-through"
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
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">Our AI is arranging the best options for you...</p>
      </div>
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
  return (
    <div
      data-testid={`card-hotel-${hotel.name?.replace(/\s+/g, '-').toLowerCase()}`}
      className="bg-card border border-border rounded-2xl overflow-hidden card-hover"
    >
      {/* Color banner based on stars */}
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
          onClick={() => window.open(`https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name)}`, "_blank", "noopener")}
        >
          Book on Booking.com
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

  try { flights = JSON.parse(search.flightsData || "{}").flights || []; } catch {}
  try { accommodations = JSON.parse(search.accommodationsData || "{}").accommodations || []; } catch {}
  try { attractions = JSON.parse(search.attractionsData || "{}").attractions || []; } catch {}
  try { summaryData = JSON.parse(search.summary || "{}"); } catch {}

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
        {/* Summary */}
        {summaryData?.summary && <SummaryPanel summaryData={summaryData} search={search} />}

        {/* Tabs */}
        <Tabs defaultValue="flights" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-12 rounded-xl bg-muted p-1">
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
              <span className="text-sm text-muted-foreground">{accommodations.length} options found</span>
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

        {/* Sources */}
        {summaryData?.sources?.length > 0 && (
          <div className="mt-8 p-5 bg-card border border-border rounded-2xl">
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
              <Globe2 className="w-3.5 h-3.5" />
              Sources from Perplexity Search
            </h3>
            <ul className="space-y-1.5">
              {summaryData.sources.map((url: string, i: number) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-ocean hover:underline break-all"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/60 rounded-xl border border-border text-xs text-muted-foreground text-center">
          <Info className="w-3.5 h-3.5 inline mr-1 mb-0.5" />
          Results are web-grounded by Perplexity Sonar AI. Prices and availability may vary — always verify with official booking sites before purchasing.
        </div>
      </div>
    </div>
  );
}
