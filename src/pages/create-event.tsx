import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EventVibe } from "@/types";
import { useToast } from "@/components/ui/toast";

const VIBES: { id: EventVibe; label: string; helper: string }[] = [
  { id: "move",    label: "Move",    helper: "Running, gym, hiking, yoga, sports, anything active" },
  { id: "create",  label: "Create",  helper: "Art sessions, jam sessions, writing, photography, crafts" },
  { id: "hang",    label: "Hang",    helper: "Parties, dinners, drinks, game nights, casual meetups" },
  { id: "learn",   label: "Learn",   helper: "Workshops, book clubs, talks, study groups, skill-shares" },
  { id: "explore", label: "Explore", helper: "Trips, hikes, food tours, visiting new places, adventures" },
];

const DISTRICTS = [
  "Siliguri", "Jalpaiguri", "Darjeeling",
  "Kalimpong", "Kurseong", "Alipurduar", "Cooch Behar", "Other",
];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#6B6B63",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "block",
  marginBottom: "8px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  height: "44px",
  fontSize: "16px",
  color: "#F0EEE9",
  backgroundColor: "transparent",
  border: "none",
  borderBottom: "1px solid #2A2A28",
  outline: "none",
  padding: "0",
};

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, openAuthModal } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal(
        "Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.",
        "/host"
      );
      navigate("/");
    }
  }, [user, authLoading]);

  const [coverUrl, setCoverUrl]           = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [title, setTitle]                 = useState("");
  const [vibe, setVibe]                   = useState<EventVibe>("move");
  const [district, setDistrict]           = useState(DISTRICTS[0]);
  const [date, setDate]                   = useState("");
  const [time, setTime]                   = useState("");
  const [locationStr, setLocationStr]     = useState("");
  const [description, setDescription]    = useState("");

  const isFormValid = coverUrl && title && vibe && district && locationStr && date && time;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in to host");
      const eventDateTime = new Date(`${date}T${time}`);
      if (eventDateTime <= new Date()) throw new Error("Date must be in the future");

      const { data, error } = await supabase.from("events").insert({
        host_id: user.id,
        title,
        vibe,
        district,
        city: localStorage.getItem("gather_city") || "Siliguri",
        location_text: locationStr,
        description: description || null,
        event_datetime: eventDateTime.toISOString(),
        cover_image_url: coverUrl || null,
      }).select().single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Your event is live!", "success");
      navigate(`/event/${data.id}`);
    },
  });

  const handleSubmit = () => {
    if (!isFormValid || createMutation.isPending || isUploadingImage) return;
    createMutation.mutate();
  };

  const selectedVibeObj = VIBES.find((v) => v.id === vibe);

  return (
    <div
      className="page-transition max-w-md mx-auto min-h-screen"
      style={{ backgroundColor: "#111110", paddingBottom: "80px" }}
    >
      {/* Nav header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between"
        style={{
          height: "56px",
          backgroundColor: "rgba(17,17,16,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #2A2A28",
          padding: "0 16px",
        }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center active:opacity-60 transition-opacity"
          style={{ width: "40px", height: "40px" }}
        >
          <ChevronLeft size={22} color="#F0EEE9" strokeWidth={2} />
        </button>

        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "16px",
            fontWeight: 600,
            color: "#F0EEE9",
          }}
        >
          Host a gathering
        </span>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || createMutation.isPending || isUploadingImage}
          className="transition-opacity active:opacity-70"
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: isFormValid && !createMutation.isPending && !isUploadingImage
              ? "#FF6B35"
              : "#3D3D38",
          }}
        >
          {createMutation.isPending ? "..." : "Publish"}
        </button>
      </header>

      {/* Form */}
      <div
        className="flex flex-col"
        style={{ padding: "24px 20px", gap: "28px" }}
      >
        {createMutation.error && (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#FF3B30",
              textAlign: "center",
              backgroundColor: "rgba(255,59,48,0.08)",
              borderRadius: "12px",
              padding: "12px",
            }}
          >
            {(createMutation.error as Error).message}
          </div>
        )}

        {/* Cover photo */}
        <div>
          <div
            className="w-full aspect-video overflow-hidden"
            style={{
              backgroundColor: "#1C1C1A",
              border: "1.5px dashed #2A2A28",
              borderRadius: "14px",
            }}
          >
            <ImageUploader
              bucket="event-covers"
              folder={user?.id}
              onUploadStart={() => setIsUploadingImage(true)}
              onUploadEnd={() => setIsUploadingImage(false)}
              onUploadSuccess={(url) => setCoverUrl(url)}
            />
          </div>
        </div>

        {/* Event name */}
        <div>
          <label style={LABEL_STYLE}>Event name</label>
          <input
            type="text"
            placeholder="Event name"
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              ...INPUT_STYLE,
              fontSize: "24px",
              fontWeight: 700,
            }}
            className="placeholder:text-[#3D3D38]"
          />
        </div>

        {/* Vibe */}
        <div>
          <label style={LABEL_STYLE}>Vibe</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {VIBES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVibe(v.id)}
                className="flex-shrink-0 transition-opacity active:opacity-70"
                style={{
                  height: "32px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: vibe === v.id ? 600 : 400,
                  backgroundColor: vibe === v.id ? "#FF6B35" : "#1C1C1A",
                  color: vibe === v.id ? "white" : "#6B6B63",
                  border: vibe === v.id ? "none" : "1px solid #2A2A28",
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          {selectedVibeObj && (
            <p style={{ fontSize: "13px", color: "#6B6B63", marginTop: "8px", lineHeight: 1.5 }}>
              {selectedVibeObj.helper}
            </p>
          )}
        </div>

        {/* Date + Time */}
        <div>
          <label style={LABEL_STYLE}>Date & Time</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...INPUT_STYLE, colorScheme: "dark" }}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ ...INPUT_STYLE, colorScheme: "dark" }}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={LABEL_STYLE}>Location</label>
          <input
            type="text"
            placeholder="Where's it happening?"
            maxLength={120}
            value={locationStr}
            onChange={(e) => setLocationStr(e.target.value)}
            style={INPUT_STYLE}
            className="placeholder:text-[#3D3D38]"
          />
        </div>

        {/* District pills */}
        <div>
          <label style={LABEL_STYLE}>District</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                onClick={() => setDistrict(d)}
                className="flex-shrink-0 transition-opacity active:opacity-70"
                style={{
                  height: "32px",
                  padding: "0 14px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: district === d ? 600 : 400,
                  backgroundColor: district === d ? "#FF6B35" : "#1C1C1A",
                  color: district === d ? "white" : "#6B6B63",
                  border: district === d ? "none" : "1px solid #2A2A28",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={LABEL_STYLE}>Description</label>
          <textarea
            placeholder="Tell people what to expect..."
            rows={4}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent outline-none resize-none placeholder:text-[#3D3D38] leading-relaxed"
            style={{
              fontSize: "16px",
              color: "#F0EEE9",
              borderBottom: "1px solid #2A2A28",
              minHeight: "80px",
              padding: "0 0 8px 0",
            }}
          />
        </div>
      </div>
    </div>
  );
}
