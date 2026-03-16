"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] p-6 text-center">
      <div className="bg-blue-50 p-6 rounded-full text-blue-600 mb-6">
        <FileQuestion size={48} />
      </div>
      <h1 className="text-4xl font-black text-gray-900 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The research asset or page you are looking for does not exist or has been moved.
      </p>
      <Link 
        href="/" 
        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
      >
        <ArrowLeft size={18} /> Back to Engine
      </Link>
    </div>
  );
}