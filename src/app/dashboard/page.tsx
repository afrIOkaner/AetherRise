"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Trash2,
  Search,
  X,
  Copy,
  Download,
  LayoutDashboard,
} from "lucide-react";

interface Note {
  id: string;
  title: string | null;
  content: string;
  provider: string;
  created_at: string;
  university: string | null;
  department: string | null;
  vault_id: string | null;
}

interface Vault {
  id: string;
  name: string;
}

export default function AetherUserDashboard() {
  const { user, loading: authLoading } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVault, setSelectedVault] = useState("all");
  const [newVaultName, setNewVaultName] = useState("");
  const [creatingVault, setCreatingVault] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [savingVaultId, setSavingVaultId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const [{ data: notesData, error: notesError }, { data: vaultsData, error: vaultsError }] =
        await Promise.all([
          supabase
            .from("aether_notes")
            .select("id, title, content, provider, created_at, university, department, vault_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("vaults")
            .select("id, name")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (notesError) throw notesError;
      if (vaultsError) throw vaultsError;

      setNotes(notesData || []);
      setVaults(vaultsData || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      showMessage("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchDashboardData]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.university?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVault =
        selectedVault === "all" ? true : note.vault_id === selectedVault;

      return Boolean(matchesSearch && matchesVault);
    });
  }, [notes, searchTerm, selectedVault]);

  const recentNotes = notes.slice(0, 5);

  const handleCreateVault = async () => {
    if (!user?.id || !newVaultName.trim()) return;

    setCreatingVault(true);

    try {
      const { data, error } = await supabase
        .from("vaults")
        .insert([
          {
            user_id: user.id,
            name: newVaultName.trim(),
          },
        ])
        .select("id, name")
        .single();

      if (error) throw error;

      setVaults((prev) => [data, ...prev]);
      setNewVaultName("");
      showMessage("Vault created.");
    } catch (error) {
      console.error(error);
      showMessage("Failed to create vault.");
    } finally {
      setCreatingVault(false);
    }
  };

  const handleAssignVault = async (noteId: string, vaultId: string | null) => {
    setSavingVaultId(noteId);

    try {
      const { error } = await supabase
        .from("aether_notes")
        .update({ vault_id: vaultId })
        .eq("id", noteId);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId ? { ...note, vault_id: vaultId } : note
        )
      );

      if (selectedNote?.id === noteId) {
        setSelectedNote((prev) =>
          prev ? { ...prev, vault_id: vaultId } : prev
        );
      }

      showMessage("Vault updated.");
    } catch (error) {
      console.error(error);
      showMessage("Failed to update vault.");
    } finally {
      setSavingVaultId(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm("Delete this note?");
    if (!confirmed) return;

    setDeletingNoteId(noteId);

    try {
      const { error } = await supabase
        .from("aether_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }

      showMessage("Note deleted.");
    } catch (error) {
      console.error(error);
      showMessage("Failed to delete note.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage("Copied.");
    } catch {
      showMessage("Copy failed.");
    }
  };

  const exportToPDF = (note: Note) => {
    const doc = new jsPDF();
    const title =
      note.title ||
      note.content.split("\n")[0].replace(/[#*]/g, "").trim() ||
      "Untitled";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Created: ${new Date(note.created_at).toLocaleString()}`, 20, 30);
    doc.text(`Provider: ${note.provider}`, 20, 36);

    const body = doc.splitTextToSize(note.content, 170);
    doc.setFontSize(11);
    doc.text(body, 20, 50);

    doc.save(`aetherrise-note-${note.id.slice(0, 6)}.pdf`);
    showMessage("PDF downloaded.");
  };

  const getVaultName = (vaultId: string | null) => {
    if (!vaultId) return "Unassigned";
    return vaults.find((vault) => vault.id === vaultId)?.name || "Unknown";
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] p-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <p className="mb-4 text-gray-600">Please sign in first.</p>
          <Link
            href="/"
            className="inline-flex rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-16">
      {message && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {message}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:-translate-x-1"
            >
              <ArrowLeft size={16} />
              Back to AetherRise
            </Link>

            <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-gray-900">
              Dashboard
              <LayoutDashboard className="text-blue-600" size={30} />
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage your notes, vaults, and recent research.
            </p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Total Notes
            </p>
            <p className="mt-3 text-3xl font-black text-gray-900">{notes.length}</p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Total Vaults
            </p>
            <p className="mt-3 text-3xl font-black text-gray-900">{vaults.length}</p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Recent Notes
            </p>
            <p className="mt-3 text-3xl font-black text-gray-900">{recentNotes.length}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Search Notes
            </p>
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 outline-none transition focus:border-blue-300"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
              Create Vault
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="New vault name"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-4 outline-none transition focus:border-blue-300"
              />
              <button
                onClick={handleCreateVault}
                disabled={creatingVault || !newVaultName.trim()}
                className="rounded-2xl bg-gray-900 px-5 py-4 text-sm font-bold text-white transition hover:bg-black disabled:opacity-50"
              >
                {creatingVault ? "Creating..." : "Add"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Filter by Vault
          </p>
          <select
            title="Filter notes by vault"
            aria-label="Filter notes by vault"
            value={selectedVault}
            onChange={(e) => setSelectedVault(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 outline-none transition focus:border-blue-300"
          >
            <option value="all">All Notes</option>
            {vaults.map((vault) => (
              <option key={vault.id} value={vault.id}>
                {vault.name}
              </option>
            ))}
          </select>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={34} />
            <h2 className="text-xl font-bold text-gray-800">No notes found</h2>
            <p className="mt-2 text-gray-500">
              Generate and save a note from the home page first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:shadow-xl"
              >
                <div
                  className="cursor-pointer p-6"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <FileText size={20} />
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="text-gray-300 transition hover:text-red-500"
                    >
                      {deletingNoteId === note.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>

                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">
                    {note.title ||
                      note.content.split("\n")[0].replace(/[#*]/g, "").trim() ||
                      "Untitled"}
                  </h3>

                  <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-500">
                    {note.content}
                  </p>

                  <div className="space-y-2 text-xs font-medium text-gray-400">
                    <p>Vault: {getVaultName(note.vault_id)}</p>
                    <p>{new Date(note.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t bg-gray-50/60 p-4">
                  <div className="mb-3">
                    <select
                      title="Assign note to vault"
                      aria-label="Assign note to vault"
                      value={note.vault_id || ""}
                      onChange={(e) =>
                        handleAssignVault(note.id, e.target.value || null)
                      }
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none"
                    >
                      <option value="">Unassigned</option>
                      {vaults.map((vault) => (
                        <option key={vault.id} value={vault.id}>
                          {vault.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => exportToPDF(note)}
                    disabled={savingVaultId === note.id}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:text-blue-800"
                  >
                    <Download size={14} />
                    Export PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNote && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(selectedNote.content)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700"
                >
                  <Copy size={16} />
                  Copy
                </button>

                <button
                  onClick={() => exportToPDF(selectedNote)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
                >
                  <Download size={16} />
                  PDF
                </button>
              </div>

              <button
                onClick={() => setSelectedNote(null)}
                title="Close note"
                aria-label="Close note"
                className="rounded-2xl bg-red-50 p-3 text-red-500"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="mb-4 text-3xl font-black text-gray-900">
              {selectedNote.title ||
                selectedNote.content.split("\n")[0].replace(/[#*]/g, "").trim() ||
                "Untitled"}
            </h2>

            <div className="mb-6 flex flex-wrap gap-3 text-xs font-medium text-gray-400">
              <span>Provider: {selectedNote.provider}</span>
              <span>Vault: {getVaultName(selectedNote.vault_id)}</span>
              <span>{new Date(selectedNote.created_at).toLocaleString()}</span>
            </div>

            <div className="whitespace-pre-wrap text-base leading-8 text-gray-700">
              {selectedNote.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}