"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/gov/client";
import { useAreaContext } from "./area-context";
import type { GeographicUnitOut } from "@/lib/gov/types";

export function AreaSelector({ destination = "overview" }: { destination?: "overview" | "gis" }) {
  const router = useRouter();
  const { setSelectedArea } = useAreaContext();
  const [states, setStates] = useState<GeographicUnitOut[]>([]);
  const [districts, setDistricts] = useState<GeographicUnitOut[]>([]);
  const [stateId, setStateId] = useState<string>("");
  const [districtId, setDistrictId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listGeographies("state")
      .then((rows) => {
        setStates(rows);
        if (rows.length) setStateId(rows[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!stateId) return;
    setDistrictId("");
    api.listGeographies("district", stateId).then(setDistricts);
  }, [stateId]);

  const selectedState = states.find((s) => s.id === stateId);
  const selectedDistrict = districts.find((d) => d.id === districtId);

  return (
    <div className="max-w-2xl rounded-sm border border-register-line bg-register-panel p-6 shadow-card">
      <h2 className="font-serif-display text-lg font-semibold text-register-navy">Select an area</h2>
      <p className="mt-1 text-sm text-register-ink/60">
        Choose a state and district to open its Area Intelligence Overview.
      </p>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-[58px] animate-shimmer rounded-sm bg-register-line/40" />
          <div className="h-[58px] animate-shimmer rounded-sm bg-register-line/40" />
        </div>
      ) : states.length === 0 ? (
        <p className="mt-6 rounded-sm border border-dashed border-register-line px-4 py-6 text-center text-sm text-register-ink/50">
          No geographies are seeded yet. Run the backend seed script.
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">State</span>
              <select
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm transition-colors focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-register-ink/80">District</span>
              <select
                className="w-full rounded-sm border border-register-line bg-white px-3 py-2.5 text-sm transition-colors focus:border-register-navy focus:outline-none focus:ring-2 focus:ring-register-navy/15 disabled:bg-register-bg disabled:text-register-ink/40"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={districts.length === 0}
              >
                <option value="" disabled>
                  {districts.length ? "Choose a district" : "No districts available yet"}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedState && (
            <p className="mt-4 text-xs text-register-ink/50">
              <span className="text-register-ink/70">{selectedState.name}</span>
              {selectedDistrict && <> · <span className="text-register-ink/70">{selectedDistrict.name}</span></>}
            </p>
          )}
        </>
      )}

      <button
        disabled={!districtId}
        onClick={() => {
          if (selectedDistrict) setSelectedArea(selectedDistrict);
          router.push(`/gov/areas/${districtId}/${destination}`);
        }}
        className="mt-6 rounded-sm bg-register-navy px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-register-navy2 focus:outline-none focus:ring-2 focus:ring-register-navy/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-register-ink/20"
      >
        {destination === "gis" ? "Open GIS & Land Insights" : "Open Area Overview"}
      </button>
    </div>
  );
}
