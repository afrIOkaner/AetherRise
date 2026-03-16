import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * @description Updated interface to support both naming conventions (logout and signOut)
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  signOut: () => Promise<void>; // Existing method
  logout: () => Promise<void>;  // Added to match Sidebar usage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial authentication check on component mount
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      setLoading(false);
    };

    initializeAuth();

    // Listener for real-time authentication state changes
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
  }, []);

  /**
   * @description Fetches the user profile from the database
   */
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) setProfile(data);
  };

  /**
   * @description Syncs or creates a new profile for the user
   */
  const syncProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Auto-create profile if it doesn't exist
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

      if (!insertError) setProfile(newProfile);
    } else {
      setProfile(data);
    }
  };

  /**
   * @description Centralized sign out method
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * @description Alias for signOut to maintain compatibility with Sidebar
   */
  const logout = signOut;

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};