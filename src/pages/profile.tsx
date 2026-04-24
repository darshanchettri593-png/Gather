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
      <Icon className="h-12 w-12 text-neutral-300 mb-4" strokeWidth={1.5} />
      <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-1.5">{heading}</h3>
      <p className="text-[14px] text-neutral-500 max-w-[260px]">{subtext}</p>
      {buttonText && onAction && (
        <button 
          onClick={onAction}
          className="mt-6 h-[52px] px-8 rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold active:scale-[0.98] transition-transform"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

function EventCard({ event, isPast }: { event: any; isPast: boolean }) {
  // Only fetch ratings summary for past events to avoid N+1 on active events
  const { data: ratingSummary } = useEventRatingSummary(event.id, isPast);

  return (
    <Link
      to={`/event/${event.id}`}
      className={`block relative group ${isPast ? "opacity-[0.65]" : ""}`}
    >
      <div className="flex flex-col bg-white rounded-2xl overflow-hidden active:scale-[0.99] transition-transform">
        <div className="h-[140px] w-full bg-[#F5F5F2] shrink-0 relative">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[12px] font-bold text-primary/30 uppercase tracking-wide">
              Gather
            </div>
          )}
          {isPast && (
            <div className="absolute top-3 right-3 border border-[#FF6B35] text-[#FF6B35] px-2 py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-sm">
              Past
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-1.5">
          <h3 className="text-[17px] font-semibold text-[#1A1A1A] leading-snug line-clamp-1">
            {event.title}
          </h3>
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-neutral-500 font-medium">
              {format(new Date(event.event_datetime), "MMM d, h:mm a")}
            </p>
            <p className="text-[12px] text-neutral-400">
              {event._count?.attendees || 0} attending
            </p>
          </div>
          {/* Rating summary — only shown for past events that have been rated */}
          {isPast && (
            <div className="mt-0.5">
              {ratingSummary ? (
                <StarDisplay avg={ratingSummary.avg} count={ratingSummary.count} />
              ) : (
                <span className="text-[12px] text-neutral-400">Not yet rated</span>
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
        .from('users')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    }
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

  const joinDate = user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : '';

  if (!user) {
    return (
      <div className="page-transition max-w-md mx-auto min-h-screen bg-[#F2F2EF] pb-[100px] flex flex-col pt-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 px-5">
          <h1 className="text-[32px] font-extrabold text-[#1A1A1A]" style={{ letterSpacing: '-0.5px' }}>Profile</h1>
          <button onClick={() => navigate('/settings')} className="text-neutral-400 active:opacity-70">
            <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
          </button>
        </div>
        
        {/* Guest State */}
        <div className="flex flex-col items-center text-center px-4 pt-[15vh]">
          <div className="w-16 h-16 bg-[#E5E5E0] rounded-full flex flex-col items-center justify-center text-neutral-400 mb-2">
            <UserIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h2 className="text-[20px] font-semibold text-[#1A1A1A] mt-4">Your profile lives here</h2>
          <p className="text-[14px] text-neutral-500 mt-2 max-w-[280px]">
            Sign in to host events, track who's coming, and see what you've joined.
          </p>
          <button 
            onClick={() => openAuthModal("Sign in to host events, track who's coming, and see what you've joined.", "/profile")}
            className="mt-6 w-[160px] h-[44px] rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold active:scale-[0.98] transition-transform"
          >
            Sign in
          </button>
          <Link to="/" className="text-[13px] text-neutral-500 mt-4 active:text-neutral-700">
            Just browsing? Keep exploring.
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-md mx-auto min-h-screen bg-[#F2F2EF] pb-[100px] flex flex-col pt-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 px-5">
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A]" style={{ letterSpacing: '-0.5px' }}>Profile</h1>
        <button onClick={() => navigate('/settings')} className="text-neutral-400 active:opacity-70">
          <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={1.75} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6 mt-4 px-4">
          <Skeleton className="h-[200px] w-full rounded-3xl bg-white" />
        </div>
      ) : (
        <>
          {/* Avatar / Stats Card */}
          <div className="bg-white rounded-3xl mx-4 p-5">
            <div className="flex items-center">
              {/* Avatar */}
              <div className="relative w-[76px] h-[76px] shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-primary text-white flex items-center justify-center relative cursor-pointer">
                  {!profile?.avatar_url && (
                    <span className="text-[32px] font-semibold pointer-events-none absolute z-0 text-white">
                      {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="z-10 w-full h-full relative">
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
                {/* Camera Badge */}
                <div className="absolute right-0 bottom-0 w-[22px] h-[22px] bg-white rounded-full border border-[#E5E5E0] flex items-center justify-center pointer-events-none z-20">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
              </div>

              {/* Info */}
              <div className="ml-4 flex flex-col justify-center">
                <h2 className="text-[20px] font-semibold text-[#1A1A1A] leading-none mb-1">
                  {profile?.display_name || user?.email?.split('@')[0]}
                </h2>
                {profile?.location && (
                  <p className="text-[13px] text-neutral-500 mb-1 flex items-center gap-[3px]">
                    <MapPin className="w-[11px] h-[11px] text-neutral-400" />
                    {profile.location}
                  </p>
                )}
                {joinDate && (
                  <p className="text-[12px] text-neutral-400 leading-none mt-[2px]">
                    Joined {joinDate}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-4 pt-4 border-t border-[#F0F0ED] grid grid-cols-2">
              <div className="flex flex-col items-center border-r border-[#E5E5E0]">
                <span className="text-[24px] font-bold text-[#1A1A1A] leading-none">{userEvents?.hosted?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-[2px]">Hosted</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[24px] font-bold text-[#1A1A1A] leading-none">{userEvents?.joined?.length || 0}</span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-[2px]">Joined</span>
              </div>
            </div>

            {/* Ratings Summary */}
            <div className="mt-4 pt-4 border-t border-[#F0F0ED] flex flex-col items-center">
              {profileRatings ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-bold text-[#1A1A1A] leading-none">{profileRatings.averageRating.toFixed(1)}</span>
                    <StarDisplay avg={profileRatings.averageRating} count={0} />
                  </div>
                  <p className="text-[12px] text-neutral-400 mt-1">{profileRatings.totalRatings} {profileRatings.totalRatings === 1 ? 'rating' : 'ratings'}</p>
                </>
              ) : (
                <p className="text-[12px] text-neutral-400">No ratings yet</p>
              )}
            </div>
          </div>

          {/* Underline Tabs */}
          <div className="mt-2 flex relative mx-4">
            <button
              onClick={() => switchTab("hosting")}
              className={`flex-1 h-[44px] text-[17px] transition-colors relative ${
                activeTab === "hosting" ? "text-[#1A1A1A] font-semibold" : "text-neutral-400 font-normal"
              }`}
            >
              Hosting
            </button>
            <button
              onClick={() => switchTab("joined")}
              className={`flex-1 h-[44px] text-[17px] transition-colors relative ${
                activeTab === "joined" ? "text-[#1A1A1A] font-semibold" : "text-neutral-400 font-normal"
              }`}
            >
              Joined
            </button>

            {/* Inactive line underneath both */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#E5E5E0] pointer-events-none" />
            
            {/* Active sliding indicator */}
            <div 
              className="absolute bottom-0 h-[2px] bg-black transition-all duration-200 pointer-events-none" 
              style={{ 
                width: '50%', 
                left: activeTab === 'hosting' ? '0%' : '50%'
              }} 
            />
          </div>

          {/* Event List / Empty States */}
          <div className="mt-4 space-y-4 px-4">
            {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
              activeTab === "hosting" ? (
                <EmptyState
                  icon={CalendarRange}
                  heading="Nothing hosted yet"
                  subtext="Host your first event and bring people together."
                  buttonText="Host a thing"
                  onAction={() => navigate("/host")}
                />
              ) : (
                <EmptyState
                  icon={Users}
                  heading="No events joined yet"
                  subtext="Find something that sounds fun and tap 'I'm Going'."
                  buttonText="Browse events"
                  onAction={() => navigate("/")}
                />
              )
            ) : (
              <>
                {/* Upcoming */}
                {upcomingEvents.length === 0 ? (
                  <p className="text-[14px] text-neutral-500 text-center py-8">
                    No upcoming events
                  </p>
                ) : (
                  upcomingEvents.map((event: any) => (
                    <EventCard key={event.id} event={event} isPast={false} />
                  ))
                )}

                {/* Past events collapsible */}
                {pastEvents.length > 0 && (
                  <div className="border-t border-[#E5E5E0] pt-4">
                    <button
                      onClick={() => setShowPastEvents((v) => !v)}
                      className="w-full flex items-center justify-between py-3 text-[14px] font-semibold text-[#1A1A1A] transition-colors"
                    >
                      <span>Past events ({pastEvents.length})</span>
                      <span className="text-[13px] text-neutral-400 font-normal">
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
