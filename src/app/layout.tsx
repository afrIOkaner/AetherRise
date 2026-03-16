import { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; 
import { Metadata, Viewport } from "next"; // Viewport 

// --- [SECTION: METADATA CONFIGURATION] ---
export const metadata: Metadata = {
  title: "AetherRise Aura Core",
  description: "Enterprise-grade AI Orchestrator",
  manifest: "/manifest.json", 
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AetherRise",
  },
};

// Next.js 14+  viewport definition for improved mobile responsiveness and control over scaling behavior. This configuration ensures that the app is optimized for various devices, providing a better user experience on smartphones and tablets by preventing unwanted zooming and ensuring the layout adapts to the screen size effectively.
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* AuthProvider wraps the app to manage global user state.
          The 'mounted' check inside AuthProvider will prevent SSR hydration issues.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}