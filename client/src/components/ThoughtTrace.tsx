import { useEffect, useRef } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface ThoughtStep {
  id: string;
  icon: string;
  label: string;
  detail?: string;
  status: "pending" | "active" | "done" | "error";
}

interface ThoughtTraceProps {
  steps: ThoughtStep[];
  isComplete: boolean;
}

export default function ThoughtTrace({ steps, isComplete }: ThoughtTraceProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const lastStep = containerRef.current.querySelector("[data-active='true']");
      lastStep?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [steps]);

  return (
    <div className="flex gap-3">
      {/* Agent avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-primary flex items-center justify-center shrink-0 mt-1">
        <span className="text-white text-xs">🧠</span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-card border border-border rounded-2xl rounded-tl-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agent Reasoning
          </span>
          {!isComplete && (
            <Loader2 className="w-3 h-3 text-ocean animate-spin" />
          )}
        </div>

        {/* Steps */}
        <div className="divide-y divide-border/50">
          {steps.map((step, i) => (
            <div
              key={`${step.id}-${i}`}
              data-active={step.status === "active"}
              className={`px-4 py-3 flex items-start gap-3 transition-all duration-300 ${
                step.status === "active"
                  ? "bg-primary/5"
                  : step.status === "done"
                  ? "opacity-80"
                  : step.status === "error"
                  ? "bg-red-50 dark:bg-red-900/10"
                  : "opacity-40"
              }`}
            >
              {/* Icon */}
              <span className="text-lg mt-0.5 shrink-0">{step.icon}</span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-body ${
                    step.status === "active"
                      ? "text-foreground font-medium"
                      : step.status === "done"
                      ? "text-muted-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
                    {step.detail}
                  </p>
                )}
              </div>

              {/* Status icon */}
              <div className="shrink-0 mt-0.5">
                {step.status === "active" && (
                  <Loader2 className="w-4 h-4 text-ocean animate-spin" />
                )}
                {step.status === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                {step.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Thinking animation at bottom */}
        {!isComplete && (
          <div className="px-4 py-2 border-t border-border/50">
            <div className="dot-loader">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
