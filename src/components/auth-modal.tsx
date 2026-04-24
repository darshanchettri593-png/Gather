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
  "w-full h-[44px] border-b border-[#E5E5E0] bg-transparent px-0 text-[16px] text-[#1A1A1A] placeholder:text-neutral-400 outline-none focus:border-[#1A1A1A] transition-colors rounded-none disabled:opacity-50";

const SUBMIT_CLASS =
  "w-full h-[52px] mt-2 rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-transform";

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
  // Separate error shown inline below the email field (e.g. already registered)
  const [emailError, setEmailError] = useState<string | null>(null);

  // Reset all fields whenever the modal opens
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

  // Password strength (only shown on sign-up tab while typing)
  const passwordStrength =
    password.length === 0 ? null
    : password.length < 8  ? { label: "Too short", cls: "text-[#FF3B30]" }
    : password.length < 12 ? { label: "Good",      cls: "text-[#34C759]" }
    :                         { label: "Strong",    cls: "text-[#34C759]" };

  // Store the user's pending intent in localStorage so handlePostLoginAction
  // (in auth-context.tsx) can redirect after onAuthStateChange fires.
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
      console.log("[Auth] signUp:", email);
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
      console.error("[Auth] signUp error:", err);
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
      console.log("[Auth] signInWithPassword:", email);
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;

      closeAuthModal();
      toast("Welcome back!", "success");
    } catch (err: any) {
      console.error("[Auth] signIn error:", err);
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

  // Inline JSX — never extract as <InnerComponent /> or React remounts on each
  // parent render, resetting input focus on every keystroke.
  const modalJsx = (
    <div className="p-6 pt-4">
      {/* Tab row */}
      <div className="flex mb-5 border-b border-[#E5E5E0]">
        {(["signup", "signin"] as AuthTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 pb-3 text-[15px] font-medium transition-colors relative ${
              tab === t ? "text-[#1A1A1A]" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {t === "signup" ? "Sign up" : "Sign in"}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Context message */}
      {authModalMessage && authModalMessage !== "Sign in to continue" && (
        <p className="text-[14px] text-neutral-500 mb-5 leading-relaxed">
          {authModalMessage}
        </p>
      )}

      {tab === "signup" ? (
        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            autoComplete="name"
            autoFocus
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            className={INPUT_CLASS}
          />
          <div>
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
              <div className="mt-1.5 space-y-0.5">
                <p className="text-[12px] text-[#FF3B30]">
                  {emailError}{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("signin")}
                    className="underline font-medium hover:opacity-80"
                  >
                    Sign in instead
                  </button>
                </p>
                <p className="text-[11px] text-neutral-400">
                  Just deleted your account? Wait a moment then try again.
                </p>
              </div>
            )}
          </div>

          <div>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              className={INPUT_CLASS}
            />
            {passwordStrength && (
              <p className={`text-[12px] mt-1.5 font-medium ${passwordStrength.cls}`}>
                {passwordStrength.label}
              </p>
            )}
          </div>

          {error && <p className="text-[13px] text-[#FF3B30] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || password.length < 8}
            className={SUBMIT_CLASS}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
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
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className={INPUT_CLASS}
          />

          {error && <p className="text-[13px] text-[#FF3B30] font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className={SUBMIT_CLASS}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors"
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
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl border-0 shadow-xl">
          <DialogTitle className="sr-only">Authentication</DialogTitle>
          {modalJsx}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DrawerContent className="rounded-t-3xl border-0 px-0">
        <DrawerTitle className="sr-only">Authentication</DrawerTitle>
        <div className="mx-auto mt-2 mb-2 h-1 w-[40px] rounded-full bg-[#E5E5E0]" />
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
