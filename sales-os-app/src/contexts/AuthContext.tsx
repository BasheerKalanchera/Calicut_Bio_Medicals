import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";

interface AuthContextValue {
  session: any;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]         = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const queryClient = useQueryClient();
  // True while signIn() below is actively driving a login attempt end to
  // end -- guards the onAuthStateChange listener from *also* reacting to
  // that same login (Supabase fires it on its own the instant
  // signInWithPassword succeeds, independent of signIn()'s sequencing).
  // Without this, both signIn() and the listener independently call
  // getCurrentUser()/signOut() for the same event; one's signOut() can
  // invalidate the session out from under the other's in-flight request,
  // and having two uncoordinated handlers race to set/clear state is what
  // caused the login error to flash and then disappear (a rapid
  // double-submit was also part of it -- see signIn()'s comment below).
  const signingInRef = useRef(false);

  // Supabase Auth has no idea user_profile.is_active exists -- it's a plain
  // app-level column, not synced to Auth, so a deactivated account's
  // credentials remain perfectly valid there. /auth/me (get_current_user)
  // is the only place that actually checks is_active. setSession(s) is
  // deliberately called only on the *success* path here, never before the
  // check -- isAuthenticated (session-based) must never flip true and then
  // immediately false, or AuthGate flashes the app shell before reverting
  // to the login screen.
  async function applySession(s: any): Promise<void> {
    if (!s) {
      setSession(null);
      setUserProfile(null);
      return;
    }
    try {
      const profile = await getCurrentUser();
      setSession(s);
      setUserProfile(profile);
    } catch (err) {
      await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
      throw err;
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s)
        .catch(() => {})
        .finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (signingInRef.current) return; // signIn() below already owns this transition
        applySession(s).catch(() => {});
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    signingInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Awaited directly and to completion -- signIn()'s promise doesn't
      // resolve until this finishes, so LoginScreen's loading state (and
      // the disabled submit button) covers the whole check, not just the
      // Auth call. That's what actually prevents the double-submit that
      // was clearing the error: previously this returned as soon as Auth
      // accepted the credentials, re-enabling the button before the
      // is_active check had even run.
      await applySession(data.session);
    } finally {
      signingInRef.current = false;
    }
  }

  async function signOut() {
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userProfile,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
