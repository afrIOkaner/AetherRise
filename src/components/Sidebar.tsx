"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  Zap, 
  Settings, 
  Database, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AETHER_CONFIG } from '@/lib/business-config';

/**
 * @description Sidebar navigation component for AetherRise
 * @location src/components/Sidebar.tsx
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();

  // Navigation menu items mapping
  const menuItems = [
    { name: 'Research Engine', icon: MessageSquare, href: '/' },
    { name: 'Research Vault', icon: Database, href: '/dashboard' },
  ];

  // Secondary system links mapping
  const secondaryItems = [
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40 overflow-y-auto">
      
      {/* Brand Identity Branding Section */}
      <div className="p-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-blue-100">
            <Sparkles className="text-white" size={20} />
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tighter uppercase">
            {AETHER_CONFIG.BRAND.NAME}
          </span>
        </Link>
      </div>

      {/* Primary Navigation Menu */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Core Grid</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-sm font-bold ${isActive ? 'font-black' : ''}`}>{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
              )}
            </Link>
          );
        })}

        {/* System Settings Section */}
        <div className="pt-8 space-y-2">
          <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">System</p>
          {secondaryItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-gray-900 transition-colors group"
            >
              <item.icon size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-bold">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Pro Upgrade Call-to-Action for Free Tier Users */}
      {profile?.tier !== 'pro' && (
        <div className="mx-4 mb-6 p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[32px] relative overflow-hidden group shadow-lg shadow-blue-200">
          <Zap className="absolute -right-2 -top-2 text-white/10 group-hover:scale-150 transition-transform duration-700" size={80} />
          <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-2">Limitless Access</p>
          <h4 className="text-white font-bold text-sm mb-4 leading-tight">Join {AETHER_CONFIG.BRAND.NAME} Pro</h4>
          <Link 
            href="/upgrade" 
            className="block w-full py-3 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase text-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* User Profile Footer with Sign Out Action */}
      <div className="p-4 border-t bg-gray-50/50">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-gray-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-inner">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black text-gray-900 truncate">
                {profile?.full_name || 'Academic'}
              </span>
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">
                {profile?.tier === 'pro' ? '⭐ Pro Member' : 'Standard Tier'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}