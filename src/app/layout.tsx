import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * @description Import core providers and layout components
 */
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/context/AuthContext"; 
import { AETHER_CONFIG } from "@/lib/business-config";
import ClientLayout from "@/components/ClientLayout"; 

const inter = Inter({ subsets: ["latin"] });

/**
 * @description Global SEO Metadata - Configured for PWA and Social Sharing
 */
export const metadata: Metadata = {
  title: AETHER_CONFIG.METADATA.TITLE,
  description: AETHER_CONFIG.METADATA.DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
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
 * @description Viewport settings to ensure native mobile feel (Disable user scaling)
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
          {/* Handles PWA Service Worker background registration */}
          <ServiceWorkerRegistration />

          {/* ClientLayout manages conditional sidebar rendering based on routes */}
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}