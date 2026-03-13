"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Calendar,
  Trash2,
  ArrowLeft,
  Search,
  Loader2,
  Star,
  ExternalLink,
  BookOpen,
  Zap,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import UpgradeModal from '@/components/aether/upgradeModal';
import { AETHER_CONFIG } from '@/lib/business-config';

interface Note {
  id: string;
  content: string;
  github_url: string | null;
  created_at: string;
  university: string;
  department: string;
  word_count: number;
  is_favorite: boolean;
}

export default function AetherUserDashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- Business Logic States ---
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const savedUser = localStorage.getItem('aether_user_meta');
    const userMeta = savedUser ? JSON.parse(savedUser) : null;

    if (userMeta?.id) {
      const { data, error } = await supabase
        .from('aether_notes')
        .select('*')
        .eq('user_id', userMeta.id)
        .order('created_at', { ascending: false });

      if (!error) setNotes(data || []);
      if (userMeta.tier === 'pro') setUserTier('pro');
    }
    setLoading(false);
  };

  // Guard for Quota Limits
  const handleEngineAccess = (e: React.MouseEvent) => {
    if (userTier === 'free' && notes.length >= AETHER_CONFIG.LIMITS.FREE_NOTES_PER_DAY) {
      e.preventDefault();
      setIsUpgradeOpen(true);
    }
  };

  const toggleFavorite = async (noteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('aether_notes')
        .update({ is_favorite: !currentStatus })
        .eq('id', noteId);

      if (!error) {
        setNotes(notes.map(note =>
          note.id === noteId ? { ...note, is_favorite: !currentStatus } : note
        ));
      }
    } catch (err) {
      console.error("Sync Error:", err);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm("Remove this research asset permanently?")) return;
    setIsDeleting(noteId);
    const { error } = await supabase.from('aether_notes').delete().eq('id', noteId);
    if (!error) setNotes(notes.filter(n => n.id !== noteId));
    setIsDeleting(null);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header with Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link
              href="/"
              onClick={handleEngineAccess}
              className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 hover:translate-x-[-4px] transition-all"
            >
              <ArrowLeft size={16} /> RETURN TO ENGINE
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Research <span className="text-blue-600">Vault</span></h1>
            <p className="text-gray-500 mt-1 font-medium italic underline decoration-blue-100">AetherRise Institutional Repository.</p>
          </div>

          {/* Quota & Launch Offer Badge */}
          <div className="flex items-center gap-3">
            {userTier === 'free' && (
              <div className="hidden lg:flex flex-col items-end">
                <span className="flex items-center gap-1 text-[10px] font-black text-red-500 animate-pulse bg-red-50 px-2 py-0.5 rounded-full">
                  <TrendingDown size={10} /> FLASH SALE: 149 BDT
                </span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Ends in 24 Hours</span>
              </div>
            )}

            <div className="bg-white border p-2 rounded-2xl shadow-sm flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${userTier === 'pro' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-700'}`}>
                {userTier === 'pro' ? '⭐ PRO MEMBER' : `Usage: ${notes.length} / ${AETHER_CONFIG.LIMITS.FREE_NOTES_PER_DAY}`}
              </div>

              {userTier === 'free' && (
                <button
                  onClick={() => setIsUpgradeOpen(true)}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-90"
                  title="Upgrade to Pro"
                  aria-label="Upgrade to Pro"
                >
                  <Zap size={18} fill="white" />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group overflow-hidden">
                <div className="p-7 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100">
                      <FileText size={22} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting === note.id}
                        className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                        title="Delete Research Note"
                        aria-label="Delete Research Note"
                      >
                        {isDeleting === note.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={isDeleting === note.id}
                        className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                      >
                        {isDeleting === note.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight line-clamp-2">
                    {note.content.split('\n')[0].replace(/[#*]/g, '') || "Untitled Research"}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-md border border-gray-100 uppercase">
                      <BookOpen size={10} /> {note.word_count || 0} Words
                    </div>
                    <div className="px-2 py-1 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md border border-blue-100 uppercase">
                      {note.department || "Statistics"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    <Calendar size={14} /> {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/40 border-t flex gap-2">
                  {note.github_url && (
                    <a
                      href={note.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 hover:bg-black transition-all"
                    >
                      <ExternalLink size={14} /> View on GitHub
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[50px] border-2 border-dashed border-gray-100">
            <Search className="text-blue-100 mx-auto mb-6" size={64} />
            <h3 className="text-2xl font-black text-gray-800">Your Vault is Empty</h3>
            <p className="text-gray-400 mt-2 mb-10 italic">Ready to start your research journey?</p>
            <Link
              href="/"
              onClick={handleEngineAccess}
              className="inline-block px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Start Generating
            </Link>
          </div>
        )}
      </div>

      {/* --- Global Components --- */}
      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
}