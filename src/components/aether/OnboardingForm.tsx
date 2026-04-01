"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';

/**
 * @interface OnboardingProps
 * @description Standardized prop definition for seamless integration.
 */
interface OnboardingProps {
  onSuccess: () => void;
}

/**
 * @component OnboardingForm
 * @description Captures user metadata to fulfill Goal 2 and Goal 5.
 * FIXED: Accessibility, Error Handling, and Metadata Precision.
 */
export default function OnboardingForm({ onSuccess }: OnboardingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    department: '',
  });

  /**
   * Data Orchestration:
   * 1. Profiles synchronization (Goal 5).
   * 2. Local persistence update (Goal 2).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Goal 5: Academic persistence in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            full_name: formData.fullName, 
            university: formData.university || "BRUR", 
            department: formData.department || "Statistics",
            is_onboarded: true 
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Goal 2: Synchronize local state with fresh DB record
      localStorage.setItem('aether_user_meta', JSON.stringify({
        id: data.id,
        fullName: data.full_name,
        university: data.university,
        department: data.department,
        is_onboarded: true
      }));

      // Trigger transition in UI
      onSuccess();
      
    } catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  console.error("[ONBOARDING_FAILURE]:", errorMessage);
  alert("Registration failed. Please check your network or database schema.");
} finally {
  setIsSubmitting(false);
}
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-500">
        
        <div className="mb-10 text-center">
          <div className="inline-flex p-3 bg-blue-50 rounded-2xl text-blue-600 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2 uppercase italic">Academic Profile</h2>
          <p className="text-gray-400 font-bold text-[10px] tracking-[0.3em] uppercase">Initialize Research Metadata</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
            <input 
              id="fullName"
              name="fullName"
              type="text"
              required
              disabled={isSubmitting}
              title="Enter your full name"
              className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:border-blue-100 focus:bg-white focus:ring-[12px] focus:ring-blue-50/50 outline-none transition-all font-bold text-gray-700"
              placeholder="e.g. Priom Das"
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="university" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">University</label>
              <input 
                id="university"
                name="university"
                type="text"
                required
                disabled={isSubmitting}
                title="Enter university name"
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:border-blue-100 focus:bg-white focus:ring-[12px] focus:ring-blue-50/50 outline-none transition-all font-bold text-gray-700 text-sm"
                placeholder="BRUR"
                onChange={(e) => setFormData({...formData, university: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dept" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Dept.</label>
              <input 
                id="dept"
                name="dept"
                type="text"
                required
                disabled={isSubmitting}
                title="Enter department name"
                className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-[24px] focus:border-blue-100 focus:bg-white focus:ring-[12px] focus:ring-blue-50/50 outline-none transition-all font-bold text-gray-700 text-sm"
                placeholder="Statistics"
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            title="Confirm and Initialize Session"
            className={`w-full py-6 rounded-[24px] font-black text-white text-[11px] uppercase tracking-[0.4em] transition-all mt-4 flex items-center justify-center gap-3 shadow-xl ${
              isSubmitting 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-gray-900 shadow-blue-100 active:scale-95"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Initialize Session"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}