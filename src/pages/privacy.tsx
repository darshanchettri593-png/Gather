import { useNavigate } from 'react-router';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111110', color: '#F0EEE9' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#1C1C1A', borderBottom: '1px solid #2A2A28', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F0EEE9', fontSize: '20px', cursor: 'pointer', padding: '0' }}>←</button>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', margin: 0 }}>Privacy Policy</h1>
      </div>

      <div style={{ padding: '24px 20px 80px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '12px' }}>Last updated: May 2026</p>

        <p style={{ fontSize: '15px', color: '#C8C6C0', lineHeight: 1.7, marginBottom: '32px' }}>
          This Privacy Policy explains what data Gather collects, why we collect it, how we use it, and what control you have over it. We built Gather to connect people — not to harvest their data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>What We Collect</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Account information</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>When you sign up we collect your email address, display name, date of birth, and gender. Your date of birth is used to enforce the 18+ rule and to display your age on your profile. Your gender is used for event filters.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Profile information</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Your profile photo and bio (up to 150 characters) are optional. You choose what to share.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Location data</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We use your GPS coordinates to show nearby events and detect your city name. Your city is cached locally on your device. We do not store your raw GPS coordinates against your profile in our database.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Event data</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Events you host or RSVP to, check-in status, ratings you give or receive, and event chat messages are stored and associated with your account.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Push notification data</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If you enable push notifications we store a browser push token linked to your account. This is used only to send you notifications about events you have RSVPd to or accounts you follow.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Photos</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>All photos uploaded to Gather — profile photos and event covers — are processed on your device to strip EXIF metadata including GPS location tags before being uploaded. Your photo location data is never stored on our servers.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>What We Do Not Collect</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We do not collect payment information, government ID, Aadhaar, PAN, or any financial data. We do not run ads and do not collect data for advertising purposes. We do not sell your data to third parties. We do not track your behaviour outside of the Gather app.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>How We Use Your Data</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>To run the platform</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Your data is used to show you nearby events, enforce age and gender filters, process RSVPs, send push notifications, display your public profile, and manage your account.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>To keep the platform safe</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We use account data to enforce platform rules including the 18+ gate, one-event-per-host limit, capacity enforcement, and community guideline violations.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Nothing else</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We do not use your data for advertising, profiling, resale, or any purpose beyond operating and improving the Gather platform.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>What's Public vs Private</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Public to all users</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Display name, profile photo, bio, gender, age (calculated from DOB — exact DOB is never shown), hosted events, follower and following counts, and ratings.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Visible to RSVPd attendees only</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>WhatsApp group invite links. These are hidden from non-attendees at the database level using Row Level Security.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Private — never shown publicly</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Email address, exact date of birth, GPS coordinates, push notification tokens.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Third Party Services</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Supabase</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Our database, authentication, file storage, and real-time messaging run on Supabase. Your data is stored on Supabase infrastructure. Supabase is SOC 2 compliant.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Vercel</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>The Gather app is hosted on Vercel. Vercel may log standard web server data such as IP addresses and request timestamps as part of normal hosting operations.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>OpenStreetMap & Nominatim</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Maps and location search are powered by OpenStreetMap tiles and Nominatim geocoding. These services receive your search queries and map tile requests but do not receive your account information.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>cron-job.org</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Used to trigger hourly event reminder notifications. No personal data is sent to cron-job.org — it only triggers our own Edge Functions.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Your Rights & Controls</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Edit your data</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You can update your display name, profile photo, and bio at any time from your profile page.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Disable notifications</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You can disable push notifications at any time from Settings. Your push token will be removed from our database.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Delete your account</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You can permanently delete your account from Settings at any time. This removes all your data from our database including your profile, events, messages, RSVPs, ratings, and push tokens. Deletion is immediate and cannot be undone.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Data portability</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If you want a copy of your data before deleting your account, contact us through the app or GitHub before initiating deletion.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Data Retention</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Your data is retained for as long as your account exists. When you delete your account all personal data is permanently deleted via cascading database deletion. Past event records that other users participated in may retain anonymised aggregate data such as attendance counts but will not retain your identity.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Security</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We implement Row Level Security on all database tables so users can only access data they are authorised to see. All data is transmitted over HTTPS. Sensitive fields like WhatsApp links are access-controlled at the database level. EXIF data is stripped from all uploaded photos client-side before upload.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Children's Privacy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is strictly for users 18 and older. We do not knowingly collect data from anyone under 18. If we become aware of an under-18 account it is immediately and permanently deleted along with all associated data.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Changes to This Policy</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>If we make significant changes to this Privacy Policy we will notify users through the app before the changes take effect. Continued use of Gather after notification means you accept the updated policy. The date at the top of this page always reflects when it was last updated.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #FF6B35', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 8px' }}>Questions about your privacy?</p>
            <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Reach out through the Gather app or the GitHub repository. We will respond to all privacy-related queries within 7 days.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
