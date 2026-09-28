import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { GlobalNav } from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "Land Intelligence Platform",
  description:
    "Government, Researcher and Public/Citizen portals for land governance and land intelligence — one app, one server, one port.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <GlobalNav />
        {children}
      </body>
    </html>
  );
}
