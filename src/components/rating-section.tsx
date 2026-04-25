import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { useEventRatings, useMyRating, useSubmitRating } from "@/hooks/useRatings";
import { useToast } from "@/components/ui/toast";
import type { EventRating } from "@/types";

// ─── StarRow ─────────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-[4px]">
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
                : "text-[#343432] fill-[#343432]"
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
    <div className="flex items-center gap-2">
      <StarRow value={Math.round(avg)} size="sm" />
      <span className="text-[12px] text-[#9A9A8E] font-bold leading-none">
        {avg.toFixed(1)} <span className="text-[#5A5A52] font-medium">({count})</span>
      </span>
    </div>
  );
}

// ─── RatingItem (one review in the list) ─────────────────────────────────────

function RatingItem({ rating }: { rating: EventRating }) {
  return (
    <div className="flex gap-3 py-4 border-b border-[#2E2E2C]/50 last:border-0">
      <div className="w-9 h-9 rounded-full bg-[#FF6B35] overflow-hidden flex items-center justify-center text-[12px] font-bold text-white shrink-0 border-2 border-[#242422]">
        {rating.rater?.avatar_url ? (
          <img src={rating.rater.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          (rating.rater?.display_name || "?").charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[14px] font-bold text-[#F0F0EA] truncate">
            {rating.rater?.display_name || "Anonymous User"}
          </span>
          <span className="text-[11px] text-[#5A5A52] ml-2 shrink-0 font-medium">
            {format(new Date(rating.created_at), "MMM d, yyyy")}
          </span>
        </div>
        <StarRow value={rating.rating_value} size="sm" />
        {rating.comment && (
          <p className="text-[14px] text-[#9A9A8E] mt-2 leading-relaxed">
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

  useEffect(() => {
    if (existing) {
      setStars(existing.rating_value);
      setComment(existing.comment ?? "");
    }
  }, [existing?.id]);

  const label = isHost
    ? "How did the event go?"
    : `How was ${hostDisplayName ? `${hostDisplayName}'s` : "the"} event?`;

  return (
    <div className="space-y-4">
      <p className="text-[14px] font-bold text-[#F0F0EA]">{label}</p>

      <StarRow value={stars} onChange={setStars} size="md" />

      {stars === 0 && (
        <p className="text-[11px] text-[#5A5A52] font-bold uppercase tracking-wider">Tap to rate</p>
      )}

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={200}
        rows={3}
        placeholder="Share your experience (optional)..."
        className="w-full text-[14px] bg-[#2C2C2A] border border-[#383836] rounded-xl px-4 py-3 resize-none outline-none focus:border-[#FF6B35] transition-all placeholder:text-[#5A5A52] text-[#F0F0EA]"
      />
      {comment.length >= 160 && (
        <p className="text-[11px] text-[#5A5A52] text-right">{comment.length}/200</p>
      )}

      <div className="flex items-center justify-between pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-[#5A5A52] font-bold hover:text-[#9A9A8E] transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => onSubmit(stars, comment)}
          disabled={isPending || stars === 0}
          className="ml-auto h-[44px] px-8 rounded-full bg-[#FF6B35] text-white text-[14px] font-bold disabled:opacity-50 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(255,107,53,0.3)]"
        >
          {isPending
            ? "Submitting..."
            : existing
            ? "Update Review"
            : "Post Review"}
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

  if (!canRate && totalRatings === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] mb-5">
        Reviews{totalRatings > 0 ? ` (${totalRatings})` : ""}
      </h2>

      {/* ── Rating form / your existing rating ─────────────────────────────── */}
      {canRate && (
        <div className="bg-[#242422] rounded-2xl p-5 mb-8 border border-[#2E2E2C] shadow-sm">
          {hasRated && !isEditing ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#5A5A52] uppercase tracking-[0.1em] font-bold mb-3">
                  Your review
                </p>
                <StarRow value={myRating!.rating_value} size="md" />
                {myRating!.comment && (
                  <p className="text-[15px] text-[#9A9A8E] mt-3 leading-relaxed">
                    {myRating!.comment}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[13px] font-bold text-[#FF6B35] active:opacity-70 transition-opacity shrink-0"
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
        <div className="space-y-1">
          {isHost && (
            <p className="text-[11px] text-[#5A5A52] uppercase tracking-[0.1em] font-bold mb-3">
              Guest reviews
            </p>
          )}
          <div className="flex flex-col">
            {attendeeRatings.map((r) => (
              <RatingItem key={r.id} rating={r} />
            ))}
          </div>
        </div>
      )}

      {/* ── Host's note ──────────────────────────────────────────────────────── */}
      {hostRatings.length > 0 && (
        <div className={attendeeRatings.length > 0 ? "mt-8" : ""}>
          {(attendeeRatings.length > 0 || !isHost) && (
            <p className="text-[11px] text-[#5A5A52] uppercase tracking-[0.1em] font-bold mb-3">
              Host's note
            </p>
          )}
          <div className="flex flex-col">
            {hostRatings.map((r) => (
              <RatingItem key={r.id} rating={r} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {canRate && totalRatings === 0 && !showForm && (
        <div className="bg-[#2C2C2A] rounded-2xl p-6 text-center border border-dashed border-[#383836]">
          <p className="text-[14px] text-[#5A5A52] font-medium">No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  );
}
