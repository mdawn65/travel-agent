export interface City {
  name: string;
  country: string;
  code: string; // IATA airport code
}

export const CITIES: City[] = [
  // Asia
  { name: "Tokyo", country: "Japan", code: "NRT" },
  { name: "Osaka", country: "Japan", code: "KIX" },
  { name: "Kyoto", country: "Japan", code: "KIX" },
  { name: "Seoul", country: "South Korea", code: "ICN" },
  { name: "Busan", country: "South Korea", code: "PUS" },
  { name: "Jeju", country: "South Korea", code: "CJU" },
  { name: "Beijing", country: "China", code: "PEK" },
  { name: "Shanghai", country: "China", code: "PVG" },
  { name: "Hong Kong", country: "China", code: "HKG" },
  { name: "Taipei", country: "Taiwan", code: "TPE" },
  { name: "Bangkok", country: "Thailand", code: "BKK" },
  { name: "Chiang Mai", country: "Thailand", code: "CNX" },
  { name: "Phuket", country: "Thailand", code: "HKT" },
  { name: "Singapore", country: "Singapore", code: "SIN" },
  { name: "Kuala Lumpur", country: "Malaysia", code: "KUL" },
  { name: "Bali", country: "Indonesia", code: "DPS" },
  { name: "Jakarta", country: "Indonesia", code: "CGK" },
  { name: "Manila", country: "Philippines", code: "MNL" },
  { name: "Hanoi", country: "Vietnam", code: "HAN" },
  { name: "Ho Chi Minh City", country: "Vietnam", code: "SGN" },
  { name: "Da Nang", country: "Vietnam", code: "DAD" },
  { name: "Mumbai", country: "India", code: "BOM" },
  { name: "New Delhi", country: "India", code: "DEL" },
  { name: "Maldives", country: "Maldives", code: "MLE" },
  // Europe
  { name: "London", country: "United Kingdom", code: "LHR" },
  { name: "Paris", country: "France", code: "CDG" },
  { name: "Rome", country: "Italy", code: "FCO" },
  { name: "Milan", country: "Italy", code: "MXP" },
  { name: "Venice", country: "Italy", code: "VCE" },
  { name: "Florence", country: "Italy", code: "FLR" },
  { name: "Barcelona", country: "Spain", code: "BCN" },
  { name: "Madrid", country: "Spain", code: "MAD" },
  { name: "Amsterdam", country: "Netherlands", code: "AMS" },
  { name: "Berlin", country: "Germany", code: "BER" },
  { name: "Munich", country: "Germany", code: "MUC" },
  { name: "Vienna", country: "Austria", code: "VIE" },
  { name: "Prague", country: "Czech Republic", code: "PRG" },
  { name: "Budapest", country: "Hungary", code: "BUD" },
  { name: "Lisbon", country: "Portugal", code: "LIS" },
  { name: "Athens", country: "Greece", code: "ATH" },
  { name: "Santorini", country: "Greece", code: "JTR" },
  { name: "Istanbul", country: "Turkey", code: "IST" },
  { name: "Zurich", country: "Switzerland", code: "ZRH" },
  { name: "Copenhagen", country: "Denmark", code: "CPH" },
  { name: "Stockholm", country: "Sweden", code: "ARN" },
  { name: "Oslo", country: "Norway", code: "OSL" },
  { name: "Helsinki", country: "Finland", code: "HEL" },
  { name: "Dublin", country: "Ireland", code: "DUB" },
  { name: "Edinburgh", country: "United Kingdom", code: "EDI" },
  { name: "Reykjavik", country: "Iceland", code: "KEF" },
  { name: "Dubrovnik", country: "Croatia", code: "DBV" },
  { name: "Warsaw", country: "Poland", code: "WAW" },
  // Americas
  { name: "New York", country: "United States", code: "JFK" },
  { name: "Los Angeles", country: "United States", code: "LAX" },
  { name: "San Francisco", country: "United States", code: "SFO" },
  { name: "Chicago", country: "United States", code: "ORD" },
  { name: "Miami", country: "United States", code: "MIA" },
  { name: "Las Vegas", country: "United States", code: "LAS" },
  { name: "Honolulu", country: "United States", code: "HNL" },
  { name: "Seattle", country: "United States", code: "SEA" },
  { name: "Boston", country: "United States", code: "BOS" },
  { name: "Washington DC", country: "United States", code: "IAD" },
  { name: "Toronto", country: "Canada", code: "YYZ" },
  { name: "Vancouver", country: "Canada", code: "YVR" },
  { name: "Mexico City", country: "Mexico", code: "MEX" },
  { name: "Cancun", country: "Mexico", code: "CUN" },
  { name: "Lima", country: "Peru", code: "LIM" },
  { name: "Buenos Aires", country: "Argentina", code: "EZE" },
  { name: "Rio de Janeiro", country: "Brazil", code: "GIG" },
  { name: "Sao Paulo", country: "Brazil", code: "GRU" },
  { name: "Bogota", country: "Colombia", code: "BOG" },
  { name: "Havana", country: "Cuba", code: "HAV" },
  // Africa & Middle East
  { name: "Dubai", country: "UAE", code: "DXB" },
  { name: "Abu Dhabi", country: "UAE", code: "AUH" },
  { name: "Doha", country: "Qatar", code: "DOH" },
  { name: "Cairo", country: "Egypt", code: "CAI" },
  { name: "Marrakech", country: "Morocco", code: "RAK" },
  { name: "Cape Town", country: "South Africa", code: "CPT" },
  { name: "Nairobi", country: "Kenya", code: "NBO" },
  { name: "Tel Aviv", country: "Israel", code: "TLV" },
  // Oceania
  { name: "Sydney", country: "Australia", code: "SYD" },
  { name: "Melbourne", country: "Australia", code: "MEL" },
  { name: "Auckland", country: "New Zealand", code: "AKL" },
  { name: "Queenstown", country: "New Zealand", code: "ZQN" },
  { name: "Fiji", country: "Fiji", code: "NAN" },
];

export function searchCities(query: string): City[] {
  if (!query || query.length < 1) return [];
  const lower = query.toLowerCase();
  return CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(lower) ||
      city.country.toLowerCase().includes(lower) ||
      city.code.toLowerCase().includes(lower)
  ).slice(0, 8);
}
