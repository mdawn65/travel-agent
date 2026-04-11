"use client";

interface MapEmbedProps {
  places: { name: string; address: string }[];
  destination: string;
}

function buildMapUrl(places: { name: string; address: string }[], destination: string): string {
  if (places.length === 0) return "";
  if (places.length === 1) {
    const q = encodeURIComponent(`${places[0].name}, ${destination}`);
    return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
  }
  const waypoints = places
    .map((p) => encodeURIComponent(`${p.name}, ${p.address}`))
    .join("/");
  return `https://www.google.com/maps/dir/${waypoints}/?output=embed`;
}

export function MapLink({ placeName, destination }: { placeName: string; destination: string }) {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${placeName}, ${destination}`
  )}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium"
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
      Map
    </a>
  );
}

export default function MapEmbed({ places, destination }: MapEmbedProps) {
  if (places.length === 0) return null;
  const src = buildMapUrl(places, destination);
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mt-3">
      <iframe
        src={src}
        width="100%"
        height="250"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Route map"
      />
    </div>
  );
}
