import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  roleLoading: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const resolvedRoleUserRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async (userId: string) => {
      if (resolvedRoleUserRef.current === userId) return;
      setRoleLoading(true);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        
        if (!isMounted) return;

        if (error) {
          setIsAdmin(false);
        } else {
          const is_admin = !!data;
          setIsAdmin(is_admin);
          resolvedRoleUserRef.current = userId;
        }
      } catch (err) {
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setRoleLoading(false);
      }
    };

    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchRole(initialSession.user.id);
        } else {
          setRoleLoading(false);
        }
      } catch (err) {
        if (isMounted) setRoleLoading(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!isMounted) return;
      
      setSession(s);
      setUser(s?.user ?? null);
      
      if (s?.user) {
        await fetchRole(s.user.id);
      } else if (event === ("SIGNED_OUT" as any)) {
        resolvedRoleUserRef.current = null;
        setIsAdmin(false);
        setRoleLoading(false);
      }
      
      setLoading(false);
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    return { error: error?.message ?? null };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ user, session, isAdmin, roleLoading, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
