import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CalendarRange, MapPin, Check,
  Share2, AlertCircle, Clock, MoreVertical, Send,
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

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    return subscribeToMessages(id, () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    });
  }, [id, queryClient]);

  // Scroll to latest message when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    const content = chatInput.trim();
    if (!content || !user || !id || isSending) return;
    console.log('[Chat] sending:', { eventId: id, userId: user?.id, content });
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
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — do nothing
      }
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
      <div className="relative min-h-screen bg-[#131312] pb-[100px]">
        <div className="w-full bg-[#2A2A28] animate-pulse" style={{ height: "530px" }} />
        <div
          className="bg-[#242422] rounded-xl -mt-12 mx-6 p-8 space-y-6 relative z-20"
          style={{ border: "1px solid #2E2E2C", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
        >
          <div className="h-4 w-16 bg-[#2A2A28] rounded animate-pulse" />
          <div className="h-[36px] w-[80%] bg-[#2A2A28] rounded animate-pulse" />
          <div className="space-y-4">
            <div className="h-[64px] w-full bg-[#2A2A28] rounded-lg animate-pulse" />
            <div className="h-[64px] w-full bg-[#2A2A28] rounded-lg animate-pulse" />
            <div className="h-[64px] w-full bg-[#2A2A28] rounded-lg animate-pulse" />
          </div>
        </div>
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-[14px]"
          style={{
            height: "96px",
            backgroundColor: "#1C1C1A",
            borderTop: "1px solid #2E2E2C",
          }}
        >
          <div className="h-[54px] w-full bg-[#2A2A28] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Error / not found ───────────────────────────────────────────────────────
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#131312] px-4 text-center">
        <AlertCircle className="h-12 w-12 text-[#5A5A52] mb-4" strokeWidth={1.5} />
        <h3 className="text-[20px] font-semibold text-[#E5E2DE] mb-2">Event not found</h3>
        <p className="text-[14px] text-[#9A9A8E] mb-6 max-w-[280px]">
          This event might have been deleted or the link is broken.
        </p>
        <button
          className="px-8 h-[48px] rounded-full bg-[#242422] text-[#E5E2DE] font-semibold active:bg-[#2A2A28] transition-colors"
          style={{ border: "1px solid #2E2E2C" }}
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
    <div className="relative min-h-screen bg-[#131312] pb-[100px]">

      {/* ── Hero image ──────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: "530px" }}>
        {event.cover_image_url ? (
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: "#242422" }}
          >
            <span className="text-[28px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,107,53,0.15)" }}>
              Gather
            </span>
          </div>
        )}

        {/* Cinematic gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(19,19,18,0) 0%, rgba(19,19,18,0.4) 40%, rgba(19,19,18,1) 100%)",
          }}
        />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "rgba(0,0,0,0.40)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Top-right buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {isHost && (
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(0,0,0,0.40)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center justify-center rounded-full active:scale-95 transition-transform"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#1C1C1A",
              border: "1px solid #2A2A28",
            }}
            aria-label="Share"
          >
            <Share2 size={20} color="#F0EEE9" strokeWidth={1.8} />
          </button>
        </div>

        {/* Hero bottom content */}
        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="rounded-full px-3 py-1 font-semibold"
              style={{
                fontSize: "12px",
                backgroundColor: "rgba(255,107,53,0.2)",
                border: "1px solid rgba(255,107,53,0.3)",
                color: "#FF6B35",
              }}
            >
              {getVibeLabel(event.vibe)}
            </span>
          </div>
          <h1
            className="font-bold text-white leading-[1.05]"
            style={{ fontSize: "48px", letterSpacing: "-0.04em" }}
          >
            {event.title}
          </h1>
        </div>
      </div>

      {/* ── Dropdown menu ────────────────────────────────────────────────────── */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsMenuOpen(false)} />
          <div
            className="absolute top-[60px] right-4 z-[100] rounded-xl border shadow-xl overflow-hidden min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
            style={{ backgroundColor: "#2A2A28", borderColor: "#383836" }}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsDeleteModalOpen(true);
              }}
              className="w-full flex items-center px-4 py-3 text-[15px] font-medium active:bg-[#343432] transition-colors text-left"
              style={{ color: "#FF3B30" }}
            >
              Delete event
            </button>
          </div>
        </>
      )}

      {/* ── Content card ──────────────────────────────────────────────────────── */}
      <div
        className="relative -mt-12 z-20 mx-0 px-6 pt-8 pb-[100px] min-h-[60vh] rounded-xl"
        style={{
          backgroundColor: "#242422",
          border: "1px solid #2E2E2C",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        }}
      >

        {/* Info grid — 3 columns */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Date */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-lg mb-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#2A2A28",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <CalendarRange className="h-5 w-5" style={{ color: "#FF6B35" }} />
            </div>
            <span
              className="uppercase tracking-widest mb-1 block"
              style={{ fontSize: "12px", color: "#5A5A52" }}
            >
              Date
            </span>
            <span className="font-semibold block" style={{ fontSize: "15px", color: "#E5E2DE", lineHeight: 1.2 }}>
              {format(new Date(event.event_datetime), "MMM d")}
            </span>
            <span style={{ fontSize: "13px", color: "#9A9A8E" }}>
              {format(new Date(event.event_datetime), "EEEE")}
            </span>
          </div>

          {/* Time */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-lg mb-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#2A2A28",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Clock className="h-5 w-5" style={{ color: "#FF6B35" }} />
            </div>
            <span
              className="uppercase tracking-widest mb-1 block"
              style={{ fontSize: "12px", color: "#5A5A52" }}
            >
              Time
            </span>
            <span className="font-semibold block" style={{ fontSize: "15px", color: "#E5E2DE", lineHeight: 1.2 }}>
              {format(new Date(event.event_datetime), "h:mm")}
            </span>
            <span style={{ fontSize: "13px", color: "#9A9A8E" }}>
              {format(new Date(event.event_datetime), "a")}
            </span>
          </div>

          {/* Entry */}
          <div className="flex flex-col items-center text-center">
            <div
              className="flex items-center justify-center rounded-lg mb-3"
              style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#2A2A28",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <MapPin className="h-5 w-5" style={{ color: "#FF6B35" }} />
            </div>
            <span
              className="uppercase tracking-widest mb-1 block"
              style={{ fontSize: "12px", color: "#5A5A52" }}
            >
              Entry
            </span>
            <span className="font-semibold block" style={{ fontSize: "15px", color: "#E5E2DE", lineHeight: 1.2 }}>
              Free
            </span>
          </div>
        </div>

        {/* Location row */}
        <div
          className="flex items-start gap-3 mb-8 p-4 rounded-xl"
          style={{ backgroundColor: "#2A2A28", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#FF6B35" }} />
          <div className="flex flex-col">
            <span className="font-medium" style={{ fontSize: "15px", color: "#E5E2DE" }}>
              {event.location_text}
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline mt-1 inline-block"
              style={{ fontSize: "13px", color: "#FF6B35" }}
            >
              Open in Maps
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[#2E2E2C] mb-8" />

        {/* About section */}
        {event.description && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4" style={{ fontSize: "24px", color: "#E5E2DE" }}>
              About the Gathering
            </h2>
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{ fontSize: "18px", color: "#a8a29e", lineHeight: 1.6 }}
            >
              {event.description}
            </p>
          </div>
        )}

        {/* Host row */}
        <div
          className="flex items-center gap-4 mb-8 p-4 rounded-xl"
          style={{ backgroundColor: "#2A2A28", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            className="shrink-0 rounded-full overflow-hidden flex items-center justify-center text-white font-bold"
            style={{
              width: "48px",
              height: "48px",
              border: "2px solid rgba(255,107,53,0.30)",
              backgroundColor: "#FF6B35",
            }}
          >
            {event.host?.avatar_url ? (
              <img src={event.host.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span style={{ fontSize: "16px" }}>
                {event.host?.display_name?.charAt(0) || "?"}
              </span>
            )}
          </div>
          <div>
            <span
              className="block uppercase tracking-widest"
              style={{ fontSize: "10px", color: "#5A5A52" }}
            >
              Hosted by
            </span>
            <span className="font-semibold" style={{ fontSize: "14px", color: "#E5E2DE" }}>
              {event.host?.display_name}
            </span>
          </div>
        </div>

        {/* Attendees row */}
        <div className="mb-8 pt-6 border-t border-[#2E2E2C]">
          <h2
            className="font-bold uppercase tracking-[0.1em] mb-4"
            style={{ fontSize: "12px", color: "#5A5A52" }}
          >
            People Going
          </h2>
          {attendeesList.length === 0 ? (
            <div
              className="rounded-2xl p-4 text-center border border-dashed"
              style={{ backgroundColor: "#2A2A28", borderColor: "#383836" }}
            >
              <p className="text-[14px] text-[#5A5A52]">No one yet. Be the trendsetter.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {displayAttendees.map((att: any, i: number) => (
                  <div
                    key={att.id}
                    className="rounded-full overflow-hidden flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "2px solid #242422",
                      backgroundColor: "#2A2A28",
                      color: "#9A9A8E",
                      zIndex: 10 - i,
                    }}
                  >
                    {att.user?.avatar_url ? (
                      <img src={att.user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{att.user?.display_name?.charAt(0) || "?"}</span>
                    )}
                  </div>
                ))}
                {overflowCount > 0 && (
                  <div
                    className="rounded-full flex items-center px-3 font-bold z-0 ml-1"
                    style={{
                      height: "40px",
                      border: "2px solid #242422",
                      backgroundColor: "#2A2A28",
                      fontSize: "13px",
                      color: "#E5E2DE",
                    }}
                  >
                    +{overflowCount}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "14px", color: "#9A9A8E" }}>
                {attendeesList.length} going
              </span>
            </div>
          )}
        </div>

        {/* ── Group Chat ───────────────────────────────────────────────────────── */}
        <div className="pt-6 border-t border-[#2E2E2C] mb-8">
          <h2
            className="font-bold uppercase tracking-[0.1em] mb-4"
            style={{ fontSize: "12px", color: "#5A5A52" }}
          >
            Group Chat
          </h2>

          {/* Message list */}
          <div
            className="flex flex-col gap-4 mb-4"
            style={{
              minHeight: messages.length === 0 ? "48px" : undefined,
              width: "100%",
              overflowX: "hidden",
              overflowY: "auto",
            }}
          >
            {messages.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#5A5A52" }}>
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
                      padding: "0 16px",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="shrink-0 rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                      style={{
                        width: "30px",
                        height: "30px",
                        fontSize: "12px",
                        backgroundColor: isOwn ? "#FF6B35" : "#2A2A28",
                        border: isOwn ? "none" : "1px solid #383836",
                        flexShrink: 0,
                      }}
                    >
                      {msg.user?.avatar_url ? (
                        <img src={msg.user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        maxWidth: "75%",
                        minWidth: 0,
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                        alignItems: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <div className="flex items-baseline gap-2">
                        {!isOwn && (
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#E5E2DE" }}>
                            {msg.user?.display_name || "Guest"}
                          </span>
                        )}
                        <span style={{ fontSize: "11px", color: "#5A5A52" }}>
                          {format(new Date(msg.created_at), "h:mm a")}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "15px",
                          color: "#E5E2DE",
                          lineHeight: 1.45,
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          whiteSpace: "pre-wrap",
                          margin: 0,
                        }}
                      >
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send input — visible on all events (past and upcoming) */}
          <>
            {!user ? (
              <p style={{ fontSize: "13px", color: "#5A5A52" }}>
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
              <p style={{ color: "#6B6B63", fontSize: "13px" }}>
                Loading...
              </p>
            ) : !hasRSVPd ? (
              <p style={{ color: "#6B6B63", fontSize: "13px" }}>
                RSVP to join the conversation.
              </p>
            ) : (
              <div
                className="flex items-center gap-3"
                style={{
                  backgroundColor: "#2A2A28",
                  border: "1px solid #383836",
                  borderRadius: "14px",
                  padding: "8px 8px 8px 14px",
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontSize: "16px",
                    color: "#E5E2DE",
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSending}
                  className="flex items-center justify-center rounded-xl shrink-0 transition-opacity active:opacity-70 disabled:opacity-30"
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "#FF6B35",
                  }}
                >
                  <Send className="h-4 w-4 text-white" strokeWidth={2} />
                </button>
              </div>
            )}
            {sendError && (
              <p style={{ color: "#FF3B30", fontSize: "12px", padding: "4px 16px" }}>
                {(sendError as Error).message}
              </p>
            )}
          </>
        </div>

        {/* Ratings (past events only) */}
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
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-5 flex items-center sm:max-w-md sm:mx-auto"
        style={{
          height: "96px",
          backgroundColor: "#1C1C1A",
          borderTop: "1px solid #2E2E2C",
          boxShadow: "0 -8px 30px rgba(15,15,14,0.6)",
          paddingBottom: "env(safe-area-inset-bottom, 12px)",
        }}
      >
        <div className="flex items-center justify-between w-full gap-4">
          {/* Left: price */}
          <div className="flex flex-col">
            <span style={{ fontSize: "12px", color: "#5A5A52", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Entry
            </span>
            <span className="font-bold" style={{ fontSize: "20px", color: "#E5E2DE" }}>
              Free
            </span>
          </div>

          {/* Right: CTA button */}
          {isPastEvent ? (
            <button
              disabled
              className="flex-1 rounded-xl font-bold cursor-not-allowed"
              style={{
                height: "54px",
                backgroundColor: "#2A2A28",
                color: "#5A5A52",
                fontSize: "16px",
                border: "1px solid #383836",
              }}
            >
              Event Ended
            </button>
          ) : hasRSVPd ? (
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="flex-1 rounded-xl font-bold flex items-center justify-center active:scale-[0.98] transition-all"
              style={{
                height: "54px",
                backgroundColor: "transparent",
                border: "2px solid #FF6B35",
                color: "#FF6B35",
                fontSize: "16px",
              }}
            >
              <Check className="h-5 w-5 mr-2" strokeWidth={3} />
              You're Going
            </button>
          ) : (
            <button
              disabled={isRSVPPending}
              onClick={handleRSVPClick}
              className="flex-1 rounded-xl text-white font-bold active:scale-[0.98] transition-all"
              style={{
                height: "54px",
                backgroundColor: "#FF6B35",
                fontSize: "24px",
                boxShadow: "0 4px 15px rgba(255,107,53,0.3)",
              }}
            >
              I'm Going
            </button>
          )}
        </div>
      </div>

      {/* ── Cancel RSVP modal ─────────────────────────────────────────────────── */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent
          className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 shadow-2xl"
          style={{ backgroundColor: "#2A2A28", border: "1px solid #383836" }}
        >
          <DialogTitle className="text-[20px] font-bold text-[#E5E2DE] mb-2">
            Change your mind?
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#9A9A8E] mb-6 leading-relaxed">
            Cancelling your RSVP will notify the host and free up your spot for someone else.
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
              className="w-full h-[50px] rounded-xl font-bold text-[#E5E2DE] active:bg-[#343432] transition-all"
              style={{ border: "1px solid #383836" }}
            >
              Nevermind, I'm going
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete event modal ────────────────────────────────────────────────── */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => !isDeleting && setIsDeleteModalOpen(open)}
      >
        <DialogContent
          className="sm:max-w-[360px] rounded-2xl w-[90%] p-6 shadow-2xl"
          style={{ backgroundColor: "#2A2A28", border: "1px solid #383836" }}
        >
          <DialogTitle className="text-[20px] font-bold text-[#E5E2DE] mb-2">
            Delete this event?
          </DialogTitle>
          <DialogDescription className="text-[15px] text-[#9A9A8E] mb-6 leading-relaxed">
            This action is permanent. All attendees will be notified that the event was cancelled.
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
              className="w-full h-[50px] rounded-xl font-bold text-[#E5E2DE] active:bg-[#343432] transition-all"
              style={{ border: "1px solid #383836" }}
            >
              Go Back
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
