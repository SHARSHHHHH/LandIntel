import type { Metadata } from "next";
import { Header } from "@/components/public/layout/header";
import { Footer } from "@/components/public/layout/footer";

export const metadata: Metadata = {
  title: "BhumiKosh — National Platform for Land Research & Policy",
  description:
    "A public knowledge platform for land governance in India. Explore research, policies, maps, and dashboards about land records, ULPIN, disputes, climate and urbanisation.",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      data-portal="public"
      className="min-h-screen flex flex-col font-sans bg-background text-foreground"
    >
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
