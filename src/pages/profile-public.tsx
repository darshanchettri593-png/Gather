import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useFollowerCount, useIsVerifiedHost, useFollowStatus, useToggleFollow } from "@/lib/queries";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ReportSheet } from "@/components/ReportSheet";
import { InstagramIcon, TwitterIcon, FacebookIcon } from "@/components/SocialIcons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

function getVibeLabel(vibe: string) {
  return vibe.charAt(0).toUpperCase() + vibe.slice(1);
}

function extractHandle(url: string, domains: string[]): string {
  for (const domain of domains) {
    const match = url.match(new RegExp(domain + '\\/([^/?]+)'));
    if (match) return '@' + match[1];
  }
  return '@' + url.replace(/^@/, '');
}

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, openAuthModal } = useAuth();

  // ── All existing queries — untouched ─────────────────────────────────────────
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["public-user", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, location, created_at, date_of_birth, gender, bio, instagram, twitter, facebook")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["public-user-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_datetime, cover_image_url, location_text, district, vibe, attendees(count)")
        .eq("host_id", id!)
        .gte("event_datetime", new Date().toISOString())
        .order("event_datetime", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: followerCount } = useFollowerCount(id || "");
  const { data: isVerified } = useIsVerifiedHost(id);
  const [showReport, setShowReport] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["public-user-stats", id],
    queryFn: async () => {
      const { count: hostedCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("host_id", id!);

      const { count: attendedCount } = await supabase
        .from("attendees")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id!);

      const { data: hostedEventIds } = await supabase
        .from("events")
        .select("id")
        .eq("host_id", id!);

      const ids = (hostedEventIds || []).map((e: { id: string }) => e.id);
      let avgRating: number | null = null;
      if (ids.length > 0) {
        const { data: ratings } = await supabase
          .from("event_ratings")
          .select("rating_value")
          .in("event_id", ids)
          .eq("rater_type", "attendee");
        if (ratings && ratings.length > 0) {
          avgRating = ratings.reduce((sum: number, r: { rating_value: number }) => sum + r.rating_value, 0) / ratings.length;
        }
      }

      return {
        hostedCount: hostedCount || 0,
        attendedCount: attendedCount || 0,
        avgRating,
      };
    },
    enabled: !!id,
  });

  // ── Follow ────────────────────────────────────────────────────────────────────
  const { data: isFollowing } = useFollowStatus(id || "", currentUser?.id);
  const toggleFollow = useToggleFollow();

  const handleFollow = () => {
    if (!currentUser) { openAuthModal('Sign in to follow hosts', '/'); return; }
    if (!id) return;
    toggleFollow.mutate({ followingId: id, followerId: currentUser.id, isFollowing: !!isFollowing });
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (userLoading || eventsLoading) {
    return (
      <div style={{ backgroundColor: "#111110", minHeight: "100vh" }}>
        <div style={{ height: "56px" }} />
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", paddingTop: "32px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#1C1C1A" }} className="animate-pulse" />
            <div style={{ width: "120px", height: "20px", borderRadius: "8px", backgroundColor: "#1C1C1A" }} className="animate-pulse" />
            <div style={{ width: "80px", height: "14px", borderRadius: "8px", backgroundColor: "#1C1C1A" }} className="animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: "#111110", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <p style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9", marginBottom: "8px" }}>User not found</p>
        <p style={{ fontSize: "14px", color: "#6B6B63", marginBottom: "24px" }}>This profile doesn't exist or was removed.</p>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0 28px", height: "48px", borderRadius: "999px", backgroundColor: "#1C1C1A", border: "1px solid #2A2A28", color: "#F0EEE9", fontSize: "15px", fontWeight: 500 }}
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const joinDate = user.created_at ? format(new Date(user.created_at), "MMM yyyy") : null;
  const initial = (user.display_name || "?").charAt(0).toUpperCase();

  const calcAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };
  const age = (user as any).date_of_birth ? calcAge((user as any).date_of_birth) : null;
  const gender = (user as any).gender ?? null;
  const isOwnProfile = currentUser?.id === id;

  const upcomingCount = events.filter((e: any) => new Date(e.event_datetime) > new Date()).length;

  return (
    <div style={{ backgroundColor: "#111110", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "#F0EEE9", fontSize: "22px", cursor: "pointer", padding: "4px", lineHeight: 1 }}
        >
          ←
        </button>
        <button
          onClick={() => setShowReport(true)}
          style={{ background: "none", border: "none", color: "#6B6B63", fontSize: "13px", cursor: "pointer", padding: "4px 8px" }}
        >
          Report
        </button>
      </header>

      {/* ── Profile card ─────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: "#1C1C1A",
        border: "1px solid #2A2A28",
        borderRadius: "16px",
        padding: "24px 20px",
        margin: "0 12px 12px",
      }}>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            overflow: "hidden",
            backgroundColor: "#242422",
            border: isVerified ? "3px solid #FF6B35" : "2px solid #2A2A28",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9" }}>{initial}</span>
            )}
          </div>
        </div>

        {/* Name + badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#F0EEE9" }}>
            {user.display_name || "Anonymous"}
          </span>
          <VerifiedBadge size={18} />
        </div>

        {/* Identity pills */}
        {(gender || age !== null || user.location) && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", flexWrap: "wrap", marginTop: "8px" }}>
            {gender && (
              <span style={{ fontSize: "12px", color: "#F0EEE9", backgroundColor: "#242422", border: "1px solid #2A2A28", borderRadius: "20px", padding: "3px 10px" }}>
                {gender}
              </span>
            )}
            {age !== null && (
              <span style={{ fontSize: "12px", color: "#6B6B63" }}>{age} yrs</span>
            )}
            {user.location && (
              <span style={{ fontSize: "12px", color: "#6B6B63" }}>📍 {user.location}</span>
            )}
          </div>
        )}

        {/* Member since */}
        {joinDate && (
          <p style={{ textAlign: "center", marginTop: "6px", fontSize: "10px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Member since {joinDate}
          </p>
        )}

        {/* Bio */}
        {(user as any).bio && (
          <p style={{ fontSize: "13px", color: "#C8C6C0", textAlign: "center", marginTop: "12px", lineHeight: 1.6 }}>
            {(user as any).bio}
          </p>
        )}

        {/* Social links */}
        {((user as any).instagram || (user as any).twitter || (user as any).facebook) && (
          <div style={{ display: "flex", gap: "14px", marginTop: "10px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
            {(user as any).instagram && (
              <a
                href={(user as any).instagram.startsWith('http') ? (user as any).instagram : `https://instagram.com/${(user as any).instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
              >
                <InstagramIcon size={14} />
                <span style={{ fontSize: "12px", color: "#FF6B35" }}>
                  {extractHandle((user as any).instagram, ['instagram\\.com'])}
                </span>
              </a>
            )}
            {(user as any).twitter && (
              <a
                href={(user as any).twitter.startsWith('http') ? (user as any).twitter : `https://twitter.com/${(user as any).twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
              >
                <TwitterIcon size={14} />
                <span style={{ fontSize: "12px", color: "#FF6B35" }}>
                  {extractHandle((user as any).twitter, ['twitter\\.com', 'x\\.com'])}
                </span>
              </a>
            )}
            {(user as any).facebook && (
              <a
                href={(user as any).facebook.startsWith('http') ? (user as any).facebook : `https://facebook.com/${(user as any).facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
              >
                <FacebookIcon size={14} />
                <span style={{ fontSize: "12px", color: "#FF6B35" }}>
                  {extractHandle((user as any).facebook, ['facebook\\.com'])}
                </span>
              </a>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#2A2A28", margin: "16px 0" }} />

        {/* Stats row */}
        <div style={{ display: "flex" }}>
          {[
            { label: "HOSTED",    value: stats?.hostedCount ?? "—" },
            { label: "ATTENDED",  value: stats?.attendedCount ?? "—" },
            { label: "RATING",    value: stats?.avgRating != null ? `⭐ ${stats.avgRating.toFixed(1)}` : "—" },
            { label: "FOLLOWERS", value: followerCount ?? 0 },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{ flex: 1, textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid #2A2A28" : "none" }}>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#F0EEE9", margin: 0 }}>{stat.value}</p>
              <p style={{ fontSize: "9px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", margin: "3px 0 0" }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Follow button */}
        {!isOwnProfile && (
          <button
            onClick={handleFollow}
            disabled={toggleFollow.isPending}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "999px",
              marginTop: "16px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              border: isFollowing ? "1px solid #2A2A28" : "none",
              backgroundColor: isFollowing ? "transparent" : "#FF6B35",
              color: isFollowing ? "#6B6B63" : "white",
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* ── Hosting section ───────────────────────────────────────────────────── */}
      <div style={{ padding: "0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Hosting
          </span>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {upcomingCount} Upcoming
          </span>
        </div>

        {events.length === 0 ? (
          <div style={{
            backgroundColor: "#1C1C1A",
            border: "1px dashed #2A2A28",
            borderRadius: "12px",
            padding: "28px 20px",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "13px", color: "#6B6B63" }}>Nothing hosted yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {events.map((event: any) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                style={{ textDecoration: "none", display: "block", marginBottom: "8px" }}
              >
                <div style={{
                  backgroundColor: "#1C1C1A",
                  border: "1px solid #2A2A28",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#242422",
                  }}>
                    {event.cover_image_url ? (
                      <img src={event.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {event.title}
                    </p>
                    <p style={{ fontSize: "12px", color: "#6B6B63", margin: "0 0 4px" }}>
                      {format(new Date(event.event_datetime), "MMM d · h:mm a")}
                    </p>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      backgroundColor: "rgba(255,107,53,0.12)",
                      color: "#FF6B35",
                      borderRadius: "4px",
                      padding: "2px 6px",
                    }}>
                      {getVibeLabel(event.vibe)}
                    </span>
                  </div>

                  {/* Arrow */}
                  <span style={{ fontSize: "16px", color: "#3D3D38", flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showReport && (
        <ReportSheet
          targetType="user"
          targetId={id!}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
