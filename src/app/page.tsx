"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, loading, signOut, profile } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<AetherResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("");
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
    try {
      setErrorMessage("");
      await signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage("Failed to sign out. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsEmailLoading(true);
    setErrorMessage("");
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setAuthMessage("Check your email for the magic login link.");
    }

    setIsEmailLoading(false);
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
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          query: prompt.trim(),
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
        provider: data.provider || "gemini",
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] p-6">
        <div className="w-full max-w-md rounded-[32px] border border-gray-100 bg-white p-8 shadow-2xl shadow-blue-50">
          <div className="text-center">
            <div className="mx-auto mb-6 inline-flex rounded-[24px] bg-blue-600 p-4 text-white shadow-lg shadow-blue-200">
              <Cpu size={30} />
            </div>

            <h1 className="mb-2 text-4xl font-black uppercase tracking-[0.12em] text-gray-900">
              {AETHER_CONFIG?.BRAND?.NAME || "AETHERRISE"}
            </h1>

            <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              The AI Research Engine
            </p>

            <p className="mb-8 text-sm leading-6 text-gray-500">
              Built for engineers, statisticians, researchers, and deep thinkers.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-gray-200 transition hover:bg-black"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
              <div className="h-px flex-1 bg-gray-200" />
              <span>or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />

              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                {isEmailLoading ? "Sending Link..." : "Sign in with Email"}
              </button>
            </form>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {errorMessage}
              </div>
            )}

            {authMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                {authMessage}
              </div>
            )}
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
            <h1 className="text-lg font-black uppercase tracking-tighter text-gray-900">
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
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || "Researcher"}
          </h2>
          <p className="text-sm text-gray-500">
            Continue your research journey.
          </p>
        </div>

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