import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ProfileProvider } from "@/context/ProfileContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["400", "600", "800"],
});

export const metadata: Metadata = {
  title: "CarbonFootprint | Smart Sustainability",
  description: "Understand, track, and reduce your carbon footprint with personalized insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Skip-to-content link for keyboard / screen reader users */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <ProfileProvider>
          <div id="main-content">
            {children}
          </div>
        </ProfileProvider>
      </body>
    </html>
  );
}
