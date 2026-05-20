import { useNavigate } from "react-router";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#111110',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <style>{`
        @keyframes nf-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes nf-ping { 0% { transform: scale(1); opacity: 0.5 } 100% { transform: scale(2); opacity: 0 } }
      `}</style>

      {/* Animated icon */}
      <div style={{
        position: 'relative',
        width: 100,
        height: 100,
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid #FF6B35',
          opacity: 0.4,
          animation: 'nf-ping 2.5s ease-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid #FF6B35',
          opacity: 0.4,
          animation: 'nf-ping 2.5s ease-out 0.8s infinite',
        }} />
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: '#1C1C1A',
          border: '0.5px solid #2A2A28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'nf-float 3s ease-in-out infinite',
        }}>
          <MapPinOff size={32} color="#FF6B35" />
        </div>
      </div>

      {/* Eyebrow */}
      <div style={{
        color: '#3D3D38',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        ERROR · 404
      </div>

      {/* Headline */}
      <h1 style={{
        color: '#F0EEE9',
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '-0.4px',
        lineHeight: 1.2,
        margin: '0 0 10px 0',
        maxWidth: 280,
      }}>
        You took a wrong<br/>turn somewhere.
      </h1>

      {/* Subline */}
      <p style={{
        color: '#6B6B63',
        fontSize: 14,
        lineHeight: 1.5,
        margin: '0 0 32px 0',
        maxWidth: 280,
      }}>
        This page doesn't exist. But there are plans happening — just not here.
      </p>

      {/* CTAs */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        maxWidth: 280,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#FF6B35',
            color: 'white',
            border: 'none',
            padding: 14,
            borderRadius: 50,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Explore
        </button>
        <button
          onClick={() => navigate('/host')}
          style={{
            background: 'none',
            border: '0.5px solid #2A2A28',
            color: '#6B6B63',
            padding: 13,
            borderRadius: 50,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Host something instead
        </button>
      </div>
    </div>
  );
}
