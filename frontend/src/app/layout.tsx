import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "react-hot-toast";
import PWARegister from "@/components/shared/PWARegister";
import AppPrompt from "@/components/shared/AppPrompt";
import SmoothScroller from "@/components/shared/SmoothScroller";
import FloatingWidgets from "@/components/shared/FloatingWidgets";
import VisitorTracker from "@/components/VisitorTracker";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MYSURU TRAVEL CLUB | Explore the Extraordinary",
  description: "Discover breathtaking destinations with MYSURU TRAVEL CLUB. AI-powered trip planning, group adventures, and unforgettable experiences. Book your next adventure today!",
  keywords: "travel agency, adventure trips, group travel, India travel, AI travel planner, MYSURU TRAVEL CLUB",
  openGraph: {
    title: "MYSURU TRAVEL CLUB — Explore the Extraordinary",
    description: "AI-powered travel agency for unforgettable group adventures",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`light ${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-inter antialiased bg-[#f8fafc] text-[#0f172a] selection:bg-primary-500 selection:text-white" suppressHydrationWarning>
        <PWARegister />
        <AppPrompt />
        <SmoothScroller />
        <Suspense>
          <VisitorTracker />
        </Suspense>
        <FloatingWidgets />
        <div className="noise-overlay" />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(15,23,42,0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
