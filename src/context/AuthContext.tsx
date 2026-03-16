"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';


interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  university: string | null;
  department: string | null;
  tier: 'free' | 'pro' | 'ultra';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null; 
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Profile fetching logic with stable reference
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
  }, []);

  // Syncing logic for new users
  const syncProfile = useCallback(async (authUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || 'Aether User',
          university: 'Begum Rokeya University, Rangpur',
          department: 'Statistics',
          tier: 'free'
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        setProfile(newProfile as UserProfile);
      }
    } else {
      setProfile(data as UserProfile);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) await fetchProfile(currentSession.user.id);
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, syncProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const logout = signOut;

  // Build Shield to prevent Next.js 15 serialization errors
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: true,
      profile: null,
      signOut: async () => {},
      logout: async () => {}
    };
  }
  return context;
};