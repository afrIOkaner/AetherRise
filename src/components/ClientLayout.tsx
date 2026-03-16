"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  /**
   * @description Hide sidebar on the landing/login page to prevent UI overlap
   */
  const isLoginPage = pathname === "/";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Conditionally render Sidebar */}
      {!isLoginPage && <Sidebar />}

      {/* Adjust layout margin dynamically: ml-0 for Login, md:ml-72 for Dashboard */}
      <main className={`flex-1 min-h-screen relative overflow-x-hidden transition-all duration-300 ${isLoginPage ? 'ml-0' : 'ml-0 md:ml-72'}`}>
        <div className={isLoginPage ? "" : "p-4 md:p-8 lg:p-12"}>
          {children}
        </div>
      </main>
    </div>
  );
}