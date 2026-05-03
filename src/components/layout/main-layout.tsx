import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Outlet, useLocation, useNavigate } from "react-router";
import { MapPin, ChevronDown } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { BottomNav } from "./bottom-nav";
import { useProfile } from "@/hooks/useUser";
import { ProfileGate } from "@/components/ProfileGate";

export function MainLayout() {
  const { user, openAuthModal } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [headerState, setHeaderState] = useState(
    () => localStorage.getItem("gather_state") || "West Bengal"
  );

  useEffect(() => {
    const handleStorage = () => {
      setHeaderState(localStorage.getItem("gather_state") || "West Bengal");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSettings  = location.pathname.startsWith("/settings");
  const isProfile   = location.pathname === "/profile";
  const isSearch    = location.pathname === "/search";
  const isEventDetail = location.pathname.startsWith("/event/");
  const hideHeader  = isSettings || isProfile || isSearch || isEventDetail;

  return (
    <div
      className={`flex min-h-screen flex-col ${isEventDetail ? "pb-0" : "pb-[64px]"}`}
      style={{ backgroundColor: "#111110" }}
    >
      {!hideHeader && (
        <header
          className="sticky top-0 z-50 w-full"
          style={{
            backgroundColor: "rgba(17,17,16,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid #2A2A28",
            height: "56px",
          }}
        >
          <div
            className="flex h-full w-full items-center justify-between"
            style={{ padding: "0 20px" }}
          >
            {/* LEFT: state location — opens state picker */}
            <button
              className="flex items-center gap-[6px] active:opacity-60 transition-opacity"
              onClick={() => window.dispatchEvent(new CustomEvent("gather:open-city-picker"))}
            >
              <MapPin
                size={16}
                strokeWidth={2}
                style={{ color: "#FF6B35", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#F0EEE9",
                  whiteSpace: "nowrap",
                }}
              >
                {headerState}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                style={{ color: "#6B6B63", flexShrink: 0 }}
              />
            </button>

            {/* RIGHT: avatar or sign-in */}
            {!user ? (
              <button
                style={{ fontSize: "14px", fontWeight: 500, color: "#FF6B35" }}
                className="active:opacity-60 transition-opacity"
                onClick={() =>
                  openAuthModal(
                    "Quick sign up to join or host events. Takes 10 seconds.",
                    "/"
                  )
                }
              >
                Sign in
              </button>
            ) : (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center justify-center overflow-hidden rounded-full active:opacity-60 transition-opacity shrink-0"
                style={{
                  width: "34px",
                  height: "34px",
                  border: "1px solid #2A2A28",
                  backgroundColor: "#242422",
                  color: "#F0EEE9",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (profile?.display_name || user?.email || "?")
                    .charAt(0)
                    .toUpperCase()
                )}
              </button>
            )}
          </div>
        </header>
      )}

      <main
        className="tab-transition flex-1 w-full max-w-5xl mx-auto"
      >
        <Outlet />
      </main>

      {!isEventDetail && <BottomNav />}
      <AuthModal />
      {!!user && !profileLoading && !!profile && (!profile.date_of_birth || !profile.gender) && !profileComplete && (
        <ProfileGate onComplete={() => setProfileComplete(true)} />
      )}
    </div>
  );
}
