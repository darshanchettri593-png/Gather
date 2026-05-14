import { Compass, Search, Plus, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === "/") return path === "/" || path === "/events";
    if (route === "/search") return path === "/search";
    if (route === "/profile") return path === "/profile";
    return false;
  };

  const handleHostTap = () => {
    navigator.vibrate?.(10);
    if (user) {
      navigate("/host");
    } else {
      openAuthModal(
        "Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.",
        "/host"
      );
    }
  };

  const activeColor = "#F0EEE9";
  const inactiveColor = "#6B6B63";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <div
      id="bottom-nav"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        right: '16px',
        backgroundColor: 'rgba(28,28,26,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '100px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 0px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }}
    >
      <Link
        to="/"
        onClick={() => { navigator.vibrate?.(10); scrollToTop(); }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        <Compass size={24} strokeWidth={isActive("/") ? 2.5 : 1.5} color={isActive("/") ? activeColor : inactiveColor} fill="none" />
        <span style={{ fontSize: '10px', lineHeight: 1, fontWeight: isActive("/") ? 600 : 400, color: isActive("/") ? activeColor : inactiveColor }}>Explore</span>
      </Link>

      <Link
        to="/search"
        onClick={() => { navigator.vibrate?.(10); scrollToTop(); }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        <Search size={24} strokeWidth={1.8} color={isActive("/search") ? activeColor : inactiveColor} fill="none" />
        <span style={{ fontSize: '10px', lineHeight: 1, fontWeight: isActive("/search") ? 600 : 400, color: isActive("/search") ? activeColor : inactiveColor }}>Search</span>
      </Link>

      <button
        onClick={handleHostTap}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#FF6B35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={22} strokeWidth={2} color="white" />
        </div>
        <span style={{ fontSize: '10px', lineHeight: 1, fontWeight: 600, color: '#FF6B35' }}>Host</span>
      </button>

      <Link
        to="/profile"
        onClick={() => { navigator.vibrate?.(10); scrollToTop(); }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, WebkitTouchCallout: 'none', userSelect: 'none' }}
      >
        <User size={24} strokeWidth={isActive("/profile") ? 2.5 : 1.8} color={isActive("/profile") ? activeColor : inactiveColor} fill="none" />
        <span style={{ fontSize: '10px', lineHeight: 1, fontWeight: isActive("/profile") ? 600 : 400, color: isActive("/profile") ? activeColor : inactiveColor }}>Profile</span>
      </Link>
    </div>
  );
}
