"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Sparkles, LogOut, Cpu, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import AetherNotesFormatter from "@/components/aether/AetherNotesFormatter";
import { AETHER_CONFIG } from "@/lib/business-config";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface AetherResult {
  content: string;
  provider: string;
  timestamp: string;
  github_url: string | null;
}

export default function AetherHomePage() {
  const { user, loading, signOut } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<AetherResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [result]);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Please sign in first.");
      return;
    }

    if (!prompt.trim()) {
      setErrorMessage("Please enter a question.");
      return;
    }

    setErrorMessage("");
    setSavedMessage("");
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: prompt.trim(),
          isPro: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate response.");
      }

      if (!data?.text) {
        throw new Error("Empty response from AI.");
      }

      setResult({
        content: data.text,
        provider: "gemini",
        timestamp: new Date().toISOString(),
        github_url: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!user || !result) return;

    setIsSaving(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const title =
        prompt.trim().slice(0, 60) || result.content.slice(0, 60) || "Untitled";

      const { error } = await supabase.from("aether_notes").insert([
        {
          user_id: user.id,
          title,
          content: result.content,
          provider: result.provider,
          university: "Aether Research",
          department: "Core",
          topic: prompt.trim(),
        },
      ]);

      if (error) {
        throw error;
      }

      setSavedMessage("Note saved successfully.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save note.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] p-6">
        <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-2xl shadow-blue-50">
          <div className="mx-auto mb-6 inline-flex rounded-[24px] bg-blue-600 p-4 text-white shadow-lg shadow-blue-200">
            <Cpu size={30} />
          </div>

          <h1 className="mb-2 text-4xl font-black uppercase tracking-tighter italic text-gray-900">
            {AETHER_CONFIG?.BRAND?.NAME || "AETHERRISE"}
          </h1>

          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
            AI Research Workspace
          </p>

          <p className="mb-8 text-sm leading-6 text-gray-500">
            Built for students, researchers, and deep thinkers who want to turn
            questions into structured knowledge.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              className="w-full rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-black shadow-lg shadow-gray-200"
            >
              Continue with Google
            </button>

            <button
              className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              disabled
            >
              Email Login Coming Soon
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            <span className="rounded-full bg-gray-50 px-3 py-2">AI Notes</span>
            <span className="rounded-full bg-gray-50 px-3 py-2">Vaults</span>
            <span className="rounded-full bg-gray-50 px-3 py-2">
              Research Memory
            </span>
            <span className="rounded-full bg-gray-50 px-3 py-2">
              Installable App
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <header className="sticky top-0 z-50 border-b bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <Cpu size={20} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-tighter italic text-gray-900">
              {AETHER_CONFIG?.BRAND?.NAME || "AETHERRISE"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {deferredPrompt && (
              <button
                onClick={handleInstallApp}
                className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 transition hover:bg-blue-100"
              >
                <Download size={14} />
                Install
              </button>
            )}

            <Link
              href="/dashboard"
              className="rounded-xl border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 transition hover:bg-gray-50"
            >
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl p-2 text-gray-500 transition hover:text-red-500"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        <div className="mb-8 rounded-[32px] border border-gray-100 bg-white p-3 shadow-2xl shadow-blue-50/50">
          <form onSubmit={handleGenerate} className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask your research question..."
              disabled={isGenerating}
              className="min-h-[220px] w-full resize-none rounded-[28px] bg-gray-50/40 p-8 pb-28 text-lg font-medium leading-relaxed text-gray-700 outline-none"
            />

            <div className="absolute bottom-6 right-6">
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Sparkles size={18} />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        {savedMessage && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {savedMessage}
          </div>
        )}

        <div ref={resultRef}>
          {result && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <AetherNotesFormatter
                content={result.content}
                provider={result.provider}
                timestamp={result.timestamp}
                githubUrl={result.github_url}
              />

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="rounded-2xl bg-gray-900 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Note"}
                </button>

                <button
                  onClick={() => setResult(null)}
                  className="rounded-2xl border border-gray-200 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 transition hover:bg-gray-50"
                >
                  Clear Result
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}