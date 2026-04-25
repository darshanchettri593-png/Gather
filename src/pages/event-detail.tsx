import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CalendarRange, MapPin, Check,
  Share2, AlertCircle, Clock, MoreVertical,
} from "lucide-react";
import { useEventDetail, useRSVPStatus, useToggleRSVP } from "@/lib/queries";
import { useDeleteEvent } from "@/hooks/useEvent";
import { useAuth } from "@/lib/auth-context";
import { RatingSection } from "@/components/rating-section";
import { format } from "date-fns";
import { getVibeLabel } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useEventDetail(id || "");
  const { data: hasRSVPd } = useRSVPStatus(id || "", user?.id);
  const { mutate: toggleRSVP, isPending: isRSVPPending } = useToggleRSVP();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isHost = !!user && !!event && user.id === event.host_id;

  // Handle pending RSVP intent after login
  useEffect(() => {
    if (user && id) {
      const pendingEventId = localStorage.getItem("pending_rsvp_event_id");
      if (pendingEventId === id && hasRSVPd === false) {
        localStorage.removeItem("pending_rsvp_event_id");
        toggleRSVP(
          { eventId: id, userId: user.id, isAttending: false },
          {
            onSuccess: () => toast("You're in!", "success"),
            onError: () => toast("Couldn't update RSVP, try again", "error"),
          }
        );
      }
    }
  }, [user, id, hasRSVPd, toggleRSVP, toast]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title || "Gather Event", url: window.location.href });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast("Link copied");
    }
  };

  const handleRSVPClick = () => {
    if (!user) {
      openAuthModal(
        "We just need your name and email so the host knows who's coming. Takes 10 seconds.",
        `/event/${id}`
      );
      return;
    }
    if (hasRSVPd) {
      setIsCancelModalOpen(true);
    } else {
      toggleRSVP(
        { eventId: id as string, userId: user.id, isAttending: false },
        {
          onSuccess: () => toast("You're in!", "success"),
          onError: () => toast("Couldn't update RSVP, try again", "error"),
        }
      );
    }
  };

  const confirmCancelRSVP = () => {
    setIsCancelModalOpen(false);
    if (user && id) {
      toggleRSVP(
        { eventId: id, userId: user.id, isAttending: true },
        {
          onSuccess: () => toast("RSVP cancelled"),
          onError: () => toast("Couldn't update RSVP, try again", "error"),
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!event || !id) return;
    deleteEvent(
      { eventId: id, coverImageUrl: event.cover_image_url },
      {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          toast("Event deleted");
          navigate("/");
        },
        onError: (err: any) => {
          console.error("[DeleteEvent] Error:", err);
          toast("Couldn't delete event, try again", "error");
        },
      }
    );
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#1C1C1A] pb-[100px]">
        <div className="w-full h-[280px] bg-[#2C2C2A] animate-pulse" />
        <div className="bg-[#242422] rounded-t-3xl -mt-6 p-6 space-y-6">
          <div className="h-4 w-16 bg-[#2C2C2A] rounded animate-pulse" />
          <div className="h-[26px] w-[80%] bg-[#2C2C2A] rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-[44px] w-full bg-[#2C2C2A] rounded-lg animate-pulse" />
            <div className="h-[44px] w-full bg-[#2C2C2A] rounded-lg animate-pulse" />
            <div className="h-[44px] w-full bg-[#2C2C2A] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-[#242422]/90 backdrop-blur-xl border-t border-[#2E2E2C] px-4 py-[14px]">
          <div className="h-[52px] w-full bg-[#2C2C2A] rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Error / not found ───────────────────────────────────────────────────────

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1C1C1A] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-[#5A5A52] mb-4" strokeWidth={1.5} />
        <h3 className="text-[20px] font-semibold text-[#F0F0EA] mb-2">Event not found</h3>
        <p className="text-[14px] text-[#9A9A8E] mb-6 max-w-[280px]">
          This event might have been deleted or the link is broken.
        </p>
        <button
          className="px-8 h-[48px] rounded-full bg-[#242422] border border-[#2E2E2C] text-[#F0F0EA] font-semibold active:bg-[#2C2C2A] transition-colors"
          onClick={() => navigate("/")}
        >
          Back to feed
        </button>
      </div>
    );
  }

  // ─── Derived values ──────────────────────────────────────────────────────────

  const isPastEvent = new Date(event.event_datetime) < new Date();
  const attendeesList = event.attendees || [];
  const displayAttendees = attendeesList.slice(0, 5);
  const overflowCount = Math.max(0, attendeesList.length - 5);
  const encodedLocation = encodeURIComponent(event.location_text || "");
  const hasAttended = !!user && attendeesList.some((att: any) => att.user?.id === user.id);

  // ─── Page ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#1C1C1A] pb-[100px]">

      {/* ── Cover Image ──────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[280px]">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#2C2C2A] flex items-center justify-center text-[24px] font-bold text-[#FF6B35]/20 uppercase tracking-widest">
            Gather
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Top-right button group */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
          )}

          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-90 transition-transform"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* ── Dropdown menu ────── */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute top-[60px] right-4 z-[100] bg-[#2C2C2A] rounded-xl border border-[#383836] shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsDeleteModalOpen(true);
              }}
              className="w-full flex items-center px-4 py-3 text-[15px] font-medium text-[#FF3B30] active:bg-[#343432] transition-colors text-left"
            >
              Delete event
            </button>
          </div>
        </>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#242422] rounded-t-[24px] border-t border-[#2E2E2C] -mt-[24px] px-6 pt-6 pb-[100px] min-h-[70vh] z-20 shadow-[0_-12px_40px_rgba(0,0,0,0.4)]">

        {/* Vibe tag */}
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#FF6B35] mb-2">
          {getVibeLabel(event.vibe)}
        </div>

        {/* Title */}
        <h1 className="text-[28px] font-bold tracking-tight text-[#F0F0EA] leading-tight mb-4 line-clamp-3">
          {event.title}
        </h1>

        {/* Host */}
        <div className="flex items-center gap-[12px] mb-8 bg-[#2C2C2A] p-3 rounded-2xl border border-[#383836]">
          <div className="h-10 w-10 rounded-full bg-[#FF6B35] overflow-hidden flex items-center justify-center text-white font-bold shrink-0 border-2 border-[#242422]">
            {event.host?.avatar_url ? (
              <img src={event.host.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[14px]">{event.host?.display_name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-[#5A5A52] block font-medium uppercase tracking-wider">Hosted by</span>
            <span className="text-[15px] font-semibold text-[#F0F0EA] leading-tight">
              {event.host?.display_name}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center h-[48px]">
            <div className="w-9 h-9 rounded-full bg-[#2C2C2A] flex items-center justify-center shrink-0">
              <CalendarRange className="h-[18px] w-[18px] text-[#9A9A8E]" strokeWidth={2} />
            </div>
            <span className="ml-[12px] text-[15px] text-[#F0F0EA] font-medium">
              {format(new Date(event.event_datetime), "EEEE, MMMM d")}
            </span>
          </div>

          <div className="flex items-center h-[48px]">
            <div className="w-9 h-9 rounded-full bg-[#2C2C2A] flex items-center justify-center shrink-0">
              <Clock className="h-[18px] w-[18px] text-[#9A9A8E]" strokeWidth={2} />
            </div>
            <span className="ml-[12px] text-[15px] text-[#F0F0EA] font-medium">
              {format(new Date(event.event_datetime), "h:mm a")}
            </span>
          </div>

          <div className="flex items-start py-[6px] min-h-[48px]">
            <div className="w-9 h-9 rounded-full bg-[#2C2C2A] flex items-center justify-center shrink-0 mt-[2px]">
              <MapPin className="h-[18px] w-[18px] text-[#9A9A8E]" strokeWidth={2} />
            </div>
            <div className="ml-[12px] flex flex-col pt-[4px]">
              <span className="text-[15px] text-[#F0F0EA] font-medium leading-snug">{event.location_text}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#FF6B35] font-semibold hover:underline mt-1.5 inline-block w-fit"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-8 pt-6 border-t border-[#2E2E2C]">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] mb-3">
              Description
            </h2>
            <p className="text-[15px] text-[#9A9A8E] leading-[1.6] whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Attendees */}
        <div className="mb-8 pt-6 border-t border-[#2E2E2C]">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] mb-4">
            People Going
          </h2>
          {attendeesList.length === 0 ? (
            <div className="bg-[#2C2C2A] rounded-2xl p-4 text-center border border-dashed border-[#383836]">
              <p className="text-[14px] text-[#5A5A52]">No one yet. Be the trendsetter.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 bg-[#2C2C2A] p-4 rounded-2xl border border-[#383836]">
              <div className="flex items-center -space-x-[10px]">
                {displayAttendees.map((att: any, i: number) => (
                  <div
                    key={att.id}
                    className="h-9 w-9 rounded-full border-2 border-[#2C2C2A] bg-[#343432] overflow-hidden flex items-center justify-center text-[12px] font-bold text-[#9A9A8E] shrink-0"
                    style={{ zIndex: 10 - i }}
                  >
                    {att.user?.avatar_url ? (
                      <img src={att.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{att.user?.display_name?.charAt(0) || "?"}</span>
                    )}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div className="h-9 rounded-full bg-[#343432] flex items-center px-3 border-2 border-[#2C2C2A] text-[13px] font-bold text-[#F0F0EA] z-0 ml-1">
                    +{overflowCount}
                  </div>
                )}
              </div>
              <p className="text-[14px] font-medium text-[#F0F0EA]">
                {attendeesList.length} {attendeesList.length === 1 ? "is" : "are"} joining
              </p>
            </div>
          )}
        </div>

        {/* ── Ratings (past events only) ────────────────────────────────────── */}
        {isPastEvent && (
          <div className="pt-6 border-t border-[#2E2E2C]">
            <RatingSection
              eventId={id!}
              isHost={isHost}
              hasAttended={hasAttended}
              hostDisplayName={event.host?.display_name ?? null}
            />
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#242422]/80 backdrop-blur-xl border-t border-[#2E2E2C] px-5 pt-[14px] pb-[calc(14px+env(safe-area-inset-bottom,20px))] z-40 sm:max-w-md sm:mx-auto">
        {isPastEvent ? (
          <button
            disabled
            className="w-full h-[54px] rounded-2xl bg-[#2C2C2A] text-[#5A5A52] text-[16px] font-bold cursor-not-allowed border border-[#383836]"
          >
            Event Ended
          </button>
        ) : hasRSVPd ? (
          <div className="flex flex-col gap-2">
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="w-full h-[54px] rounded-2xl bg-transparent border-2 border-[#FF6B35] text-[#FF6B35] text-[16px] font-bold flex items-center justify-center active:scale-[0.98] transition-all"
            >
              <Check className="h-5 w-5 mr-2" strokeWidth={3} />
              You're Going
            </button>
            <p className="text-center text-[12px] text-[#5A5A52] font-medium">
              See you there! Tap to change RSVP.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="w-full h-[54px] rounded-2xl bg-[#FF6B35] text-white text-[16px] font-bold active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(255,107,53,0.3)]"
            >
              I'm Going
            </button>
            <p className="text-center text-[12px] text-[#5A5A52] font-medium">
              Confirm your spot in 1-tap
            </p>
          </div>
        )}
      </div>

      {/* ── Cancel RSVP modal ─────────────────────────────────────────────────── */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 bg-[#2C2C2A] border-[#383836] shadow-2xl">
          <DialogTitle className="text-[20px] font-bold text-[#F0F0EA] mb-2">
            Change your mind?
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#9A9A8E] mb-6 leading-relaxed">
            Cancelling your RSVP will notify the host and free up your spot for someone else.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmCancelRSVP}
              className="w-full h-[50px] rounded-xl bg-[#FF3B30] text-white font-bold active:scale-[0.98] transition-all"
            >
              Cancel RSVP
            </button>
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="w-full h-[50px] rounded-xl border border-[#383836] font-bold text-[#F0F0EA] active:bg-[#343432] transition-all"
            >
              Nevermind, I'm going
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete event modal ────────────────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 bg-[#2C2C2A] border-[#383836] shadow-2xl">
          <DialogTitle className="text-[20px] font-bold text-[#F0F0EA] mb-2">
            Delete this event?
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#9A9A8E] mb-6 leading-relaxed">
            This action is permanent. All attendees will be notified that the event was cancelled.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full h-[50px] rounded-xl bg-[#FF3B30] text-white font-bold active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Event"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="w-full h-[50px] rounded-xl border border-[#383836] font-bold text-[#F0F0EA] active:bg-[#343432] transition-all"
            >
              Go Back
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
