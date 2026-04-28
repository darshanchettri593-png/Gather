import { Compass, Search, Plus, User } from "lucide-react";
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
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: "#1C1C1A",
        borderTop: "1px solid #2E2E2C",
        boxShadow: "0 -8px 30px rgba(15,15,14,0.6)",
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
      }}
    >
      <div className="flex items-center justify-around min-h-[60px] py-2 max-w-md mx-auto">

        <Link
          to="/"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-all active:scale-95",
            isActive("/") ? "text-[#FF6B35]" : "text-[#5A5A52]"
          )}
        >
          <Compass
            className="h-6 w-6"
            strokeWidth={isActive("/") ? 2 : 1.5}
          />
          <span
            className={cn(
              "text-[11px] font-medium whitespace-nowrap",
              isActive("/") && "text-[#FF6B35]"
            )}
          >
            Explore
          </span>
        </Link>

        <Link
          to="/search"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-all active:scale-95",
            isActive("/search") ? "text-[#FF6B35]" : "text-[#5A5A52]"
          )}
        >
          <Search className="h-6 w-6" strokeWidth={1.5} />
          <span
            className={cn(
              "text-[11px] font-medium whitespace-nowrap",
              isActive("/search") && "text-[#FF6B35]"
            )}
          >
            Search
          </span>
        </Link>

        <button
          onClick={handleHostTap}
          className="flex flex-col items-center justify-center flex-1 min-w-0 h-full transition-all active:scale-95 active:opacity-70"
        >
          <div
            className="flex items-center justify-center w-[56px] h-[28px] rounded-full"
            style={{
              backgroundColor: "#FF6B35",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 8px rgba(255,107,53,0.35)",
            }}
          >
            <Plus className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-[11px] text-[#FF6B35] font-semibold mt-[4px]">
            Host
          </span>
        </button>

        <Link
          to="/profile"
          className={cn(
            "flex flex-col items-center justify-center flex-1 min-w-0 h-full gap-1 transition-all active:scale-95",
            isActive("/profile") ? "text-[#FF6B35]" : "text-[#5A5A52]"
          )}
        >
          <User
            className="h-6 w-6"
            strokeWidth={1.5}
            fill={isActive("/profile") ? "currentColor" : "none"}
          />
          <span
            className={cn(
              "text-[11px] font-medium whitespace-nowrap",
              isActive("/profile") && "text-[#FF6B35]"
            )}
          >
            Profile
          </span>
        </Link>

      </div>
    </div>
  );
}
