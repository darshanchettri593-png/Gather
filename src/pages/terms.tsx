import { useNavigate } from 'react-router';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111110', color: '#F0EEE9' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: '#1C1C1A', borderBottom: '1px solid #2A2A28', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#F0EEE9', fontSize: '20px', cursor: 'pointer', padding: '0' }}>←</button>
        <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#F0EEE9', margin: 0 }}>Terms of Service</h1>
      </div>

      <div style={{ padding: '24px 20px 80px', maxWidth: '600px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: '#6B6B63', marginBottom: '12px' }}>Last updated: May 2026</p>

        <p style={{ fontSize: '15px', color: '#C8C6C0', lineHeight: 1.7, marginBottom: '32px' }}>
          These Terms of Service govern your use of Gather, a free community events platform built for India. By creating an account or using Gather, you agree to these terms. Please read them carefully.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>About Gather</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>What Gather is</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is a free platform that lets anyone in India host or join local community events. It is not a ticketing platform, a commercial marketplace, or a dating app. It is a tool for real people to meet in real life.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Who can use Gather</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is available exclusively in India and is strictly for users who are 18 years of age or older. By creating an account you confirm that you meet both requirements. Users found to be under 18 or outside India will be removed.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Free to use</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is currently free for all users. If pricing is introduced in the future, existing users will be notified in advance and will have the option to continue or leave before any charges apply.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Your Account</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Accurate information</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You must provide accurate information when creating your account including your real date of birth and gender. This information is used to enforce platform safety rules and cannot be falsified.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Account security</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You are responsible for maintaining the security of your account and password. Do not share your credentials with anyone. Gather will never ask for your password outside of the login screen.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>One account per person</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Each person may only have one Gather account. Creating multiple accounts to bypass restrictions or suspensions is a violation of these Terms and will result in permanent removal.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Account deletion</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You can delete your account at any time from Settings. Deletion is permanent and removes all your data including events, messages, RSVPs, ratings, and profile information. This cannot be undone.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Events & Hosting</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Host responsibility</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>As a host you are solely responsible for the accuracy of your event details, the conduct of your event, and the safety and experience of your attendees. Gather provides the platform — not the supervision.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>One active event at a time</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Hosts may only have one active event running at a time. This is enforced at the database level. Complete or delete your current event before creating a new one.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Event duration limit</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Events cannot exceed 12 hours in duration. This is enforced automatically when creating or editing an event.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No commercial events</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Events listed on Gather must be free to attend. You may not charge entry fees, collect payments, or use Gather events to generate commercial revenue without explicit written permission from Gather.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Gather is not liable for events</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is a discovery and coordination platform. We are not responsible for anything that occurs at events hosted through the platform. Hosts assume full responsibility for their events.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Your Content</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>You own your content</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You retain ownership of content you post on Gather including event descriptions, photos, messages, and profile information. By posting, you grant Gather a non-exclusive license to display that content on the platform.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Content standards</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>All content you post must comply with our Community Guidelines and Indian law. We reserve the right to remove any content that violates these standards without notice.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No illegal content</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You may not post content that is defamatory, obscene, threatening, or that violates the intellectual property rights of others. Content that violates the Information Technology Act 2000 or any other applicable Indian law is strictly prohibited.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Acceptable Use</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Prohibited activities</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You may not use Gather to harass or harm other users, run spam or phishing campaigns, scrape or harvest user data, attempt to gain unauthorised access to any part of the platform, reverse engineer the app, or interfere with the platform's normal operation.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>No automated use</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Bots, scrapers, automated accounts, or any non-human use of Gather is prohibited. All accounts must represent real individual humans.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Termination</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Our right to suspend or terminate</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We reserve the right to suspend or permanently delete any account that violates these Terms or our Community Guidelines, with or without prior notice depending on the severity of the violation.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Your right to leave</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>You can stop using Gather and delete your account at any time from Settings. No questions asked.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Disclaimers & Liability</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Provided as is</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is provided as is without warranties of any kind. We do not guarantee uninterrupted service, error-free operation, or that the platform will meet your specific requirements.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Limitation of liability</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform, events hosted through it, or interactions between users. Use Gather at your own risk.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Third party services</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>Gather uses third party services including Supabase, Vercel, and OpenStreetMap. We are not responsible for the availability, accuracy, or conduct of these services.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '14px', padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Legal</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Governing law</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>These Terms are governed by the laws of India. Any disputes arising from your use of Gather will be subject to the exclusive jurisdiction of the courts of West Bengal, India.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Changes to these Terms</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>We may update these Terms from time to time. If changes are significant, we will notify users through the app. Continued use of Gather after notification means you accept the updated Terms.</p>
              </div>
              <div style={{ height: '1px', backgroundColor: '#2A2A28' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#F0EEE9', margin: '0 0 4px' }}>Contact</p>
                <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>For questions about these Terms, reach out through the Gather app or GitHub repository.</p>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#1C1C1A', border: '1px solid #FF6B35', borderRadius: '14px', padding: '18px' }}>
            <p style={{ fontSize: '13px', color: '#C8C6C0', lineHeight: 1.6, margin: 0 }}>
              By using Gather you confirm that you have read, understood, and agreed to these Terms of Service and our Community Guidelines. If you do not agree, please do not use the platform.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
