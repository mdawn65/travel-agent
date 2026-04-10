import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Search } from "@shared/schema";
import { Plane, Hotel, MapPin, Sparkles, Globe2, Star, Clock, ArrowRight } from "lucide-react";

const POPULAR_DESTINATIONS = [
  { city: "Paris", country: "France", emoji: "🗼", desc: "City of lights & romance" },
  { city: "Tokyo", country: "Japan", emoji: "⛩️", desc: "Ancient meets ultra-modern" },
  { city: "Bali", country: "Indonesia", emoji: "🌴", desc: "Tropical paradise & culture" },
  { city: "New York", country: "USA", emoji: "🗽", desc: "The city that never sleeps" },
  { city: "Rome", country: "Italy", emoji: "🏛️", desc: "Eternal city of history" },
  { city: "Santorini", country: "Greece", emoji: "🫙", desc: "Clifftop sunsets & bluest sea" },
];

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
              Tell us where you're going. Our AI agent finds the best flights, accommodations, and tourist attractions — all arranged for you.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-3xl mx-auto">
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
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: Plane, label: "Flights" },
              { icon: Hotel, label: "Hotels" },
              { icon: MapPin, label: "Attractions" },
              { icon: Clock, label: "Instant Results" },
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
            <p className="text-muted-foreground">Three steps to your perfect trip</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Enter Your Trip", desc: "Tell us your origin, destination, dates, and how many people are traveling.", icon: MapPin },
              { step: "02", title: "AI Plans Everything", desc: "Our AI agent searches flights, hotels, and top attractions simultaneously.", icon: Sparkles },
              { step: "03", title: "Book & Go", desc: "Review curated options and book directly. Your adventure awaits.", icon: Plane },
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
        <p>AI-powered travel planning · Results are AI-generated suggestions</p>
      </footer>
    </div>
  );
}
