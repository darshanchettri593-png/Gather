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
      <div className="relative min-h-screen bg-white pb-[100px]">
        <div className="w-full h-[280px] bg-[#ECECE7] animate-pulse" />
        <div className="bg-white rounded-t-3xl -mt-6 p-6 space-y-6">
          <div className="h-4 w-16 bg-[#ECECE7] rounded animate-pulse" />
          <div className="h-[26px] w-[80%] bg-[#ECECE7] rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-[44px] w-full bg-[#ECECE7] rounded-lg animate-pulse" />
            <div className="h-[44px] w-full bg-[#ECECE7] rounded-lg animate-pulse" />
            <div className="h-[44px] w-full bg-[#ECECE7] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-[#E5E5E0] px-4 py-[14px]">
          <div className="h-[52px] w-full bg-[#ECECE7] rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Error / not found ───────────────────────────────────────────────────────

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center mt-20">
        <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" strokeWidth={1.5} />
        <h3 className="text-[20px] font-semibold text-neutral-900 mb-2">Event not found</h3>
        <p className="text-[14px] text-neutral-500 mb-6 max-w-[280px]">
          This event might have been deleted or the link is broken.
        </p>
        <button
          className="px-6 py-2.5 rounded-full border-2 border-neutral-200 text-neutral-700 font-semibold active:bg-neutral-50 transition-colors"
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
    <div className="relative min-h-screen bg-background pb-[100px]">

      {/* ── Cover Image ──────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[280px]">
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFE4DD] to-[#FFE8CC]" />
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border-0 active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Top-right button group */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border-0 active:scale-95 transition-transform"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
          )}

          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border-0 active:scale-95 transition-transform"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* ── Dropdown backdrop (click-outside to dismiss) ─────────────────────── */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── Dropdown menu (fixed so it escapes stacking-context clipping) ────── */}
      {isMenuOpen && (
        <div className="fixed top-[60px] right-4 z-[100] bg-white rounded-lg border border-[#E5E5E0] shadow-sm overflow-hidden min-w-[160px]">
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsDeleteModalOpen(true);
            }}
            className="w-full flex items-center px-4 py-3 text-[15px] font-medium text-[#FF3B30] hover:bg-red-50 active:bg-red-50 transition-colors text-left"
          >
            Delete event
          </button>
        </div>
      )}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-white rounded-t-[24px] -mt-[24px] px-6 pt-6 pb-[100px] min-h-[70vh] z-20">

        {/* Vibe tag */}
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          {getVibeLabel(event.vibe)}
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-bold tracking-tight text-[#1A1A1A] leading-snug mb-4 line-clamp-3">
          {event.title}
        </h1>

        {/* Host */}
        <div className="flex items-center gap-[12px] mb-6">
          <div className="h-8 w-8 rounded-full bg-[#F5F5F2] overflow-hidden flex items-center justify-center text-neutral-600 font-medium shrink-0">
            {event.host?.avatar_url ? (
              <img src={event.host.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px]">{event.host?.display_name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-neutral-500 block leading-tight">Hosted by</span>
            <span className="text-[14px] font-semibold text-neutral-900 leading-tight">
              {event.host?.display_name}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-0 mb-6">
          <div className="flex items-center h-[44px]">
            <CalendarRange className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={2} />
            <span className="ml-[12px] text-[14px] text-neutral-800">
              {format(new Date(event.event_datetime), "EEEE, MMMM d")}
            </span>
          </div>

          <div className="flex items-center h-[44px]">
            <Clock className="h-4 w-4 text-neutral-400 shrink-0" strokeWidth={2} />
            <span className="ml-[12px] text-[14px] text-neutral-800">
              {format(new Date(event.event_datetime), "h:mm a")}
            </span>
          </div>

          <div className="flex items-start py-[10px] min-h-[44px]">
            <MapPin className="h-4 w-4 text-neutral-400 shrink-0 mt-[2px]" strokeWidth={2} />
            <div className="ml-[12px] flex flex-col">
              <span className="text-[14px] text-neutral-800 mb-1">{event.location_text}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#FF6B35] font-medium hover:underline inline-block w-fit"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-8">
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500 mb-2">
              About
            </h2>
            <p className="text-[14px] text-neutral-800 leading-[1.6] whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Attendees */}
        <div className="mb-8">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            Who's coming
          </h2>
          {attendeesList.length === 0 ? (
            <p className="text-[13px] text-neutral-500">Be the first to join</p>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center -space-x-[8px] mb-[8px]">
                {displayAttendees.map((att: any, i: number) => (
                  <div
                    key={att.id}
                    className="h-8 w-8 rounded-full border-2 border-white bg-[#F5F5F2] overflow-hidden flex items-center justify-center text-[10px] font-semibold text-neutral-600 shrink-0"
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
                  <div className="h-8 rounded-full bg-[#ECECE7] flex items-center px-3 border-2 border-white text-[12px] font-medium text-neutral-700 z-0 ml-1">
                    +{overflowCount} more
                  </div>
                )}
              </div>
              <p className="text-[13px] text-neutral-600">
                {attendeesList.length} {attendeesList.length === 1 ? "person" : "people"} coming
              </p>
            </div>
          )}
        </div>

        {/* ── Ratings (past events only) ────────────────────────────────────── */}
        {isPastEvent && (
          <RatingSection
            eventId={id!}
            isHost={isHost}
            hasAttended={hasAttended}
            hostDisplayName={event.host?.display_name ?? null}
          />
        )}
      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5E0] px-4 pt-[14px] pb-[calc(14px+env(safe-area-inset-bottom))] z-40 sm:max-w-5xl sm:mx-auto">
        {isPastEvent ? (
          <button
            disabled
            className="w-full h-[52px] rounded-full bg-[#ECECE7] text-neutral-500 text-[16px] font-medium cursor-not-allowed"
          >
            This event has ended
          </button>
        ) : hasRSVPd ? (
          <>
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="w-full h-[52px] rounded-full bg-transparent border-[1.5px] border-[#1A1A1A] text-[#1A1A1A] text-[16px] font-semibold flex items-center justify-center active:bg-neutral-50 transition-colors"
            >
              <Check className="h-[18px] w-[18px] mr-2" strokeWidth={2.5} />
              You're Going
            </button>
            <p className="text-center text-[11px] text-neutral-500 mt-1.5">
              You've RSVP'd to this event
            </p>
          </>
        ) : (
          <>
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="w-full h-[52px] rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold active:opacity-90 transition-opacity"
            >
              I'm Going
            </button>
            <p className="text-center text-[11px] text-neutral-500 mt-1.5">
              Tap to RSVP and confirm attendance
            </p>
          </>
        )}
      </div>

      {/* ── Cancel RSVP modal ─────────────────────────────────────────────────── */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl w-[90%] p-6">
          <DialogTitle className="text-[18px] font-semibold text-[#1A1A1A] mb-2">
            Cancel your RSVP?
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-600 mb-6">
            You'll lose your spot and the host will be notified.
          </DialogDescription>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 h-[44px] rounded-full border border-[#E5E5E0] font-medium text-neutral-700 active:bg-neutral-50"
            >
              Keep RSVP
            </button>
            <button
              onClick={confirmCancelRSVP}
              className="flex-1 h-[44px] rounded-full bg-[#1A1A1A] text-white font-medium active:opacity-90"
            >
              Cancel RSVP
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete event modal ────────────────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}>
        <DialogContent className="sm:max-w-[340px] rounded-2xl w-[90%] p-6">
          <DialogTitle className="text-[18px] font-semibold text-[#1A1A1A] mb-2">
            Delete this event?
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-600 mb-6">
            This cannot be undone. All RSVPs will be removed.
          </DialogDescription>
          <div className="flex gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="flex-1 h-[44px] rounded-full border border-[#E5E5E0] font-medium text-neutral-700 active:bg-neutral-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 h-[44px] rounded-full bg-[#FF3B30] text-white font-medium active:opacity-90 disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
