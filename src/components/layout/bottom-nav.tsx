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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5E0]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-[60px] max-w-md mx-auto px-4">

        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
            isActive("/") ? "text-[#1A1A1A]" : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          <Home
            className="h-6 w-6"
            strokeWidth={2}
            fill={isActive("/") ? "currentColor" : "none"}
          />
          <span className={cn("text-[11px]", isActive("/") ? "font-semibold" : "font-normal")}>
            Home
          </span>
        </Link>

        <Link
          to="/search"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
            isActive("/search") ? "text-[#1A1A1A]" : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          <Search
            className="h-6 w-6"
            strokeWidth={isActive("/search") ? 2.5 : 2}
          />
          <span className={cn("text-[11px]", isActive("/search") ? "font-semibold" : "font-normal")}>
            Search
          </span>
        </Link>

        <button
          onClick={handleHostTap}
          className="flex flex-col items-center justify-center w-16 h-full gap-1 transition-opacity active:opacity-70"
        >
          <div
            className={cn(
              "flex items-center justify-center rounded-full w-11 h-11 transition-colors",
              isActive("/host") ? "bg-[#E55A25]" : "bg-[#FF6B35]"
            )}
          >
            <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span
            className={cn(
              "text-[11px]",
              isActive("/host") ? "font-semibold text-[#1A1A1A]" : "font-normal text-neutral-500"
            )}
          >
            Host
          </span>
        </button>

        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
            isActive("/profile") ? "text-[#1A1A1A]" : "text-neutral-500 hover:text-neutral-700"
          )}
        >
          <User
            className="h-6 w-6"
            strokeWidth={2}
            fill={isActive("/profile") ? "currentColor" : "none"}
          />
          <span className={cn("text-[11px]", isActive("/profile") ? "font-semibold" : "font-normal")}>
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
