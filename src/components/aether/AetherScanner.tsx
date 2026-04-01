"use client";

import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

/**
 * @component AetherScanner
 * @description QR Scanner component for academic data input. 
 * Accessibility fixed: Added aria-labels for screen readers.
 */
const AetherScanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    // Academic precision configuration for scanning
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0 
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear().catch(err => console.error("Scanner clear failed", err));
      },
      () => {
        // Silent error logging for UX stability
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        
        {/* Header Section */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">Aether Scanner</h3>
              <p className="text-[10px] text-gray-400 font-mono tracking-tighter">CORE v1.0.4 • SYNC MODE</p>
            </div>
          </div>
          
          {/* Fixed Button: Added title and aria-label to resolve Accessibility Diagnostic */}
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-gray-200 rounded-full transition-all active:scale-90"
            aria-label="Close Scanner"
            title="Close Scanner"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Scanner Interface */}
        <div className="p-6">
          <div 
            id="reader" 
            className="overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50"
          ></div>
          
          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm font-medium text-gray-600">Align QR Code to Begin</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest px-4">
              Syncing physical documents to your secure academic archive
            </p>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="bg-gray-50 p-4 text-center">
          <span className="text-[9px] text-gray-300 font-mono">ENCRYPTED DATA STREAM • AES-256</span>
        </div>
      </div>
    </div>
  );
};

export default AetherScanner;