import { getDatabase, mapResource, mapProject, mapOpportunity } from '@/lib/research/db';
import { AppShell } from '@/components/research/layout/AppShell';
import { StatCard } from '@/components/research/dashboard/StatCard';
import { ResearchActivity } from '@/components/research/dashboard/ResearchActivity';
import { RecentResearch } from '@/components/research/dashboard/RecentResearch';
import { ActiveProjects } from '@/components/research/dashboard/ActiveProjects';
import { GISPreview } from '@/components/research/dashboard/GISPreview';
import { InnovationOpportunities } from '@/components/research/dashboard/InnovationOpportunities';
import { BookOpen, Database, FolderKanban, Map, ShieldCheck } from 'lucide-react';

export default async function DashboardPage() {
  let resourceCount = 2;
  let datasetCount = 2;
  let gisCount = 2;
  let projectCount = 1;
  let recentResources: any[] = [
    {
      id: 'res-1',
      title: 'Urban Expansion and Agricultural Land Conversion in Tamil Nadu: A 10-Year Spatial Analysis',
      authors: ['Dr. Rajesh Sharma', 'Priya Verma'],
      organization: 'Center for Land Governance Studies',
      resourceType: 'Research Paper',
      publicationYear: 2022,
      topic: 'Urban Sprawl & Agriculture',
      dataStatus: 'SAMPLE',
    },
    {
      id: 'res-2',
      title: 'Policy Frameworks for Peri-Urban Land Protection in India',
      authors: ['Ananya Sen', 'Karthik Rao'],
      organization: 'Institute of National Policy',
      resourceType: 'Government Policy Report',
      publicationYear: 2021,
      topic: 'Land Governance & Policy',
      dataStatus: 'SAMPLE',
    },
  ];
  let activeProjects: any[] = [
    {
      id: 'proj-1',
      title: 'Impact of Urban Expansion on Agricultural Land in District X',
      geographicScope: 'District X, Tamil Nadu',
      status: 'ACTIVE',
      institution: 'Indian Institute of Technology (IIT) - Demo Campus',
      createdAt: new Date('2024-01-15'),
    },
  ];
  let innovationOpportunities: any[] = [
    {
      id: 'opp-1',
      title: 'National Land Governance Hackathon 2026 - Smart Sprawl Challenge',
      type: 'hackathon',
      organizer: 'Ministry of Rural & Land Development (Demo)',
      deadline: new Date('2026-11-30'),
      status: 'OPEN',
    },
  ];

  try {
    const db = getDatabase();
    const rc = (db.prepare('SELECT COUNT(*) c FROM research_resources').get() as any).c;
    const dc = (db.prepare('SELECT COUNT(*) c FROM datasets').get() as any).c;
    const gc = (db.prepare('SELECT COUNT(*) c FROM gis_layers').get() as any).c;
    const pc = (db.prepare('SELECT COUNT(*) c FROM research_projects').get() as any).c;
    const rr = (
      db.prepare('SELECT * FROM research_resources ORDER BY created_at DESC LIMIT 3').all() as any[]
    ).map(mapResource);
    const ap = (
      db
        .prepare(`SELECT * FROM research_projects WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 2`)
        .all() as any[]
    ).map(mapProject);
    const io = (
      db
        .prepare(`SELECT * FROM innovation_opportunities WHERE status = 'OPEN' ORDER BY deadline ASC LIMIT 2`)
        .all() as any[]
    ).map(mapOpportunity);

    resourceCount = rc;
    datasetCount = dc;
    gisCount = gc;
    projectCount = pc;
    if (rr.length > 0) recentResources = rr;
    if (ap.length > 0) activeProjects = ap;
    if (io.length > 0) innovationOpportunities = io;
  } catch (error) {
    console.warn('Database connection unavailable during build/runtime, using sample fallback data:', error);
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
                Research & Academic Portal
              </span>
              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> SIH 26019 Platform
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, Dr. Rajesh Sharma
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              National Digital Platform for Research, Policy Innovation, and Evidence-Based Land Governance. Monitor your projects, explore verified datasets, and collaborate on spatial research.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/research/projects"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              + Create Research Project
            </a>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Research Resources"
            value={resourceCount}
            icon={BookOpen}
            description="Papers, reports & policy briefs"
            badge="Indexed"
          />
          <StatCard
            title="Datasets Explorer"
            value={datasetCount}
            icon={Database}
            description="LULC & socioeconomic data"
            badge="Verified"
          />
          <StatCard
            title="Active Projects"
            value={projectCount}
            icon={FolderKanban}
            description="Workspaces in progress"
            badge="Active"
          />
          <StatCard
            title="GIS Spatial Layers"
            value={gisCount}
            icon={Map}
            description="Administrative & thematic maps"
            badge="GeoJSON"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            <ActiveProjects projects={activeProjects} />
            <RecentResearch resources={recentResources} />
            <GISPreview />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <ResearchActivity />
            <InnovationOpportunities opportunities={innovationOpportunities} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
