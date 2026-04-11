"use client";

import { useState, useEffect } from "react";
import { LOADING_MESSAGES } from "@/lib/constants";

interface LoadingOverlayProps {
  onCancel: () => void;
}

export default function LoadingOverlay({ onCancel }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      {/* Orbiting rings */}
      <div className="relative w-28 h-28 mb-10">
        <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-pulse-ring" />
        <div className="absolute inset-3 rounded-full border border-purple-500/20 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
        <div className="absolute inset-6 rounded-full border border-blue-400/30 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-float">&#9992;</span>
        </div>
      </div>

      <p className="text-lg text-gray-300 font-medium mb-2 transition-opacity duration-700">
        {LOADING_MESSAGES[messageIndex]}
      </p>
      <p className="text-sm text-gray-600 mb-10">This may take 30-60 seconds</p>

      {/* Progress bar */}
      <div className="w-72 h-1 bg-white/5 rounded-full overflow-hidden mb-10">
        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-loading-bar" />
      </div>

      <button
        onClick={onCancel}
        className="px-6 py-2 text-gray-500 hover:text-gray-300 font-medium transition-colors text-sm border border-white/10 rounded-lg hover:border-white/20"
      >
        Cancel
      </button>
    </div>
  );
}
