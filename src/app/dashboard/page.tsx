"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  FileText, Calendar, Trash2, ArrowLeft, Loader2, BookOpen, 
  LayoutDashboard, Github, X, Copy, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import UpgradeModal from '@/components/aether/upgradeModal';
import { AETHER_CONFIG } from '@/lib/business-config';

interface Note {
  id: string;
  content: string;
  github_url: string | null;
  sync_status: string | null; // Added sync status
  created_at: string;
  university: string;
  department: string;
  word_count: number;
}

export default function AetherUserDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null); // For Preview Panel
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    if (user) fetchNotes();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const fetchNotes = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('aether_notes') 
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error("Failed to fetch vault assets:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast("Content copied to clipboard!", "success");
  };

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation(); // Prevent triggering the note preview when clicking delete
    if (!confirm("Are you sure you want to remove this research asset?")) return;
    
    setIsDeleting(noteId);
    try {
      const { error } = await supabase.from('aether_notes').delete().eq('id', noteId);
      if (!error) {
        setNotes(notes.filter(n => n.id !== noteId));
        if (selectedNote?.id === noteId) setSelectedNote(null);
        showToast("Asset removed from vault", "info");
      }
    } catch (err) {
      alert("System error during deletion.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20 relative overflow-x-hidden font-sans">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className="fixed top-8 right-8 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.type === 'success' ? <CheckCircle2 className="text-green-400" size={20} /> : <AlertCircle className="text-blue-400" size={20} />}
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 hover:-translate-x-1 transition-transform">
              <ArrowLeft size={16} /> RETURN TO ENGINE
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Research <span className="text-blue-600">Vault</span> <LayoutDashboard className="text-gray-200" size={32} />
            </h1>
          </div>

          <div className="bg-white border p-2 rounded-2xl shadow-sm flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${profile?.tier === 'pro' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-700'}`}>
              {profile?.tier === 'pro' ? '⭐ PRO MEMBER' : `Usage: ${notes.length} / ${AETHER_CONFIG.LIMITS.FREE_NOTES_PER_DAY}`}
            </div>
          </div>
        </div>

        {/* ASSETS GRID */}
        {notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {notes.map((note) => (
              <div 
                key={note.id} 
                onClick={() => setSelectedNote(note)}
                className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col overflow-hidden cursor-pointer group"
              >
                <div className="p-7 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={22} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, note.id)} 
                      className="p-2 text-gray-200 hover:text-red-500 transition-all"
                    >
                      {isDeleting === note.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight line-clamp-2">
                    {note.content.split('\n')[0].replace(/[#*]/g, '').trim() || "Research Asset"}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-2 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-md border border-gray-100 uppercase flex items-center gap-1">
                      <BookOpen size={10} /> {note.word_count || 0} words
                    </div>
                    {note.github_url && (
                      <div className="px-2 py-1 bg-green-50 text-[10px] font-bold text-green-600 rounded-md border border-green-100 uppercase flex items-center gap-1">
                        <Github size={10} /> Synced
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    <Calendar size={14} /> {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="px-7 py-4 bg-gray-50/50 border-t flex justify-between items-center">
                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Click to expand</span>
                   <ExternalLink size={14} className="text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[50px] border-2 border-dashed border-gray-100">
            <h3 className="text-2xl font-black text-gray-800">Your Vault is Empty</h3>
            <Link href="/" className="mt-6 inline-block px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all">
              Start Generating
            </Link>
          </div>
        )}
      </div>

      {/* --- QUICK VIEW PANEL (Slide-over) --- */}
      {selectedNote && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl p-8 md:p-12 overflow-y-auto animate-in slide-in-from-right duration-500"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCopy(selectedNote.content)}
                  className="p-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center gap-2 font-bold text-xs uppercase"
                >
                  <Copy size={18} /> Copy Code
                </button>
                {selectedNote.github_url && (
                  <a 
                    href={selectedNote.github_url} 
                    target="_blank" 
                    className="p-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all flex items-center gap-2 font-bold text-xs uppercase"
                  >
                    <Github size={18} /> Source
                  </a>
                )}
              </div>
              <button 
  onClick={() => setSelectedNote(null)}
  className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
  title="Close Preview" 
  aria-label="Close Preview" // Accessibility label
>
  <X size={24} />
</button>
            </div>

            <div className="prose prose-slate max-w-none">
              <div className="mb-8 pb-8 border-b">
                <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">Research Documentation</span>
                <h2 className="text-4xl font-black text-gray-900 mt-2 leading-tight">
                  {selectedNote.content.split('\n')[0].replace(/[#*]/g, '').trim()}
                </h2>
                <div className="flex gap-6 mt-4 text-gray-400 font-bold text-[11px] uppercase tracking-widest">
                   <div className="flex items-center gap-2"><Calendar size={14} /> {new Date(selectedNote.created_at).toLocaleDateString()}</div>
                   <div className="flex items-center gap-2"><BookOpen size={14} /> {selectedNote.word_count} Words</div>
                </div>
              </div>
              
              <div className="whitespace-pre-wrap text-gray-700 leading-[1.8] font-medium text-lg">
                {selectedNote.content}
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}