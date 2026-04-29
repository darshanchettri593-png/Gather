import { useState, useEffect } from "react";
import type React from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToast } from "@/components/ui/toast";

type AuthTab = "signup" | "signin";

// Filled box style — 16px font prevents iOS auto-zoom
const INPUT_CLASS =
  "w-full outline-none transition-colors placeholder:text-[#3D3D38] disabled:opacity-50";

const INPUT_STYLE: React.CSSProperties = {
  height: "52px",
  backgroundColor: "#242422",
  border: "1px solid #2A2A28",
  borderRadius: "12px",
  padding: "0 16px",
  fontSize: "16px",
  color: "#F0EEE9",
};

const SUBMIT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "52px",
  marginTop: "16px",
  borderRadius: "999px",
  backgroundColor: "#FF6B35",
  color: "white",
  fontSize: "15px",
  fontWeight: 600,
};

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMessage, authModalRedirectTo } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [tab, setTab]                     = useState<AuthTab>("signup");
  const [name, setName]                   = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [emailError, setEmailError]       = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setTab("signup");
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
      setEmailError(null);
      // Body lock — prevents iOS viewport resize when keyboard opens
      document.body.style.overflow  = "hidden";
      document.body.style.position  = "fixed";
      document.body.style.width     = "100%";
    } else {
      document.body.style.overflow  = "";
      document.body.style.position  = "";
      document.body.style.width     = "";
    }
    return () => {
      document.body.style.overflow  = "";
      document.body.style.position  = "";
      document.body.style.width     = "";
    };
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
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true); setError(null); setEmailError(null); storeIntent();
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name } },
      });
      if (err) throw err;
      if (data.session) { closeAuthModal(); toast("Welcome to Gather!", "success"); }
      else { closeAuthModal(); toast("Check your email to confirm your account", "info"); }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setEmailError("Email already has an account");
      } else {
        setError(friendlyError(msg));
      }
    } finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null); storeIntent();
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      closeAuthModal(); toast("Welcome back!", "success");
    } catch (err: any) {
      setError(friendlyError(err.message));
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email above first"); return; }
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
    setTab(t); setError(null); setEmailError(null);
  };

  const modalContent = (
    <div style={{ padding: "8px 24px 24px" }}>
      {/* Tab row */}
      <div
        className="flex"
        style={{ borderBottom: "1px solid #2A2A28", marginBottom: "28px" }}
      >
        {(["signup", "signin"] as AuthTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className="flex-1 relative transition-colors active:opacity-70"
            style={{
              paddingBottom: "14px",
              fontSize: "15px",
              fontWeight: 700,
              color: tab === t ? "#F0EEE9" : "#6B6B63",
            }}
          >
            {t === "signup" ? "Sign up" : "Sign in"}
            {tab === t && (
              <span
                className="absolute bottom-0 left-0 right-0 rounded-full"
                style={{ height: "2px", backgroundColor: "#FF6B35" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Context message */}
      {authModalMessage && authModalMessage !== "Sign in to continue" && (
        <p
          style={{
            fontSize: "14px",
            color: "#6B6B63",
            marginBottom: "20px",
            lineHeight: 1.5,
          }}
        >
          {authModalMessage}
        </p>
      )}

      {tab === "signup" ? (
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[6px]">
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Full Name
            </label>
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
              style={INPUT_STYLE}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              disabled={loading}
              required
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
            {emailError && (
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "rgba(255,59,48,0.08)",
                  borderRadius: "10px",
                }}
              >
                <p style={{ fontSize: "12px", color: "#FF3B30" }}>
                  {emailError}{" "}
                  <button
                    type="button"
                    onClick={() => switchTab("signin")}
                    style={{ textDecoration: "underline", fontWeight: 700 }}
                  >
                    Sign in instead
                  </button>
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[6px]">
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Password
            </label>
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
              style={INPUT_STYLE}
            />
            {passwordStrength && (
              <p className={`text-[12px] font-bold ${passwordStrength.cls}`}>
                {passwordStrength.label}
              </p>
            )}
          </div>

          {error && (
            <p
              style={{
                fontSize: "13px",
                color: "#FF3B30",
                backgroundColor: "rgba(255,59,48,0.08)",
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || password.length < 8}
            className="active:opacity-80 transition-opacity disabled:opacity-40"
            style={SUBMIT_STYLE}
          >
            {loading ? "Creating account…" : "Join Gather"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-[6px]">
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Email
            </label>
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
              style={INPUT_STYLE}
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: "13px",
                color: "#FF3B30",
                backgroundColor: "rgba(255,59,48,0.08)",
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="active:opacity-80 transition-opacity disabled:opacity-40"
            style={SUBMIT_STYLE}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-center" style={{ paddingTop: "4px" }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{ fontSize: "13px", color: "#6B6B63" }}
              className="active:opacity-60 transition-opacity"
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
        <DialogContent
          className="sm:max-w-[420px] p-0 overflow-hidden rounded-3xl"
          style={{ backgroundColor: "#1C1C1A", border: "1px solid #2A2A28" }}
        >
          <DialogTitle className="sr-only">Authentication</DialogTitle>
          <div style={{ padding: "24px 0 0" }}>{modalContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DrawerContent
        className="rounded-t-3xl px-0"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#1C1C1A",
          borderTop: "1px solid #2A2A28",
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch" as any,
          transform: "translateZ(0)",
          willChange: "transform",
          paddingBottom: "env(safe-area-inset-bottom, 20px)",
        }}
      >
        <DrawerTitle className="sr-only">Authentication</DrawerTitle>
        {/* Drag handle */}
        <div className="flex justify-center" style={{ paddingTop: "12px", paddingBottom: "4px" }}>
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "999px",
              backgroundColor: "#2A2A28",
            }}
          />
        </div>
        {modalContent}
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
