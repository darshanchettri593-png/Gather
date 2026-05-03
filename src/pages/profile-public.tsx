import { useParams, useNavigate, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useFollowerCount } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ArrowLeft, MapPin, CalendarDays } from "lucide-react";

function getVibeLabel(vibe: string) {
  return vibe.charAt(0).toUpperCase() + vibe.slice(1);
}

export function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["public-user", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, location, created_at, date_of_birth, gender")
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

  const joinDate = user.created_at ? format(new Date(user.created_at), "MMMM yyyy") : null;
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

  return (
    <div style={{ backgroundColor: "#111110", minHeight: "100vh", paddingBottom: "80px" }}>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "56px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          backgroundColor: "rgba(17,17,16,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #2A2A28",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="active:opacity-60 transition-opacity"
          style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={22} color="#F0EEE9" strokeWidth={2} />
        </button>
      </header>

      <div style={{ padding: "32px 20px 0" }}>

        {/* Avatar + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              overflow: "hidden",
              backgroundColor: "#FF6B35",
              border: "2px solid rgba(255,107,53,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
              flexShrink: 0,
            }}
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>{initial}</span>
            )}
          </div>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#F0EEE9", marginBottom: "4px" }}>
            {user.display_name || "Anonymous"}
          </span>
          {(gender || age !== null) && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginTop: "4px" }}>
              {gender && (
                <span style={{ fontSize: "13px", color: "#F0EEE9", backgroundColor: "#242422", border: "1px solid #2A2A28", borderRadius: "999px", padding: "2px 10px" }}>
                  {gender}
                </span>
              )}
              {age !== null && (
                <span style={{ fontSize: "13px", color: "#6B6B63" }}>{age} years old</span>
              )}
            </div>
          )}
          {(localStorage.getItem('gather_city') || user.location) && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={12} color="#6B6B63" strokeWidth={1.8} />
              <span style={{ fontSize: "13px", color: "#6B6B63" }}>
                {localStorage.getItem('gather_city') || user.location}
              </span>
            </div>
          )}
          {joinDate && (
            <span style={{ fontSize: "13px", color: "#6B6B63", marginTop: "6px" }}>
              Member since {joinDate}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "32px" }}>
          <div style={{ backgroundColor: "#242422", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid #2A2A28" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#F0EEE9", display: "block" }}>
              {stats?.hostedCount ?? "—"}
            </span>
            <span style={{ fontSize: "11px", color: "#6B6B63", marginTop: "2px", display: "block" }}>
              Hosted
            </span>
          </div>
          <div style={{ backgroundColor: "#242422", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid #2A2A28" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#F0EEE9", display: "block" }}>
              {stats?.attendedCount ?? "—"}
            </span>
            <span style={{ fontSize: "11px", color: "#6B6B63", marginTop: "2px", display: "block" }}>
              Attended
            </span>
          </div>
          <div style={{ backgroundColor: "#242422", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid #2A2A28" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#F0EEE9", display: "block" }}>
              {stats?.avgRating != null ? `⭐ ${stats.avgRating.toFixed(1)}` : "—"}
            </span>
            <span style={{ fontSize: "11px", color: "#6B6B63", marginTop: "2px", display: "block" }}>
              Rating
            </span>
          </div>
          <div style={{ flex: 1, backgroundColor: '#242422', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #2A2A28' }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#F0EEE9", display: "block" }}>
              {followerCount || 0}
            </span>
            <span style={{ fontSize: "11px", color: "#6B6B63", marginTop: "2px", display: "block", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Followers
            </span>
          </div>
        </div>

        {/* Events section */}
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#F0EEE9", marginBottom: "12px" }}>
            Hosting
          </h2>

          {events.length === 0 ? (
            <div
              style={{
                backgroundColor: "#1C1C1A",
                border: "1px dashed #2A2A28",
                borderRadius: "14px",
                padding: "32px 20px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>Nothing hosted yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {events.map((event: any) => {
                const attendeeCount = event.attendees?.[0]?.count || 0;
                return (
                  <Link
                    key={event.id}
                    to={`/event/${event.id}`}
                    className="block active:opacity-90 transition-opacity"
                  >
                    <div
                      style={{
                        backgroundColor: "#1C1C1A",
                        border: "1px solid #2A2A28",
                        borderRadius: "14px",
                        padding: "12px",
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          flexShrink: 0,
                          backgroundColor: "#242422",
                        }}
                      >
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "20px", fontWeight: 700, color: "#3D3D38" }}>
                              {getVibeLabel(event.vibe).charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px", justifyContent: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {getVibeLabel(event.vibe)}
                        </span>
                        <h3
                          style={{ fontSize: "15px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                        >
                          {event.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <CalendarDays size={11} color="#6B6B63" strokeWidth={1.8} />
                          <span style={{ fontSize: "12px", color: "#6B6B63" }}>
                            {format(new Date(event.event_datetime), "MMM d, h:mm a")}
                          </span>
                        </div>
                        {event.district && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <MapPin size={11} color="#6B6B63" strokeWidth={1.8} />
                            <span style={{ fontSize: "12px", color: "#6B6B63", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {event.district}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
