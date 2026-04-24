import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMessage: string;
  authModalRedirectTo: string;
  openAuthModal: (message?: string, redirectTo?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  isAuthModalOpen: false,
  authModalMessage: "",
  authModalRedirectTo: "",
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("");
  const [authModalRedirectTo, setAuthModalRedirectTo] = useState("");

  const openAuthModal = (message = "Sign in to continue", redirectTo = "/events") => {
    setAuthModalMessage(message);
    setAuthModalRedirectTo(redirectTo);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      handlePostLoginAction(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        handlePostLoginAction(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostLoginAction = (session: Session | null) => {
    if (!session) return;

    const pendingHostIntent = localStorage.getItem("pending_host_intent");
    if (pendingHostIntent) {
      localStorage.removeItem("pending_host_intent");
      window.location.href = "/host";
      return;
    }

    const pendingAction = localStorage.getItem("gather_pending_action");
    if (pendingAction) {
      localStorage.removeItem("gather_pending_action");
      window.location.href = pendingAction;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      signOut,
      isAuthModalOpen,
      authModalMessage,
      authModalRedirectTo,
      openAuthModal,
      closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
