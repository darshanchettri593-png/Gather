import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EventVibe } from "@/types";
import { useToast } from "@/components/ui/toast";
import { MapPicker } from "@/components/ui/map-picker";
import { sanitizeText } from "@/lib/sanitize";

const VIBES: { id: EventVibe; label: string; helper: string; emoji: string; short: string }[] = [
  { id: "move",    label: "Move",    emoji: "🏃", short: "Sport, hike, dance, walk",            helper: "Running, gym, hiking, yoga, sports, anything active" },
  { id: "create",  label: "Create",  emoji: "🎨", short: "Make something together",              helper: "Art sessions, jam sessions, writing, photography, crafts" },
  { id: "hang",    label: "Hang",    emoji: "🤙", short: "Casual, low-key, conversation",        helper: "Parties, dinners, drinks, game nights, casual meetups" },
  { id: "learn",   label: "Learn",   emoji: "📚", short: "Workshops & skill swaps",              helper: "Workshops, book clubs, talks, study groups, skill-shares" },
  { id: "explore", label: "Explore", emoji: "🗺️", short: "New places, food, experiences",        helper: "Trips, hikes, food tours, visiting new places, adventures" },
];

const DISTRICTS = [
  "Siliguri", "Jalpaiguri", "Darjeeling",
  "Kalimpong", "Kurseong", "Alipurduar", "Cooch Behar", "Other",
];

const GENDER_OPTIONS = [
  { label: "Open to all", value: "All" },
  { label: "Women only",  value: "Female" },
  { label: "Men only",    value: "Male" },
  { label: "LGBTQ+",      value: "LGBTQ+" },
];

const LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B6B63",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "8px",
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

  // ── Step ──────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── All existing state — untouched ────────────────────────────────────────────
  const [coverUrl, setCoverUrl]               = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [title, setTitle]                     = useState("");
  const [vibe, setVibe]                       = useState<EventVibe>("move");
  const [district, setDistrict]               = useState(DISTRICTS[0]);
  const [date, setDate]                       = useState("");
  const [time, setTime]                       = useState("");
  const [locationStr, setLocationStr]         = useState("");
  const [description, setDescription]         = useState("");
  const [whatsappLink, setWhatsappLink]       = useState("");
  const [endDate, setEndDate]                 = useState("");
  const [endTime, setEndTime]                 = useState("");
  const [endTimeError, setEndTimeError]       = useState("");
  const [capacity, setCapacity]               = useState("20");
  const [capacityError, setCapacityError]     = useState("");
  const [mapCoords, setMapCoords]             = useState<{ lat: number; lng: number } | null>(null);
  const [minAge, setMinAge]                   = useState('18');
  const [maxAge, setMaxAge]                   = useState('60');
  const [genderFilter, setGenderFilter]       = useState('All');

  useEffect(() => {
    if (date && !endDate) setEndDate(date);
  }, [date]);

  // ── Existing mutation — untouched ─────────────────────────────────────────────
  const isFormValid = coverUrl && title && vibe && district && locationStr && date && time && endDate && endTime && capacity;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in to host");
      const eventDateTime = new Date(`${date}T${time}`);
      if (eventDateTime <= new Date()) throw new Error("Date must be in the future");

      const endDT = new Date(`${endDate}T${endTime}`);
      const diffHours = (endDT.getTime() - eventDateTime.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 0) throw new Error("End must be after start time");
      if (diffHours > 12) throw new Error("Event cannot exceed 12 hours");

      const { data, error } = await supabase.from("events").insert({
        host_id: user.id,
        title: sanitizeText(title),
        vibe,
        district,
        location_text: sanitizeText(locationStr),
        description: description ? sanitizeText(description) : null,
        event_datetime: eventDateTime.toISOString(),
        end_datetime: endDT.toISOString(),
        cover_image_url: coverUrl || null,
        whatsapp_link: whatsappLink || null,
        capacity: parseInt(capacity),
        latitude: mapCoords?.lat ?? null,
        longitude: mapCoords?.lng ?? null,
        min_age: parseInt(minAge),
        max_age: parseInt(maxAge),
        gender_filter: genderFilter,
      }).select().single();

      if (error) {
        if (error.message.includes('You already have an active event')) {
          throw new Error('You already have an active event running. End it before hosting a new one.');
        }
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast("Your gathering is live! 🎉", "success");
      if (data?.id) {
        navigate(`/event/${data.id}`);
      } else {
        navigate("/");
      }
    },
  });

  // ── Existing handleSubmit — untouched ─────────────────────────────────────────
  const handleSubmit = () => {
    if (!isFormValid || createMutation.isPending || isUploadingImage) return;
    setEndTimeError("");
    setCapacityError("");
    if (!capacity || parseInt(capacity) < 1) {
      setCapacityError("Please set a capacity");
      return;
    }
    if (parseInt(capacity) > 10000) {
      setCapacityError("Maximum capacity is 10,000");
      return;
    }
    if (date && time && endDate && endTime) {
      const startDT = new Date(`${date}T${time}`);
      const endDT = new Date(`${endDate}T${endTime}`);
      if (endDT <= startDT) { setEndTimeError("End must be after start time"); return; }
      const diffHours = (endDT.getTime() - startDT.getTime()) / (1000 * 60 * 60);
      if (diffHours > 12) { setEndTimeError("Event cannot exceed 12 hours"); return; }
    }
    createMutation.mutate();
  };

  // ── Navigation helpers ────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 1) { navigate(-1); } else { setStep(s => s - 1); }
  };
  const goNext = () => setStep(s => s + 1);

  // ── Step content ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 1 ───────────────────────────────────────────────────────────────
      case 1:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                Let's get the basics
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Cover photo and a name people will recognize.
              </p>
            </div>

            {/* Cover photo */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                overflow: "hidden",
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

            {/* Event name */}
            <div>
              <label style={LABEL}>Event name</label>
              <input
                type="text"
                placeholder="Event name"
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#F0EEE9",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid #2A2A28",
                  outline: "none",
                  padding: "0 0 10px",
                }}
                className="placeholder:text-[#3D3D38]"
              />
              <p style={{ fontSize: "12px", color: "#3D3D38", marginTop: "6px", textAlign: "right" }}>
                {title.length} / 60
              </p>
            </div>
          </div>
        );

      // ── STEP 2 ───────────────────────────────────────────────────────────────
      case 2:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                What's the vibe?
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Helps the right people find your gathering.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {VIBES.map((v) => {
                const selected = vibe === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVibe(v.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      width: "100%",
                      backgroundColor: "#1C1C1A",
                      border: `1px solid ${selected ? "#FF6B35" : "#2A2A28"}`,
                      borderRadius: "14px",
                      padding: "16px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>{v.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "16px", fontWeight: 700, color: "#F0EEE9", margin: 0 }}>
                        {v.label}
                      </p>
                      <p style={{ fontSize: "13px", color: "#6B6B63", margin: "2px 0 0" }}>
                        {v.short}
                      </p>
                    </div>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        border: `2px solid ${selected ? "#FF6B35" : "#2A2A28"}`,
                        backgroundColor: selected ? "#FF6B35" : "transparent",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ── STEP 3 ───────────────────────────────────────────────────────────────
      case 3:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                When's it happening?
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Pick a start and end. Most gatherings run 2–3 hours.
              </p>
            </div>

            {/* STARTS card */}
            <div
              style={{
                backgroundColor: "#1C1C1A",
                border: "1px solid #2A2A28",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#FF6B35" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF6B35", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Starts
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={LABEL}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F0EEE9",
                      backgroundColor: "#242422",
                      border: "1px solid #2A2A28",
                      borderRadius: "10px",
                      padding: "0 12px",
                      outline: "none",
                      colorScheme: "dark",
                      boxSizing: "border-box",
                      WebkitTextFillColor: "#F0EEE9",
                    }}
                  />
                </div>
                <div>
                  <label style={LABEL}>Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F0EEE9",
                      backgroundColor: "#242422",
                      border: "1px solid #2A2A28",
                      borderRadius: "10px",
                      padding: "0 12px",
                      outline: "none",
                      colorScheme: "dark",
                      boxSizing: "border-box",
                      WebkitTextFillColor: "#F0EEE9",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Connector */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: "2px", height: "20px", backgroundColor: "#2A2A28" }} />
            </div>

            {/* ENDS card */}
            <div
              style={{
                backgroundColor: "#1C1C1A",
                border: "1px solid #2A2A28",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3D3D38" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Ends
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={LABEL}>Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={date}
                    onChange={(e) => { setEndDate(e.target.value); setEndTimeError(""); }}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F0EEE9",
                      backgroundColor: "#242422",
                      border: "1px solid #2A2A28",
                      borderRadius: "10px",
                      padding: "0 12px",
                      outline: "none",
                      colorScheme: "dark",
                      boxSizing: "border-box",
                      WebkitTextFillColor: "#F0EEE9",
                    }}
                  />
                </div>
                <div>
                  <label style={LABEL}>Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => { setEndTime(e.target.value); setEndTimeError(""); }}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#F0EEE9",
                      backgroundColor: "#242422",
                      border: "1px solid #2A2A28",
                      borderRadius: "10px",
                      padding: "0 12px",
                      outline: "none",
                      colorScheme: "dark",
                      boxSizing: "border-box",
                      WebkitTextFillColor: "#F0EEE9",
                    }}
                  />
                </div>
              </div>
            </div>

            {endTimeError && (
              <p style={{ color: "#FF3B30", fontSize: "13px", marginTop: "-12px" }}>
                {endTimeError}
              </p>
            )}
          </div>
        );

      // ── STEP 4 ───────────────────────────────────────────────────────────────
      case 4:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                Where to?
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Drop a pin, or search an address.
              </p>
            </div>

            {/* Location text input */}
            <div>
              <label style={LABEL}>Address</label>
              <input
                type="text"
                placeholder="Street, area or venue name"
                maxLength={120}
                value={locationStr}
                onChange={(e) => setLocationStr(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "16px",
                  color: "#F0EEE9",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid #2A2A28",
                  outline: "none",
                  padding: "0 0 10px",
                }}
                className="placeholder:text-[#3D3D38]"
              />
            </div>

            {/* Map pin */}
            <div>
              <label style={LABEL}>Pin Location</label>
              <MapPicker
                mode="picker"
                lat={mapCoords?.lat}
                lng={mapCoords?.lng}
                onLocationSelect={(coords) => setMapCoords(coords)}
              />
            </div>
          </div>
        );

      // ── STEP 5 ───────────────────────────────────────────────────────────────
      case 5:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                Who's invited?
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Open it up, or set who fits best.
              </p>
            </div>

            {/* Gender */}
            <div>
              <label style={LABEL}>Gender</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {GENDER_OPTIONS.map((g) => {
                  const selected = genderFilter === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGenderFilter(g.value)}
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 600,
                        border: `1px solid ${selected ? "#FF6B35" : "#2A2A28"}`,
                        backgroundColor: selected ? "#FF6B35" : "#1C1C1A",
                        color: selected ? "white" : "#6B6B63",
                        cursor: "pointer",
                      }}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age range */}
            <div>
              <label style={LABEL}>Age Range</label>

              {/* Big display */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <p style={{ fontSize: "48px", fontWeight: 700, color: "#F0EEE9", margin: 0, lineHeight: 1 }}>
                  {minAge} → {maxAge}
                </p>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#3D3D38", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "6px" }}>
                  Years old
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Min stepper */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", width: "80px" }}>
                    Minimum
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      type="button"
                      onClick={() => setMinAge(String(Math.max(18, parseInt(minAge) - 1)))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#F0EEE9", minWidth: "32px", textAlign: "center" }}>
                      {minAge}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMinAge(String(Math.min(parseInt(maxAge) - 1, parseInt(minAge) + 1)))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Max stepper */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", width: "80px" }}>
                    Maximum
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                      type="button"
                      onClick={() => setMaxAge(String(Math.max(parseInt(minAge) + 1, parseInt(maxAge) - 1)))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#F0EEE9", minWidth: "32px", textAlign: "center" }}>
                      {maxAge}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaxAge(String(Math.min(99, parseInt(maxAge) + 1)))}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ── STEP 6 ───────────────────────────────────────────────────────────────
      case 6:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F0EEE9", marginBottom: "6px" }}>
                Last few details
              </h1>
              <p style={{ fontSize: "14px", color: "#6B6B63" }}>
                Capacity, WhatsApp link, and a quick blurb.
              </p>
            </div>

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

            {/* Capacity card */}
            <div
              style={{
                backgroundColor: "#1C1C1A",
                border: "1px solid #2A2A28",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#F0EEE9", margin: 0 }}>Capacity</p>
                  <p style={{ fontSize: "13px", color: "#6B6B63", margin: "2px 0 0" }}>How many guests max?</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseInt(capacity) || 0;
                      if (current > 1) { setCapacity(String(current - 1)); setCapacityError(""); }
                    }}
                    style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={capacity}
                    onChange={(e) => { setCapacity(e.target.value); setCapacityError(""); }}
                    style={{
                      width: "56px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#F0EEE9",
                      WebkitTextFillColor: "#F0EEE9",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      textAlign: "center",
                    }}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseInt(capacity) || 0;
                      if (current < 10000) { setCapacity(String(current + 1)); setCapacityError(""); }
                    }}
                    style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#242422", border: "1px solid #2A2A28", color: "#FF6B35", fontSize: "20px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    +
                  </button>
                </div>
              </div>
              {capacityError && (
                <p style={{ color: "#FF3B30", fontSize: "12px", marginTop: "10px" }}>
                  {capacityError}
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label style={LABEL}>WhatsApp Group Link</label>
              <input
                type="url"
                placeholder="Paste invite link (optional)"
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "16px",
                  color: "#F0EEE9",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: "1px solid #2A2A28",
                  outline: "none",
                  padding: "0 0 10px",
                }}
                className="placeholder:text-[#3D3D38]"
              />
              <p style={{ fontSize: "12px", color: "#6B6B63", marginTop: "6px" }}>
                Shared with confirmed guests only.
              </p>
            </div>

            {/* Description */}
            <div>
              <label style={LABEL}>Description</label>
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
                  width: "100%",
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh", paddingBottom: "180px" }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(17,17,16,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
            padding: "0 16px",
          }}
        >
          <button
            onClick={goBack}
            style={{
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6B6B63",
              fontSize: "20px",
            }}
          >
            ✕
          </button>

          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#6B6B63",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Step {step} / 6
          </span>

          <div style={{ width: "40px" }} />
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", backgroundColor: "#2A2A28", width: "100%" }}>
          <div
            style={{
              height: "100%",
              backgroundColor: "#FF6B35",
              width: `${(step / 6) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "28px 20px 0" }}>
        {renderStep()}
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#1C1C1A",
          borderTop: "1px solid #2A2A28",
          padding: "16px 20px",
          paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          gap: "12px",
        }}
      >
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            style={{
              height: "52px",
              padding: "0 24px",
              borderRadius: "999px",
              backgroundColor: "#242422",
              border: "1px solid #2A2A28",
              color: "#F0EEE9",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Back
          </button>
        )}

        {step < 6 ? (
          <button
            type="button"
            onClick={goNext}
            style={{
              flex: 1,
              height: "52px",
              borderRadius: "999px",
              backgroundColor: "#FF6B35",
              border: "none",
              color: "white",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || createMutation.isPending || isUploadingImage}
            style={{
              flex: 1,
              height: "52px",
              borderRadius: "999px",
              backgroundColor: isFormValid && !createMutation.isPending && !isUploadingImage ? "#FF6B35" : "#2A2A28",
              border: "none",
              color: isFormValid && !createMutation.isPending && !isUploadingImage ? "white" : "#3D3D38",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isFormValid ? "pointer" : "not-allowed",
            }}
          >
            {createMutation.isPending ? "Publishing..." : "Publish gathering"}
          </button>
        )}
      </div>
    </div>
  );
}
