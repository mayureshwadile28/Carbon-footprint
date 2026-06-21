"use client";

import dynamic from "next/dynamic";

// Dynamically import the client home page with SSR disabled to prevent all hydration mismatches
const HomeClient = dynamic(() => import("@/components/HomeClient"), {
  ssr: false,
  loading: () => <main style={{ minHeight: "100vh" }}></main>
});

export default function Home() {
  return <HomeClient />;
}
