import { NextResponse } from 'next/server';

// GET /api/geojson/sample - Sample GeoJSON for development/demo testing only
export async function GET() {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Sample District X Boundary',
          dataStatus: 'SAMPLE',
          category: 'administrative',
          state: 'Tamil Nadu',
          district: 'District X',
          provider: 'Sample Cartography Dept',
          description: 'DEMO ONLY: Sample polygon for verifying GeoJSON rendering on the GIS map.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [78.0, 21.0],
              [78.5, 21.0],
              [78.5, 21.5],
              [78.0, 21.5],
              [78.0, 21.0],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: 'Sample Built-up Expansion Zone',
          dataStatus: 'SAMPLE',
          category: 'land_use',
          state: 'Tamil Nadu',
          district: 'District X',
          provider: 'Sample Remote Sensing Lab',
          description: 'DEMO ONLY: Sample polygon for verifying built-up expansion overlay rendering.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [78.2, 21.1],
              [78.4, 21.1],
              [78.4, 21.3],
              [78.2, 21.3],
              [78.2, 21.1],
            ],
          ],
        },
      },
    ],
  };

  return NextResponse.json(geojson, { status: 200 });
}
