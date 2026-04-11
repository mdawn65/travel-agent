"use client";

import { useState, useCallback, useRef } from "react";
import { TravelFormInput, TravelPlan } from "@/types/travel";
import { parsePlan } from "@/lib/parsePlan";

type StreamingStatus = "idle" | "streaming" | "complete" | "error";

interface StreamingState {
  status: StreamingStatus;
  plan: TravelPlan | null;
  error: string | null;
}

export function useStreamingPlan() {
  const [state, setState] = useState<StreamingState>({
    status: "idle",
    plan: null,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (input: TravelFormInput) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "streaming", plan: null, error: null });

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = ""; // Buffer for incomplete SSE lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last line in buffer (it may be incomplete)
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith("data:")) {
        const data = buffer.trim().slice(5).trim();
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) accumulated += content;
          } catch {
            // ignore
          }
        }
      }

      if (!accumulated) {
        throw new Error("No content received from AI service");
      }

      const plan = parsePlan(accumulated);
      setState({ status: "complete", plan, error: null });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setState({ status: "idle", plan: null, error: null });
        return;
      }
      setState({
        status: "error",
        plan: null,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", plan: null, error: null });
  }, []);

  return { ...state, generate, cancel };
}
