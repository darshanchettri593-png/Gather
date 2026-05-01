import { useState, useEffect } from 'react';
import { getEventStatus, getCountdownText } from '@/lib/event-status';

interface CountdownProps {
  eventDatetime: string;
  endDatetime: string;
}

export function Countdown({ eventDatetime, endDatetime }: CountdownProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState(() =>
    getEventStatus(eventDatetime, endDatetime)
  );

  useEffect(() => {
    const update = () => {
      const s = getEventStatus(eventDatetime, endDatetime);
      setStatus(s);
      if (s === 'upcoming') {
        setText(getCountdownText(eventDatetime));
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [eventDatetime, endDatetime]);

  if (status === 'live') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(255,59,48,0.1)',
          border: '1px solid rgba(255,59,48,0.2)',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#FF3B30',
            animation: 'pulse 1.5s infinite',
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ color: '#FF3B30', fontSize: '14px', fontWeight: 700, margin: 0 }}>
            Happening right now
          </p>
          <p style={{ color: '#6B6B63', fontSize: '12px', margin: '2px 0 0' }}>
            This gathering is live
          </p>
        </div>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div
        style={{
          padding: '10px 14px',
          background: '#1C1C1A',
          border: '1px solid #2A2A28',
          borderRadius: '12px',
          marginBottom: '16px',
        }}
      >
        <p style={{ color: '#6B6B63', fontSize: '14px', fontWeight: 500, margin: 0 }}>
          This gathering has ended
        </p>
      </div>
    );
  }

  if (!text) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: 'rgba(255,107,53,0.08)',
        border: '1px solid rgba(255,107,53,0.15)',
        borderRadius: '12px',
        marginBottom: '16px',
      }}
    >
      <span style={{ fontSize: '16px' }}>⏱</span>
      <p style={{ color: '#FF6B35', fontSize: '14px', fontWeight: 600, margin: 0 }}>
        {text}
      </p>
    </div>
  );
}
