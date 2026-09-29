# Land-record adapter architecture

The GIS & Land Insights UI (`app/gov/areas/[areaId]/gis/`,
`components/gov/gis/*`) never talks to a state's land-record system
directly. Every district/tehsil/village/parcel call goes through the
`LandRecordAdapter` interface in `types.ts`, resolved server-side by
`index.ts` and only ever consumed through the `/api/gov/gis/*` routes.

## Why

Every Indian state runs its own land-record system with its own field
names, numbering conventions and API shape (Karnataka's Bhoomi, Telangana's
Dharani, Maharashtra's Mahabhulekh, the DILRMP central stack, and so on). The
UI should not need to change when a new one is plugged in, and one state's
schema quirks (e.g. Telangana's encumbrance-status field, Tamil Nadu's patta
number) should not force every other state to carry a blank field.

## Current adapter

`sampleDataAdapter.ts` is the only adapter registered today. It backs:

- State -> District from the **real** seeded Census 2011 district dataset
  (`lib/gov/db.ts`, `geographic_units` table) -- 23 districts, 21 states.
- District -> Tehsil/Taluk/Mandal -> Village -> Parcel from **generated
  sample data**, clearly tagged `SAMPLE`/`DERIVED` end to end, for 5 pilot
  districts spanning three terminology zones (Tehsil: Jaipur RJ, Ludhiana
  PB · Taluk: Chennai TN, Bengaluru Urban KA · Mandal: Hyderabad TS).

Every parcel record intentionally varies its field set by state (see
`extraFields` in `sampleParcels.ts`) to prove the UI tolerates schema
variation rather than assuming one shape.

## Plugging in a real state adapter

1. Implement `LandRecordAdapter` in a new file, e.g. `karnatakaBhoomiAdapter.ts`
   or `telanganaDharaniAdapter.ts`, calling that state's real API/bulk
   extract and mapping its fields into the shared `ParcelDetail` /
   `SubDistrictDetail` / `GisLayerKey` GeoJSON shapes in `../types.ts`. Any
   state-specific field that doesn't fit the common shape goes into
   `extraFields` rather than widening the shared interface.
2. Register it in `index.ts`, e.g. keyed by state code:
   ```ts
   const ADAPTERS: Record<string, LandRecordAdapter> = {
     KA: karnatakaBhoomiAdapter,
     TS: telanganaDharaniAdapter,
   };
   export function getLandRecordAdapter(stateCode: string): LandRecordAdapter {
     return ADAPTERS[stateCode] ?? sampleDataAdapter;
   }
   ```
3. Set each returned dataset's `data_status` to `OFFICIAL` (or `HISTORICAL`)
   instead of `SAMPLE`/`DERIVED`, with the real source name and date -- the
   UI's provenance badges and the demo/sample banner read directly off this
   field, no UI change required.
4. Nothing in `app/gov/areas/[areaId]/gis/*` or `components/gov/gis/*` needs
   to change: those components only import `LandRecordAdapter`'s return
   types, never a specific adapter's internals.
