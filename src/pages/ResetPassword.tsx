import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

function getScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const SEGMENT_COLORS = ['#FF3B30', '#FF6B35', '#FFB830', '#34C759'];
const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [confirmFocus, setConfirmFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const score = getScore(password);
  const rules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const isStrong = score === 4;
  const isMatch = confirm.length > 0 && password === confirm;
  const canSave = isStrong && isMatch;

  const pwBorder = password.length === 0
    ? pwFocus ? '#FF6B35' : '#2A2A28'
    : score < 3 ? '#FF3B30' : score === 3 ? '#FFB830' : '#34C759';

  const confirmBorder = confirm.length === 0
    ? confirmFocus ? '#FF6B35' : '#2A2A28'
    : isMatch ? '#34C759' : '#FF3B30';

  const handleSubmit = async () => {
    if (!canSave || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate('/');
    } catch {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#242422',
    border: '0.5px solid',
    borderRadius: '50px',
    color: '#F0EEE9',
    fontSize: '16px',
    padding: '13px 18px',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitTextFillColor: '#F0EEE9',
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: '#111110',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#1C1C1A',
        border: '0.5px solid #2A2A28',
        borderRadius: '20px',
        padding: '28px 24px',
      }}>

        {/* Header */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 6px' }}>
          Reset password
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6B63', margin: '0 0 24px', lineHeight: 1.5 }}>
          Choose a strong password for your account
        </p>

        {/* New password */}
        <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
          New password
        </label>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwFocus(true)}
            onBlur={() => setPwFocus(false)}
            placeholder="Enter new password"
            style={{ ...inputBase, borderColor: pwBorder, paddingRight: '48px' }}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B63', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Strength bar */}
        {password.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: i < score ? SEGMENT_COLORS[score - 1] : '#2A2A28',
                    transition: 'background-color 0.2s',
                  }}
                />
              ))}
            </div>
            {score > 0 && (
              <p style={{ fontSize: '11px', fontWeight: 600, color: SEGMENT_COLORS[score - 1], marginBottom: '8px' }}>
                {STRENGTH_LABELS[score - 1]}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {rules.map((r) => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: r.met ? '#34C759' : '#3D3D38', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: r.met ? '#34C759' : '#6B6B63' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm password */}
        <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
          Confirm password
        </label>
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onFocus={() => setConfirmFocus(true)}
            onBlur={() => setConfirmFocus(false)}
            placeholder="Repeat new password"
            style={{ ...inputBase, borderColor: confirmBorder, paddingRight: '48px' }}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(v => !v)}
            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B63', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Match feedback */}
        {confirm.length > 0 && (
          <p style={{ fontSize: '12px', marginBottom: '20px', color: isMatch ? (isStrong ? '#34C759' : '#FF6B35') : '#FF3B30' }}>
            {isMatch
              ? isStrong
                ? '✓ Passwords match'
                : 'Match — but make the password stronger first'
              : "Passwords don't match"}
          </p>
        )}
        {confirm.length === 0 && <div style={{ marginBottom: '20px' }} />}

        {/* Error */}
        {error && (
          <p style={{ fontSize: '13px', color: '#FF3B30', marginBottom: '12px', textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSave || loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '50px',
            backgroundColor: '#FF6B35',
            border: 'none',
            color: 'white',
            fontSize: '15px',
            fontWeight: 700,
            cursor: canSave && !loading ? 'pointer' : 'not-allowed',
            opacity: canSave && !loading ? 1 : 0.4,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Saving...' : 'Save password'}
        </button>
      </div>
    </div>
  );
}
