import type { Metadata } from "next";
import { AuthProvider } from "@/components/gov/auth-context";
import { AreaProvider } from "@/components/gov/area-context";

export const metadata: Metadata = {
  title: "Area / Land Intelligence Overview",
  description: "Government & Policy portal for land governance evidence and GIS insight.",
};

export default function GovLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal="gov" className="min-h-screen bg-register-bg text-register-ink font-sans">
      <AuthProvider>
        <AreaProvider>{children}</AreaProvider>
      </AuthProvider>
    </div>
  );
}
