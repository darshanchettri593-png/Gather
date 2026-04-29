import { useState, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { Settings as SettingsIcon, MapPin, CalendarDays, Users, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserEvents, useProfile } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUploader } from "@/components/ui/image-uploader";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEventRatingSummary, useProfileRatings } from "@/hooks/useRatings";
import { StarDisplay } from "@/components/rating-section";

// ─── EmptyState (exported for events-feed) ───────────────────────────────────

interface EmptyStateProps {
  icon: React.ElementType;
  heading: string;
  subtext: string;
  buttonText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, heading, subtext, buttonText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: "40px 24px" }}>
      <Icon size={32} strokeWidth={1.5} style={{ color: "#3D3D38" }} />
      <h3
        style={{ fontSize: "15px", fontWeight: 600, color: "#6B6B63", marginTop: "12px" }}
      >
        {heading}
      </h3>
      {subtext && (
        <p style={{ fontSize: "13px", color: "#3D3D38", marginTop: "4px" }}>
          {subtext}
        </p>
      )}
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="active:opacity-80 transition-opacity"
          style={{
            marginTop: "20px",
            backgroundColor: "#FF6B35",
            color: "white",
            fontSize: "15px",
            fontWeight: 600,
            height: "48px",
            borderRadius: "999px",
            padding: "0 28px",
          }}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

// ─── Event Card (compact horizontal) ─────────────────────────────────────────

function EventCard({ event, isPast }: { event: any; isPast: boolean }) {
  const { data: ratingSummary } = useEventRatingSummary(event.id, isPast);
  const vibeInitial = event.vibe ? event.vibe.charAt(0).toUpperCase() : "G";

  return (
    <Link
      to={`/event/${event.id}`}
      className="block active:opacity-80 transition-opacity"
    >
      <div
        className="flex gap-3"
        style={{
          backgroundColor: "#1C1C1A",
          border: "1px solid #2A2A28",
          borderRadius: "14px",
          padding: "12px",
          opacity: isPast ? 0.5 : 1,
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            backgroundColor: "#242422",
            position: "relative",
          }}
        >
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#3D3D38" }}>
                {vibeInitial}
              </span>
            </div>
          )}
          {isPast && (
            <div
              className="absolute top-[6px] right-[6px] flex items-center justify-center"
              style={{
                border: "1px solid #2A2A28",
                borderRadius: "999px",
                padding: "1px 5px",
              }}
            >
              <span style={{ fontSize: "9px", color: "#6B6B63", fontWeight: 500 }}>Past</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-[3px] flex-1 min-w-0 justify-center">
          <h3
            className="line-clamp-1"
            style={{ fontSize: "15px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.3 }}
          >
            {event.title}
          </h3>
          <span style={{ fontSize: "12px", color: "#6B6B63" }}>
            {format(new Date(event.event_datetime), "MMM d, h:mm a")}
          </span>
          <span style={{ fontSize: "12px", color: "#6B6B63" }}>
            {event._count?.attendees || 0} attending
          </span>
          {isPast && ratingSummary && (
            <StarDisplay avg={ratingSummary.avg} count={ratingSummary.count} />
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

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

  // ─── Unauthenticated ─────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div
        className="page-transition max-w-md mx-auto min-h-screen flex flex-col"
        style={{ backgroundColor: "#111110", paddingBottom: "80px" }}
      >
        {/* Header row */}
        <div
          className="flex items-center justify-between"
          style={{ padding: "20px 20px 0" }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#F0EEE9" }}>Profile</h1>
          <button
            onClick={() => navigate("/settings")}
            className="active:opacity-60 transition-opacity"
            style={{ color: "#6B6B63" }}
          >
            <SettingsIcon size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center px-8" style={{ paddingTop: "15vh" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#1C1C1A",
            }}
          >
            <UserIcon size={24} strokeWidth={1.5} color="#3D3D38" />
          </div>
          <h2
            style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9", marginTop: "16px" }}
          >
            Your profile lives here.
          </h2>
          <p style={{ fontSize: "14px", color: "#6B6B63", marginTop: "8px", lineHeight: 1.5 }}>
            Sign in to host events and track who's coming.
          </p>
          <button
            onClick={() =>
              openAuthModal(
                "Sign in to host events, track who's coming, and see what you've joined.",
                "/profile"
              )
            }
            className="active:opacity-80 transition-opacity"
            style={{
              marginTop: "24px",
              backgroundColor: "#FF6B35",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              height: "48px",
              borderRadius: "999px",
              padding: "0 32px",
            }}
          >
            Sign in
          </button>
          <Link
            to="/"
            style={{ fontSize: "13px", color: "#6B6B63", marginTop: "12px" }}
            className="active:opacity-60 transition-opacity"
          >
            Just browsing? Keep exploring.
          </Link>
        </div>
      </div>
    );
  }

  // ─── Authenticated ────────────────────────────────────────────────────────────

  return (
    <div
      className="page-transition max-w-md mx-auto min-h-screen flex flex-col"
      style={{ backgroundColor: "#111110", paddingBottom: "80px" }}
    >
      {/* Header row — no background, no border */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "20px 20px 0" }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#F0EEE9" }}>Profile</h1>
        <button
          onClick={() => navigate("/settings")}
          className="active:opacity-60 transition-opacity"
          style={{ color: "#6B6B63" }}
        >
          <SettingsIcon size={22} strokeWidth={1.8} />
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: "16px 20px" }}>
          <Skeleton className="h-[160px] w-full rounded-[20px]" style={{ backgroundColor: "#1C1C1A" }} />
        </div>
      ) : (
        <>
          {/* Profile card */}
          <div
            style={{
              margin: "16px 20px",
              padding: "20px",
              backgroundColor: "#1C1C1A",
              border: "1px solid #2A2A28",
              borderRadius: "20px",
            }}
          >
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              {/* Avatar 68px */}
              <div className="relative" style={{ flexShrink: 0 }}>
                <div
                  className="rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
                  style={{
                    width: "68px",
                    height: "68px",
                    backgroundColor: "#242422",
                    border: "1px solid #2A2A28",
                    position: "relative",
                  }}
                >
                  {!profile?.avatar_url && (
                    <span
                      style={{ fontSize: "26px", fontWeight: 600, color: "#F0EEE9", position: "absolute", zIndex: 0 }}
                    >
                      {(profile?.display_name || user?.email || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="w-full h-full relative z-10">
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
                {/* Camera badge */}
                <div
                  className="absolute bottom-0 right-0 flex items-center justify-center pointer-events-none z-20"
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#1C1C1A",
                    border: "1px solid #2A2A28",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B6B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </div>
              </div>

              {/* Name / location / joined */}
              <div className="flex flex-col gap-[4px] min-w-0">
                <span
                  style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9" }}
                  className="line-clamp-1"
                >
                  {profile?.display_name || user?.email?.split("@")[0]}
                </span>
                {profile?.location && (
                  <div className="flex items-center gap-[4px]">
                    <MapPin size={12} color="#6B6B63" strokeWidth={1.8} />
                    <span style={{ fontSize: "13px", color: "#6B6B63" }}>{profile.location}</span>
                  </div>
                )}
                {joinDate && (
                  <span style={{ fontSize: "12px", color: "#3D3D38" }}>
                    Joined {joinDate}
                  </span>
                )}
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: "1px", backgroundColor: "#2A2A28", margin: "16px 0" }} />

            {/* Stats row */}
            <div className="flex">
              <div className="flex-1 flex flex-col items-center text-center">
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#F0EEE9" }}>
                  {userEvents?.hosted?.length || 0}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#6B6B63",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: "2px",
                  }}
                >
                  Hosted
                </span>
              </div>
              {/* Divider */}
              <div style={{ width: "1px", backgroundColor: "#2A2A28" }} />
              <div className="flex-1 flex flex-col items-center text-center">
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#F0EEE9" }}>
                  {userEvents?.joined?.length || 0}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#6B6B63",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginTop: "2px",
                  }}
                >
                  Joined
                </span>
              </div>
              {profileRatings && (
                <>
                  <div style={{ width: "1px", backgroundColor: "#2A2A28" }} />
                  <div className="flex-1 flex flex-col items-center text-center">
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "#F0EEE9" }}>
                      {profileRatings.averageRating.toFixed(1)}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#6B6B63",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginTop: "2px",
                      }}
                    >
                      Rating
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="flex relative"
            style={{
              margin: "8px 20px 0",
              borderBottom: "1px solid #2A2A28",
            }}
          >
            {(["hosting", "joined"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className="flex-1 transition-colors"
                style={{
                  height: "44px",
                  fontSize: "17px",
                  fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? "#F0EEE9" : "#6B6B63",
                  borderBottom: activeTab === tab ? "2px solid #FF6B35" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab === "hosting" ? "Hosting" : "Joined"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: "16px 20px", backgroundColor: "#111110" }}>
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              activeTab === "hosting" ? (
                <EmptyState
                  icon={CalendarDays}
                  heading="Nothing hosted yet."
                  subtext=""
                  buttonText="Host a Gathering"
                  onAction={() => navigate("/host")}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  heading="Haven't joined anything yet."
                  subtext=""
                  buttonText="Find events"
                  onAction={() => navigate("/")}
                />
              )
            ) : (
              <>
                {upcomingEvents.length === 0 ? (
                  <p style={{ fontSize: "14px", color: "#6B6B63", textAlign: "center", padding: "24px 0" }}>
                    No upcoming events
                  </p>
                ) : (
                  <div className="flex flex-col gap-[10px]">
                    {upcomingEvents.map((event: any) => (
                      <EventCard key={event.id} event={event} isPast={false} />
                    ))}
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div style={{ marginTop: "20px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#3D3D38",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      PAST
                    </span>
                    <button
                      onClick={() => setShowPastEvents((v) => !v)}
                      className="w-full flex items-center justify-between py-2 transition-opacity active:opacity-60"
                      style={{ fontSize: "14px", color: "#6B6B63" }}
                    >
                      <span>{pastEvents.length} past event{pastEvents.length !== 1 ? "s" : ""}</span>
                      <span>{showPastEvents ? "Hide ▲" : "Show ▼"}</span>
                    </button>
                    {showPastEvents && (
                      <div className="flex flex-col gap-[10px]" style={{ marginTop: "8px" }}>
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
