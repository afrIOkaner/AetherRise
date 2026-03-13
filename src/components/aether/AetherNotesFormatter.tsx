"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Download, Calendar, Cpu, School,
  BookOpen, ThumbsUp, ThumbsDown, MessageSquare,
  Send, Sparkles, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

import 'katex/dist/katex.min.css';

/**
 * @file AetherNotesFormatter.tsx
 * @description Advanced Markdown & LaTeX Renderer for Statistical Research.
 * FIXED: LaTeX regex, Accessibility labels, and Print optimization.
 */

interface FormatterProps {
  content: string;
  provider: string;
  githubUrl: string | null;
  timestamp: string;
  noteId?: string;
}

const AetherNotesFormatter: React.FC<FormatterProps> = ({ content, provider, githubUrl, timestamp, noteId }) => {
  const [userMeta, setUserMeta] = useState<{ university: string, department: string } | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem('aether_user_meta');
    if (savedData) {
      setUserMeta(JSON.parse(savedData));
    }
  }, []);

  /**
   * Goal 7: High-Precision LaTeX Normalization
   * Normalizes multiple LaTeX delimiters to standard $ and $$ for reliability.
   */
  const processedContent = content
    .replace(/\\\[/g, '\n$$\n')
    .replace(/\\\]/g, '\n$$\n')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/&nbsp;/g, ' ');

  const exportToPDF = () => { window.print(); };

  const handleFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    if (noteId && noteId.length > 20) {
      await supabase.from('aether_notes').update({ feedback: type }).eq('id', noteId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div
        id="printable-note"
        className="bg-white rounded-[48px] shadow-2xl shadow-blue-100/50 overflow-hidden border border-gray-100 print:shadow-none print:border-none relative"
      >
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 no-print" />

        <div className="p-8 sm:p-14 print:p-0">
          {/* Header Section */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-50">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">
                  <Cpu size={14} strokeWidth={3} /> {provider} Engine • Professional Grade
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 italic">
                  <Calendar size={14} /> {new Date(timestamp).toLocaleString()}
                </div>
              </div>

              {userMeta && (
                <div className="flex flex-wrap gap-2.5 mt-2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50/50 border border-blue-100 rounded-full text-[10px] font-black text-blue-700 uppercase tracking-widest">
                    <School size={12} /> {userMeta.university}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                    <BookOpen size={12} /> {userMeta.department}
                  </div>
                </div>
              )}
            </div>

            {githubUrl && (
              <div
                title="Scan to view repository"
                className="p-3 bg-white border-2 border-gray-50 rounded-3xl shadow-sm print:hidden group hover:border-blue-100 transition-all"
              >
                <QRCodeCanvas value={githubUrl} size={80} />
              </div>
            )}
          </div>

          {/* Research Content Area */}
          <article className={`prose prose-blue max-w-none 
  prose-headings:text-gray-900 prose-headings:font-black prose-headings:tracking-tighter
  prose-p:text-gray-800 prose-p:leading-[1.9] prose-p:font-medium prose-p:text-[17px]
  prose-strong:text-blue-700 prose-strong:font-black
  prose-code:text-indigo-600 prose-code:bg-indigo-50/80 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-lg prose-code:before:content-none prose-code:after:content-none
  [&_.katex-display]:my-10 [&_.katex-display]:py-10 [&_.katex-display]:bg-gray-50/50 [&_.katex-display]:rounded-[40px] [&_.katex-display]:border [&_.katex-display]:border-gray-100
  [&_.katex]:text-[1.2em] [&_table]:rounded-3xl [&_table]:overflow-hidden [&_table]:border-collapse`}>
            <ReactMarkdown
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {processedContent}
            </ReactMarkdown>
          </article>
          {/* Footer Telemetry */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-[9px] text-gray-400 font-black tracking-[0.3em] uppercase">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-blue-500" />
              <span>AETHER SYSTEM v1.0.4 • Academic Archive</span>
            </div>
            <span>{userMeta?.university || 'RESTRICTED ACCESS'} • SECURE NODE</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col gap-6 no-print">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={exportToPDF}
            title="Download notes as PDF"
            className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-2xl"
          >
            <Download size={18} /> Export Research Asset
          </button>

          <button
            onClick={() => setIsTutorOpen(!isTutorOpen)}
            title="Interact with AI Tutor"
            className={`flex items-center gap-3 px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${isTutorOpen ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-indigo-200'
              }`}
          >
            <MessageSquare size={18} /> {isTutorOpen ? 'Suspend Tutor' : 'Engage Tutor'}
          </button>

          {/* Feedback Protocol (Goal 8) */}
          <div className="flex items-center bg-white border-2 border-gray-100 rounded-3xl px-3 shadow-xl">
            <button
              onClick={() => handleFeedback('up')}
              title="Positive Precision"
              aria-label="Positive Feedback"
              className={`p-3.5 rounded-2xl transition-all ${feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-green-500'}`}
            >
              <ThumbsUp size={20} />
            </button>
            <div className="w-px h-8 bg-gray-100 mx-2" />
            <button
              onClick={() => handleFeedback('down')}
              title="Accuracy Alert"
              aria-label="Negative Feedback"
              className={`p-3.5 rounded-2xl transition-all ${feedback === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-300 hover:text-red-500'}`}
            >
              <ThumbsDown size={20} />
            </button>
          </div>
        </div>

        {/* AI Tutor Interface */}
        {isTutorOpen && (
          <div className="max-w-2xl mx-auto w-full bg-indigo-50/40 border-2 border-indigo-100/50 rounded-[40px] p-8 animate-in zoom-in-95 duration-500 shadow-inner">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white">
                <CheckCircle2 size={18} />
              </div>
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-900">Aether Tutor Protocol Active</p>
            </div>
            <div className="relative">
              <input
                type="text"
                title="Ask a follow-up question"
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                placeholder="Ask for formula simplification or proof..."
                className="w-full p-5 pr-16 bg-white border-2 border-indigo-100 rounded-[24px] text-sm font-bold focus:ring-[12px] focus:ring-indigo-100 outline-none transition-all shadow-sm placeholder:text-gray-300"
              />
              <button
                title="Send query"
                aria-label="Send query"
                className="absolute right-2.5 top-2.5 p-3.5 bg-indigo-600 text-white rounded-[18px] hover:bg-gray-900 transition-all shadow-md"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 20mm; }
          body * { visibility: hidden; }
          #printable-note, #printable-note * { visibility: visible; }
          #printable-note {
            position: absolute; left: 0; top: 0; width: 100%; border: none !important;
          }
          .no-print { display: none !important; }
        }
        /* Goal 7: Mathematical Precision Styling */
        .katex { font-size: 1.25em !important; font-weight: 700; color: #1e3a8a; }
        .katex-display { 
          overflow-x: auto; 
          overflow-y: hidden; 
          padding: 2rem;
          scrollbar-width: thin;
        }
        .prose table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .prose th { background: #f8fafc; padding: 12px; font-weight: 900; text-transform: uppercase; font-size: 10px; tracking: 0.1em; }
        .prose td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
      `}</style>
    </div>
  );
};

export default AetherNotesFormatter;