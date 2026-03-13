/**
 * @file UpgradeModal.tsx
 * @description Professional payment modal with Launch Offer (149 BDT) UI integration.
 * Finalized for AetherRise commercial launch.
 */

"use client";
import React, { useState } from 'react';
import { AETHER_CONFIG } from '@/lib/business-config';
import { CheckCircle, Zap, ShieldCheck } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'rocket' | 'nagad'>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim() || transactionId.length < 6) {
      alert("Please enter a valid Transaction ID.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
          trx_id: transactionId,
          amount: 149 // Current Launch Price
        }),
      });

      if (response.ok) {
        alert("Success! Your TrxID has been submitted. Account upgrade takes 5-30 mins after manual verification.");
        onClose();
      } else {
        alert("Submission failed. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Payment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
        
        {/* Discount Header Banner */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 py-2 px-4 flex justify-center items-center gap-2">
          <Zap size={14} className="text-white fill-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            Limited Launch Offer: First 50 Users Only
          </span>
        </div>

        <div className="p-8">
          <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">Upgrade to <span className="text-blue-600">Pro</span></h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">Get unlimited research & professional chapter notes.</p>

          {/* Pricing Display */}
          <div className="flex items-center gap-3 mb-8 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 line-through uppercase tracking-widest">Regular 500 BDT</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-blue-600">149</span>
                <span className="text-sm font-bold text-blue-600">BDT</span>
                <span className="text-[10px] font-bold text-green-600 ml-2 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">SAVE 70%</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['bkash', 'rocket', 'nagad'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-3 text-[10px] font-black uppercase rounded-xl border-2 transition-all ${
                  paymentMethod === method 
                  ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' 
                  : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-600 p-5 rounded-3xl mb-6 shadow-xl shadow-blue-100 text-white relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">
                   {AETHER_CONFIG.PAYMENT_METHODS[paymentMethod].type} Personal Number
                </p>
                <p className="text-2xl font-mono font-black tracking-widest">
                  {AETHER_CONFIG.PAYMENT_METHODS[paymentMethod].number}
                </p>
                <div className="flex items-center gap-1 mt-3 opacity-90 text-[10px] font-bold">
                  <ShieldCheck size={12} /> Encrypted Verification
                </div>
             </div>
             <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
          </div>

          {/* Input Field */}
          <div className="mb-8">
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1">Your Transaction ID (TrxID)</label>
            <input
              type="text"
              placeholder="e.g. AH73J92L0X"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 transition-all text-gray-900 font-mono font-bold placeholder:text-gray-300"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePaymentSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 text-xs font-black text-white rounded-2xl transition-all shadow-lg shadow-blue-200 uppercase tracking-[0.1em] ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSubmitting ? 'Verifying Data...' : 'Confirm Payment'}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-2 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;