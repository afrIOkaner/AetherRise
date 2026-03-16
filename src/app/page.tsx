"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import AetherNotesFormatter from '@/components/aether/AetherNotesFormatter';
import OnboardingForm from '@/components/aether/OnboardingForm';
import AetherScanner from '@/components/aether/AetherScanner';
import { AETHER_CONFIG } from '@/lib/business-config';
import {
  Sparkles, Loader2, Camera, LogOut, Mic, MicOff, Cpu
} from 'lucide-react';

// --- Types & Interfaces ---

interface AetherUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AetherResult {
  content: string;
  provider: string;
  timestamp: string;
  github_url: string | null; 
}

interface SpeechRecognitionResult {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [key: number]: {
    [key: number]: SpeechRecognitionResult;
  };
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

// Interface to resolve window.SpeechRecognition types without using 'any'
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

interface ISpeechRecognition {
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
}

export default function AetherDashboard() {
  const [user, setUser] = useState<AetherUser | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [result, setResult] = useState<AetherResult | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // Initialize and check auth session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser((session?.user as unknown as AetherUser) ?? null);
      
      if (session?.user) {
        const savedUser = localStorage.getItem('aether_user_meta');
        if (!savedUser) setShowOnboarding(true);
      }
      setIsChecking(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user as unknown as AetherUser) ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Network connectivity listener
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const handleLogout = async () => {
    if (confirm("Logout and clear academic session?")) {
      await supabase.auth.signOut();
      localStorage.removeItem('aether_user_meta');
      window.location.reload();
    }
  };

  const handleVoiceInput = () => {
    // Cast window to custom SpeechWindow interface to bypass 'any' linter rules
    const speechWin = window as unknown as SpeechWindow;
    const RecognitionConstructor = speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      return alert("Voice recognition is not supported in this browser.");
    }

    const recognition = new RecognitionConstructor();
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setPrompt((prev) => prev + " " + transcript);
    };

    recognition.start();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isOffline) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          userId: user?.id || "anonymous",
          university: AETHER_CONFIG.BRAND.INSTITUTION,
        }),
      });
      
      const data = await response.json();
      
      if (data.text) {
        setResult({ 
          content: data.text, 
          provider: data.model || "AetherCore", 
          timestamp: new Date().toISOString(),
          github_url: null 
        });
        
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-6 text-center">
        <div className="bg-blue-600 p-4 rounded-3xl text-white mb-6 shadow-2xl shadow-blue-200">
          <Cpu size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-2">{AETHER_CONFIG.BRAND.NAME}</h1>
        <p className="text-gray-500 mb-8">{AETHER_CONFIG.BRAND.TAGLINE}</p>
        <button 
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all text-gray-700"
        >
          <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fcfcfc]">
      {showOnboarding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4">
          <OnboardingForm onSuccess={() => setShowOnboarding(false)} />
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Cpu size={20} /></div>
            <h1 className="text-lg font-black uppercase tracking-tighter">{AETHER_CONFIG.BRAND.NAME}</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-12 px-6 pb-20">
        <div className="bg-white p-2 rounded-[42px] shadow-2xl shadow-blue-50 border border-gray-100">
          <form onSubmit={handleGenerate} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about Statistics..."
              className="w-full p-10 bg-gray-50/50 rounded-[38px] min-h-[300px] outline-none resize-none pb-32"
            />
            
            <div className="absolute left-8 bottom-8 flex gap-3">
              <button type="button" onClick={() => setIsScannerOpen(true)} className="p-3 bg-white border rounded-xl hover:text-blue-600 transition-colors" title="Scan Document">
                <Camera size={20} />
              </button>
              <button 
                type="button" 
                onClick={handleVoiceInput} 
                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border hover:text-blue-600'}`}
                title="Voice Input"
              >
                {isListening ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>

            <div className="absolute right-8 bottom-8">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Analyze</>}
              </button>
            </div>
          </form>
        </div>

        <div ref={resultRef}>
          {result && (
            <div className="mt-10">
              <AetherNotesFormatter 
                content={result.content}
                provider={result.provider}
                timestamp={result.timestamp}
                githubUrl={result.github_url}
              />
            </div>
          )}
        </div>
      </main>

      {isScannerOpen && (
        <AetherScanner 
          onScanSuccess={(text) => { setPrompt(text); setIsScannerOpen(false); }} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
}