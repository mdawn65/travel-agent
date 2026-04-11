"use client";

import { useState, useRef, useEffect } from "react";
import { searchCities, City } from "@/lib/cities";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  label,
  icon,
  autoFocus,
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<City[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    onChange(text);
    const matches = searchCities(text);
    setResults(matches);
    setIsOpen(matches.length > 0);
  };

  const handleSelect = (city: City) => {
    onChange(`${city.name}, ${city.country}`);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            const matches = searchCities(value);
            if (matches.length > 0) {
              setResults(matches);
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:bg-white/8 focus:outline-none transition-all text-gray-100 placeholder-gray-600 text-sm`}
        />
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl max-h-60 overflow-y-auto border border-gray-200">
          {results.map((city) => (
            <li key={`${city.code}-${city.name}`}>
              <button
                type="button"
                onClick={() => handleSelect(city)}
                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors flex items-center justify-between text-sm"
              >
                <span>
                  <span className="font-medium text-gray-900">{city.name}</span>
                  <span className="text-gray-500">, {city.country}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {city.code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
