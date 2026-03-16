"use client";

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AetherNotesFormatter from '@/components/aether/AetherNotesFormatter';
import OnboardingForm from '@/components/aether/OnboardingForm';
import AetherScanner from '@/components/aether/AetherScanner';
import { AETHER_CONFIG } from '@/lib/business-config'; // Goal: Centralized branding
import {
  Sparkles, BrainCircuit, Loader2, Globe,
  Camera, Database, LogOut, Mic, MicOff, Download, WifiOff, Cpu
} from 'lucide-react';
import Link from 'next/link';

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
  const [isListening, setIsListening] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  // --- Goal 21: Real-time Connectivity Monitoring ---
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

  // --- Goal 13: PWA Installation Handler ---
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
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
        setShowOnboarding(!userMeta?.is_onboarded);
      } catch (err) {
        console.error("[INIT_ERROR]:", err);
      } finally {
        setIsChecking(false);
      }
    };
    initializeSystem();
  }, []);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support Voice Recognition.");

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang === "Bengali" ? "bn-BD" : "en-US";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => prev + " " + transcript);
    };
    recognition.start();
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogout = () => {
    if (confirm("Reset academic session and clear local cache?")) {
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          image: scannedImage,
          userId: userMeta?.id || "anonymous",
          university: AETHER_CONFIG.BRAND.INSTITUTION,
          department: AETHER_CONFIG.BRAND.DEPARTMENT,
        }),
      });

      const data = await response.json();
      if (data.text) {
        setResult({
          content: data.text,
          provider: data.model || "AetherCore",
          github_url: null,
          timestamp: new Date().toISOString()
        });
        setScannedImage(null);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
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
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booting Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fcfcfc]">
      {/* Offline Alert */}
      {isOffline && (
        <div className="bg-red-600 text-white text-center text-[10px] font-bold py-2 uppercase tracking-widest flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <WifiOff size={14} /> Connection Lost. PWA Offline Mode Active.
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4">
          <div className="w-full max-w-md">
            <OnboardingForm onSuccess={() => setShowOnboarding(false)} />
          </div>
        </div>
      )}

      <div className={`transition-all duration-700 ${showOnboarding ? 'blur-2xl scale-95 pointer-events-none' : 'blur-0 scale-100'}`}>
        {/* --- DYNAMIC HEADER --- */}
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Cpu size={24} />
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none">
                  {AETHER_CONFIG.BRAND.NAME}
                </h1>
                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                  {AETHER_CONFIG.BRAND.DEPARTMENT} Core
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {deferredPrompt && (
                <button onClick={installApp} className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100 transition-transform hover:scale-105">
                  <Download size={14} /> Install App
                </button>
              )}

              <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                <Database size={16} /> <span className="hidden sm:block">VAULT</span>
              </Link>

              <div className="flex items-center gap-2 bg-gray-50 border px-3 py-2 rounded-xl">
                <Globe size={14} className="text-gray-400" />
                <select
                  aria-label="Select Language"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-[11px] font-black text-gray-700 outline-none uppercase cursor-pointer"
                >
                  <option value="Bengali">Bengali</option>
                  <option value="English">English</option>
                </select>
              </div>

              <button onClick={handleLogout} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* --- ENGINE INTERFACE --- */}
        <main className="max-w-4xl mx-auto pt-12 px-6 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Hello, Statistician.</h2>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest italic border-b border-blue-50 inline-block pb-1">
              Optimized for {AETHER_CONFIG.BRAND.INSTITUTION}
            </p>
          </div>

          <div className="bg-white p-2 rounded-[42px] shadow-2xl shadow-blue-50 border border-gray-100">
            <form onSubmit={handleGenerate} className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste complex math, stats problems, or ask for research summaries..."
                className="w-full p-10 bg-gray-50/50 rounded-[38px] min-h-[320px] text-lg font-medium outline-none transition-all resize-none pb-32 focus:bg-white"
                required
              />

              <div className="absolute left-8 bottom-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white border border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600 rounded-2xl transition-all shadow-sm font-black text-[10px] tracking-widest uppercase"
                >
                  <Camera size={18} /> <span>Scan Docs</span>
                </button>

                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`p-3.5 rounded-2xl transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                  aria-label="Voice Input"
                >
                  {isListening ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>

              <div className="absolute right-8 bottom-8">
                <button
                  type="submit"
                  disabled={isLoading || isOffline}
                  className="px-10 py-4 rounded-2xl font-black text-white text-xs uppercase tracking-widest bg-blue-600 hover:bg-gray-900 shadow-xl shadow-blue-200 transition-all flex items-center gap-3 disabled:bg-gray-200 disabled:shadow-none"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> <span>Analyze</span></>}
                </button>
              </div>

              {scannedImage && (
                <div className="absolute right-8 bottom-28 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg relative">
                    <img src={scannedImage} alt="Scanned Asset" className="w-full h-full object-cover" />
                    <button onClick={() => setScannedImage(null)} className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold uppercase">Clear</button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* --- RESULTS AREA --- */}
          <section ref={resultRef} className="mt-12">
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