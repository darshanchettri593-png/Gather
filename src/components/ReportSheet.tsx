import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface ReportSheetProps {
  targetType: 'event' | 'user';
  targetId: string;
  onClose: () => void;
}

const EVENT_REASONS = [
  'Fake or misleading event',
  'Inappropriate content',
  'Safety concern',
  'Spam or commercial',
  'Wrong location',
  'Other',
];

const USER_REASONS = [
  'Harassment or threatening behaviour',
  'Fake profile',
  'Inappropriate content',
  'Spam',
  'Underage user',
  'Other',
];

export function ReportSheet({ targetType, targetId, onClose }: ReportSheetProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const reasons = targetType === 'event' ? EVENT_REASONS : USER_REASONS;

  const handleSubmit = async () => {
    if (!selectedReason || !user) return;
    setLoading(true);
    await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: selectedReason,
      details: details || null,
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1C1C1A',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px',
          paddingBottom: 'calc(40px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', backgroundColor: '#2A2A28', borderRadius: '2px', margin: '0 auto 24px' }} />

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🙏</p>
            <p style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', marginBottom: '8px' }}>
              Thanks for reporting
            </p>
            <p style={{ fontSize: '14px', color: '#6B6B63', lineHeight: 1.6, marginBottom: '24px' }}>
              We'll review this and take action if it violates our Community Guidelines. Reports are anonymous.
            </p>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '999px',
                backgroundColor: '#242422',
                border: '1px solid #2A2A28',
                color: '#F0EEE9',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', marginBottom: '4px' }}>
              Report {targetType === 'event' ? 'event' : 'user'}
            </p>
            <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '20px' }}>
              Why are you reporting this {targetType}?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: selectedReason === reason ? 'rgba(255,107,53,0.1)' : '#242422',
                    border: selectedReason === reason ? '1px solid rgba(255,107,53,0.4)' : '1px solid #2A2A28',
                    color: selectedReason === reason ? '#FF6B35' : '#F0EEE9',
                    fontSize: '14px',
                    fontWeight: selectedReason === reason ? 600 : 400,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedReason && (
              <div style={{ marginBottom: '20px' }}>
                <textarea
                  placeholder="Add more details (optional)"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  maxLength={300}
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: '#242422',
                    border: '1px solid #2A2A28',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#F0EEE9',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '52px',
                  borderRadius: '999px',
                  backgroundColor: '#242422',
                  border: '1px solid #2A2A28',
                  color: '#F0EEE9',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedReason || loading}
                style={{
                  flex: 2,
                  height: '52px',
                  borderRadius: '999px',
                  backgroundColor: selectedReason && !loading ? '#FF3B30' : '#242422',
                  border: 'none',
                  color: selectedReason && !loading ? 'white' : '#3D3D38',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: selectedReason ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
