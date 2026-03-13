"use client";

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AetherNotesFormatter from '@/components/aether/AetherNotesFormatter';
import OnboardingForm from '@/components/aether/OnboardingForm';
import AetherScanner from '@/components/aether/AetherScanner';
import { 
  Sparkles, BrainCircuit, Loader2, Globe, 
  Camera, Database, LogOut, WifiOff 
} from 'lucide-react';
import Link from 'next/link';

/**
 * @file page.tsx
 * @description Central Intelligence Dashboard. 
 * PERMANENT FIX: Accessibility attributes added to resolve Edge Tools diagnostics.
 */

interface AetherResult {
  content: string;
  provider: string;
  github_url: string | null;
  timestamp: string;
}

export default function AetherDashboard() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [result, setResult] = useState<AetherResult | null>(null);
  const [selectedLang, setSelectedLang] = useState("Bengali");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    handleStatus();
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const initializeSystem = async () => {
      try {
        const savedUser = localStorage.getItem('aether_user_meta');
        if (!savedUser) {
          setShowOnboarding(true);
          return;
        }
        const userMeta = JSON.parse(savedUser);
        if (userMeta?.is_onboarded) {
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("[INIT_ERROR]:", err);
      } finally {
        setIsChecking(false);
      }
    };
    initializeSystem();
  }, []);

  const handleLogout = () => {
    if (confirm("Reset academic session?")) {
      localStorage.removeItem('aether_user_meta');
      window.location.reload();
    }
  };

  const handleScanSuccess = (decodedText: string, imageData?: string) => {
    setPrompt(decodedText);
    if (imageData) setScannedImage(imageData);
    setIsScannerOpen(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isOffline) return;

    const savedUser = localStorage.getItem('aether_user_meta');
    const userMeta = savedUser ? JSON.parse(savedUser) : null;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/aether/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          image: scannedImage,
          userId: userMeta?.id || "anonymous",
          university: userMeta?.university || "BRUR",
          department: userMeta?.department || "Statistics",
          preferredLanguage: selectedLang
        }),
      });

      const data = await response.json();
      if (data.status === "Success") {
        setResult(data.payload);
        setScannedImage(null);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error("[GEN_ERROR]:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      
      {showOnboarding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="w-full max-w-md">
            <OnboardingForm onSuccess={() => setShowOnboarding(false)} />
          </div>
        </div>
      )}

      <div className={`transition-all duration-1000 ${showOnboarding ? 'blur-3xl pointer-events-none' : 'blur-0'}`}>
        
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <BrainCircuit size={24} />
              </div>
              <h1 className="text-xl font-black text-blue-700 uppercase italic">Aether Core</h1>
            </div>

            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                title="Go to Vault"
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-xl"
              >
                <Database size={16} /> <span className="hidden sm:block uppercase">Vault</span>
              </Link>
              
              {/* FIXED: Added title and aria-label to Logout button */}
              <button 
                onClick={handleLogout} 
                title="Logout and Reset Session"
                aria-label="Logout"
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut size={20} />
              </button>

              <div className="flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded-lg">
                <Globe size={16} className="text-gray-400" />
                {/* FIXED: Added title and id to select element */}
                <select 
                  id="language-selector"
                  title="Select Output Language"
                  value={selectedLang} 
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-sm font-bold text-gray-700 outline-none"
                >
                  <option value="Bengali">Bengali</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto pt-16 px-6 pb-20">
          <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-blue-100 border border-gray-100 mb-12">
            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your thesis problem..."
                  className="w-full p-10 bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white focus:ring-[20px] focus:ring-blue-50/50 rounded-[40px] min-h-[250px] text-lg font-medium outline-none transition-all resize-none pb-28"
                  required
                />
                {/* FIXED: Added title to scanner button */}
                <button
                  type="button"
                  title="Scan using Camera or Image"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute left-8 bottom-8 flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 rounded-2xl transition-all shadow-sm font-black text-[10px] tracking-widest uppercase"
                >
                  <Camera size={20} />
                  <span>Scan Data</span>
                </button>
              </div>

              <button
                type="submit"
                title="Generate Research Asset"
                disabled={isLoading || isOffline}
                className="w-full py-6 rounded-[28px] font-black text-white text-xl uppercase tracking-[0.2em] bg-blue-600 hover:bg-gray-900 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles /> <span>Run Analysis</span></>}
              </button>
            </form>
          </div>

          <section ref={resultRef}>
            {result && (
              <AetherNotesFormatter
                content={result.content}
                provider={result.provider}
                githubUrl={result.github_url}
                timestamp={result.timestamp}
              />
            )}
          </section>
        </main>
      </div>

      {isScannerOpen && (
        <AetherScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />
      )}
    </div>
  );
}