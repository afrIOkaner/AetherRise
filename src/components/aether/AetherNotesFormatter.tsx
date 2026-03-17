"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { QRCodeCanvas } from "qrcode.react";
import {
  Download,
  Calendar,
  Cpu,
  School,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Sparkles,
  Loader2,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import "katex/dist/katex.min.css";

interface FormatterProps {
  content: string;
  provider: string;
  githubUrl: string | null;
  timestamp: string;
  noteId?: string;
}

interface StoredUserMeta {
  university: string;
  department: string;
  status?: string;
}

const AetherNotesFormatter: React.FC<FormatterProps> = ({
  content,
  provider,
  githubUrl,
  timestamp,
  noteId,
}) => {
  const [userMeta, setUserMeta] = useState<StoredUserMeta | null>(null);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem("aether_user_meta");

    if (savedData) {
      try {
        setUserMeta(JSON.parse(savedData) as StoredUserMeta);
      } catch (error) {
        console.error("Failed to parse user metadata", error);
      }
    }
  }, []);

  const isProUser = useMemo(() => userMeta?.status === "pro", [userMeta]);

  const processedContent = useMemo(() => {
    return content
      // Convert escaped LaTeX block delimiters
      .replace(/\\\[/g, "\n$$\n")
      .replace(/\\\]/g, "\n$$\n")

      // Convert escaped inline delimiters
      .replace(/\\\(/g, "$")
      .replace(/\\\)/g, "$")

      // Convert plain square-bracket equations like:
      // [Y = \beta_0 + \beta_1X + ...]
      .replace(/\[([^\[\]\n]*\\[a-zA-Z]+[^\[\]\n]*)\]/g, "\n$$\n$1\n$$\n")

      // Clean non-breaking spaces
      .replace(/&nbsp;/g, " ");
  }, [content]);

  const exportToPDF = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleFeedback = async (type: "up" | "down") => {
    setFeedback(type);

    if (noteId && noteId.length > 20) {
      const { error } = await supabase
        .from("aether_notes")
        .update({ feedback: type })
        .eq("id", noteId);

      if (error) {
        console.error("Feedback update failed", error);
      }
    }
  };

  const handleTutorSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!tutorQuery.trim() || isTutorLoading) return;

    setIsTutorLoading(true);
    setTutorResponse(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          query: tutorQuery,
          context: content,
          university: userMeta?.university,
          department: userMeta?.department,
        }),
      });

      const data = await response.json();

      if (data.text) {
        setTutorResponse(data.text);
        setTutorQuery("");
      } else {
        setTutorResponse(data.error || "AI Engine encountered an issue.");
      }
    } catch (error) {
      console.error("Tutor request failed", error);
      setTutorResponse("Connection lost.");
    } finally {
      setIsTutorLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 space-y-6 duration-1000">
      <div
        id="printable-note"
        className="relative rounded-[48px] border border-gray-100 bg-white shadow-2xl print:shadow-none"
      >
        <div className="no-print h-2.5 bg-gradient-to-r from-blue-600 to-purple-600" />

        <div className="p-8 print:p-0 sm:p-14">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-gray-50 pb-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">
                  <Cpu size={14} />
                  {provider} Engine • {isProUser ? "PRO NODE" : "STANDARD"}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
                  <Calendar size={14} />
                  {new Date(timestamp).toLocaleString()}
                </div>
              </div>

              {userMeta && (
                <div className="mt-2 flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700">
                    <School size={12} />
                    {userMeta.university}
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                    <BookOpen size={12} />
                    {userMeta.department}
                  </div>
                </div>
              )}
            </div>

            {githubUrl && <QRCodeCanvas value={githubUrl} size={80} />}
          </div>

          <article className="prose prose-blue max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {processedContent}
            </ReactMarkdown>
          </article>

          <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-10 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-blue-500" />
              <span>
                AETHER SYSTEM v1.0.4 •{" "}
                {isProUser ? "PRO VERSION" : "ACADEMIC ARCHIVE"}
              </span>
            </div>

            <span>{userMeta?.university || "RESTRICTED ACCESS"} • SECURE NODE</span>
          </div>
        </div>
      </div>

      <div className="no-print flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-3 rounded-3xl bg-gray-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-blue-600"
          >
            <Download size={18} />
            Export PDF
          </button>

          <button
            onClick={() => setIsTutorOpen(!isTutorOpen)}
            className={`flex items-center gap-3 rounded-3xl px-8 py-4 text-xs font-black uppercase tracking-widest shadow-xl transition-all ${
              isTutorOpen
                ? "bg-indigo-600 text-white"
                : "border-2 border-gray-100 bg-white text-gray-700"
            }`}
          >
            <MessageSquare size={18} />
            {isTutorOpen ? "Close Tutor" : "Engage Tutor"}
          </button>

          <div className="flex items-center rounded-3xl border-2 border-gray-100 bg-white px-3 py-1 shadow-lg">
            <button
              onClick={() => handleFeedback("up")}
              title="Helpful"
              className={`p-2 transition-colors ${
                feedback === "up" ? "text-green-600" : "text-gray-300"
              }`}
            >
              <ThumbsUp size={20} />
            </button>

            <div className="mx-2 h-6 w-px bg-gray-100" />

            <button
              onClick={() => handleFeedback("down")}
              title="Not Helpful"
              className={`p-2 transition-colors ${
                feedback === "down" ? "text-red-600" : "text-gray-300"
              }`}
            >
              <ThumbsDown size={20} />
            </button>
          </div>
        </div>

        {isTutorOpen && (
          <div className="mx-auto w-full max-w-2xl space-y-6 rounded-[40px] border-2 border-indigo-100 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-600" size={18} />
                <p className="text-[13px] font-bold text-indigo-900">
                  Aether AI Tutor
                </p>
              </div>

              {tutorResponse && (
                <button
                  onClick={() => setTutorResponse(null)}
                  title="Clear Response"
                  className="text-gray-400 transition-colors hover:text-red-500"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            <div className="min-h-[100px] overflow-y-auto">
              {isTutorLoading ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2
                    className="mb-2 animate-spin text-indigo-600"
                    size={30}
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    Processing...
                  </p>
                </div>
              ) : tutorResponse ? (
                <div className="rounded-[32px] bg-indigo-50/50 p-6 text-gray-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {tutorResponse}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>

            <form onSubmit={handleTutorSubmit} className="relative">
              <input
                type="text"
                value={tutorQuery}
                onChange={(event) => setTutorQuery(event.target.value)}
                placeholder="Ask something..."
                className="w-full rounded-[24px] border-2 border-indigo-100 bg-white p-5 pr-16 focus:border-indigo-400 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isTutorLoading || !tutorQuery.trim()}
                title="Send Inquiry"
                className="absolute right-2.5 top-2.5 rounded-[18px] bg-indigo-600 p-3.5 text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AetherNotesFormatter;