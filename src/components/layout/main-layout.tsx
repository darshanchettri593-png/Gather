import { useAuth } from "@/lib/auth-context";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Sparkles, User } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";
import { BottomNav } from "./bottom-nav";
import { useProfile } from "@/hooks/useUser";

export function MainLayout() {
  const { user, openAuthModal } = useAuth();
  const { data: profile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  const isSettings = location.pathname.startsWith('/settings');
  const isProfile = location.pathname === '/profile';
  const isSearch = location.pathname === '/search';
  const isEventDetail = location.pathname.startsWith('/event/');
  const hideHeader = isSettings || isProfile || isSearch || isEventDetail;

  return (
    <div className={`flex min-h-screen flex-col bg-background ${isEventDetail ? 'pb-0' : 'pb-[80px]'}`}>
      {!hideHeader && (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md">
          <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-[20px]">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="font-heading text-[17px] font-bold tracking-tight">Gather</span>
              </Link>
            </div>
            
            <nav className="flex items-center gap-4">
              <Link 
                to="/host" 
                className="hidden sm:flex items-center justify-center bg-primary text-white rounded-full px-4 text-sm font-semibold h-8"
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    openAuthModal("Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.", "/host");
                  }
                }}
              >
                Host
              </Link>

              {!user ? (
                <button 
                  className="px-2 py-1.5 text-[14px] font-medium text-[#1A1A1A] active:bg-neutral-100 hover:bg-neutral-100 rounded-md transition-colors"
                  onClick={() => openAuthModal("Quick sign up to join or host events. Takes 10 seconds.", "/")}
                >
                  Sign in
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-7 h-7 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center text-[12px] font-medium text-neutral-600 active:opacity-70 transition-opacity"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.display_name || user?.email || '?').charAt(0).toUpperCase()
                  )}
                </button>
              )}
            </nav>
          </div>
        </header>
      )}

      {/* Main layout wrapper, remove default padding on settings and profile */}
      <main className={`flex-1 w-full max-w-5xl mx-auto ${hideHeader ? '' : 'p-4 sm:p-6'}`}>
        <Outlet />
      </main>

      {!isEventDetail && <BottomNav />}
      <AuthModal />
    </div>
  );
}
