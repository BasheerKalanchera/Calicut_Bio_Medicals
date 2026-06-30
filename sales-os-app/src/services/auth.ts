import api from "../lib/api";
import { supabase } from "../lib/supabase";

export async function signInWithEmail(email: string, password: string): Promise<unknown> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<unknown> {
  const response = await api.get("/auth/me");
  return response.data.data;
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSession(): Promise<unknown> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
