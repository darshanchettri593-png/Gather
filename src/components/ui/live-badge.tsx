import { getEventStatus } from '@/lib/event-status';

interface LiveBadgeProps {
  eventDatetime: string;
  endDatetime: string;
  size?: 'sm' | 'md';
}

export function LiveBadge({
  eventDatetime,
  endDatetime,
  size = 'md',
}: LiveBadgeProps) {
  const status = getEventStatus(eventDatetime, endDatetime);
  if (status !== 'live') return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(255,59,48,0.15)',
        border: '1px solid rgba(255,59,48,0.3)',
        borderRadius: '999px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
      }}
    >
      <div
        style={{
          width: size === 'sm' ? '6px' : '8px',
          height: size === 'sm' ? '6px' : '8px',
          borderRadius: '50%',
          background: '#FF3B30',
          animation: 'pulse 1.5s infinite',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color: '#FF3B30',
          fontSize: size === 'sm' ? '10px' : '12px',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}
      >
        LIVE
      </span>
    </div>
  );
}
