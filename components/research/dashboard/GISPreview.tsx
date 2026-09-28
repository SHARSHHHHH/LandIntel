import Link from 'next/link';
import { Map, Layers, ExternalLink } from 'lucide-react';

export function GISPreview() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-4 h-4 text-blue-600" />
            GIS & Spatial Workspace Preview
          </h2>
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">SAMPLE BOUNDARIES</span>
        </div>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Explore administrative boundaries, land-use conversion vectors, and socio-economic overlays for District X. Interactive spatial querying and layer superimposition available.
        </p>
        <div className="bg-slate-100 border border-slate-200 rounded-lg h-36 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <Layers className="w-8 h-8 text-blue-600 mb-2 relative z-10" />
          <span className="text-xs font-bold text-slate-700 relative z-10">Interactive MapLibre GIS Map Ready</span>
          <span className="text-[10px] text-slate-400 relative z-10 mt-0.5">District X, Tamil Nadu Spatial Layers</span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">2 Active GIS Layers Loaded</span>
        <Link href="/research/gis" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
          Open Full GIS Workspace <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
