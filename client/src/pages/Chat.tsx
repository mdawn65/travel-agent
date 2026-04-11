import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Link2, ArrowRight, Plane, Hotel, MapPin, Globe2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThoughtTrace from "@/components/ThoughtTrace";
import TripCard from "@/components/TripCard";
import PreferenceSelector from "@/components/PreferenceSelector";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ThoughtStep {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done" | "error";
}

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

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "thought-trace" | "trip-card";
  content: string;
  thoughts?: ThoughtStep[];
  trip?: TripPlan;
  timestamp: Date;
}

interface Preferences {
  style: string;
  budget: string;
  pace: string;
}

// ─── Quick Prompts ──────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { emoji: "🏖️", label: "Beach getaway", prompt: "Plan a relaxing beach trip for next month, budget around $2000" },
  { emoji: "⛩️", label: "Tokyo adventure", prompt: "I want to explore Tokyo for 5 days, flying from San Francisco" },
  { emoji: "🍝", label: "Italian food tour", prompt: "Plan a foodie trip to Italy — Rome & Florence, 7 days" },
  { emoji: "🤷", label: "Surprise me!", prompt: "Surprise me with an amazing 5-day trip, budget $1500" },
];

// ─── Chat Page Component ────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState<ThoughtStep[]>([]);
  const [showPreferences, setShowPreferences] = useState(true);
  const [preferences, setPreferences] = useState<Preferences>({ style: "", budget: "", pace: "" });

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThoughts, scrollToBottom]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("🔌 Connected to Voyagr agent");
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log("🔌 Disconnected from agent");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "thinking_start":
          setIsThinking(true);
          setCurrentThoughts([]);
          break;

        case "thought":
          setCurrentThoughts((prev) => {
            const existing = prev.findIndex((s) => s.id === data.step.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = data.step;
              return updated;
            }
            return [...prev, data.step];
          });
          break;

        case "trip":
          // Add trip card message
          setMessages((prev) => [
            ...prev,
            {
              id: `trip-${Date.now()}`,
              role: "trip-card" as const,
              content: "",
              trip: data.trip,
              timestamp: new Date(),
            },
          ]);
          break;

        case "thinking_end":
          // Save thought trace as a message
          setMessages((prev) => {
            // Check if we already added a thought trace
            const lastThought = prev.find(m => m.role === "thought-trace" && Date.now() - m.timestamp.getTime() < 5000);
            if (lastThought) return prev;
            return [
              ...prev,
              {
                id: `thoughts-${Date.now()}`,
                role: "thought-trace" as const,
                content: "",
                thoughts: [...currentThoughts],
                timestamp: new Date(),
              },
            ];
          });
          setIsThinking(false);
          setCurrentThoughts([]);
          break;

        case "message":
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              role: data.role,
              content: data.content,
              timestamp: new Date(),
            },
          ]);
          setIsThinking(false);
          break;

        case "error":
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "assistant",
              content: `⚠️ ${data.message}`,
              timestamp: new Date(),
            },
          ]);
          setIsThinking(false);
          break;
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Send message
  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: msg,
        timestamp: new Date(),
      },
    ]);

    // Send via WebSocket
    wsRef.current.send(JSON.stringify({ message: msg, preferences }));

    setInput("");
    setShowPreferences(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePreferencesComplete = (prefs: Preferences) => {
    setPreferences(prefs);
    setShowPreferences(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-white px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg aria-label="Voyagr logo" width="32" height="32" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="2" />
              <path d="M10 18 Q18 8 26 18 Q18 28 10 18Z" fill="white" fillOpacity="0.9" />
              <circle cx="18" cy="18" r="3" fill="white" />
            </svg>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Voyagr</h1>
              <p className="text-white/60 text-xs font-body">AI Travel Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            <span className="text-white/60 text-xs font-body">
              {isConnected ? "Connected" : "Reconnecting..."}
            </span>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome state */}
          {messages.length === 0 && !showPreferences && (
            <WelcomeScreen onPromptSelect={sendMessage} />
          )}

          {/* Preference selector */}
          {messages.length === 0 && showPreferences && (
            <div className="max-w-2xl mx-auto">
              <PreferenceSelector onComplete={handlePreferencesComplete} onSkip={() => setShowPreferences(false)} />
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" && <UserBubble content={msg.content} />}
              {msg.role === "assistant" && <AssistantBubble content={msg.content} />}
              {msg.role === "thought-trace" && msg.thoughts && (
                <ThoughtTrace steps={msg.thoughts} isComplete={true} />
              )}
              {msg.role === "trip-card" && msg.trip && <TripCard trip={msg.trip} />}
            </div>
          ))}

          {/* Live thinking */}
          {isThinking && currentThoughts.length > 0 && (
            <ThoughtTrace steps={currentThoughts} isComplete={false} />
          )}

          {/* Typing indicator */}
          {isThinking && currentThoughts.length === 0 && (
            <div className="flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-ocean" />
              </div>
              <div className="dot-loader">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-4 shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Quick prompts (show when empty) */}
          {messages.length === 0 && !showPreferences && (
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.prompt)}
                  className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-sm rounded-full px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <span>{p.emoji}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your dream trip, or paste an Instagram/Threads link..."
                className="pr-10 h-12 rounded-xl bg-background border-border text-base"
                disabled={!isConnected || isThinking}
              />
              <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || !isConnected || isThinking}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-2">
            Powered by Perplexity Sonar · Web-grounded AI travel planning
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3">
        <p className="text-sm font-body whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-ocean" />
      </div>
      <div className="max-w-[85%] bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
        <p className="text-sm font-body text-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) {
  return (
    <div className="text-center py-16 space-y-8">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Globe2 className="w-10 h-10 text-ocean" />
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">Where to next?</h2>
        <p className="text-muted-foreground font-body max-w-md mx-auto">
          Tell me your dream trip, paste an Instagram link, or just say "surprise me" — I'll handle everything.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => onPromptSelect(p.prompt)}
            className="group flex items-center gap-3 bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-all card-hover"
          >
            <span className="text-2xl">{p.emoji}</span>
            <div>
              <div className="font-display font-semibold text-sm">{p.label}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{p.prompt}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        {[
          { icon: MessageCircle, label: "Natural Language" },
          { icon: Link2, label: "Instagram / Threads Links" },
          { icon: Plane, label: "Flights + Hotels" },
          { icon: MapPin, label: "Day-by-Day Itinerary" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <Icon className="w-3 h-3" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
