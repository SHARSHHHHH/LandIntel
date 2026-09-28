import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'National Digital Platform for Research & Land Governance',
  description: 'SIH 26019 Research & Academic Portal',
};

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased" data-portal="research">
      {children}
    </div>
  );
}
