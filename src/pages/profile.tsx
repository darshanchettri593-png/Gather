import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { Settings as SettingsIcon, MapPin, CalendarDays, Users, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserEvents, useProfile } from "@/hooks/useUser";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUploader } from "@/components/ui/image-uploader";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEventRatingSummary, useProfileRatings } from "@/hooks/useRatings";
import { useFollowerCount, useIsVerifiedHost } from "@/lib/queries";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { InstagramIcon, TwitterIcon, FacebookIcon } from "@/components/SocialIcons";
import { StarDisplay } from "@/components/rating-section";
import { LiveBadge } from "@/components/ui/live-badge";
import { getEventStatus } from "@/lib/event-status";

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
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#6B6B63", marginTop: "12px" }}>
        {heading}
      </h3>
      {subtext && (
        <p style={{ fontSize: "13px", color: "#3D3D38", marginTop: "4px" }}>{subtext}</p>
      )}
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="active:opacity-80 transition-opacity"
          style={{ marginTop: "20px", backgroundColor: "#FF6B35", color: "white", fontSize: "15px", fontWeight: 600, height: "48px", borderRadius: "999px", padding: "0 28px" }}
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
    <Link to={`/event/${event.id}`} className="block active:opacity-80 transition-opacity">
      <div
        style={{
          backgroundColor: "#1C1C1A",
          border: "1px solid #2A2A28",
          borderRadius: "12px",
          padding: "12px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "8px",
          opacity: isPast ? 0.55 : 1,
        }}
      >
        <div style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, backgroundColor: "#242422", position: "relative" }}>
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#3D3D38" }}>{vibeInitial}</span>
            </div>
          )}
          {isPast && (
            <div className="absolute top-[5px] right-[5px]" style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "1px 4px" }}>
              <span style={{ fontSize: "9px", color: "#6B6B63" }}>Past</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="line-clamp-1" style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", margin: "0 0 2px" }}>
            {event.title}
          </p>
          <p style={{ fontSize: "12px", color: "#6B6B63", margin: "0 0 4px" }}>
            {format(new Date(event.event_datetime), "MMM d · h:mm a")}
          </p>
          <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", backgroundColor: "rgba(255,107,53,0.12)", color: "#FF6B35", borderRadius: "4px", padding: "2px 6px" }}>
            {event.vibe ? event.vibe.charAt(0).toUpperCase() + event.vibe.slice(1) : ""}
          </span>
          {isPast && ratingSummary && (
            <div style={{ marginTop: "4px" }}>
              <StarDisplay avg={ratingSummary.avg} count={ratingSummary.count} />
            </div>
          )}
        </div>

        <span style={{ fontSize: "16px", color: "#3D3D38", flexShrink: 0 }}>›</span>
      </div>
    </Link>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const queryClient = useQueryClient();

  // ── All existing state — untouched ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"hosting" | "joined">("hosting");
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifySheet, setShowVerifySheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editFacebook, setEditFacebook] = useState('');

  // ── All existing queries/hooks — untouched ──────────────────────────────────
  const { data: userEvents, isLoading: isEventsLoading } = useUserEvents();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: profileRatings } = useProfileRatings(user?.id);
  const { data: isVerified } = useIsVerifiedHost(user?.id);
  const { data: followerCount } = useFollowerCount(user?.id || "");
  const { data: verifyProgress } = useQuery({
    queryKey: ['verify-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: userData } = await supabase.from('users').select('created_at').eq('id', user.id).single();
      const accountAgeDays = userData
        ? Math.floor((Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const { data: events } = await supabase.from('events').select('id').eq('host_id', user.id);
      const eventCount = events?.length || 0;
      const eventIds = events?.map(e => e.id) || [];
      const { data: ratings } = await supabase.from('event_ratings').select('rating_value').in('event_id', eventIds).eq('rater_type', 'attendee');
      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating_value, 0) / ratings.length : 0;
      const { data: attendees } = await supabase.from('attendees').select('checked_in, no_show').in('event_id', eventIds.length > 0 ? eventIds : ['none']);
      const resolved = attendees?.filter(a => a.checked_in || a.no_show) || [];
      const checkedIn = attendees?.filter(a => a.checked_in) || [];
      const checkinRate = resolved.length > 0 ? checkedIn.length / resolved.length : 0;
      return { accountAgeDays, eventCount, avgRating: Math.round(avgRating * 10) / 10, checkinRate: Math.round(checkinRate * 100) };
    },
    enabled: !!user?.id,
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (url: string) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("users").update({ avatar_url: url }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["profile", user?.id] }); },
  });

  const isLoading = isEventsLoading || isProfileLoading;

  useEffect(() => {
    if (profile) {
      setEditName((profile as any).display_name || '');
      setEditBio((profile as any).bio || '');
      setEditInstagram((profile as any).instagram || '');
      setEditTwitter((profile as any).twitter || '');
      setEditFacebook((profile as any).facebook || '');
    }
  }, [profile]);

  const { liveEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const rawEvents = activeTab === "hosting" ? userEvents?.hosted : userEvents?.joined;
    if (!rawEvents) return { liveEvents: [], upcomingEvents: [], pastEvents: [] };
    const now = new Date();
    const live: any[] = [], upcoming: any[] = [], past: any[] = [];
    for (const e of rawEvents) {
      const status = e.end_datetime
        ? getEventStatus(e.event_datetime, e.end_datetime)
        : (new Date(e.event_datetime) >= now ? 'upcoming' : 'ended');
      if (status === 'live') live.push(e);
      else if (status === 'upcoming') upcoming.push(e);
      else past.push(e);
    }
    upcoming.sort((a, b) => new Date(a.event_datetime).getTime() - new Date(b.event_datetime).getTime());
    past.sort((a, b) => new Date(b.event_datetime).getTime() - new Date(a.event_datetime).getTime());
    return { liveEvents: live, upcomingEvents: upcoming, pastEvents: past };
  }, [userEvents, activeTab]);

  const switchTab = useCallback((tab: "hosting" | "joined") => {
    setActiveTab(tab);
    setShowPastEvents(false);
  }, []);

  const joinDate = user?.created_at ? format(new Date(user.created_at), "MMM yyyy") : "";

  const calcAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };
  const age = profile?.date_of_birth ? calcAge(profile.date_of_birth) : null;

  // ── Save handler (shared by Done button) ────────────────────────────────────
  const handleSaveProfile = async () => {
    await supabase.from('users').update({
      display_name: editName,
      bio: editBio,
      instagram: editInstagram || null,
      twitter: editTwitter || null,
      facebook: editFacebook || null,
    }).eq('id', user!.id);
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    setShowEditModal(false);
  };

  // ─── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="page-transition max-w-md mx-auto min-h-screen flex flex-col" style={{ backgroundColor: "#111110", paddingBottom: "80px" }}>
        <div className="flex items-center justify-between" style={{ padding: "20px 20px 0" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#F0EEE9" }}>Profile</h1>
          <button onClick={() => navigate("/settings")} className="active:opacity-60 transition-opacity" style={{ color: "#6B6B63" }}>
            <SettingsIcon size={22} strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center px-8" style={{ paddingTop: "15vh" }}>
          <div className="flex items-center justify-center" style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#1C1C1A" }}>
            <UserIcon size={24} strokeWidth={1.5} color="#3D3D38" />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9", marginTop: "16px" }}>Your profile lives here.</h2>
          <p style={{ fontSize: "14px", color: "#6B6B63", marginTop: "8px", lineHeight: 1.5 }}>Sign in to host events and track who's coming.</p>
          <button
            onClick={() => openAuthModal("Sign in to host events, track who's coming, and see what you've joined.", "/profile")}
            className="active:opacity-80 transition-opacity"
            style={{ marginTop: "24px", backgroundColor: "#FF6B35", color: "white", fontSize: "15px", fontWeight: 600, height: "48px", borderRadius: "999px", padding: "0 32px" }}
          >
            Sign in
          </button>
          <Link to="/" style={{ fontSize: "13px", color: "#6B6B63", marginTop: "12px" }} className="active:opacity-60 transition-opacity">
            Just browsing? Keep exploring.
          </Link>
        </div>
      </div>
    );
  }

  // ─── Authenticated ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#111110' }}>

      {/* ── Section 1: Sticky header + profile card + tabs ─────────────────── */}
      <div style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#111110' }}>

        {/* Header */}
        <div style={{ height: '64px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2A2A28' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#F0EEE9' }}>Profile</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{ fontSize: '15px', fontWeight: 600, color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Edit
            </button>
            <button
              onClick={() => navigate('/settings')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B63', fontSize: '20px', padding: 0, display: 'flex', alignItems: 'center' }}
            >
              <SettingsIcon size={20} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Profile card */}
        {isLoading ? (
          <div style={{ margin: '12px' }}>
            <Skeleton className="h-[160px] w-full rounded-2xl" style={{ backgroundColor: '#1C1C1A' }} />
          </div>
        ) : (
          <div style={{ margin: '12px', backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '16px', padding: '20px' }}>

            {/* Top row: avatar + info */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
                  border: isVerified ? '2px solid #FF6B35' : '2px solid #2A2A28',
                  backgroundColor: '#242422', position: 'relative',
                }}>
                  {!profile?.avatar_url && (
                    <span style={{ fontSize: '26px', fontWeight: 600, color: '#F0EEE9', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 0 }}>
                      {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
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
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Name + verify badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#F0EEE9' }} className="line-clamp-1">
                    {profile?.display_name || user?.email?.split('@')[0]}
                  </span>
                  <button
                    onClick={() => setShowVerifySheet(true)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {isVerified ? (
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="#FF6B35"/>
                        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="#3D3D38" strokeWidth="1.5" strokeDasharray="3 2"/>
                        <path d="M4.5 8L7 10.5L11.5 5.5" stroke="#3D3D38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>

                {/* Gender + age */}
                {(profile?.gender || age !== null) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {profile?.gender && (
                      <span style={{ fontSize: '12px', color: '#F0EEE9', backgroundColor: '#242422', border: '1px solid #2A2A28', borderRadius: '20px', padding: '2px 10px' }}>
                        {profile.gender}
                      </span>
                    )}
                    {age !== null && (
                      <span style={{ fontSize: '12px', color: '#6B6B63' }}>{age} yrs</span>
                    )}
                  </div>
                )}

                {/* Location */}
                {(localStorage.getItem('gather_city') || profile?.location) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" fill="#FF6B35"/>
                      <text x="6" y="7" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5" fontWeight="700" fontFamily="-apple-system, sans-serif">G</text>
                    </svg>
                    <span style={{ fontSize: '12px', color: '#6B6B63' }}>
                      {localStorage.getItem('gather_city') || profile?.location}
                    </span>
                  </div>
                )}

                {/* Member since */}
                {user?.created_at && (
                  <span style={{ fontSize: '11px', color: '#3D3D38' }}>
                    Joined {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            {(profile as any)?.bio && (
              <p style={{ fontSize: '13px', color: '#C8C6C0', marginTop: '12px', lineHeight: 1.6 }}>
                {(profile as any).bio}
              </p>
            )}

            {/* Social links */}
            {((profile as any)?.instagram || (profile as any)?.twitter || (profile as any)?.facebook) && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(profile as any).instagram && (
                  <a
                    href={(profile as any).instagram.startsWith('http') ? (profile as any).instagram : `https://instagram.com/${(profile as any).instagram}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <InstagramIcon size={14} />
                    <span style={{ fontSize: '12px', color: '#FF6B35' }}>
                      {(() => { const v = (profile as any).instagram || ''; const m = v.match(/instagram\.com\/([^/?]+)/); return m ? '@' + m[1] : '@' + v.replace(/^@/, ''); })()}
                    </span>
                  </a>
                )}
                {(profile as any).twitter && (
                  <a
                    href={(profile as any).twitter.startsWith('http') ? (profile as any).twitter : `https://twitter.com/${(profile as any).twitter}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <TwitterIcon size={14} />
                    <span style={{ fontSize: '12px', color: '#FF6B35' }}>
                      {(() => { const v = (profile as any).twitter || ''; const m = v.match(/(?:twitter|x)\.com\/([^/?]+)/); return m ? '@' + m[1] : '@' + v.replace(/^@/, ''); })()}
                    </span>
                  </a>
                )}
                {(profile as any).facebook && (
                  <a
                    href={(profile as any).facebook.startsWith('http') ? (profile as any).facebook : `https://facebook.com/${(profile as any).facebook}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <FacebookIcon size={14} />
                    <span style={{ fontSize: '12px', color: '#FF6B35' }}>
                      {(() => { const v = (profile as any).facebook || ''; const m = v.match(/facebook\.com\/([^/?]+)/); return m ? '@' + m[1] : '@' + v.replace(/^@/, ''); })()}
                    </span>
                  </a>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: '#2A2A28', margin: '14px 0' }} />

            {/* Stats row */}
            <div style={{ display: 'flex' }}>
              {[
                { label: 'HOSTED',    value: userEvents?.hosted?.length || 0 },
                { label: 'JOINED',    value: userEvents?.joined?.length || 0 },
                { label: 'FOLLOWERS', value: followerCount || 0 },
              ].map((stat, i, arr) => (
                <div key={stat.label} style={{ flex: 1, textAlign: 'center', borderRight: i < arr.length - 1 ? '1px solid #2A2A28' : 'none' }}>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#F0EEE9', margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '2px 0 0' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Rating row */}
            {profileRatings && profileRatings.overall.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, color: '#F0EEE9', lineHeight: 1 }}>
                  {profileRatings.overall.avg}
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} style={{ fontSize: '16px', color: star <= Math.round(Number(profileRatings.overall.avg)) ? '#FF6B35' : '#2A2A28' }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: '#6B6B63' }}>
                  {profileRatings.overall.count} rating{profileRatings.overall.count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #2A2A28', padding: '0 20px', display: 'flex' }}>
          {(['hosting', 'joined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '10px 0',
                fontSize: '15px',
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? '#F0EEE9' : '#6B6B63',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #FF6B35' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
              }}
            >
              {tab === 'hosting' ? 'Hosting' : 'Joined'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2: Scrollable content ──────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '100px' }}>
        {upcomingEvents.length === 0 && pastEvents.length === 0 && liveEvents.length === 0 ? (
          activeTab === 'hosting' ? (
            <EmptyState icon={CalendarDays} heading="Nothing hosted yet." subtext="" buttonText="Host a Gathering" onAction={() => navigate('/host')} />
          ) : (
            <EmptyState icon={Users} heading="Haven't joined anything yet." subtext="" buttonText="Find events" onAction={() => navigate('/')} />
          )
        ) : (
          <>
            {/* Live now */}
            {activeTab === 'hosting' && liveEvents.length > 0 && (
              <div style={{ marginTop: '12px', marginBottom: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  LIVE NOW
                </p>
                {liveEvents.map((event: any) => (
                  <div key={event.id} style={{ border: '1px solid rgba(255,59,48,0.3)', borderRadius: '12px', overflow: 'hidden', marginTop: '6px', marginBottom: '8px' }}>
                    <EventCard event={event} isPast={false} />
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming */}
            {upcomingEvents.length === 0 && liveEvents.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6B6B63', textAlign: 'center', padding: '24px 0' }}>No upcoming events</p>
            ) : (
              upcomingEvents.map((event: any) => (
                <EventCard key={event.id} event={event} isPast={false} />
              ))
            )}

            {/* Past */}
            {pastEvents.length > 0 && (
              <div style={{ marginTop: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#3D3D38', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>PAST</p>
                <button
                  onClick={() => setShowPastEvents(v => !v)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6B6B63' }}
                >
                  <span>{pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''}</span>
                  <span>{showPastEvents ? 'Hide ▲' : 'Show ▼'}</span>
                </button>
                {showPastEvents && pastEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Modal — position fixed, does not scroll page ──────────────── */}
      {showEditModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1A', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 14px', position: 'sticky', top: 0, backgroundColor: '#1C1C1A', zIndex: 10 }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9' }}>Edit Profile</span>
              <button onClick={handleSaveProfile} style={{ fontSize: '15px', fontWeight: 600, color: '#FF6B35', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
                Done
              </button>
            </div>
            <div style={{ height: '1px', backgroundColor: '#2A2A28', marginBottom: '24px' }} />
            <div style={{ padding: '0 24px' }}>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <ImageUploader
                  bucket="avatars"
                  folder="avatars"
                  defaultImage={profile?.avatar_url}
                  aspectRatio="1/1"
                  showCameraBadge
                  onUploadSuccess={async (url) => {
                    await supabase.from('users').update({ avatar_url: url }).eq('id', user!.id);
                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                  }}
                />
              </div>

              <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Display Name</p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={30}
                style={{ width: '100%', backgroundColor: '#242422', border: '1px solid #2A2A28', borderRadius: '12px', padding: '14px 16px', fontSize: '15px', color: '#F0EEE9', marginBottom: '16px', boxSizing: 'border-box' }}
              />

              <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Bio</p>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                placeholder="Tell people about yourself..."
                rows={3}
                style={{ width: '100%', backgroundColor: '#242422', border: '1px solid #2A2A28', borderRadius: '12px', padding: '14px 16px', fontSize: '15px', color: '#F0EEE9', marginBottom: '4px', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
              />
              <p style={{ fontSize: '12px', color: editBio.length >= 140 ? '#FF3B30' : '#6B6B63', textAlign: 'right', marginBottom: '20px' }}>
                {editBio.length}/150
              </p>

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Instagram</label>
                <input type="text" placeholder="username or profile URL" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)}
                  style={{ width: '100%', fontSize: '15px', color: '#F0EEE9', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #2A2A28', outline: 'none', padding: '0 0 10px' }} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Twitter / X</label>
                <input type="text" placeholder="username or profile URL" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)}
                  style={{ width: '100%', fontSize: '15px', color: '#F0EEE9', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #2A2A28', outline: 'none', padding: '0 0 10px' }} />
              </div>
              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Facebook</label>
                <input type="text" placeholder="username or profile URL" value={editFacebook} onChange={(e) => setEditFacebook(e.target.value)}
                  style={{ width: '100%', fontSize: '15px', color: '#F0EEE9', backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #2A2A28', outline: 'none', padding: '0 0 10px' }} />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Verify Sheet — position fixed ──────────────────────────────────── */}
      {showVerifySheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowVerifySheet(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1A', borderRadius: '20px 20px 0 0', padding: '24px 20px calc(100px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div style={{ width: '36px', height: '4px', backgroundColor: '#2A2A28', borderRadius: '2px', margin: '0 auto 24px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {isVerified ? (
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#FF6B35"/>
                  <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#3D3D38" strokeWidth="1.5" strokeDasharray="3 2"/>
                  <path d="M4.5 8L7 10.5L11.5 5.5" stroke="#3D3D38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <div>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', margin: 0 }}>
                  {isVerified ? 'Verified Host' : 'Verification in Progress'}
                </p>
                <p style={{ fontSize: '13px', color: '#6B6B63', margin: '2px 0 0' }}>
                  {isVerified ? 'You meet all criteria' : 'Meet all 4 criteria to get verified'}
                </p>
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: '#2A2A28', margin: '20px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: '7 or more events hosted', detail: `You have hosted ${verifyProgress?.eventCount || 0} events`, done: (verifyProgress?.eventCount || 0) >= 7 },
                { label: '4.0+ average rating', detail: `Your rating is ${verifyProgress?.avgRating || 0}`, done: (verifyProgress?.avgRating || 0) >= 4.0 },
                { label: '70%+ check-in rate', detail: `Your check-in rate is ${verifyProgress?.checkinRate || 0}%`, done: (verifyProgress?.checkinRate || 0) >= 70 },
                { label: 'Account 30+ days old', detail: `Your account is ${verifyProgress?.accountAgeDays || 0} days old`, done: (verifyProgress?.accountAgeDays || 0) >= 30 },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, backgroundColor: item.done ? '#FF6B35' : '#242422', border: item.done ? 'none' : '1px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.done ? (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3D3D38' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: item.done ? '#F0EEE9' : '#6B6B63', margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: '#6B6B63', margin: '2px 0 0' }}>{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {isVerified && (
              <div style={{ marginTop: '24px', backgroundColor: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#FF6B35', fontWeight: 600, margin: 0 }}>🎉 You are a Verified Host on Gather</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
