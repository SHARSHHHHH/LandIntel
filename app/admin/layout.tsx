import type { Metadata } from "next";
import { AuthProvider } from "@/components/gov/auth-context";

export const metadata: Metadata = {
  title: "Administration — Land Intelligence Platform",
  description: "User, role and audit administration for the Land Intelligence Platform.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-portal="admin" className="min-h-screen bg-register-bg text-register-ink font-sans">
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
