"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  university: string | null;
  department: string | null;
  tier: "free" | "flash" | "pro";
  daily_usage_count?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getDefaultFullName = (authUser: User) => {
    return (
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "Aether User"
    );
  };

  const syncProfile = useCallback(async (authUser: User) => {
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, university, department, tier")
      .eq("id", authUser.id)
      .maybeSingle();

    if (fetchError) {
      setProfile(null);
      return;
    }

    if (!existingProfile) {
      const { data: createdProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: getDefaultFullName(authUser),
          university: null,
          department: null,
          tier: "free",
        })
        .select("id, email, full_name, university, department, tier")
        .single();

      if (insertError) {
        setProfile(null);
        return;
      }

      setProfile(createdProfile as UserProfile);
      return;
    }

    const updates: Partial<UserProfile> = {};

    if (existingProfile.email !== authUser.email) {
      updates.email = authUser.email ?? null;
    }

    if (!existingProfile.full_name) {
      updates.full_name = getDefaultFullName(authUser);
    }

    if (Object.keys(updates).length === 0) {
      setProfile(existingProfile as UserProfile);
      return;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", authUser.id)
      .select("id, email, full_name, university, department, tier")
      .single();

    if (updateError) {
      setProfile(existingProfile as UserProfile);
      return;
    }

    setProfile(updatedProfile as UserProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setProfile(null);
      return;
    }

    await syncProfile(currentUser);
  }, [syncProfile]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);

      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await syncProfile(currentSession.user);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        if (!isMounted) return;

        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await syncProfile(currentUser);
        } else {
          setProfile(null);
        }

        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const logout = signOut;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        signOut,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};