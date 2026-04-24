import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useEventRatings, useMyRating, useSubmitRating } from "@/hooks/useRatings";
import { useToast } from "@/components/ui/toast";
import type { EventRating } from "@/types";

// ─── StarRow ─────────────────────────────────────────────────────────────────
// File-level component — never define inside another component (remount bug).

function StarRow({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const interactive = !!onChange;

  return (
    <div className="flex items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive
            ? "active:scale-90 transition-transform focus:outline-none"
            : "pointer-events-none"}
          aria-label={interactive ? `${n} star${n > 1 ? "s" : ""}` : undefined}
          tabIndex={interactive ? 0 : -1}
        >
          <Star
            className={`${dim} transition-colors ${
              n <= active
                ? "text-[#FF6B35] fill-[#FF6B35]"
                : "text-neutral-300 fill-neutral-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── StarDisplay (exported for profile cards) ─────────────────────────────────

export function StarDisplay({
  avg,
  count,
}: {
  avg: number;
  count: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <StarRow value={Math.round(avg)} size="sm" />
      <span className="text-[12px] text-neutral-500 font-medium leading-none">
        {avg.toFixed(1)}/5
        {count > 0 && (
          <span className="text-neutral-400"> ({count})</span>
        )}
      </span>
    </div>
  );
}

// ─── RatingItem (one review in the list) ─────────────────────────────────────

function RatingItem({ rating }: { rating: EventRating }) {
  return (
    <div className="flex gap-3 py-3 border-b border-[#E5E5E0] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[#F5F5F2] overflow-hidden flex items-center justify-center text-[11px] font-semibold text-neutral-600 shrink-0">
        {rating.rater?.avatar_url ? (
          <img src={rating.rater.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (rating.rater?.display_name || "?").charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-semibold text-neutral-900 truncate">
            {rating.rater?.display_name || "Anonymous"}
          </span>
          <span className="text-[11px] text-neutral-400 ml-2 shrink-0">
            {format(new Date(rating.created_at), "MMM d")}
          </span>
        </div>
        <StarRow value={rating.rating_value} size="sm" />
        {rating.comment && (
          <p className="text-[13px] text-neutral-600 mt-1.5 leading-relaxed">
            {rating.comment}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── RatingForm (the submit / edit form) ─────────────────────────────────────

function RatingForm({
  isHost,
  hostDisplayName,
  existing,
  onCancel,
  onSubmit,
  isPending,
}: {
  isHost: boolean;
  hostDisplayName: string | null;
  existing: EventRating | null;
  onCancel?: () => void;
  onSubmit: (stars: number, comment: string) => void;
  isPending: boolean;
}) {
  const [stars, setStars] = useState(existing?.rating_value ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");

  // Pre-fill from existing rating when it becomes available
  useEffect(() => {
    if (existing) {
      setStars(existing.rating_value);
      setComment(existing.comment ?? "");
    }
  }, [existing?.id]); // only re-sync when a different rating row appears

  const label = isHost
    ? "Rate how the event went"
    : `Rate ${hostDisplayName ? `${hostDisplayName}'s` : "this"} event`;

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-neutral-700">{label}</p>

      <StarRow value={stars} onChange={setStars} size="md" />

      {stars === 0 && (
        <p className="text-[11px] text-neutral-400">Tap a star to rate</p>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
        rows={2}
        placeholder="Leave a comment (optional)"
        className="w-full text-[14px] bg-white border border-[#E5E5E0] rounded-lg px-3 py-2 resize-none outline-none focus:border-[#1A1A1A] transition-colors placeholder:text-neutral-400 text-[#1A1A1A]"
      />
      {comment.length >= 160 && (
        <p className="text-[11px] text-neutral-400 text-right">{comment.length}/200</p>
      )}

      <div className="flex items-center justify-between">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => onSubmit(stars, comment)}
          disabled={isPending || stars === 0}
          className="ml-auto h-[40px] px-6 rounded-full bg-[#FF6B35] text-white text-[14px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {isPending
            ? "Submitting…"
            : existing
            ? "Update rating"
            : "Submit rating"}
        </button>
      </div>
    </div>
  );
}

// ─── RatingSection (main export) ─────────────────────────────────────────────

export function RatingSection({
  eventId,
  isHost,
  hasAttended,
  hostDisplayName,
}: {
  eventId: string;
  isHost: boolean;
  hasAttended: boolean;
  hostDisplayName: string | null;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: ratings = [] } = useEventRatings(eventId);
  const { data: myRating } = useMyRating(eventId, user?.id);
  const { mutate: submitRating, isPending } = useSubmitRating();

  const [isEditing, setIsEditing] = useState(false);

  const canRate = !!user && (hasAttended || isHost);
  const hasRated = !!myRating;
  const showForm = canRate && (!hasRated || isEditing);

  const attendeeRatings = ratings.filter((r) => r.rater_type === "attendee");
  const hostRatings = ratings.filter((r) => r.rater_type === "host");
  const totalRatings = ratings.length;

  const handleSubmit = (ratingValue: number, comment: string) => {
    if (!user || ratingValue === 0) return;
    submitRating(
      {
        eventId,
        raterId: user.id,
        raterType: isHost ? "host" : "attendee",
        ratingValue,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast("Rating submitted!", "success");
          setIsEditing(false);
        },
        onError: () => toast("Couldn't submit rating, try again", "error"),
      }
    );
  };

  // Show nothing if there's no content and no form to display
  if (!canRate && totalRatings === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500 mb-4">
        Reviews{totalRatings > 0 ? ` (${totalRatings})` : ""}
      </h2>

      {/* ── Rating form / your existing rating ─────────────────────────────── */}
      {canRate && (
        <div className="bg-[#F9F9F7] rounded-xl p-4 mb-5">
          {hasRated && !isEditing ? (
            // Summary view — show their rating with an Edit button
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-semibold mb-1.5">
                  Your rating
                </p>
                <StarRow value={myRating!.rating_value} size="md" />
                {myRating!.comment && (
                  <p className="text-[13px] text-neutral-600 mt-2 leading-relaxed">
                    {myRating!.comment}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[13px] font-medium text-[#FF6B35] hover:opacity-80 transition-opacity shrink-0 pt-0.5"
              >
                Edit
              </button>
            </div>
          ) : (
            <RatingForm
              isHost={isHost}
              hostDisplayName={hostDisplayName}
              existing={myRating ?? null}
              onCancel={hasRated ? () => setIsEditing(false) : undefined}
              onSubmit={handleSubmit}
              isPending={isPending}
            />
          )}
        </div>
      )}

      {/* ── Attendee ratings ─────────────────────────────────────────────────── */}
      {attendeeRatings.length > 0 && (
        <div>
          {isHost && (
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-semibold mb-2">
              Attendee reviews
            </p>
          )}
          <div>
            {attendeeRatings.map((r) => (
              <RatingItem key={r.id} rating={r} />
            ))}
          </div>
        </div>
      )}

      {/* ── Host's note ──────────────────────────────────────────────────────── */}
      {hostRatings.length > 0 && (
        <div className={attendeeRatings.length > 0 ? "mt-4" : ""}>
          {(attendeeRatings.length > 0 || !isHost) && (
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide font-semibold mb-2">
              Host's note
            </p>
          )}
          <div>
            {hostRatings.map((r) => (
              <RatingItem key={r.id} rating={r} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — eligible but no ratings yet */}
      {canRate && totalRatings === 0 && !showForm && (
        <p className="text-[13px] text-neutral-400">No reviews yet. Be the first!</p>
      )}
    </div>
  );
}
