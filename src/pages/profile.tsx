import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { Settings as SettingsIcon, MapPin, CalendarRange, Users, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserEvents, useProfile } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUploader } from "@/components/ui/image-uploader";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEventRatingSummary, useProfileRatings } from "@/hooks/useRatings";
import { StarDisplay } from "@/components/rating-section";

interface EmptyStateProps {
  icon: React.ElementType;
  heading: string;
  subtext: string;
  buttonText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, heading, subtext, buttonText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center mt-[80px]">
      <Icon className="h-12 w-12 mb-4" strokeWidth={1.5} style={{ color: "#5A5A52" }} />
      <h3 className="font-semibold mb-1.5" style={{ fontSize: "24px", color: "#E5E2DE" }}>
        {heading}
      </h3>
      <p className="max-w-[260px]" style={{ fontSize: "14px", color: "#9A9A8E" }}>
        {subtext}
      </p>
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-8 rounded-full text-white font-semibold active:scale-[0.98] transition-transform"
          style={{
            height: "52px",
            backgroundColor: "#FF6B35",
            fontSize: "16px",
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

function EventCard({ event, isPast }: { event: any; isPast: boolean }) {
  const { data: ratingSummary } = useEventRatingSummary(event.id, isPast);

  return (
    <Link
      to={`/event/${event.id}`}
      className={`block relative group ${isPast ? "opacity-[0.65]" : ""}`}
    >
      <div
        className="glass-card rounded-xl overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="h-[140px] w-full shrink-0 relative overflow-hidden bg-[#242422]">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className={`h-full w-full object-cover transition-all duration-500 ${isPast ? "grayscale group-hover:grayscale-0" : ""}`}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: "rgba(255,107,53,0.30)" }}>
                Gather
              </span>
            </div>
          )}
          {isPast && (
            <div
              className="absolute top-3 right-3 px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm"
              style={{
                border: "1px solid #FF6B35",
                color: "#FF6B35",
                backgroundColor: "rgba(19,19,18,0.90)",
              }}
            >
              Past
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-1.5">
          <h3 className="font-semibold leading-snug line-clamp-1" style={{ fontSize: "17px", color: "#E5E2DE" }}>
            {event.title}
          </h3>
          <div className="flex justify-between items-center">
            <p className="font-medium" style={{ fontSize: "13px", color: "#9A9A8E" }}>
              {format(new Date(event.event_datetime), "MMM d, h:mm a")}
            </p>
            <p style={{ fontSize: "12px", color: "#5A5A52" }}>
              {event._count?.attendees || 0} attending
            </p>
          </div>
          {isPast && (
            <div className="mt-0.5">
              {ratingSummary ? (
                <StarDisplay avg={ratingSummary.avg} count={ratingSummary.count} />
              ) : (
                <span style={{ fontSize: "12px", color: "#5A5A52" }}>Not yet rated</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"hosting" | "joined">("hosting");
  const [showPastEvents, setShowPastEvents] = useState(false);

  const { data: userEvents, isLoading: isEventsLoading } = useUserEvents();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: profileRatings } = useProfileRatings(user?.id);

  const updateAvatarMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const isLoading = isEventsLoading || isProfileLoading;

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const rawEvents = activeTab === "hosting" ? userEvents?.hosted : userEvents?.joined;
    if (!rawEvents) return { upcomingEvents: [], pastEvents: [] };
    const now = new Date();
    const upcoming = rawEvents
      .filter((e) => new Date(e.event_datetime) >= now)
      .sort((a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime());
    const past = rawEvents
      .filter((e) => new Date(e.event_datetime) < now)
      .sort((a, b) => new Date(b.event_datetime).getTime() - new Date(a.event_datetime).getTime());
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [userEvents, activeTab]);

  const switchTab = useCallback((tab: "hosting" | "joined") => {
    setActiveTab(tab);
    setShowPastEvents(false);
  }, []);

  const joinDate = user?.created_at ? format(new Date(user.created_at), "MMMM yyyy") : "";

  if (!user) {
    return (
      <div className="page-transition profile-mesh max-w-md mx-auto min-h-screen bg-[#131312] pb-[100px] flex flex-col pt-4">
        <div className="flex items-center justify-between py-4 px-5">
          <h1
            className="font-extrabold text-[#E5E2DE]"
            style={{ fontSize: "32px", letterSpacing: "-0.5px" }}
          >
            Profile
          </h1>
          <button onClick={() => navigate("/settings")} className="active:opacity-70" style={{ color: "#9A9A8E" }}>
            <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center px-4 pt-[15vh]">
          <div
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center mb-2"
            style={{ backgroundColor: "#242422", border: "1px solid #2E2E2C", color: "#5A5A52" }}
          >
            <UserIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="font-semibold text-[#E5E2DE] mt-4" style={{ fontSize: "20px" }}>
            Your profile lives here
          </h2>
          <p className="mt-2 max-w-[280px]" style={{ fontSize: "14px", color: "#9A9A8E" }}>
            Sign in to host events, track who's coming, and see what you've joined.
          </p>
          <button
            onClick={() =>
              openAuthModal(
                "Sign in to host events, track who's coming, and see what you've joined.",
                "/profile"
              )
            }
            className="mt-6 rounded-full text-white font-semibold active:scale-[0.98] transition-transform"
            style={{ width: "160px", height: "44px", backgroundColor: "#FF6B35", fontSize: "16px" }}
          >
            Sign in
          </button>
          <Link to="/" className="mt-4 hover:text-[#9A9A8E] transition-colors" style={{ fontSize: "13px", color: "#5A5A52" }}>
            Just browsing? Keep exploring.
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition profile-mesh max-w-md mx-auto min-h-screen bg-[#131312] pb-[100px] flex flex-col pt-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5">
        <h1
          className="font-extrabold text-[#E5E2DE]"
          style={{ fontSize: "32px", letterSpacing: "-0.5px" }}
        >
          Profile
        </h1>
        <button onClick={() => navigate("/settings")} className="active:opacity-70" style={{ color: "#9A9A8E" }}>
          <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6 mt-4 px-4">
          <Skeleton className="h-[200px] w-full rounded-3xl bg-[#242422]" />
        </div>
      ) : (
        <>
          {/* Profile hero */}
          <div className="flex flex-col items-center px-4 pb-6">
            {/* Avatar with glow */}
            <div className="relative mb-4">
              {/* Orange glow behind avatar */}
              <div
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: "rgba(255,107,53,0.20)" }}
              />
              <div
                className="relative rounded-full overflow-hidden flex items-center justify-center bg-[#FF6B35] text-white cursor-pointer"
                style={{
                  width: "112px",
                  height: "112px",
                  border: "2px solid rgba(255,107,53,0.30)",
                  padding: "4px",
                  backgroundColor: "#1C1C1A",
                }}
              >
                {!profile?.avatar_url && (
                  <span
                    className="absolute z-0 font-semibold pointer-events-none text-white"
                    style={{ fontSize: "40px" }}
                  >
                    {(profile?.display_name || user?.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="z-10 w-full h-full relative rounded-full overflow-hidden">
                  <ImageUploader
                    bucket="avatars"
                    folder={user.id}
                    aspectRatio="1/1"
                    defaultImage={profile?.avatar_url}
                    onUploadSuccess={(url) => updateAvatarMutation.mutate(url)}
                    showCameraBadge={false}
                  />
                </div>
              </div>
              {/* Edit button */}
              <div
                className="absolute bottom-0 right-0 flex items-center justify-center rounded-full pointer-events-none z-20"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "#FF6B35",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </div>

            {/* Name */}
            <h2
              className="font-bold text-[#E5E2DE] text-center"
              style={{ fontSize: "32px", letterSpacing: "-0.02em" }}
            >
              {profile?.display_name || user?.email?.split("@")[0]}
            </h2>

            {/* Location / join date */}
            {profile?.location && (
              <p className="flex items-center gap-1 mt-1" style={{ fontSize: "16px", color: "#9A9A8E" }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: "#5A5A52" }} />
                {profile.location}
              </p>
            )}
            {joinDate && (
              <p className="mt-1" style={{ fontSize: "13px", color: "#5A5A52" }}>
                Member since {joinDate}
              </p>
            )}
          </div>

          {/* Stats grid — 2 columns */}
          <div className="grid grid-cols-2 gap-3 px-4 mb-4">
            <div
              className="rounded-xl p-5 text-center"
              style={{ backgroundColor: "#242422", border: "1px solid #2E2E2C" }}
            >
              <span className="font-bold block" style={{ fontSize: "24px", color: "#FF6B35" }}>
                {userEvents?.hosted?.length || 0}
              </span>
              <span
                className="uppercase tracking-widest mt-1 block"
                style={{ fontSize: "10px", color: "#5A5A52" }}
              >
                Hosted
              </span>
            </div>
            <div
              className="rounded-xl p-5 text-center"
              style={{ backgroundColor: "#242422", border: "1px solid #2E2E2C" }}
            >
              <span className="font-bold block" style={{ fontSize: "24px", color: "#FF6B35" }}>
                {userEvents?.joined?.length || 0}
              </span>
              <span
                className="uppercase tracking-widest mt-1 block"
                style={{ fontSize: "10px", color: "#5A5A52" }}
              >
                Joined
              </span>
            </div>
          </div>

          {/* Ratings summary */}
          {profileRatings && (
            <div
              className="mx-4 rounded-xl p-4 flex items-center justify-center gap-3 mb-4"
              style={{ backgroundColor: "#242422", border: "1px solid #2E2E2C" }}
            >
              <span className="font-bold" style={{ fontSize: "24px", color: "#E5E2DE" }}>
                {profileRatings.averageRating.toFixed(1)}
              </span>
              <StarDisplay avg={profileRatings.averageRating} count={0} />
              <span style={{ fontSize: "12px", color: "#5A5A52" }}>
                {profileRatings.totalRatings} {profileRatings.totalRatings === 1 ? "rating" : "ratings"}
              </span>
            </div>
          )}

          {/* Tabs — sticky */}
          <div
            className="sticky top-0 z-30 mx-4 flex relative"
            style={{
              backgroundColor: "rgba(28,28,26,0.95)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <button
              onClick={() => switchTab("hosting")}
              className={`flex-1 h-[44px] transition-colors relative`}
              style={{
                fontSize: "17px",
                color: activeTab === "hosting" ? "#FF6B35" : "#9A9A8E",
                fontWeight: activeTab === "hosting" ? 600 : 400,
              }}
            >
              Hosting
            </button>
            <button
              onClick={() => switchTab("joined")}
              className="flex-1 h-[44px] transition-colors relative"
              style={{
                fontSize: "17px",
                color: activeTab === "joined" ? "#FF6B35" : "#9A9A8E",
                fontWeight: activeTab === "joined" ? 600 : 400,
              }}
            >
              Joined
            </button>

            {/* Inactive underline */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#2E2E2C] pointer-events-none" />
            {/* Active indicator */}
            <div
              className="absolute bottom-0 h-[2px] transition-all duration-200 pointer-events-none"
              style={{
                width: "50%",
                left: activeTab === "hosting" ? "0%" : "50%",
                backgroundColor: "#FF6B35",
              }}
            />
          </div>

          {/* Event list */}
          <div className="mt-4 space-y-4 px-4">
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              activeTab === "hosting" ? (
                <EmptyState
                  icon={CalendarRange}
                  heading="You haven't hosted anything yet."
                  subtext="What are you waiting for?"
                  buttonText="Host a thing"
                  onAction={() => navigate("/host")}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  heading="You haven't joined anything yet."
                  subtext="Go find your people."
                  buttonText="Find events"
                  onAction={() => navigate("/")}
                />
              )
            ) : (
              <>
                {upcomingEvents.length === 0 ? (
                  <p className="text-center py-8" style={{ fontSize: "14px", color: "#5A5A52" }}>
                    No upcoming events
                  </p>
                ) : (
                  upcomingEvents.map((event: any) => (
                    <EventCard key={event.id} event={event} isPast={false} />
                  ))
                )}

                {pastEvents.length > 0 && (
                  <div className="border-t border-[#2E2E2C] pt-4 mt-2">
                    <button
                      onClick={() => setShowPastEvents((v) => !v)}
                      className="w-full flex items-center justify-between py-3 font-semibold transition-colors"
                      style={{ fontSize: "14px", color: "#E5E2DE" }}
                    >
                      <span>Past events ({pastEvents.length})</span>
                      <span style={{ fontSize: "13px", color: "#5A5A52", fontWeight: 400 }}>
                        {showPastEvents ? "Hide ▲" : "Show ▼"}
                      </span>
                    </button>

                    {showPastEvents && (
                      <div className="space-y-4 pt-1">
                        {pastEvents.map((event: any) => (
                          <EventCard key={event.id} event={event} isPast />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
