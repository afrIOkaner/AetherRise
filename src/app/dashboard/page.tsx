"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  FileText, Calendar, Trash2, ArrowLeft, Loader2,
  LayoutDashboard, X, Copy, CheckCircle2, AlertCircle, ExternalLink, Search, Download
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface Note {
  id: string;
  content: string;
  github_url: string | null;
  sync_status: string | null;
  created_at: string;
  university: string;
  department: string;
  word_count: number;
}

export default function AetherUserDashboard() {
  const auth = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const user = auth?.user;
  const authLoading = auth?.loading ?? true;

  useEffect(() => {
    setMounted(true);
  }, []);

  const exportToPDF = (note: Note) => {
    const doc = new jsPDF();
    const title = note.content.split('\n')[0].replace(/[#*]/g, '').trim();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Aether Research Asset", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Institution: ${note.university || 'N/A'}`, 20, 35);
    
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title, 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(note.content, 170);
    doc.text(splitText, 20, 70);
    
    doc.save(`Aether_Research_${note.id.slice(0, 5)}.pdf`);
    setToast({ msg: "PDF Downloaded successfully!", type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotes = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (mounted && user) fetchNotes();
    else if (mounted && !authLoading) setLoading(false);
  }, [user, authLoading, mounted, fetchNotes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => 
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, notes]);

  const handleCopy = (content: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(content);
      setToast({ msg: "Content copied to clipboard!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure?")) return;
    setIsDeleting(noteId);
    try {
      await supabase.from('aether_notes').delete().eq('id', noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setToast({ msg: "Asset removed", type: "info" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsDeleting(null); 
    }
  };

  if (!mounted || !auth) return null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20 relative font-sans">
      {toast && (
        <div className="fixed top-8 right-8 z-[100] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          {toast.type === 'success' ? <CheckCircle2 className="text-green-400" size={20} /> : <AlertCircle className="text-blue-400" size={20} />}
          <span className="text-[11px] font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 hover:-translate-x-1 transition-transform">
              <ArrowLeft size={16} /> RETURN TO ENGINE
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Research <span className="text-blue-600">Vault</span> <LayoutDashboard className="text-gray-200" size={32} />
            </h1>
          </div>
        </div>

        <div className="mb-12 relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-gray-300 group-focus-within:text-blue-500 transition-colors" size={22} />
          </div>
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 py-6 pl-16 pr-8 rounded-[30px] shadow-sm focus:shadow-xl focus:border-blue-100 transition-all outline-none text-lg font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
              title="Clear Search"
              aria-label="Clear Search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all flex flex-col overflow-hidden cursor-pointer group">
              <div className="p-7 flex-1" onClick={() => setSelectedNote(note)}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText size={22} />
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, note.id)} 
                    className="p-2 text-gray-200 hover:text-red-500 transition-all"
                    title="Delete Asset"
                  >
                    {isDeleting === note.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  </button>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                  {note.content.split('\n')[0].replace(/[#*]/g, '').trim()}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                  <Calendar size={14} /> {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="px-7 py-4 bg-gray-50/50 border-t flex justify-between items-center">
                 <button 
                  onClick={(e) => { e.stopPropagation(); exportToPDF(note); }}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-tighter hover:text-blue-800"
                  title="Download as PDF"
                 >
                   <Download size={14} /> Export PDF
                 </button>
                 <ExternalLink size={14} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNote && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-12">
               <div className="flex gap-2">
                <button onClick={() => handleCopy(selectedNote.content)} className="p-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs uppercase flex items-center gap-2"><Copy size={18} /> Copy</button>
                <button onClick={() => exportToPDF(selectedNote)} className="p-4 bg-blue-600 text-white rounded-2xl font-bold text-xs uppercase flex items-center gap-2"><Download size={18} /> PDF Export</button>
               </div>
               <button onClick={() => setSelectedNote(null)} className="p-4 bg-red-50 text-red-500 rounded-2xl" title="Close" aria-label="Close"><X size={24} /></button>
            </div>
            <div className="prose prose-slate max-w-none">
              <h2 className="text-4xl font-black text-gray-900 mb-8">{selectedNote.content.split('\n')[0].replace(/[#*]/g, '').trim()}</h2>
              <div className="whitespace-pre-wrap text-gray-700 leading-[1.8] font-medium text-lg">{selectedNote.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}