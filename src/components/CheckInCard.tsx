import { useCheckIn } from '@/lib/queries';

interface CheckInCardProps {
  eventId: string;
  userId: string;
  attendee?: { checked_in: boolean; no_show: boolean };
}

export function CheckInCard({ eventId, userId, attendee }: CheckInCardProps) {
  const checkIn = useCheckIn();

  if (attendee?.checked_in) {
    return (
      <div style={{
        backgroundColor: '#1C1C1A',
        border: '1px solid #34C759',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 10,
      }}>
        <p style={{ fontSize: '24px', marginBottom: '4px' }}>✅</p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#34C759' }}>You showed up!</p>
        <p style={{ fontSize: '13px', color: '#6B6B63', marginTop: '4px' }}>Thanks for being part of it.</p>
      </div>
    );
  }

  if (attendee?.no_show) {
    return (
      <div style={{
        backgroundColor: '#1C1C1A',
        border: '1px solid #2A2A28',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 10,
      }}>
        <p style={{ fontSize: '24px', marginBottom: '4px' }}>😔</p>
        <p style={{ fontSize: '16px', fontWeight: 600, color: '#6B6B63' }}>You missed this one</p>
        <p style={{ fontSize: '13px', color: '#6B6B63', marginTop: '4px' }}>Next time!</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1C1C1A',
      border: '1px solid #FF6B35',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '24px',
      position: 'relative',
      zIndex: 10,
    }}>
      <p style={{ fontSize: '18px', fontWeight: 700, color: '#F0EEE9', marginBottom: '4px' }}>
        Did you show up? 👋
      </p>
      <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '16px' }}>
        Let the host and community know.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => checkIn.mutate({ eventId, userId, checkedIn: true })}
          disabled={checkIn.isPending}
          style={{
            flex: 1,
            backgroundColor: '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10,
          }}
        >
          Yes, I was there 🙌
        </button>
        <button
          onClick={() => checkIn.mutate({ eventId, userId, checkedIn: false })}
          disabled={checkIn.isPending}
          style={{
            flex: 1,
            backgroundColor: '#242422',
            color: '#6B6B63',
            border: '1px solid #2A2A28',
            borderRadius: '999px',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10,
          }}
        >
          No, I missed it
        </button>
      </div>
    </div>
  );
}
