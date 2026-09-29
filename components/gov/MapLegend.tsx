import type { GisLayerKey } from "@/lib/gov/gis/types";

interface LegendEntry {
  color: string;
  label: string;
}

const ZONE_LEGEND: LegendEntry[] = [
  { color: "#8a9a5b", label: "Agricultural" },
  { color: "#b8862b", label: "Urban / built-up" },
  { color: "#3c6b4a", label: "Forest / uncultivable" },
  { color: "#2e6f9e", label: "Water body" },
];

const SAMPLE_LEGEND: Record<GisLayerKey, LegendEntry> = {
  parcels: { color: "#152238", label: "Land parcel (sample)" },
  landuse: { color: "#8a9a5b", label: "Land use (sample)" },
  governmentLand: { color: "#5b6b8a", label: "Government land (sample)" },
  roads: { color: "#6b6259", label: "Road (sample)" },
  water: { color: "#2e6f9e", label: "Water body (sample)" },
  disputed: { color: "#b0392f", label: "Disputed parcel (sample)" },
};

export function MapLegend({ showZones, showOffices, showLocation, sampleLayers }: {
  showZones: boolean;
  showOffices: boolean;
  showLocation: boolean;
  sampleLayers?: Set<GisLayerKey>;
}) {
  const hasSampleLayers = sampleLayers && sampleLayers.size > 0;
  if (!showZones && !showOffices && !showLocation && !hasSampleLayers) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] max-w-[200px] rounded-sm border border-register-line bg-white/95 p-3 text-xs shadow-sm backdrop-blur-sm">
      <p className="mb-1.5 font-semibold text-register-navy">Legend</p>
      <div className="space-y-1">
        {showZones &&
          ZONE_LEGEND.map((entry) => (
            <div key={entry.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-register-ink/70">{entry.label}</span>
            </div>
          ))}
        {showOffices && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: "#A8752A" }} />
            <span className="text-register-ink/70">District headquarters</span>
          </div>
        )}
        {showLocation && (
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: "#2E5F8A" }} />
            <span className="text-register-ink/70">Your device location</span>
          </div>
        )}
        {hasSampleLayers &&
          Array.from(sampleLayers!).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm border border-black/10"
                style={{ backgroundColor: SAMPLE_LEGEND[key].color }}
              />
              <span className="text-register-ink/70">{SAMPLE_LEGEND[key].label}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
