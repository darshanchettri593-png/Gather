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
    navigator.vibrate(10);
    if (user) {
      navigate("/host");
    } else {
      openAuthModal(
        "Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.",
        "/host"
      );
    }
  };

  const activeColor = "#FF6B35";
  const inactiveColor = "#6B6B63";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "#1C1C1A",
        borderTop: "1px solid #2A2A28",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        height: "64px",
      }}
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto px-2">

        {/* Explore */}
        <Link
          to="/"
          onClick={() => navigator.vibrate(10)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-opacity active:opacity-60"
        >
          <Compass
            size={22}
            strokeWidth={isActive("/") ? 2.5 : 1.5}
            color={isActive("/") ? activeColor : inactiveColor}
            fill={isActive("/") ? "rgba(255,107,53,0.15)" : "none"}
            style={{ display: "block" }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: isActive("/") ? 600 : 400,
              color: isActive("/") ? activeColor : inactiveColor,
              letterSpacing: "0.01em",
            }}
          >
            Explore
          </span>
        </Link>

        {/* Search */}
        <Link
          to="/search"
          onClick={() => navigator.vibrate(10)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-opacity active:opacity-60"
        >
          <Search
            size={22}
            strokeWidth={1.8}
            color={isActive("/search") ? activeColor : inactiveColor}
            fill="none"
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: isActive("/search") ? 600 : 400,
              color: isActive("/search") ? activeColor : inactiveColor,
              letterSpacing: "0.01em",
            }}
          >
            Search
          </span>
        </Link>

        {/* Host — pill button, no label */}
        <button
          onClick={handleHostTap}
          className="flex flex-col items-center justify-center flex-1 h-full transition-opacity active:opacity-70"
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "52px",
              height: "28px",
              borderRadius: "999px",
              backgroundColor: "#FF6B35",
            }}
          >
            <Plus size={20} strokeWidth={2} color="white" />
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#FF6B35",
              marginTop: "3px",
              letterSpacing: "0.01em",
            }}
          >
            Host
          </span>
        </button>

        {/* Profile */}
        <Link
          to="/profile"
          onClick={() => navigator.vibrate(10)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-opacity active:opacity-60"
        >
          <User
            size={22}
            strokeWidth={isActive("/profile") ? 2.5 : 1.8}
            color={isActive("/profile") ? activeColor : inactiveColor}
            fill={isActive("/profile") ? "rgba(255,107,53,0.15)" : "none"}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: isActive("/profile") ? 600 : 400,
              color: isActive("/profile") ? activeColor : inactiveColor,
              letterSpacing: "0.01em",
            }}
          >
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
