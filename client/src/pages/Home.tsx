import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Search } from "@shared/schema";
import { Plane, Hotel, MapPin, Sparkles, Globe2, Clock, ArrowRight, Instagram, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const POPULAR_DESTINATIONS = [
  { city: "Paris", country: "France", emoji: "🗼", desc: "City of lights & romance" },
  { city: "Tokyo", country: "Japan", emoji: "⛩️", desc: "Ancient meets ultra-modern" },
  { city: "Bali", country: "Indonesia", emoji: "🌴", desc: "Tropical paradise & culture" },
  { city: "New York", country: "USA", emoji: "🗽", desc: "The city that never sleeps" },
  { city: "Rome", country: "Italy", emoji: "🏛️", desc: "Eternal city of history" },
  { city: "Santorini", country: "Greece", emoji: "🫙", desc: "Clifftop sunsets & bluest sea" },
];

const STYLE_EMOJI: Record<string, string> = {
  adventure: "🧗",
  luxury: "✨",
  cultural: "🏛️",
  beach: "🏖️",
  foodie: "🍜",
  urban: "🌆",
};

// ─── Social Post Feed Panel ──────────────────────────────────────────────────
const VIBE_EXAMPLES = [
  "Beach sunsets, street food, ancient temples",
  "Ski mountains, cozy chalets, apres-ski",
  "Hidden cafes, art galleries, slow travel",
  "Jungle trekking, wildlife, off the beaten path",
  "Rooftop bars, fashion week, fine dining",
];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
  X: "bg-black",
  TikTok: "bg-black",
  Blog: "bg-ocean",
};

function PostCard({ post, onUse }: { post: any; onUse: (dest: string) => void }) {
  const platformColor = PLATFORM_COLORS[post.platform] || "bg-gray-700";
  return (
    <div className="bg-white/10 rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors">
      {/* Platform bar */}
      <div className={`${platformColor} px-3 py-1.5 flex items-center justify-between`}>
        <span className="text-white text-xs font-semibold">{post.platform}</span>
        {post.author && <span className="text-white/70 text-xs">{post.author}</span>}
      </div>
      {/* Image context (visual placeholder) */}
      <div className="bg-white/5 px-3 py-2 text-white/40 text-xs italic min-h-[36px] flex items-center gap-1.5">
        <MapPin className="w-3 h-3 shrink-0" />
        {post.imageContext || post.location || "Travel photo"}
      </div>
      {/* Caption */}
      <div className="px-3 py-2">
        <p className="text-white/80 text-xs leading-relaxed line-clamp-3">{post.caption}</p>
        {post.location && (
          <p className="text-white/40 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{post.location}
          </p>
        )}
        {post.likes && (
          <p className="text-white/30 text-xs mt-0.5">{post.likes} likes</p>
        )}
      </div>
      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-white/50 hover:text-white underline underline-offset-2 flex-1 truncate"
        >
          View post
        </a>
        {post.destination && (
          <button
            onClick={() => onUse(post.destination)}
            className="text-xs bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full transition-colors shrink-0"
          >
            Go here
          </button>
        )}
      </div>
    </div>
  );
}

function VibeInferencePanel({ onDestinationFound }: { onDestinationFound: (dest: string) => void }) {
  const [styleInput, setStyleInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);
  const { toast } = useToast();

  const inferMutation = useMutation({
    mutationFn: async (input: string) => {
      const res = await apiRequest("POST", "/api/infer-destination", { styleInput: input });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      if (!data.posts?.length && !data.destination) {
        toast({ title: "No results found", description: "Try a different travel style description.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Search failed", description: "Try again with different keywords.", variant: "destructive" });
    },
  });

  const handleInfer = () => {
    const input = styleInput.trim();
    if (!input) {
      toast({ title: "Describe your vibe", description: "What kind of trip excites you?", variant: "destructive" });
      return;
    }
    setResult(null);
    inferMutation.mutate(input);
  };

  const tryExample = (ex: string) => {
    setStyleInput(ex);
    setResult(null);
    inferMutation.mutate(ex);
  };

  return (
    <div className="mt-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-full flex items-center justify-between px-4 py-3 text-white/80 hover:text-white transition-colors text-sm"
        data-testid="button-toggle-vibe"
      >
        <span className="flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          <span className="font-medium">Get inspired — search Instagram & X by travel vibe</span>
          <span className="text-white/50 text-xs">(optional)</span>
        </span>
        {showPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showPanel && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-3">
          <p className="text-white/60 text-xs">
            Describe your travel vibe — Perplexity searches real Instagram and X posts matching your style, so you can get inspired and pick a destination.
          </p>

          {/* Example chips */}
          <div className="flex flex-wrap gap-1.5">
            {VIBE_EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => tryExample(ex)}
                disabled={inferMutation.isPending}
                className="text-xs bg-white/10 hover:bg-white/20 text-white/70 hover:text-white px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
                data-testid={`chip-${ex.slice(0,10).replace(/\s+/g,"-").toLowerCase()}`}
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              data-testid="input-style-vibe"
              value={styleInput}
              onChange={e => setStyleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInfer()}
              placeholder="e.g. beach cafes, hammock views, fresh coconuts..."
              className="bg-white/10 border-white/30 text-white placeholder:text-white/40 h-10 text-sm flex-1"
            />
            <Button
              data-testid="button-infer-vibe"
              onClick={handleInfer}
              disabled={inferMutation.isPending}
              className="bg-amber-400 hover:bg-amber-300 text-amber-900 h-10 px-4 shrink-0"
            >
              {inferMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
          </div>

          {inferMutation.isPending && (
            <p className="text-white/50 text-xs text-center animate-pulse">Searching Instagram & X for your travel vibe...</p>
          )}

          {result && (
            <div className="space-y-3">
              {/* Destination recommendation */}
              {result.destination && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/50 text-xs mb-1.5 uppercase tracking-wide font-semibold">AI Destination Pick</p>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-display font-bold text-white">{result.destination}</p>
                      {result.reasoning && <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{result.reasoning}</p>}
                      {result.alternatives?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          <span className="text-white/30 text-xs">Also:</span>
                          {result.alternatives.map((alt: string) => (
                            <button
                              key={alt}
                              onClick={() => onDestinationFound(alt)}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white/60 hover:text-white px-2 py-0.5 rounded-full transition-colors"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      data-testid="button-use-inferred-destination"
                      size="sm"
                      onClick={() => onDestinationFound(result.destination)}
                      className="bg-amber-400 hover:bg-amber-300 text-amber-900 text-xs h-8 px-3 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Use this
                    </Button>
                  </div>
                </div>
              )}

              {/* Social post feed */}
              {result.posts?.length > 0 ? (
                <div>
                  <p className="text-white/40 text-xs mb-2 uppercase tracking-wide font-semibold">Posts matching your vibe</p>
                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                    {result.posts.map((post: any, i: number) => (
                      <PostCard key={i} post={post} onUse={onDestinationFound} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-xs text-center">No social posts found — try a different vibe description.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    travelers: 1,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/searches", data);
      return res.json() as Promise<Search>;
    },
    onSuccess: (search) => {
      setLocation(`/results/${search.id}`);
    },
    onError: () => {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin.trim() || !form.destination.trim()) {
      toast({ title: "Missing fields", description: "Please enter both origin and destination.", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const selectDestination = (city: string) => {
    setForm(f => ({ ...f, destination: city }));
    // Auto-scroll to form
    document.getElementById("search-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative gradient-hero text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 pb-10">
          {/* Nav */}
          <nav className="flex items-center justify-between mb-14">
            <div className="flex items-center gap-3">
              <svg aria-label="Voyagr logo" width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="2"/>
                <path d="M10 18 Q18 8 26 18 Q18 28 10 18Z" fill="white" fillOpacity="0.9"/>
                <circle cx="18" cy="18" r="3" fill="white"/>
              </svg>
              <span className="font-display text-2xl font-bold tracking-tight">Voyagr</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-body">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Perplexity Sonar</span>
            </div>
          </nav>

          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Your Next Adventure,<br />
              <span className="text-amber-300">Planned in Seconds</span>
            </h1>
            <p className="font-body text-white/75 text-lg max-w-xl mx-auto">
              Tell us where you're going — or let AI figure it out from your Instagram. Flights, hotels, a day-by-day itinerary, and live disruption alerts.
            </p>
          </div>

          {/* Search Form */}
          <div id="search-form" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm font-medium flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5" /> Departing From
                  </Label>
                  <Input
                    data-testid="input-origin"
                    value={form.origin}
                    onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                    placeholder="e.g. New York, London, KUL..."
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25 focus:border-white/60 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Destination
                  </Label>
                  <Input
                    data-testid="input-destination"
                    value={form.destination}
                    onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                    placeholder="e.g. Paris, Tokyo, Bali..."
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:bg-white/25 focus:border-white/60 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm font-medium">Departure Date</Label>
                  <Input
                    data-testid="input-departure"
                    type="date"
                    value={form.departureDate}
                    onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white focus:bg-white/25 focus:border-white/60 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm font-medium">Return Date</Label>
                  <Input
                    data-testid="input-return"
                    type="date"
                    value={form.returnDate}
                    onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white focus:bg-white/25 focus:border-white/60 h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/90 text-sm font-medium">Travelers</Label>
                  <Input
                    data-testid="input-travelers"
                    type="number"
                    min={1}
                    max={20}
                    value={form.travelers}
                    onChange={e => setForm(f => ({ ...f, travelers: parseInt(e.target.value) || 1 }))}
                    className="bg-white/20 border-white/30 text-white focus:bg-white/25 focus:border-white/60 h-11"
                  />
                </div>
              </div>

              <Button
                data-testid="button-search"
                type="submit"
                disabled={mutation.isPending}
                className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold text-base rounded-xl transition-all"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="dot-loader"><span/><span/><span/></div>
                    Planning your trip...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Plan My Trip
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Social inference panel */}
            <VibeInferencePanel onDestinationFound={(dest) => setForm(f => ({ ...f, destination: dest }))} />
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: Plane, label: "Flights" },
              { icon: Hotel, label: "Hotels via Trivago" },
              { icon: MapPin, label: "Day-by-Day Itinerary" },
              { icon: Clock, label: "Disruption Alerts" },
              { icon: Instagram, label: "Social Intake" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/10 rounded-full px-4 py-1.5 text-sm text-white/80">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-center gap-2 mb-2">
          <Globe2 className="w-5 h-5 text-ocean" />
          <span className="text-sm font-semibold text-ocean uppercase tracking-wider">Popular Destinations</span>
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground mb-8">Where will you go next?</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {POPULAR_DESTINATIONS.map(dest => (
            <button
              key={dest.city}
              data-testid={`card-destination-${dest.city.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => selectDestination(dest.city)}
              className="group text-left rounded-2xl border border-border bg-card p-5 card-hover cursor-pointer hover:border-primary/40 transition-colors"
            >
              <div className="text-3xl mb-3">{dest.emoji}</div>
              <div className="font-display text-lg font-bold text-foreground">{dest.city}</div>
              <div className="text-sm text-muted-foreground mb-1">{dest.country}</div>
              <div className="text-xs text-muted-foreground">{dest.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-2">How Voyagr Works</h2>
            <p className="text-muted-foreground">From zero to full trip plan — you barely lift a finger</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Drop a Hint", desc: "Enter origin + destination, or paste your Instagram URL and let AI infer where you should go.", icon: Instagram },
              { step: "02", title: "AI Plans", desc: "Parallel agents search flights, Trivago hotels, and top attractions simultaneously.", icon: Sparkles },
              { step: "03", title: "Itinerary Built", desc: "A full day-by-day plan with meals, timing, and total budget estimate is generated for you.", icon: MapPin },
              { step: "04", title: "Live Alerts", desc: "Disruption agents monitor your route and surface alternatives if something changes.", icon: Clock },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="bg-card rounded-2xl p-6 border border-border relative overflow-hidden">
                <div className="absolute top-4 right-4 font-display text-5xl font-bold text-border leading-none">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-ocean" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg aria-label="Voyagr logo" width="20" height="20" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 18 Q18 8 26 18 Q18 28 10 18Z" fill="currentColor" fillOpacity="0.7"/>
            <circle cx="18" cy="18" r="3" fill="currentColor"/>
          </svg>
          <span className="font-display font-bold">Voyagr</span>
        </div>
        <p>AI-powered travel planning · Results grounded by Perplexity Sonar with Trivago</p>
      </footer>
    </div>
  );
}
