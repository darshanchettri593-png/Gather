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

  return (
    <div
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
        padding: '10px 20px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
      }}
    >

        {/* Explore */}
        <Link
          to="/"
          onClick={() => navigator.vibrate?.(10)}
          onContextMenu={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-opacity active:opacity-60"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <Compass
            size={24}
            strokeWidth={isActive("/") ? 2.5 : 1.5}
            color={isActive("/") ? activeColor : inactiveColor}
            fill="none"
          />
          <span className="text-[10px] leading-none" style={{ fontWeight: isActive("/") ? 600 : 400, color: isActive("/") ? activeColor : inactiveColor }}>
            Explore
          </span>
        </Link>

        {/* Search */}
        <Link
          to="/search"
          onClick={() => navigator.vibrate?.(10)}
          onContextMenu={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-opacity active:opacity-60"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <Search
            size={24}
            strokeWidth={1.8}
            color={isActive("/search") ? activeColor : inactiveColor}
            fill="none"
          />
          <span className="text-[10px] leading-none" style={{ fontWeight: isActive("/search") ? 600 : 400, color: isActive("/search") ? activeColor : inactiveColor }}>
            Search
          </span>
        </Link>

        {/* Host — pill button, no label */}
        <button
          onClick={handleHostTap}
          onContextMenu={(e) => e.preventDefault()}
          className="tap-scale flex flex-col items-center justify-center flex-1 h-full transition-opacity active:opacity-70"
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            position: 'relative',
            zIndex: 100,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "24px",
              backgroundColor: "#FF6B35",
            }}
          >
            <Plus size={22} strokeWidth={2} color="white" />
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#FF6B35",
              marginTop: "4px",
              letterSpacing: "0.01em",
            }}
          >
            Host
          </span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          onClick={() => navigator.vibrate?.(10)}
          onContextMenu={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-opacity active:opacity-60"
          style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <User
            size={24}
            strokeWidth={isActive("/profile") ? 2.5 : 1.8}
            color={isActive("/profile") ? activeColor : inactiveColor}
            fill={isActive("/profile") ? "none" : "none"}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: isActive("/profile") ? 600 : 400,
              color: isActive("/profile") ? activeColor : inactiveColor,
              letterSpacing: "0.01em",
              marginTop: "4px",
            }}
          >
            Profile
          </span>
        </Link>

    </div>
  );
}
