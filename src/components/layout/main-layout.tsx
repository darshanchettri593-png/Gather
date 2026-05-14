import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Outlet, useLocation, useNavigate } from "react-router";
import { MapPin } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { BottomNav } from "./bottom-nav";
import { useProfile } from "@/hooks/useUser";
import { ProfileGate } from "@/components/ProfileGate";
import { supabase } from "@/lib/supabase";

export function MainLayout() {
  const { user, openAuthModal } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [profileComplete, setProfileComplete] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [headerState, setHeaderState] = useState(
    () => localStorage.getItem("gather_city") || localStorage.getItem("gather_state") || "India"
  );

  useEffect(() => {
    const cached = localStorage.getItem('gather_city');
    if (cached) {
      setHeaderState(cached);
      return;
    }

    const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
      try {
        const response = await fetch(
          `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lon}&api_key=${import.meta.env.VITE_OLA_MAPS_KEY}`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const components = result.address_components || [];
          const city =
            components.find((c: any) => c.types?.includes('locality'))?.long_name ||
            components.find((c: any) => c.types?.includes('administrative_area_level_2'))?.long_name ||
            components.find((c: any) => c.types?.includes('administrative_area_level_1'))?.long_name ||
            result.formatted_address?.split(',')[0] ||
            'Nearby';
          return city;
        }
        return 'Nearby';
      } catch (err) {
        console.error('OLA reverse geocode error:', err);
        return 'Nearby';
      }
    };

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setHeaderState(city);
        localStorage.setItem('gather_city', city);
        localStorage.setItem('gather_lat', String(pos.coords.latitude));
        localStorage.setItem('gather_lng', String(pos.coords.longitude));
        if (user) {
          supabase.from('users').update({ location: city }).eq('id', user.id);
        }
      } catch {
        // Keep existing value
      }
    }, () => {
      // GPS denied — keep existing value
    });
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
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
            minHeight: "56px",
            height: "auto",
          }}
        >
          <div
            className="flex h-full w-full items-center justify-between"
            style={{ padding: "0 20px" }}
          >
            {/* LEFT: state location — opens state picker */}
            <div className="flex items-center gap-[6px]">
              <MapPin
                size={16}
                strokeWidth={2}
                style={{ color: "#F0EEE9", flexShrink: 0 }}
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
            </div>

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
        style={{ paddingBottom: '100px' }}
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
