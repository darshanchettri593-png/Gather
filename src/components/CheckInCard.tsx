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
      <div className="rounded-2xl p-5 mb-6 text-center" style={{ backgroundColor: '#1C1C1A', border: '1px solid #34C759' }}>
        <p className="text-2xl mb-1">✅</p>
        <p className="font-semibold" style={{ color: '#34C759' }}>You showed up!</p>
        <p className="text-sm mt-1" style={{ color: '#6B6B63' }}>Thanks for being part of it.</p>
      </div>
    );
  }

  if (attendee?.no_show) {
    return (
      <div className="rounded-2xl p-5 mb-6 text-center" style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28' }}>
        <p className="text-2xl mb-1">😔</p>
        <p className="font-semibold" style={{ color: '#6B6B63' }}>You missed this one</p>
        <p className="text-sm mt-1" style={{ color: '#6B6B63' }}>Next time!</p>
      </div>
    );
  }

  const handleYes = () => {
    checkIn.mutate({ eventId, userId, checkedIn: true });
  };

  const handleNo = () => {
    checkIn.mutate({ eventId, userId, checkedIn: false });
  };

  return (
    <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: '#1C1C1A', border: '1px solid #FF6B35' }}>
      <p className="text-lg font-bold mb-1" style={{ color: '#F0EEE9' }}>Did you show up? 👋</p>
      <p className="text-sm mb-4" style={{ color: '#6B6B63' }}>Let the host and community know.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onPointerUp={handleYes}
          disabled={checkIn.isPending}
          className="flex-1 rounded-full py-3 text-sm font-semibold"
          style={{ backgroundColor: '#FF6B35', color: '#fff', border: 'none', touchAction: 'manipulation' }}
        >
          Yes, I was there 🙌
        </button>
        <button
          type="button"
          onPointerUp={handleNo}
          disabled={checkIn.isPending}
          className="flex-1 rounded-full py-3 text-sm font-semibold"
          style={{ backgroundColor: '#242422', color: '#6B6B63', border: '1px solid #2A2A28', touchAction: 'manipulation' }}
        >
          No, I missed it
        </button>
      </div>
    </div>
  );
}
