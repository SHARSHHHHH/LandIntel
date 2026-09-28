import { Activity, CheckCircle2, FileText, Database, Map } from 'lucide-react';

export function ResearchActivity() {
  const activities = [
    {
      id: 1,
      type: 'PROJECT',
      text: 'Created new research project: "Impact of Urban Expansion on Agricultural Land in District X"',
      time: '2 hours ago',
      icon: FolderIconMarker,
    },
    {
      id: 2,
      type: 'DATASET',
      text: 'Discovered and linked dataset: "District X Land Use and Land Cover (LULC) Sample Grid 2023"',
      time: 'Yesterday',
      icon: Database,
    },
    {
      id: 3,
      type: 'OUTPUT',
      text: 'Published policy brief: "Mitigating Agricultural Land Loss in Peri-Urban District X"',
      time: '3 days ago',
      icon: FileText,
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Recent Research Activity
        </h2>
        <span className="text-xs font-medium text-blue-600 cursor-pointer hover:underline">View All</span>
      </div>
      <div className="space-y-4">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 leading-relaxed">{act.text}</p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FolderIconMarker(props: any) {
  return <FileText {...props} />;
}
