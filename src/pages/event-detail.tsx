import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft, CalendarRange, MapPin, Check,
  Share2, AlertCircle, Clock, MoreVertical, Send, Users,
} from "lucide-react";
import { useEventDetail, useRSVPStatus, useToggleRSVP } from "@/lib/queries";
import { useDeleteEvent } from "@/hooks/useEvent";
import { useAuth } from "@/lib/auth-context";
import { RatingSection } from "@/components/rating-section";
import { format } from "date-fns";
import { getVibeLabel } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useMessages, useSendMessage, subscribeToMessages } from "@/hooks/useMessages";
import { useQueryClient } from "@tanstack/react-query";
import { Countdown } from "@/components/ui/countdown";
import { formatDuration } from "@/lib/event-status";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading, error } = useEventDetail(id || "");
  const { data: hasRSVPd, isLoading: rsvpLoading } = useRSVPStatus(id || "", user?.id);
  const { mutate: toggleRSVP, isPending: isRSVPPending } = useToggleRSVP();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ─── Chat ────────────────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const { data: messages = [] } = useMessages(id || "");
  const { mutate: sendMessage, isPending: isSending, error: sendError } = useSendMessage();
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    return subscribeToMessages(id, () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    });
  }, [id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    const content = chatInput.trim();
    if (!content || !user || !id || isSending) return;
    setChatInput("");
    sendMessage({ eventId: id, userId: user.id, content });
  };

  const isHost = !!user && !!event && user.id === event.host_id;

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
    const formattedDate = event?.event_datetime
      ? format(new Date(event.event_datetime), "EEEE, MMM d 'at' h:mm a")
      : "";
    const shareData = {
      title: event?.title || "Gather Event",
      text: `Join me at ${event?.title} on ${formattedDate} in ${event?.location_text}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast("Link copied!");
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
          onError: (error: any) => {
            if (error.message.includes('This event is full')) {
              toast('This event is full', 'error');
            } else {
              toast('Something went wrong. Try again.', 'error');
            }
          },
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
          toast("Couldn't delete event, try again", "error");
        },
      }
    );
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="relative min-h-screen pb-[100px]" style={{ backgroundColor: "#111110" }}>
        <div className="w-full animate-pulse" style={{ height: "320px", backgroundColor: "#1C1C1A" }} />
        <div style={{ backgroundColor: "#1C1C1A", borderRadius: "24px 24px 0 0", marginTop: "-24px", padding: "24px 20px" }}>
          <div className="h-4 w-24 rounded animate-pulse mb-4" style={{ backgroundColor: "#242422" }} />
          <div className="h-7 w-3/4 rounded animate-pulse mb-6" style={{ backgroundColor: "#242422" }} />
          <div className="space-y-3">
            <div className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "#242422" }} />
            <div className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "#242422" }} />
          </div>
        </div>
        <div
          className="fixed bottom-0 left-0 right-0 px-5"
          style={{ height: "84px", backgroundColor: "#1C1C1A", borderTop: "1px solid #2A2A28", display: "flex", alignItems: "center" }}
        >
          <div className="h-[52px] w-full rounded-full animate-pulse" style={{ backgroundColor: "#242422" }} />
        </div>
      </div>
    );
  }

  // ─── Error / not found ───────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center" style={{ backgroundColor: "#111110" }}>
        <AlertCircle size={48} strokeWidth={1.5} style={{ color: "#3D3D38", marginBottom: "16px" }} />
        <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#F0EEE9", marginBottom: "8px" }}>Event not found</h3>
        <p style={{ fontSize: "14px", color: "#6B6B63", marginBottom: "24px", maxWidth: "280px" }}>
          This event might have been deleted or the link is broken.
        </p>
        <button
          style={{
            padding: "0 28px",
            height: "48px",
            borderRadius: "999px",
            backgroundColor: "#1C1C1A",
            border: "1px solid #2A2A28",
            color: "#F0EEE9",
            fontSize: "15px",
            fontWeight: 500,
          }}
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
  const attendeeCount = attendeesList.length;
  const isFull = event.capacity > 0 && attendeeCount >= event.capacity;
  const spotsLeft = event.capacity > 0 ? event.capacity - attendeeCount : Infinity;
  const totalDots = Math.min(event.capacity || 0, 20);
  const filledDots = Math.min(attendeeCount, totalDots);

  // ─── Page ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#111110", paddingBottom: "100px" }}>

      {/* ── Hero image — 320px, no title overlay ─────────────────────────────── */}
      <div className="relative w-full" style={{ height: "320px" }}>
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "#1C1C1A" }}>
            <span style={{ fontSize: "22px", fontWeight: 700, color: "#3D3D38", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Gather
            </span>
          </div>
        )}

        {/* Subtle bottom gradient so content card blends */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(17,17,16,0.6) 100%)" }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{
            width: "40px", height: "40px",
            backgroundColor: "rgba(0,0,0,0.50)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* ── Content card ──────────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#1C1C1A",
          borderRadius: "24px 24px 0 0",
          marginTop: "-24px",
          padding: "24px 20px",
          paddingBottom: "40px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Row 1: Vibe pill (left) + Share + Host menu (right) */}
        <div className="flex items-center justify-between mb-4">
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#FF6B35",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              backgroundColor: "rgba(255,107,53,0.12)",
              border: "1px solid rgba(255,107,53,0.2)",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            {getVibeLabel(event.vibe)}
          </span>

          <div className="flex items-center gap-2">
            {isHost && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  className="flex items-center justify-center rounded-full active:opacity-60 transition-opacity"
                  style={{ width: "36px", height: "36px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
                  aria-label="More options"
                >
                  <MoreVertical size={18} color="#6B6B63" strokeWidth={1.8} />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setIsMenuOpen(false)} />
                    <div
                      className="absolute z-[100] rounded-xl overflow-hidden"
                      style={{
                        top: "calc(100% + 6px)",
                        right: 0,
                        minWidth: "160px",
                        backgroundColor: "#242422",
                        border: "1px solid #2A2A28",
                      }}
                    >
                      <button
                        onClick={() => { setIsMenuOpen(false); setIsDeleteModalOpen(true); }}
                        className="w-full flex items-center px-4 py-3 text-left active:bg-[#2A2A28] transition-colors"
                        style={{ fontSize: "15px", fontWeight: 500, color: "#FF3B30" }}
                      >
                        Delete event
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={handleShare}
              className="flex items-center justify-center rounded-full active:opacity-60 transition-opacity"
              style={{ width: "36px", height: "36px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
              aria-label="Share"
            >
              <Share2 size={18} color="#6B6B63" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Event title */}
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#F0EEE9",
            lineHeight: 1.25,
            marginBottom: "24px",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {event.title}
        </h1>

        {/* Countdown / Live / Ended banner */}
        {event.end_datetime && (
          <Countdown
            eventDatetime={event.event_datetime}
            endDatetime={event.end_datetime}
          />
        )}

        {/* Info grid — 4 columns */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {/* Date */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-xl mb-2"
              style={{ width: "44px", height: "44px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
            >
              <CalendarRange size={20} style={{ color: "#FF6B35" }} />
            </div>
            <span style={{ fontSize: "10px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px", display: "block" }}>
              Date
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.2 }}>
              {format(new Date(event.event_datetime), "MMM d")}
            </span>
            <span style={{ fontSize: "12px", color: "#6B6B63" }}>
              {format(new Date(event.event_datetime), "EEEE")}
            </span>
          </div>

          {/* Time */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-xl mb-2"
              style={{ width: "44px", height: "44px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
            >
              <Clock size={20} style={{ color: "#FF6B35" }} />
            </div>
            <span style={{ fontSize: "10px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px", display: "block" }}>
              Time
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.2 }}>
              {format(new Date(event.event_datetime), "h:mm a")}
            </span>
            {event.end_datetime && (
              <>
                <span style={{ fontSize: "11px", color: "#6B6B63" }}>
                  to {format(new Date(event.end_datetime), "h:mm a")}
                </span>
                <span style={{ fontSize: "11px", color: "#3D3D38" }}>
                  ({formatDuration(event.event_datetime, event.end_datetime)})
                </span>
              </>
            )}
          </div>

          {/* Entry */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-xl mb-2"
              style={{ width: "44px", height: "44px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
            >
              <MapPin size={20} style={{ color: "#FF6B35" }} />
            </div>
            <span style={{ fontSize: "10px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px", display: "block" }}>
              Entry
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.2 }}>
              Free
            </span>
          </div>

          {/* Capacity */}
          {event.capacity > 0 && (
            <div className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-xl mb-2"
                style={{ width: "44px", height: "44px", backgroundColor: "#242422", border: "1px solid #2A2A28" }}
              >
                <Users size={20} style={{ color: "#FF6B35" }} />
              </div>
              <span style={{ fontSize: "10px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px", display: "block" }}>
                Capacity
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#F0EEE9", lineHeight: 1.2 }}>
                {attendeeCount}/{event.capacity}
              </span>
              <span style={{ fontSize: "11px", color: isFull ? "#FF3B30" : "#6B6B63" }}>
                {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#2A2A28", marginBottom: "20px" }} />

        {/* Gathering Pulse dots */}
        {event.capacity > 0 && totalDots > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "12px 0" }}>
            {Array.from({ length: totalDots }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: i < filledDots ? "#FF6B35" : "#2A2A28",
                  boxShadow: i < filledDots ? "0 0 6px rgba(255,107,53,0.5)" : "none",
                }}
              />
            ))}
          </div>
        )}

        {/* Location */}
        <div
          className="flex items-start gap-3 mb-6 p-4 rounded-xl"
          style={{ backgroundColor: "#242422", border: "1px solid #2A2A28" }}
        >
          <MapPin size={16} strokeWidth={1.8} style={{ color: "#FF6B35", marginTop: "2px", flexShrink: 0 }} />
          <div className="flex flex-col">
            <span style={{ fontSize: "15px", color: "#F0EEE9", fontWeight: 500 }}>
              {event.location_text}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px", color: "#FF6B35", marginTop: "4px", fontWeight: 600 }}
              className="hover:underline"
            >
              Open in Maps
            </a>
          </div>
        </div>

        {/* WhatsApp group link */}
        {event.whatsapp_link && (
          <a
            href={event.whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#1A2E1A",
              border: "1px solid #2A3D2A",
              borderRadius: "14px",
              padding: "14px 16px",
              textDecoration: "none",
              marginBottom: "16px",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div>
              <p style={{ color: "#25D366", fontSize: "15px", fontWeight: 600, margin: 0 }}>
                Join WhatsApp Group
              </p>
              <p style={{ color: "#6B6B63", fontSize: "12px", margin: "2px 0 0" }}>
                Chat with other attendees
              </p>
            </div>
            <svg style={{ marginLeft: "auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B6B63" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>
        )}

        {/* About */}
        {event.description && (
          <div className="mb-6">
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#F0EEE9", marginBottom: "10px" }}>
              About
            </h2>
            <p style={{ fontSize: "15px", color: "#6B6B63", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {event.description}
            </p>
          </div>
        )}

        {/* Host */}
        <Link
          to={`/user/${event.host_id}`}
          className="flex items-center gap-3 mb-6 p-4 rounded-xl active:opacity-80 transition-opacity"
          style={{ backgroundColor: "#242422", border: "1px solid #2A2A28", textDecoration: "none", display: "flex" }}
        >
          <div
            className="shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
            style={{ width: "44px", height: "44px", backgroundColor: "#FF6B35", border: "2px solid rgba(255,107,53,0.3)" }}
          >
            {event.host?.avatar_url ? (
              <img src={event.host.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span style={{ fontSize: "16px" }}>{event.host?.display_name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <span style={{ fontSize: "10px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
              Hosted by
            </span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#F0EEE9" }}>
              {event.host?.display_name}
            </span>
          </div>
        </Link>

        {/* Who's coming */}
        <div className="mb-6" style={{ paddingTop: "16px", borderTop: "1px solid #2A2A28" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Who's Coming
          </h2>
          {attendeesList.length === 0 ? (
            <div
              className="p-4 text-center rounded-xl"
              style={{ backgroundColor: "#242422", border: "1px dashed #2A2A28" }}
            >
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>No one yet. Be the trendsetter.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {displayAttendees.map((att: any, i: number) => (
                  <Link
                    key={att.id}
                    to={`/user/${att.user?.id}`}
                    className="rounded-full overflow-hidden flex items-center justify-center font-bold shrink-0 active:opacity-70 transition-opacity"
                    style={{
                      width: "36px", height: "36px",
                      border: "2px solid #1C1C1A",
                      backgroundColor: "#242422",
                      color: "#6B6B63",
                      fontSize: "12px",
                      zIndex: 10 - i,
                      textDecoration: "none",
                    }}
                  >
                    {att.user?.avatar_url ? (
                      <img src={att.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{att.user?.display_name?.charAt(0) || "?"}</span>
                    )}
                  </Link>
                ))}
                {overflowCount > 0 && (
                  <div
                    className="rounded-full flex items-center px-2 font-bold"
                    style={{ height: "36px", border: "2px solid #1C1C1A", backgroundColor: "#242422", fontSize: "12px", color: "#F0EEE9" }}
                  >
                    +{overflowCount}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "13px", color: "#6B6B63" }}>
                {attendeesList.length} going
              </span>
            </div>
          )}
        </div>

        {/* ── Group Chat ───────────────────────────────────────────────────────── */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid #2A2A28", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "11px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
            Group Chat
          </h2>

          {/* Message list */}
          <div
            className="flex flex-col gap-4 mb-4"
            style={{ minHeight: messages.length === 0 ? "48px" : undefined, width: "100%", overflowX: "hidden", overflowY: "auto" }}
          >
            {messages.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                No messages yet. Be the first to say something.
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const initial = (msg.user?.display_name || "?").charAt(0).toUpperCase();
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      width: "100%",
                      overflow: "hidden",
                      alignItems: "flex-start",
                      gap: "10px",
                      justifyContent: isOwn ? "flex-end" : "flex-start",
                      flexDirection: isOwn ? "row-reverse" : "row",
                      padding: "0 4px",
                    }}
                  >
                    <div
                      className="shrink-0 rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                      style={{
                        width: "30px", height: "30px", fontSize: "12px", flexShrink: 0,
                        backgroundColor: isOwn ? "#FF6B35" : "#242422",
                        border: isOwn ? "none" : "1px solid #2A2A28",
                      }}
                    >
                      {msg.user?.avatar_url ? (
                        <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : initial}
                    </div>
                    <div
                      style={{
                        display: "flex", flexDirection: "column", gap: "2px",
                        maxWidth: "75%", minWidth: 0,
                        wordBreak: "break-word", overflowWrap: "anywhere",
                        alignItems: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <div className="flex items-baseline gap-2">
                        {!isOwn && (
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#F0EEE9" }}>
                            {msg.user?.display_name || "Guest"}
                          </span>
                        )}
                        <span style={{ fontSize: "11px", color: "#6B6B63" }}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                      </div>
                      <p style={{ fontSize: "15px", color: "#F0EEE9", lineHeight: 1.45, wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap", margin: 0 }}>
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send input — visible on all events */}
          <>
            {!user ? (
              <p style={{ fontSize: "13px", color: "#6B6B63" }}>
                <button
                  onClick={() => openAuthModal("Sign in to join the conversation.", `/event/${id}`)}
                  style={{ color: "#FF6B35", fontWeight: 600 }}
                  className="active:opacity-70"
                >
                  Sign in
                </button>
                {" "}to join the conversation.
              </p>
            ) : rsvpLoading ? (
              <p style={{ color: "#6B6B63", fontSize: "13px" }}>Loading...</p>
            ) : !hasRSVPd ? (
              <p style={{ color: "#6B6B63", fontSize: "13px" }}>RSVP to join the conversation.</p>
            ) : (
              <div
                className="flex items-center gap-3"
                style={{ backgroundColor: "#242422", border: "1px solid #2A2A28", borderRadius: "14px", padding: "8px 8px 8px 14px" }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                  }}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "16px", color: "#F0EEE9" }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSending}
                  className="flex items-center justify-center rounded-xl shrink-0 transition-opacity active:opacity-70 disabled:opacity-30"
                  style={{ width: "36px", height: "36px", backgroundColor: "#FF6B35" }}
                >
                  <Send className="h-4 w-4 text-white" strokeWidth={2} />
                </button>
              </div>
            )}
            {sendError && (
              <p style={{ color: "#FF3B30", fontSize: "12px", padding: "4px 0" }}>
                {(sendError as Error).message}
              </p>
            )}
          </>
        </div>

        {/* Ratings (past events only) */}
        {isPastEvent && (
          <div style={{ paddingTop: "16px", borderTop: "1px solid #2A2A28", marginTop: "16px" }}>
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
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between"
        style={{
          backgroundColor: "#1C1C1A",
          borderTop: "1px solid #2A2A28",
          padding: "16px 20px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {/* Left: price */}
        <div className="flex flex-col">
          <span style={{ fontSize: "11px", color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Entry
          </span>
          <span style={{ fontSize: "20px", fontWeight: 700, color: "#F0EEE9" }}>
            Free
          </span>
        </div>

        {/* Right: CTA */}
        <div className="flex flex-col items-end gap-1">
          {isPastEvent ? (
            <button
              disabled
              style={{
                height: "52px",
                padding: "0 28px",
                borderRadius: "999px",
                backgroundColor: "#242422",
                border: "1px solid #2A2A28",
                color: "#6B6B63",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              Event Ended
            </button>
          ) : hasRSVPd ? (
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="flex items-center justify-center active:scale-[0.98] transition-all"
              style={{
                height: "52px",
                padding: "0 28px",
                borderRadius: "999px",
                backgroundColor: "transparent",
                border: "1px solid #FF6B35",
                color: "#FF6B35",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <Check className="h-4 w-4 mr-2" strokeWidth={2.5} />
              You're Going
            </button>
          ) : isFull ? (
            <button
              disabled
              style={{
                height: "52px",
                padding: "0 28px",
                borderRadius: "999px",
                backgroundColor: "#2A2A28",
                border: "1px solid #2A2A28",
                color: "#6B6B63",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "not-allowed",
              }}
            >
              Full · {attendeeCount}/{event.capacity}
            </button>
          ) : (
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="text-white active:scale-[0.98] transition-all"
              style={{
                height: "52px",
                padding: "0 32px",
                borderRadius: "999px",
                backgroundColor: "#FF6B35",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              I'm Going
            </button>
          )}
          {!isPastEvent && !hasRSVPd && !isFull && spotsLeft !== Infinity && spotsLeft <= 5 && spotsLeft > 0 && (
            <span style={{ fontSize: "13px", color: "#FF3B30", textAlign: "center" }}>
              Only {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left!
            </span>
          )}
        </div>
      </div>

      {/* ── Cancel RSVP modal ─────────────────────────────────────────────────── */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent
          className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 shadow-2xl"
          style={{ backgroundColor: "#1C1C1A", border: "1px solid #2A2A28" }}
        >
          <DialogTitle className="text-[20px] font-bold mb-2" style={{ color: "#F0EEE9" }}>
            Change your mind?
          </DialogTitle>
          <DialogDescription className="text-[15px] mb-6 leading-relaxed" style={{ color: "#6B6B63" }}>
            Cancelling your RSVP will free up your spot for someone else.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <button
              onClick={confirmCancelRSVP}
              className="w-full h-[50px] rounded-xl text-white font-bold active:scale-[0.98] transition-all"
              style={{ backgroundColor: "#FF3B30" }}
            >
              Cancel RSVP
            </button>
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="w-full h-[50px] rounded-xl font-bold active:opacity-70 transition-all"
              style={{ border: "1px solid #2A2A28", color: "#F0EEE9" }}
            >
              Nevermind, I'm going
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete event modal ────────────────────────────────────────────────── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}>
        <DialogContent
          className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 shadow-2xl"
          style={{ backgroundColor: "#1C1C1A", border: "1px solid #2A2A28" }}
        >
          <DialogTitle className="text-[20px] font-bold mb-2" style={{ color: "#F0EEE9" }}>
            Delete this event?
          </DialogTitle>
          <DialogDescription className="text-[15px] mb-6 leading-relaxed" style={{ color: "#6B6B63" }}>
            This action is permanent. All attendees will be notified.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full h-[50px] rounded-xl text-white font-bold active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ backgroundColor: "#FF3B30" }}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Event"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="w-full h-[50px] rounded-xl font-bold active:opacity-70 transition-all"
              style={{ border: "1px solid #2A2A28", color: "#F0EEE9" }}
            >
              Go Back
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
