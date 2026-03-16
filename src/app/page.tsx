"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AetherNotesFormatter from '@/components/aether/AetherNotesFormatter';
import OnboardingForm from '@/components/aether/OnboardingForm';
import AetherScanner from '@/components/aether/AetherScanner';
import { AETHER_CONFIG } from '@/lib/business-config';
import {
  Sparkles, Loader2, Camera, LogOut, Mic, MicOff, Cpu, FileText, ExternalLink, WifiOff, Mail, Lock, Download
} from 'lucide-react';

// --- [SECTION: TYPES & INTERFACES] ---
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

interface Note {
  id: string;
  content: string;
  university: string;
  created_at: string;
  github_url: string | null;
}

interface AetherUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; };
}

interface AetherResult {
  content: string;
  provider: string;
  timestamp: string;
  github_url: string | null;
}

interface ISpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string; }; }; };
}

interface ISpeechRecognition extends EventTarget {
  onstart: () => void;
  onend: () => void;
  onresult: (event: ISpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface CustomWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

export default function AetherDashboard() {
  // --- [SECTION: STATES] ---
  const [user, setUser] = useState<AetherUser | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [result, setResult] = useState<AetherResult | null>(null);
  const [feedNotes, setFeedNotes] = useState<Note[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // PWA Install States (Fixed 'any')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Email Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // --- [SECTION: FETCH RECENT FEED] ---
  const fetchFeed = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('aether_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);
    if (!error && data) setFeedNotes(data);
  }, []);

  // --- [SECTION: PWA & AUTH INITIALIZATION] ---
  useEffect(() => {
    setMounted(true);
    
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW failed", err));
    }

    // 2. Install Prompt Listener (Fixed 'any')
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Network Status
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // 4. Auth Check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = (session?.user as unknown as AetherUser) ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchFeed(currentUser.id);
        if (!localStorage.getItem('aether_user_meta')) setShowOnboarding(true);
      }
      setIsChecking(false);
    };
    checkUser();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [fetchFeed]);

  // --- [SECTION: HANDLERS] ---
  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` }
        });
        if (error) throw error;
        alert("Verification link sent to email!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Auth Error";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Logout and clear academic session?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleVoiceInput = () => {
    const win = window as unknown as CustomWindow;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechConstructor) return alert("Browser not supported");

    const recognition = new SpeechConstructor();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      setPrompt(prev => prev + " " + e.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isOffline || !user) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, isPro: false }),
      });
      const data = await response.json();

      if (data.text) {
        setResult({
          content: data.text,
          provider: "Aether Engine",
          timestamp: new Date().toISOString(),
          github_url: null
        });

        await supabase.from('aether_notes').insert([{
          user_id: user.id,
          content: data.text,
          university: localStorage.getItem('user_university') || 'Aether Research',
          department: localStorage.getItem('user_dept') || 'Core',
          created_at: new Date().toISOString()
        }]);

        fetchFeed(user.id);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  // --- [RENDER LOGIC] ---
  if (!mounted || isChecking) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-6 text-center">
       <div className="w-full max-w-[400px]">
        <div className="inline-flex bg-blue-600 p-4 rounded-[28px] text-white mb-6 shadow-xl shadow-blue-100 italic">
          <Cpu size={32} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter italic">{AETHER_CONFIG.BRAND.NAME}</h1>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-8">Research Node Access</p>
        
        <form onSubmit={handleEmailAuth} className="space-y-3 mb-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="email" placeholder="Academic Email" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm shadow-sm font-medium" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="password" placeholder="Secure Password" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm shadow-sm font-medium" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-black transition-all">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (isSignUp ? "Register" : "Initialize")}
          </button>
        </form>
        
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
          {isSignUp ? "Switch to Sign In" : "Request Access"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fcfcfc]">
      {showOnboarding && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-xl p-4"><OnboardingForm onSuccess={() => setShowOnboarding(false)} /></div>}

      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white"><Cpu size={20} /></div>
            <h1 className="text-lg font-black uppercase tracking-tighter italic">{AETHER_CONFIG.BRAND.NAME}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {deferredPrompt && (
              <button 
                onClick={handleInstallApp}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all animate-pulse shadow-sm"
              >
                <Download size={14} /> Install
              </button>
            )}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" aria-label="Sign out"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto pt-8 px-6 pb-20">
        {isOffline && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-3 text-red-600 text-xs font-black uppercase tracking-widest animate-pulse">
            <WifiOff size={18} /> Connection Lost: Offline Mode
          </div>
        )}

        <div className="bg-white p-2 rounded-[38px] shadow-2xl shadow-blue-50/50 border border-gray-100 mb-10">
          <form onSubmit={handleGenerate} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isOffline ? "System offline..." : "Ask your research question..."}
              disabled={isOffline || isLoading}
              className="w-full p-8 bg-gray-50/30 rounded-[32px] min-h-[220px] outline-none resize-none pb-28 font-medium text-gray-700 text-lg leading-relaxed"
            />
            <div className="absolute left-6 bottom-6 flex gap-2">
              <button type="button" onClick={() => setIsScannerOpen(true)} className="p-4 bg-white border border-gray-100 rounded-2xl hover:text-blue-600 shadow-sm transition-all active:scale-90" aria-label="Scan"><Camera size={22} /></button>
              <button type="button" onClick={handleVoiceInput} className={`p-4 rounded-2xl transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-gray-100 hover:text-blue-600'}`} aria-label="Mic">{isListening ? <Mic size={22} /> : <MicOff size={22} />}</button>
            </div>
            <div className="absolute right-6 bottom-6">
              <button type="submit" disabled={isLoading || isOffline} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Analyze</>}
              </button>
            </div>
          </form>
        </div>

        {!result && feedNotes.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 px-4">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" /> Research Stream
              </h2>
              <Link href="/dashboard" className="text-[9px] font-black text-blue-600 hover:underline tracking-widest uppercase italic">The Vault →</Link>
            </div>
            <div className="grid gap-3">
              {feedNotes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => setResult({ content: note.content, provider: "Vault", timestamp: note.created_at, github_url: note.github_url })} 
                  className="group bg-white p-6 rounded-[28px] border border-gray-50 hover:border-blue-100 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors"><FileText size={20} className="text-gray-300 group-hover:text-blue-600" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{note.content.split('\n')[0].replace(/[#*]/g, '')}</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 italic">{note.university}</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-200 group-hover:text-blue-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={resultRef}>
          {result && (
            <div className="mt-6 animate-in fade-in zoom-in-95 duration-500">
              <AetherNotesFormatter {...result} githubUrl={result.github_url} />
              <button onClick={() => setResult(null)} className="mt-12 text-[10px] font-black text-gray-300 hover:text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2 mx-auto transition-all italic underline-offset-4 hover:underline">
                Close Asset & Return to Stream
              </button>
            </div>
          )}
        </div>
      </main>

      {isScannerOpen && <AetherScanner onScanSuccess={(text) => { setPrompt(text); setIsScannerOpen(false); }} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}