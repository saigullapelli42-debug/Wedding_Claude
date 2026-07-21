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

/** Wraps a single site's /admin area. Checks admin status for THAT site only. */
export function SiteAdminAuthProvider({
  siteId,
  children,
}: {
  siteId: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  async function evaluate(nextSession: Session | null) {
    setSession(nextSession);
    if (!nextSession) {
      setStatus("signed-out");
      return;
    }
    // Bootstrap: if this specific site has no admin yet, the first logged-in
    // user to land here becomes its admin.
    try {
      await supabase.rpc("bootstrap_first_site_admin", { target_site_id: siteId });
    } catch {
      // ignore — not fatal, we still check is_site_admin below
    }
    const { data, error } = await supabase.rpc("is_site_admin", { check_site_id: siteId });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

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
  if (!ctx) throw new Error("useAdminAuth must be used within SiteAdminAuthProvider");
  return ctx;
}

/** Simpler context for the top-level /admin sites directory: just "is anyone logged in". */
interface AccountAuthValue {
  status: "loading" | "signed-out" | "signed-in";
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
const AccountAuthContext = createContext<AccountAuthValue | null>(null);

export function AccountAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "signed-in" : "signed-out");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "signed-in" : "signed-out");
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
    <AccountAuthContext.Provider value={{ status, session, signIn, signOut }}>
      {children}
    </AccountAuthContext.Provider>
  );
}

export function useAccountAuth() {
  const ctx = useContext(AccountAuthContext);
  if (!ctx) throw new Error("useAccountAuth must be used within AccountAuthProvider");
  return ctx;
}
