import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Preferences {
  style: string;
  budget: string;
  pace: string;
}

interface PreferenceSelectorProps {
  onComplete: (prefs: Preferences) => void;
  onSkip: () => void;
}

const STEPS = [
  {
    key: "style" as const,
    question: "What's your travel style?",
    options: [
      { value: "relaxation", emoji: "🏖️", label: "Relaxation", desc: "Beaches, spas, slow mornings" },
      { value: "adventure", emoji: "🎒", label: "Adventure", desc: "Hiking, diving, off the beaten path" },
      { value: "culture", emoji: "🏛️", label: "Culture", desc: "Museums, history, local traditions" },
      { value: "foodie", emoji: "🍽️", label: "Foodie", desc: "Street food, fine dining, local flavors" },
    ],
  },
  {
    key: "budget" as const,
    question: "What's your budget vibe?",
    options: [
      { value: "budget", emoji: "💰", label: "Budget", desc: "Hostels, street food, free activities" },
      { value: "mid-range", emoji: "💎", label: "Mid-range", desc: "Nice hotels, good restaurants" },
      { value: "luxury", emoji: "👑", label: "Luxury", desc: "5-star hotels, fine dining, VIP" },
    ],
  },
  {
    key: "pace" as const,
    question: "How do you like to travel?",
    options: [
      { value: "slow", emoji: "🐢", label: "Slow & deep", desc: "Few places, really soak it in" },
      { value: "packed", emoji: "🏃", label: "Pack it all in", desc: "See everything, sleep when you're home" },
    ],
  },
];

export default function PreferenceSelector({ onComplete, onSkip }: PreferenceSelectorProps) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>({ style: "", budget: "", pace: "" });

  const currentStep = STEPS[step];

  const selectOption = (value: string) => {
    const updated = { ...prefs, [currentStep.key]: value };
    setPrefs(updated);

    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    } else {
      setTimeout(() => onComplete(updated), 200);
    }
  };

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-ocean" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-1">Before we start...</h2>
        <p className="text-muted-foreground text-sm">
          Quick vibes check so I can plan the perfect trip for you
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-ocean" : i < step ? "w-4 bg-ocean/40" : "w-4 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="text-center">
        <h3 className="font-display text-xl font-semibold mb-4">{currentStep.question}</h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {currentStep.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => selectOption(opt.value)}
            className={`text-left rounded-xl border p-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
              prefs[currentStep.key] === opt.value
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="font-display font-semibold text-sm mt-2">{opt.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Skip */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground text-xs">
          Skip — just let me chat
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
