"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * @page DatabaseConnectionTest
 * @description Advanced diagnostic utility to verify Supabase connectivity 
 * and validate the persistence of local user metadata.
 */
export default function TestDB() {
  const [status, setStatus] = useState<string>("Ready to test...");
  const [loading, setLoading] = useState(false);
  const [localUser, setLocalUser] = useState<any>(null);

  // Load existing metadata from local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('aether_user_meta');
    if (savedData) {
      setLocalUser(JSON.parse(savedData));
    }
  }, []);

  /**
   * Attempts to insert a record into the 'notes' table using real user metadata 
   * if available, otherwise falls back to guest mode.
   */
  const testConnection = async () => {
    setLoading(true);
    setStatus("Initiating encrypted connection handshake...");

    try {
      // Data payload - Dynamic based on onboarding status
      const payload = {
        topic: "System Connectivity Audit",
        content: `Handshake successful at ${new Date().toISOString()}. Systems operational.`,
        university: localUser?.university || "Anonymous/Guest",
        department: localUser?.department || "External",
        user_id: localUser?.id || null // Links to the profile table if ID exists
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([payload])
        .select();

      if (error) throw error;

      setStatus("✅ Success! Data committed to cloud infrastructure: " + JSON.stringify(data));
    } catch (err: any) {
      console.error("Diagnostic Failure:", err);
      setStatus("❌ Sync Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears local cache for testing onboarding flow
   */
  const clearSession = () => {
    localStorage.removeItem('aether_user_meta');
    setLocalUser(null);
    setStatus("Local cache cleared. Onboarding form will trigger on next visit.");
  };

  return (
    <div className="p-10 flex flex-col items-center gap-6 min-h-screen bg-gray-50">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aether System Diagnostics</h1>
        <p className="text-gray-500 mb-6 text-sm">Verify cloud database synchronization and schema integrity.</p>
        
        {/* User Context Preview */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs">
          <span className="font-bold text-blue-700 uppercase block mb-1">Active User Context</span>
          {localUser ? (
            <div className="text-blue-600">
              <p>ID: {localUser.id}</p>
              <p>Academic: {localUser.university} | {localUser.department}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic">No local metadata detected. Testing as Guest.</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={testConnection}
            disabled={loading}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-gray-400 shadow-lg shadow-blue-100"
          >
            {loading ? "Syncing..." : "Trigger Sync Test"}
          </button>

          <button 
            onClick={clearSession}
            className="w-full px-6 py-4 bg-white text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-50 transition-all active:scale-[0.98]"
          >
            Clear Local Cache
          </button>
        </div>

        <div className="mt-8">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">System Logs</label>
          <div className="p-4 bg-gray-900 rounded-xl w-full break-all font-mono text-[10px] text-green-400 border border-gray-800 leading-relaxed min-h-[120px]">
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}