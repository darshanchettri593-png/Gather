import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, Users, MapPin, CalendarDays, Plus, Bell, ShieldCheck } from 'lucide-react';
import { subscribeToPush } from '@/lib/push';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();

  useEffect(() => {
    if (localStorage.getItem('gather_onboarding_done')) {
      onComplete();
    }
  }, []);

  if (localStorage.getItem('gather_onboarding_done')) return null;

  return <OnboardingInner onComplete={onComplete} userId={user?.id} />;
}

function OnboardingInner({ onComplete, userId }: { onComplete: () => void; userId?: string }) {
  const [cur, setCur] = useState(0);
  const startX = useRef(0);
  const mouseStartX = useRef(0);

  const goTo = (n: number) => setCur(Math.max(0, Math.min(4, n)));

  const finish = () => {
    localStorage.setItem('gather_onboarding_done', '1');
    onComplete();
  };

  const handleNotifications = async () => {
    if (userId) {
      try { await subscribeToPush(userId, supabase); } catch { /* silent */ }
    }
    finish();
  };

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - startX.current;
    if (diff < -40) goTo(cur + 1);
    else if (diff > 40) goTo(cur - 1);
  };
  const onMouseDown = (e: React.MouseEvent) => { mouseStartX.current = e.clientX; };
  const onMouseUp = (e: React.MouseEvent) => {
    const diff = e.clientX - mouseStartX.current;
    if (diff < -40) goTo(cur + 1);
    else if (diff > 40) goTo(cur - 1);
  };

  const safeTop = 'env(safe-area-inset-top, 0px)';
  const safeBot = 'env(safe-area-inset-bottom, 0px)';

  const pillStyle = (color: string, borderColor: string): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: 500,
    border: `0.5px solid ${borderColor}`, background: 'none', color,
  });

  const stepCircle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: '50%', background: '#1C1C1A',
    border: '0.5px solid #2A2A28', color: '#FF6B35', fontSize: 14, fontWeight: 700,
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  const infoCard: React.CSSProperties = {
    background: '#1C1C1A', border: '0.5px solid #2A2A28', borderRadius: 18,
    padding: '16px 18px', width: '100%', boxSizing: 'border-box', marginTop: 20,
  };

  const primaryBtn = (disabled = false): React.CSSProperties => ({
    width: '100%', padding: 17, borderRadius: 50, background: '#FF6B35', border: 'none',
    color: 'white', fontSize: 16, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  });

  const ghostBtn: React.CSSProperties = {
    width: '100%', padding: 15, borderRadius: 50, background: 'none',
    border: 'none', color: '#6B6B63', fontSize: 15, cursor: 'pointer',
  };

  const slides = [
    // SLIDE 1 — Welcome
    <div key={0} style={{ width: '20%', height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
      <div style={{ marginTop: `calc(${safeTop} + 88px)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: '#1C1C1A', border: '0.5px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Users size={40} color="#FF6B35" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Gather · India</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F0EEE9', textAlign: 'center', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>
          The app your city was<br />
          <span style={{ color: '#FF6B35' }}>waiting for.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#6B6B63', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          No agencies. No ticket fees. Just real people in your city making plans — and opening the door.
        </p>
        <div style={{ width: 40, height: 1, background: '#2A2A28', margin: '20px auto 0' }} />
      </div>
      <div style={{ paddingBottom: `calc(${safeBot} + 48px)`, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button style={primaryBtn()} onClick={() => goTo(1)}>Get started</button>
      </div>
    </div>,

    // SLIDE 2 — Discovery
    <div key={1} style={{ width: '20%', height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
      <div style={{ marginTop: `calc(${safeTop} + 88px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: '#1C1C1A', border: '0.5px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <MapPin size={40} color="#FF6B35" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Discovery</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F0EEE9', textAlign: 'center', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>
          Events built around<br /><span style={{ color: '#FF6B35' }}>where you are.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#6B6B63', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          GPS-powered. Sorted by distance. Filtered by what moves you.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <span style={pillStyle('#FF6B35', '#FF6B35')}>Move</span>
          <span style={pillStyle('rgb(168,85,247)', 'rgba(168,85,247,0.35)')}>Create</span>
          <span style={pillStyle('rgb(59,130,246)', 'rgba(59,130,246,0.35)')}>Hang</span>
          <span style={pillStyle('rgb(16,185,129)', 'rgba(16,185,129,0.35)')}>Learn</span>
          <span style={pillStyle('rgb(245,158,11)', 'rgba(245,158,11,0.35)')}>Explore</span>
        </div>
      </div>
      <div style={{ paddingBottom: `calc(${safeBot} + 48px)`, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button style={primaryBtn()} onClick={() => goTo(2)}>Next</button>
      </div>
    </div>,

    // SLIDE 3 — How it works
    <div key={2} style={{ width: '20%', height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
      <div style={{ marginTop: `calc(${safeTop} + 88px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: '#1C1C1A', border: '0.5px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <CalendarDays size={40} color="#FF6B35" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>How it works</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F0EEE9', textAlign: 'center', lineHeight: 1.2, margin: '0 0 4px', letterSpacing: -0.5 }}>
          Three steps.<br /><span style={{ color: '#FF6B35' }}>That's it.</span>
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', marginTop: 20 }}>
          {[
            { n: 1, main: 'Browse events near you', sub: 'Sorted by distance. Only upcoming events.' },
            { n: 2, main: 'RSVP — get the WhatsApp link', sub: 'Chat with the group before you show up.' },
            { n: 3, main: 'Show up. Check in. Rate.', sub: 'Your reputation grows with every event.' },
          ].map(({ n, main, sub }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={stepCircle}>{n}</div>
              <div>
                <p style={{ color: '#F0EEE9', fontSize: 14, fontWeight: 500, margin: 0 }}>{main}</p>
                <p style={{ color: '#6B6B63', fontSize: 12, marginTop: 2, margin: '2px 0 0' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ paddingBottom: `calc(${safeBot} + 48px)`, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button style={primaryBtn()} onClick={() => goTo(3)}>Got it</button>
      </div>
    </div>,

    // SLIDE 4 — Hosting
    <div key={3} style={{ width: '20%', height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
      <div style={{ marginTop: `calc(${safeTop} + 88px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: '#1C1C1A', border: '0.5px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Plus size={40} color="#FF6B35" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Hosting</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F0EEE9', textAlign: 'center', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>
          Your plan.<br />Your rules.<br /><span style={{ color: '#FF6B35' }}>Your event.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#6B6B63', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          A rooftop session, a study circle, a late-night walk — if you can imagine it, you can host it.
        </p>
        <div style={infoCard}>
          <p style={{ fontSize: 11, color: '#6B6B63', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, margin: '0 0 6px' }}>Always free</p>
          <p style={{ fontSize: 14, color: '#F0EEE9', lineHeight: 1.55, margin: 0 }}>No fees for hosts. No fees for attendees. Gather never takes a cut.</p>
        </div>
      </div>
      <div style={{ paddingBottom: `calc(${safeBot} + 48px)`, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button style={primaryBtn()} onClick={() => goTo(4)}>Next</button>
      </div>
    </div>,

    // SLIDE 5 — Notifications
    <div key={4} style={{ width: '20%', height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box' }}>
      <div style={{ marginTop: `calc(${safeTop} + 88px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: '#1C1C1A', border: '0.5px solid #2A2A28', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <Bell size={40} color="#FF6B35" />
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Notifications</p>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F0EEE9', textAlign: 'center', lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>
          Never miss<br /><span style={{ color: '#FF6B35' }}>what's happening.</span>
        </h1>
        <p style={{ fontSize: 15, color: '#6B6B63', textAlign: 'center', lineHeight: 1.65, margin: 0 }}>
          Event reminders. New RSVPs. Host announcements. All in one tap.
        </p>
        <div style={{ ...infoCard, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={22} color="#34C759" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#6B6B63', lineHeight: 1.5, margin: 0 }}>Only things that matter. Zero spam. Turn it off anytime.</p>
        </div>
      </div>
      <div style={{ paddingBottom: `calc(${safeBot} + 48px)`, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button style={primaryBtn()} onClick={handleNotifications}>Enable notifications</button>
        <button style={ghostBtn} onClick={finish}>Maybe later</button>
      </div>
    </div>,
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: '#111110', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {/* Dots */}
      <div style={{ position: 'absolute', top: `calc(${safeTop} + 20px)`, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 3, borderRadius: 2, transition: 'all 0.4s', background: i === cur ? '#FF6B35' : '#2A2A28', width: i === cur ? 32 : 18 }} />
        ))}
      </div>

      {/* Back button */}
      {cur > 0 && (
        <button
          onClick={() => goTo(cur - 1)}
          style={{ position: 'absolute', top: `calc(${safeTop} + 16px)`, left: 20, width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', color: '#6B6B63', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Skip button */}
      {cur < 4 && (
        <button
          onClick={finish}
          style={{ position: 'absolute', top: `calc(${safeTop} + 20px)`, right: 24, background: 'none', border: 'none', color: '#6B6B63', fontSize: 13, cursor: 'pointer', zIndex: 10 }}
        >
          Skip
        </button>
      )}

      {/* Track */}
      <div style={{ display: 'flex', width: '500%', height: '100%', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${cur * 20}%)` }}>
        {slides}
      </div>
    </div>
  );
}
