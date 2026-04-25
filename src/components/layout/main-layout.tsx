import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { MapPin, ChevronDown } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { BottomNav } from "./bottom-nav";
import { useProfile } from "@/hooks/useUser";

export function MainLayout() {
  const { user, openAuthModal } = useAuth();
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const [headerCity, setHeaderCity] = useState(
    () => localStorage.getItem("gather_city") || "Siliguri"
  );

  useEffect(() => {
    const handleStorage = () => {
      setHeaderCity(localStorage.getItem("gather_city") || "Siliguri");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSettings = location.pathname.startsWith("/settings");
  const isProfile = location.pathname === "/profile";
  const isSearch = location.pathname === "/search";
  const isEventDetail = location.pathname.startsWith("/event/");
  const hideHeader = isSettings || isProfile || isSearch || isEventDetail;

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#131312] ${
        isEventDetail ? "pb-0" : "pb-[80px]"
      }`}
    >
      {!hideHeader && (
        <header
          className="sticky top-0 z-50 w-full"
          style={{
            backgroundColor: "rgba(28,28,26,0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 4px 20px rgba(15,15,14,0.4)",
            height: "64px",
          }}
        >
          <div
            className="relative flex h-full w-full items-center justify-between"
            style={{ padding: "0 20px" }}
          >
            {/* LEFT: location */}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-5 w-5 shrink-0" style={{ color: "#FF6B35" }} />
              <span
                className="font-semibold tracking-tight"
                style={{ fontSize: "18px", color: "#E5E2DE" }}
              >
                {headerCity}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "#5A5A52" }}
              />
            </div>

            {/* CENTER: Gather wordmark */}
            <span
              className="absolute left-1/2 -translate-x-1/2 font-bold tracking-tighter pointer-events-none select-none"
              style={{ fontSize: "20px", color: "#E5E2DE" }}
            >
              Gather
            </span>

            {/* RIGHT: avatar / sign-in */}
            {!user ? (
              <button
                className="text-[14px] font-medium active:opacity-70 transition-opacity"
                style={{ color: "#E5E2DE" }}
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
                className="flex items-center justify-center overflow-hidden rounded-full bg-[#2A2A28] text-[14px] font-medium active:opacity-70 transition-opacity shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#E5E2DE",
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

      <main className="flex-1 w-full max-w-5xl mx-auto">
        <Outlet />
      </main>

      {!isEventDetail && <BottomNav />}
      <AuthModal />
    </div>
  );
}
