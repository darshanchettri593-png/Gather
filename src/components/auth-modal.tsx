import { useState, useEffect } from "react";
import type React from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/components/ui/toast";

type AuthTab = "signup" | "signin";

const INPUT_CLASS =
  "w-full h-[48px] border-b border-[#2E2E2C] bg-transparent px-0 text-[16px] text-[#E5E2DE] placeholder:text-[#5A5A52] outline-none focus:border-[#FF6B35] transition-all rounded-none disabled:opacity-50";

const SUBMIT_CLASS =
  "w-full h-[54px] mt-4 rounded-2xl bg-[#FF6B35] text-white text-[16px] font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(255,107,53,0.3)]";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMessage, authModalRedirectTo } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [tab, setTab] = useState<AuthTab>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setTab("signup");
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
      setEmailError(null);
    }
  }, [isAuthModalOpen]);

  const passwordStrength =
    password.length === 0 ? null
    : password.length < 8  ? { label: "Too short", cls: "text-red-500" }
    : password.length < 12 ? { label: "Good",      cls: "text-green-500" }
    :                         { label: "Strong",    cls: "text-green-500" };

  const storeIntent = () => {
    if (authModalRedirectTo.startsWith("/event/")) {
      const eventId = authModalRedirectTo.split("/event/")[1].split("?")[0];
      localStorage.setItem("pending_rsvp_event_id", eventId);
    } else if (authModalRedirectTo === "/host") {
      localStorage.setItem("pending_host_intent", "true");
    } else if (authModalRedirectTo && authModalRedirectTo !== "/events") {
      localStorage.setItem("gather_pending_action", authModalRedirectTo);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setEmailError(null);
    storeIntent();

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });

      if (err) throw err;

      if (data.session) {
        closeAuthModal();
        toast("Welcome to Gather!", "success");
      } else {
        closeAuthModal();
        toast("Check your email to confirm your account", "info");
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setEmailError("Email already has an account");
      } else {
        setError(friendlyError(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    storeIntent();

    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;

      closeAuthModal();
      toast("Welcome back!", "success");
    } catch (err: any) {
      setError(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first");
      return;
    }
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      toast("Check your email for a reset link", "info");
    } catch (err: any) {
      setError(err.message || "Couldn't send reset email");
    }
  };

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setError(null);
    setEmailError(null);
  };

  const modalJsx = (
    <div className="p-8 pt-6">
      {/* Tab row */}
      <div className="flex mb-8 border-b border-[#2E2E2C]">
        {(["signup", "signin"] as AuthTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 pb-4 text-[15px] font-bold transition-all relative ${
              tab === t ? "text-[#E5E2DE]" : "text-[#5A5A52] hover:text-[#9A9A8E]"
            }`}
          >
            {t === "signup" ? "Sign up" : "Sign in"}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF6B35] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Context message */}
      {authModalMessage && authModalMessage !== "Sign in to continue" && (
        <p className="text-[14px] text-[#9A9A8E] mb-6 leading-relaxed font-medium" style={{ color: "#9A9A8E" }}>
          {authModalMessage}
        </p>
      )}

      {tab === "signup" ? (
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#5A5A52] uppercase tracking-wider px-1">Full Name</label>
            <input
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="Elon Musk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#5A5A52] uppercase tracking-wider px-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
            {emailError && (
              <div className="mt-2 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-[12px] text-red-500 font-medium">
                  {emailError}{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("signin")}
                    className="underline font-bold"
                  >
                    Sign in instead
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#5A5A52] uppercase tracking-wider px-1">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              className={INPUT_CLASS}
            />
            {passwordStrength && (
              <p className={`text-[12px] mt-2 font-bold ${passwordStrength.cls}`}>
                {passwordStrength.label}
              </p>
            )}
          </div>

          {error && <p className="text-[13px] text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || password.length < 8}
            className={SUBMIT_CLASS}
          >
            {loading ? "Creating account…" : "Join Gather"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#5A5A52] uppercase tracking-wider px-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#5A5A52] uppercase tracking-wider px-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
            />
          </div>

          {error && <p className="text-[13px] text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className={SUBMIT_CLASS}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[13px] text-[#5A5A52] font-bold hover:text-[#9A9A8E] transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-3xl border border-[#2E2E2C] bg-[#242422] shadow-2xl">
          <DialogTitle className="sr-only">Authentication</DialogTitle>
          {modalJsx}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DrawerContent className="rounded-t-3xl border-t border-[#2E2E2C] bg-[#242422] px-0">
        <DrawerTitle className="sr-only">Authentication</DrawerTitle>
        <div className="mx-auto mt-4 mb-2 h-1.5 w-[40px] rounded-full" style={{ backgroundColor: "#383836" }} />
        {modalJsx}
      </DrawerContent>
    </Drawer>
  );
}

function friendlyError(message: string): string {
  if (!message) return "Something went wrong";
  if (message.includes("Invalid login credentials")) return "Wrong email or password";
  if (message.includes("Email not confirmed")) return "Please confirm your email first";
  if (message.includes("User already registered")) return "An account with this email already exists — try signing in";
  if (message.includes("Password should be")) return "Password must be at least 8 characters";
  if (message.includes("Unable to validate email")) return "Enter a valid email address";
  return message;
}
