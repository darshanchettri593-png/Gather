import { useNavigate } from 'react-router-dom';

export default function GuidelinesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#F0EEE9' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#1C1C1A', borderBottom: '1px solid #2A2A28', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F0EEE9', fontSize: '20px', cursor: 'pointer', padding: '0' }}>←</button>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', margin: 0 }}>Community Guidelines</h1>
      </div>

      <div style={{ padding: '24px 20px 80px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '12px' }}>Last updated: May 2026</p>

        <p style={{ fontSize: '15px', color: '#C8C6C0', lineHeight: 1.7, marginBottom: '32px' }}>
          Gather exists so people in India can meet in real life — to move, create, hang, learn, and explore together. These guidelines keep that possible for everyone. Violating them can result in event removal, suspension, or permanent ban.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Identity & Authenticity</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Be real</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Use your real identity. No fake profiles, no impersonation, no misleading bios or photos. People are showing up in real life based on who you say you are.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>18+ only</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is strictly for adults. Do not create accounts for or invite anyone under 18. Any account found to belong to a minor will be permanently deleted immediately.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>One account per person</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Do not create multiple accounts. If your account is suspended, do not create a new one to bypass it.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Hosting</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Host with intent</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Only create events you actually plan to host. If plans change, update or delete your event as early as possible. Ghosting attendees will hurt your rating and trust score permanently.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Accurate event details</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Event title, cover photo, location, description, and vibe must accurately represent what you are hosting. No bait and switch. No misleading covers or fake venues.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No surprise charges</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If your event is listed as free, it must be free. Do not RSVP people then demand entry fees, food charges, or any payment in person. Paid events will be a separate feature in the future.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No political or religious events</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is not a platform for political rallies, religious gatherings, fundraising, or ideological recruitment. Events must be social in nature.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Attending</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Show up</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If you RSVP, show up. Consistent no-shows affect your trust score and take spots from people who genuinely wanted to attend. If you can't make it, un-RSVP early.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Respect the host's rules</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If a host sets age or gender filters, do not attempt to bypass them. If you don't meet the criteria, find a different event.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Respect & Safety</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No harassment</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>No harassment, threats, bullying, or hate — in chat, announcements, or in person. This includes discrimination based on gender, religion, caste, sexuality, or background. Zero tolerance.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Keep it legal</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Do not use Gather to organise anything illegal, dangerous, or harmful under Indian law. This includes but is not limited to drug distribution, gambling, or any activity that puts attendees at risk.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Protect privacy</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Do not share other people's personal information, photos, or location without their explicit consent. The WhatsApp group link shared with attendees must not be distributed outside the group.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Chat & Communication</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Event chat is for coordination</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Use event chat to coordinate, ask questions, and connect with other attendees. Do not spam, flood, or use chat for unrelated conversations.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No spam or solicitation</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Do not use Gather to promote products, services, businesses, or other platforms. No MLM, no referral schemes, no unsolicited offers of any kind.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Announcements are for hosts only</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Host announcements must be relevant to the event — location changes, timing updates, important instructions. Do not use announcements to promote other events or content.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Consequences</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Minor violations</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>First offence warnings, event removal, temporary restrictions on hosting or RSVP.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Serious violations</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Immediate account suspension. This includes harassment, fake events, surprise charges, and privacy violations.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Zero tolerance violations</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Permanent ban with no appeal. This includes anything illegal under Indian law, minors on the platform, and repeat serious offenders.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #FF6B35', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 8px' }}>See something wrong?</p>
            <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>
              Use the Report button on any event or profile. We rely on the community to keep Gather real. Reports are reviewed and acted on — this is not a checkbox, it matters.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
