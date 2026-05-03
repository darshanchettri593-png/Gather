import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileGate({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!gender || !dob) return;

    // Check age
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      setError("Gather is for people 18 and older.");
      await supabase.auth.signOut();
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from('users')
      .update({ gender, date_of_birth: dob })
      .eq('id', user!.id);

    if (updateError) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['profile'] });
    setLoading(false);
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%',
        backgroundColor: '#1C1C1A',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 48px',
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F0EEE9', marginBottom: '8px' }}>
          One last thing 👋
        </h2>
        <p style={{ fontSize: '15px', color: '#6B6B63', marginBottom: '28px' }}>
          We need a few details to keep Gather safe and personal.
        </p>

        {/* Gender */}
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Gender
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['Male', 'Female', 'LGBTQ+'].map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: '999px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid',
                borderColor: gender === g ? '#FF6B35' : '#2A2A28',
                backgroundColor: gender === g ? '#FF6B35' : '#242422',
                color: gender === g ? 'white' : '#F0EEE9',
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Date of birth */}
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Date of Birth
        </p>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          style={{
            width: '100%',
            backgroundColor: '#242422',
            border: '1px solid #2A2A28',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '15px',
            color: '#F0EEE9',
            marginBottom: '8px',
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <p style={{ fontSize: '13px', color: '#FF3B30', marginBottom: '12px' }}>{error}</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!gender || !dob || loading}
          style={{
            width: '100%',
            backgroundColor: gender && dob && !loading ? '#FF6B35' : '#2A2A28',
            color: gender && dob && !loading ? 'white' : '#6B6B63',
            borderRadius: '999px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            cursor: gender && dob && !loading ? 'pointer' : 'not-allowed',
            marginTop: '8px',
          }}
        >
          {loading ? 'Saving...' : "Let's Go 🔥"}
        </button>
      </div>
    </div>
  );
}
