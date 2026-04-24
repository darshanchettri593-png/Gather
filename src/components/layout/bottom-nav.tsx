import { Home, Search, Plus, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === "/") return path === "/" || path === "/events";
    if (route === "/host") return path === "/host";
    if (route === "/search") return path === "/search";
    if (route === "/profile") return path === "/profile";
    return path.startsWith(route);
  };

  const handleHostTap = () => {
    if (user) {
      navigate("/host");
    } else {
      openAuthModal(
        "Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.",
        "/host"
      );
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E5E5E0]"
      style={{ 
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around h-[72px] max-w-md mx-auto">

        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-colors",
            isActive("/") ? "text-[#1A1A1A]" : "text-[#ADADAD]"
          )}
        >
          <Home
            className="h-6 w-6"
            strokeWidth={1.5}
            fill={isActive("/") ? "currentColor" : "none"}
          />
          <span className={cn("text-[10px] whitespace-nowrap", isActive("/") ? "font-semibold text-[#1A1A1A]" : "font-normal text-[#ADADAD]")}>
            Home
          </span>
        </Link>

        <Link
          to="/search"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-colors",
            isActive("/search") ? "text-[#1A1A1A]" : "text-[#ADADAD]"
          )}
        >
          <Search
            className="h-6 w-6"
            strokeWidth={1.5}
          />
          <span className={cn("text-[10px] whitespace-nowrap", isActive("/search") ? "font-semibold text-[#1A1A1A]" : "font-normal text-[#ADADAD]")}>
            Search
          </span>
        </Link>

        <button
          onClick={handleHostTap}
          className="flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-opacity active:opacity-70"
        >
          <div
            className="flex items-center justify-center rounded-full w-[52px] h-[52px] -mt-3"
            style={{ 
              backgroundColor: "#FF6B35",
              boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
            }}
          >
            <Plus className="h-[22px] w-[22px] text-white" strokeWidth={2} />
          </div>
        </button>

        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-colors",
            isActive("/profile") ? "text-[#1A1A1A]" : "text-[#ADADAD]"
          )}
        >
          <User
            className="h-6 w-6"
            strokeWidth={1.5}
            fill={isActive("/profile") ? "currentColor" : "none"}
          />
          <span className={cn("text-[10px] whitespace-nowrap", isActive("/profile") ? "font-semibold text-[#1A1A1A]" : "font-normal text-[#ADADAD]")}>
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
