"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Download, Calendar, Cpu, School,
  BookOpen, ThumbsUp, ThumbsDown, MessageSquare,
  Send, Sparkles, Loader2, XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

import 'katex/dist/katex.min.css';

interface FormatterProps {
  content: string;
  provider: string;
  githubUrl: string | null;
  timestamp: string;
  noteId?: string;
}

const AetherNotesFormatter: React.FC<FormatterProps> = ({ content, provider, githubUrl, timestamp, noteId }) => {
  const [userMeta, setUserMeta] = useState<{ university: string, department: string, status?: string } | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [tutorQuery, setTutorQuery] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<string | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('aether_user_meta');
    if (savedData) {
      try {
        setUserMeta(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse user metadata", e);
      }
    }
  }, []);

  const isProUser = useMemo(() => userMeta?.status === 'pro', [userMeta]);

  const processedContent = useMemo(() => {
    return content
      .replace(/\\\[/g, '\n$$\n')
      .replace(/\\\]/g, '\n$$\n')
      .replace(/\\\(/g, '$')
      .replace(/\\\)/g, '$')
      .replace(/&nbsp;/g, ' ');
  }, [content]);

  const exportToPDF = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    setFeedback(type);
    if (noteId && noteId.length > 20) {
      const { error } = await supabase.from('aether_notes').update({ feedback: type }).eq('id', noteId);
      if (error) console.error("Feedback update failed", error);
    }
  };

  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim() || isTutorLoading) return;

    setIsTutorLoading(true);
    setTutorResponse(null);

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: tutorQuery,
          context: content,
          isPro: isProUser
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div id="printable-note" className="bg-white rounded-[48px] shadow-2xl border border-gray-100 print:shadow-none relative">
        <div className="h-2.5 bg-gradient-to-r from-blue-600 to-purple-600 no-print" />
        <div className="p-8 sm:p-14 print:p-0">
          
          {/* Metadata Header */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-50">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Cpu size={14} /> {provider} Engine • {isProUser ? 'PRO NODE' : 'STANDARD'}
                </div>
                <div className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
                  <Calendar size={14} /> {new Date(timestamp).toLocaleString()}
                </div>
              </div>

              {/* Fixed: Re-integrated School and BookOpen icons */}
              {userMeta && (
                <div className="flex flex-wrap gap-2.5 mt-2">
                  <div className="px-4 py-1.5 bg-blue-50/50 border border-blue-100 rounded-full text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                    <School size={12} /> {userMeta.university}
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-full text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen size={12} /> {userMeta.department}
                  </div>
                </div>
              )}
            </div>
            {githubUrl && <QRCodeCanvas value={githubUrl} size={80} />}
          </div>

          <article className="prose prose-blue max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
              {processedContent}
            </ReactMarkdown>
          </article>

          {/* Academic Footer */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-[9px] text-gray-400 font-black tracking-[0.3em] uppercase">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-blue-500" />
              <span>AETHER SYSTEM v1.0.4 • {isProUser ? 'PRO VERSION' : 'ACADEMIC ARCHIVE'}</span>
            </div>
            <span>{userMeta?.university || 'RESTRICTED ACCESS'} • SECURE NODE</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-6 no-print">
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <button onClick={exportToPDF} className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:bg-blue-600">
            <Download size={18} /> Export PDF
          </button>
          <button onClick={() => setIsTutorOpen(!isTutorOpen)} className={`flex items-center gap-3 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${isTutorOpen ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-100'}`}>
            <MessageSquare size={18} /> {isTutorOpen ? 'Close Tutor' : 'Engage Tutor'}
          </button>
          
          <div className="flex items-center bg-white border-2 border-gray-100 rounded-3xl px-3 py-1 shadow-lg">
            <button onClick={() => handleFeedback('up')} title="Helpful" className={`p-2 transition-colors ${feedback === 'up' ? 'text-green-600' : 'text-gray-300'}`}>
              <ThumbsUp size={20} />
            </button>
            <div className="w-px h-6 bg-gray-100 mx-2" />
            <button onClick={() => handleFeedback('down')} title="Not Helpful" className={`p-2 transition-colors ${feedback === 'down' ? 'text-red-600' : 'text-gray-300'}`}>
              <ThumbsDown size={20} />
            </button>
          </div>
        </div>

        {/* AI Tutor Panel */}
        {isTutorOpen && (
          <div className="max-w-2xl mx-auto w-full bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-[40px] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-600" size={18} />
                <p className="text-[13px] font-bold text-indigo-900">Aether AI Tutor</p>
              </div>
              {tutorResponse && (
                <button onClick={() => setTutorResponse(null)} title="Clear Response" className="text-gray-400 hover:text-red-500 transition-colors">
                  <XCircle size={20} />
                </button>
              )}
            </div>

            <div className="min-h-[100px] overflow-y-auto">
              {isTutorLoading ? (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="animate-spin text-indigo-600 mb-2" size={30} />
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Processing...</p>
                </div>
              ) : tutorResponse && (
                <div className="bg-indigo-50/50 rounded-[32px] p-6 text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                    {tutorResponse}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <form onSubmit={handleTutorSubmit} className="relative">
              <input
                type="text"
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                placeholder="Ask something..."
                className="w-full p-5 pr-16 bg-white border-2 border-indigo-100 rounded-[24px] focus:outline-none focus:border-indigo-400"
              />
              <button 
                type="submit" 
                disabled={isTutorLoading || !tutorQuery.trim()} 
                title="Send Inquiry"
                className="absolute right-2.5 top-2.5 p-3.5 bg-indigo-600 text-white rounded-[18px] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-md"
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