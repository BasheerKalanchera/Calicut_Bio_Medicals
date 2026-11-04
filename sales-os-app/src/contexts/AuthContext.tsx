import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { ApiError, setDeliberateSignOut } from "../lib/api";

interface AuthContextValue {
  session: any;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (reason?: "idle") => Promise<void>;
  isAuthenticated: boolean;
  // True for one render cycle right after an explicit signIn() success --
  // never set by session-restore (mount-time getSession()) or token-refresh
  // (onAuthStateChange), so it's a reliable "the user just logged in, not
  // just reopened the tab" signal. Consumers must call clearJustLoggedIn()
  // once they've reacted to it, or it stays true for the rest of the session.
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  // Set only when signOut("idle") was the cause (useIdleLogout) -- lets
  // LoginScreen show a distinct "you were signed out for being idle"
  // message instead of nothing, so it never reads like the silent-redirect
  // bug this same investigation started from. Cleared by the next signOut()
  // that isn't idle-triggered (i.e. a normal manual logout).
  signOutReason: "idle" | null;
  // True when applySession had a valid session but couldn't confirm it with
  // the server after retrying (network/backend issue, not a real 401/403
  // rejection -- see the non-definitive branch below). No actual sign-out
  // happens in this case, but the on-screen state still resets to blank on
  // reload, which looks identical to a real logged-out screen -- this lets
  // LoginScreen tell the user it isn't one. Cleared by the next successful
  // session check or any explicit signOut().
  sessionCheckFailed: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// A network blip or a brief backend restart during the hourly background
// token refresh (Supabase's automatic TOKEN_REFRESHED event) must not be
// treated the same as a definitive rejection (invalid token / deactivated
// account, both surfaced as a 401 -- see backend/app/api/dependencies.py).
// See docs/Auth-Session-Resilience-Implementation-Plan.md Part A.
const AUTH_ME_RETRY_DELAYS_MS = [1000, 3000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isDefinitiveAuthRejection(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]         = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [signOutReason, setSignOutReason] = useState<"idle" | null>(null);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
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
  // True from the moment this tab signs out (button, idle timer, refused
  // session) until the user signs in here again. While on, a stray session
  // -- e.g. a background token refresh that finished just before the
  // sign-out -- must not put the app screens back on top of the login
  // screen. Seen 4 Nov: login screen, app flash for ~0.7 s, login screen.
  const signedOutRef = useRef(false);

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
    // Signed out in this tab and not signed in again here: drop the session.
    if (signedOutRef.current) return;
    // A session restored without signIn() (e.g. a login in another tab) ends
    // the "deliberate sign-out" state set by signOut(), as signIn() would.
    setDeliberateSignOut(false);
    let lastErr: unknown;
    for (let attempt = 0; ; attempt++) {
      try {
        const profile = await getCurrentUser();
        // A sign-out may have happened while /auth/me was in flight.
        if (signedOutRef.current) return;
        setSession(s);
        setUserProfile(profile);
        setSessionCheckFailed(false);
        return;
      } catch (err) {
        lastErr = err;
        if (isDefinitiveAuthRejection(err) || attempt >= AUTH_ME_RETRY_DELAYS_MS.length) break;
        await sleep(AUTH_ME_RETRY_DELAYS_MS[attempt]);
      }
    }
    if (isDefinitiveAuthRejection(lastErr)) {
      await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
    } else {
      // Not a rejection of the login itself (no status, or a 5xx) -- the
      // Supabase JWT is still valid, so keep whatever session/profile state
      // already exists rather than bouncing the user to the login screen.
      // Still surfaced here so a real recurring backend problem is visible.
      console.warn("auth: /auth/me check failed after retries, keeping existing session", lastErr);
      setSessionCheckFailed(true);
    }
    throw lastErr;
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s)
        .catch(() => {})
        .finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        // Whoever signs out -- the button, the idle timer, an expired session
        // -- the previous user's cached data must not outlive it.
        if (event === "SIGNED_OUT") {
          signedOutRef.current = true;
          queryClient.clear();
        }
        if (signingInRef.current) return; // signIn() below already owns this transition
        if (s && signedOutRef.current) return; // stray session after a sign-out
        applySession(s).catch(() => {});
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  async function signIn(email: string, password: string) {
    signingInRef.current = true;
    signedOutRef.current = false;
    // A new login ends the previous sign-out's reason, so an old "idle" never
    // shows on a later forced sign-out.
    setSignOutReason(null);
    setDeliberateSignOut(false);
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
      setJustLoggedIn(true);
    } finally {
      signingInRef.current = false;
    }
  }

  async function signOut(reason?: "idle") {
    // Set before anything else -- supabase.auth.signOut() below triggers its
    // own onAuthStateChange(SIGNED_OUT) event, which independently flips
    // session/isAuthenticated to false via applySession(null) and can reach
    // LoginScreen before this function's own state updates would otherwise
    // run. Setting the reason first means there's no ordering where
    // LoginScreen's first render can see the old (wrong) reason.
    setSignOutReason(reason ?? null);
    setSessionCheckFailed(false);
    // Stray 401s from requests still in flight must not be treated as an
    // expired session (api.ts), and a stray session must not bring the app
    // back (signedOutRef); both cleared again by the next signIn().
    signedOutRef.current = true;
    setDeliberateSignOut(true);
    queryClient.clear();
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    setJustLoggedIn(false);
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
        justLoggedIn,
        clearJustLoggedIn: () => setJustLoggedIn(false),
        signOutReason,
        sessionCheckFailed,
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
