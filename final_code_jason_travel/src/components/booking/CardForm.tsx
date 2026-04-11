"use client";

import { useState } from "react";
import { CardInfo } from "@/types/travel";

interface CardFormProps {
  onSubmit: (card: CardInfo) => void;
  onBack: () => void;
  total: number;
}

export default function CardForm({ onSubmit, onBack, total }: CardFormProps) {
  const [card, setCard] = useState<CardInfo>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const isValid =
    card.cardNumber.replace(/\s/g, "").length === 16 &&
    card.expiry.length === 5 &&
    card.cvc.length >= 3 &&
    card.name.trim().length > 0;

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-100 mb-1 text-center">Payment Details</h2>
      <p className="text-gray-500 text-center mb-8 text-sm">
        Total: <span className="font-bold text-white">${total.toLocaleString()}</span>
      </p>

      {/* Card visual */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white shadow-2xl shadow-purple-500/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative">
          <div className="flex justify-between items-start mb-8">
            <div className="w-10 h-7 bg-yellow-400/90 rounded-md shadow-sm" />
            <span className="text-sm font-bold opacity-80 tracking-widest">VISA</span>
          </div>
          <p className="font-mono text-xl tracking-[0.2em] mb-6">
            {card.cardNumber || "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022"}
          </p>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-[10px] opacity-50 uppercase tracking-wider">Card Holder</p>
              <p className="font-medium tracking-wide">{card.name || "YOUR NAME"}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] opacity-50 uppercase tracking-wider">Expires</p>
              <p className="font-medium">{card.expiry || "MM/YY"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Card Number</label>
          <input
            type="text"
            value={card.cardNumber}
            onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
            placeholder="1234 5678 9012 3456"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none text-gray-100 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Cardholder Name</label>
          <input
            type="text"
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none text-gray-100 text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Expiry</label>
            <input
              type="text"
              value={card.expiry}
              onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              placeholder="MM/YY"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none text-gray-100 font-mono text-sm"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">CVC</label>
            <input
              type="text"
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="123"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none text-gray-100 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-3 mt-4 text-center border-amber-500/20">
        <p className="text-xs text-amber-400/70">This is a demo. No real charges will be made.</p>
      </div>

      <div className="flex gap-3 justify-center mt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-white/10 text-gray-400 rounded-xl font-semibold hover:bg-white/5 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onSubmit(card)}
          disabled={!isValid}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20"
        >
          Pay ${total.toLocaleString()}
        </button>
      </div>
    </div>
  );
}
