import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/** * @description Import Sidebar and SW components from the root components folder 
 */
import Sidebar from "@/components/Sidebar"; 
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/context/AuthContext"; 
import { AETHER_CONFIG } from "@/lib/business-config";

const inter = Inter({ subsets: ["latin"] });

/**
 * @description Global Metadata - Updated with your specific icon filenames
 */
export const metadata: Metadata = {
  title: AETHER_CONFIG.METADATA.TITLE,
  description: AETHER_CONFIG.METADATA.DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    // Matches your filename: icon-512x512.png
    apple: "/icon-512x512.png", 
    icon: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: AETHER_CONFIG.BRAND.NAME,
  },
};

/**
 * @description Viewport settings for a native PWA feel on mobile devices
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Background logic for PWA Service Worker */}
          <ServiceWorkerRegistration />

          <div className="flex min-h-screen bg-gray-50">
            {/* Navigation Sidebar */}
            <Sidebar />

            {/* Main content area: ml-72 ensures it stays to the right of the sidebar */}
            <main className="flex-1 ml-72 min-h-screen relative overflow-x-hidden">
              <div className="p-4 md:p-8 lg:p-12">
                {children}
              </div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}