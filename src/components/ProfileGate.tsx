import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

const GENDERS = ["Male", "Female", "LGBTQ+"];

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function ProfileGate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const maxDob = new Date(new Date().setFullYear(new Date().getFullYear() - 13))
    .toISOString().split("T")[0];

  const handleSave = async () => {
    if (!gender || !dob || !user) return;
    setError("");

    const age = calcAge(dob);
    if (age < 18) {
      setError("Gather is for people 18 and older.");
      await supabase.auth.signOut();
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ date_of_birth: dob, gender })
        .eq("id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#1C1C1A",
          borderRadius: "24px 24px 0 0",
          padding: "32px 24px",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#F0EEE9", marginBottom: "8px", margin: 0 }}>
          One last thing 👋
        </h2>
        <p style={{ fontSize: "15px", color: "#6B6B63", marginTop: "8px", marginBottom: "28px", lineHeight: 1.5 }}>
          We need a few details to keep Gather safe and personal.
        </p>

        {/* Gender selector */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", margin: "0 0 12px" }}>
            Gender
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 500,
                  border: gender === g ? "none" : "1px solid #2A2A28",
                  backgroundColor: gender === g ? "#FF6B35" : "#242422",
                  color: gender === g ? "white" : "#F0EEE9",
                  cursor: "pointer",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Date of birth */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#6B6B63", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Date of Birth
          </p>
          <input
            type="date"
            value={dob}
            max={maxDob}
            onChange={(e) => { setDob(e.target.value); setError(""); }}
            style={{
              width: "100%",
              backgroundColor: "#1C1C1A",
              border: "1px solid #2A2A28",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#F0EEE9",
              fontSize: "15px",
              outline: "none",
              colorScheme: "dark",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: "14px", color: "#FF3B30", marginBottom: "16px", textAlign: "center" }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!gender || !dob || saving}
          style={{
            width: "100%",
            backgroundColor: "#FF6B35",
            color: "white",
            borderRadius: "999px",
            padding: "16px",
            fontSize: "16px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
          className="disabled:opacity-40"
        >
          {saving ? "Saving..." : "Let's Go 🔥"}
        </button>
      </div>
    </div>
  );
}
