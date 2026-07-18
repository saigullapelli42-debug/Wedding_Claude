import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthStatus = "loading" | "signed-out" | "signed-in-not-admin" | "admin";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  async function evaluate(nextSession: Session | null) {
    setSession(nextSession);
    if (!nextSession) {
      setStatus("signed-out");
      return;
    }

    // Try to become admin if no admin exists yet (first-run bootstrap), then check role.
    try {
      await supabase.rpc("bootstrap_first_admin");
    } catch {
      // ignore — not fatal, we still check is_admin below
    }
    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      setStatus("signed-in-not-admin");
      return;
    }
    setStatus(data ? "admin" : "signed-in-not-admin");
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      evaluate(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      evaluate(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ status, session, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
