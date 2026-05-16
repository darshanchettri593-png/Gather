import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { subscribeToPush } from "@/lib/push";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";


export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, openAuthModal } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [locationResetting, setLocationResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetsLeft, setResetsLeft] = useState(3);
  const [resetExhaustedDate, setResetExhaustedDate] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { display_name?: string; location?: string; avatar_url?: string }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  const { toast } = useToast();

  const getResetInfo = () => {
    const key = 'gather_location_resets';
    const stored = localStorage.getItem(key);
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (stored) {
      const { count, firstReset } = JSON.parse(stored);
      if (now - firstReset < oneWeek) {
        const left = Math.max(0, 3 - count);
        const date = new Date(firstReset + oneWeek).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return { left, exhaustedDate: left === 0 ? date : null };
      }
    }
    return { left: 3, exhaustedDate: null };
  };

  useEffect(() => {
    const { left, exhaustedDate } = getResetInfo();
    setResetsLeft(left);
    setResetExhaustedDate(exhaustedDate);
  }, []);

  const handleResetLocation = async () => {
    const key = 'gather_location_resets';
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const stored = localStorage.getItem(key);
    if (stored) {
      const { count, firstReset } = JSON.parse(stored);
      if (now - firstReset < oneWeek && count >= 3) {
        const date = new Date(firstReset + oneWeek).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        toast(`Reset limit reached — try again after ${date}`, 'error');
        return;
      }
      if (now - firstReset < oneWeek) {
        localStorage.setItem(key, JSON.stringify({ count: count + 1, firstReset }));
      } else {
        localStorage.setItem(key, JSON.stringify({ count: 1, firstReset: now }));
      }
    } else {
      localStorage.setItem(key, JSON.stringify({ count: 1, firstReset: now }));
    }
    setLocationResetting(true);
    localStorage.removeItem('gather_city');
    localStorage.removeItem('gather_lat');
    localStorage.removeItem('gather_lng');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const response = await fetch(
          `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${pos.coords.latitude},${pos.coords.longitude}&api_key=${import.meta.env.VITE_OLA_MAPS_KEY}`
        );
        const data = await response.json();
        const components = data.results?.[0]?.address_components || [];
        const city =
          components.find((c: any) => c.types?.includes('locality'))?.long_name ||
          components.find((c: any) => c.types?.includes('administrative_area_level_2'))?.long_name ||
          'Nearby';
        localStorage.setItem('gather_city', city);
        localStorage.setItem('gather_lat', String(pos.coords.latitude));
        localStorage.setItem('gather_lng', String(pos.coords.longitude));
        if (user) await supabase.from('users').update({ location: city }).eq('id', user.id);
        toast(`Location updated to ${city}`);
        const { left, exhaustedDate } = getResetInfo();
        setResetsLeft(left);
        setResetExhaustedDate(exhaustedDate);
        setLocationResetting(false);
        setTimeout(() => window.location.reload(), 800);
      } catch {
        setLocationResetting(false);
        toast('Failed to update location', 'error');
      }
    }, () => {
      setLocationResetting(false);
      toast('Could not get GPS. Enable location access and try again.', 'error');
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (deleteEmailConfirm.trim().toLowerCase() !== user.email?.toLowerCase()) {
      setDeleteError("Email doesn't match your account email");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (profile?.avatar_url) {
        const path = profile.avatar_url.split("/avatars/")[1];
        if (path) {
          await supabase.storage.from("avatars").remove([path]).catch(() => {});
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${response.status})`);
      }
      ["pending_rsvp_event_id", "pending_host_intent", "gather_pending_action"].forEach(
        (k) => localStorage.removeItem(k)
      );
      await supabase.auth.signOut({ scope: "local" });
      toast("Account deleted");
      navigate("/");
    } catch (err: any) {
      setDeleteError(err.message || "Something went wrong. Try again.");
      setIsDeleting(false);
    }
  };

  // ─── Sub-components ──────────────────────────────────────────────────────────

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h2
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "#6B6B63",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        padding: "20px 20px 8px",
      }}
    >
      {children}
    </h2>
  );

  const GroupCard = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        backgroundColor: "#1C1C1A",
        borderRadius: "16px",
        margin: "0 20px 8px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );

  const Row = ({
    label,
    value,
    onClick,
    hasChevron,
    children,
    subLabel,
  }: {
    label?: string | React.ReactNode;
    value?: string | React.ReactNode;
    onClick?: () => void;
    hasChevron?: boolean;
    children?: React.ReactNode;
    subLabel?: string;
  }) => (
    <div
      className={onClick ? "cursor-pointer active:opacity-60 transition-opacity" : ""}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "52px",
        padding: "0 16px",
      }}
    >
      <div style={{ flex: 1, padding: "4px 0" }}>
        {label && (
          <span style={{ fontSize: "16px", color: "#F0EEE9" }}>{label}</span>
        )}
        {subLabel && (
          <p style={{ fontSize: "12px", color: "#3D3D38", marginTop: "2px" }}>{subLabel}</p>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span style={{ fontSize: "16px", color: "#6B6B63" }}>{value}</span>
        )}
        {hasChevron && (
          <ChevronRight size={18} color="#6B6B63" strokeWidth={1.8} />
        )}
      </div>
    </div>
  );

  const Separator = () => (
    <div style={{ paddingLeft: "16px", backgroundColor: "#1C1C1A" }}>
      <div style={{ height: "1px", backgroundColor: "#2A2A28" }} />
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="page-transition w-full min-h-screen"
      style={{ backgroundColor: "#111110" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between"
        style={{
          height: "56px",
          backgroundColor: "#111110",
          borderBottom: "1px solid #2A2A28",
          padding: "0 4px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center active:opacity-60 transition-opacity"
          style={{ width: "44px", height: "44px" }}
        >
          <ChevronLeft size={22} color="#F0EEE9" strokeWidth={2} />
        </button>
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "17px",
            fontWeight: 600,
            color: "#F0EEE9",
          }}
        >
          Settings
        </span>
        <div style={{ width: "44px" }} />
      </header>

      <div className="max-w-md mx-auto" style={{ paddingBottom: "80px" }}>

        {/* ACCOUNT */}
        <SectionLabel>Account</SectionLabel>
        {!user ? (
          <GroupCard>
            <div
              className="flex flex-col items-center text-center"
              style={{ padding: "24px 20px" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#242422",
                  marginBottom: "12px",
                }}
              >
                <User size={20} color="#6B6B63" strokeWidth={1.8} />
              </div>
              <p style={{ fontSize: "14px", color: "#6B6B63", marginBottom: "20px" }}>
                Sign in to save your events and customize your profile
              </p>
              <button
                onClick={() => openAuthModal("Sign in to save your events and customize your profile", "/settings")}
                className="w-full active:opacity-80 transition-opacity"
                style={{
                  height: "44px",
                  borderRadius: "999px",
                  backgroundColor: "#FF6B35",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 600,
                }}
              >
                Sign in
              </button>
            </div>
          </GroupCard>
        ) : (
          <GroupCard>
            <div
              className="flex items-center justify-between"
              style={{ minHeight: "52px", padding: "0 16px" }}
            >
              <span style={{ fontSize: "16px", color: "#F0EEE9" }}>Name</span>
              <input
                type="text"
                defaultValue={displayName}
                onBlur={(e) => {
                  setDisplayName(e.target.value);
                  updateProfileMutation.mutate({ display_name: e.target.value });
                }}
                placeholder="Your name"
                className="text-right bg-transparent outline-none flex-1 ml-4"
                style={{ fontSize: "16px", color: "#6B6B63" }}
              />
            </div>
            <Separator />
            <Row label="Email" value={user.email} />
            <Separator />
            <div
              className="flex items-center justify-between"
              style={{ minHeight: "52px", padding: "8px 16px" }}
            >
              <span style={{ fontSize: "16px", color: "#F0EEE9" }}>Profile photo</span>
              <div
                className="rounded-full overflow-hidden relative cursor-pointer"
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#242422",
                  border: "1px solid #2A2A28",
                }}
              >
                <ImageUploader
                  bucket="avatars"
                  folder={user.id}
                  aspectRatio="1/1"
                  defaultImage={profile?.avatar_url}
                  onUploadSuccess={(url) => updateProfileMutation.mutate({ avatar_url: url })}
                />
              </div>
            </div>
          </GroupCard>
        )}

        {/* LOCATION */}
        <SectionLabel>Location</SectionLabel>
        <GroupCard>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2A2A28' }}>
            <div>
              <p style={{ fontSize: '15px', color: '#F0EEE9', marginBottom: '2px' }}>Your Location</p>
              <p style={{ fontSize: '13px', color: '#6B6B63', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: locationResetting ? '#FF6B35' : '#34C759', display: 'inline-block', flexShrink: 0 }}></span>
                {locationResetting ? 'Detecting...' : (localStorage.getItem('gather_city') || 'Not detected')}
              </p>
            </div>
            <button
              onClick={() => { setShowConfirmReset(true); setConfirmText(''); }}
              disabled={locationResetting || resetsLeft === 0}
              style={{
                padding: '7px 14px',
                borderRadius: '20px',
                background: resetsLeft === 0 ? 'transparent' : 'rgba(255,107,53,0.08)',
                border: resetsLeft === 0 ? '0.5px solid rgba(255,59,48,0.2)' : '0.5px solid rgba(255,107,53,0.25)',
                color: resetsLeft === 0 ? '#FF3B30' : '#FF6B35',
                fontSize: '13px',
                fontWeight: 600,
                cursor: resetsLeft === 0 || locationResetting ? 'not-allowed' : 'pointer',
                opacity: resetsLeft === 0 ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {locationResetting ? 'Updating...' : resetsLeft === 0 ? 'Limit reached' : 'Reset'}
            </button>
          </div>
          <div style={{ padding: '10px 20px' }}>
            <p style={{ fontSize: '11px', color: '#3D3D38', textAlign: 'center' }}>
              {resetsLeft === 0
                ? <span>Resets again on <span style={{ color: '#6B6B63' }}>{resetExhaustedDate}</span></span>
                : <span><span style={{ color: '#6B6B63' }}>{resetsLeft} reset{resetsLeft !== 1 ? 's' : ''} remaining</span> this week</span>
              }
            </p>
          </div>
        </GroupCard>

        {/* PREFERENCES */}
        <SectionLabel>Preferences</SectionLabel>
        <GroupCard>
          {typeof Notification !== 'undefined' && (
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #2A2A28',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '15px', color: '#F0EEE9', marginBottom: '2px' }}>Event Reminders</p>
                <p style={{ fontSize: '13px', color: '#6B6B63' }}>
                  {notifStatus === 'granted' ? "You'll be reminded 24h before events" : 'Get reminded 24h before events'}
                </p>
              </div>
              <div
                onClick={async () => {
                  if (notifStatus === 'denied') {
                    alert('Notifications are blocked. Please allow notifications in your browser/phone settings first, then try again.');
                    return;
                  }
                  // Whether granted or default — always re-subscribe to ensure fresh subscription
                  await subscribeToPush(user!.id, supabase);
                  setNotifStatus(Notification.permission);
                }}
                style={{
                  width: '48px',
                  height: '28px',
                  borderRadius: '999px',
                  backgroundColor: notifStatus === 'granted' ? '#34C759' : '#3D3D38',
                  position: 'relative',
                  cursor: notifStatus === 'granted' ? 'default' : 'pointer',
                  transition: 'background-color 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: notifStatus === 'granted' ? '23px' : '3px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          )}
          <Separator />
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p style={{ fontSize: '15px', color: '#F0EEE9', marginBottom: '2px' }}>Email updates</p>
              <p style={{ fontSize: '13px', color: '#6B6B63' }}>Weekly digest of events near you</p>
            </div>
            <div
              onClick={() => setEmailUpdates(v => !v)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '999px',
                backgroundColor: emailUpdates ? '#34C759' : '#3D3D38',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: emailUpdates ? '23px' : '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.2s',
              }} />
            </div>
          </div>
        </GroupCard>

        {/* ABOUT */}
        <SectionLabel>About</SectionLabel>
        <GroupCard>
          <Row
            label="Community guidelines"
            hasChevron
            onClick={() => navigate("/guidelines")}
          />
          <Separator />
          <Row label="Privacy policy" hasChevron onClick={() => navigate("/privacy")} />
          <Separator />
          <Row label="Terms of service" hasChevron onClick={() => navigate("/terms")} />
          <Separator />
          <Row label="App version" value="1.0.0" />
        </GroupCard>

        <div style={{
          padding: '12px 20px',
          borderTop: '0.5px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ fontSize: '11px', color: '#3D3D38' }}>Maps powered by</span>
          <a
            href="https://openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '11px', color: '#6B6B63', textDecoration: 'none' }}
          >
            Ola Maps
          </a>
        </div>

        {/* DANGER ZONE */}
        {user && (
          <>
            <div style={{ margin: "24px 20px 0" }}>
              <button
                onClick={handleLogout}
                className="w-full active:opacity-70 transition-opacity"
                style={{
                  height: "52px",
                  borderRadius: "16px",
                  backgroundColor: "#1C1C1A",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#FF3B30",
                }}
              >
                Sign out
              </button>
            </div>
            <div className="text-center" style={{ marginTop: "16px" }}>
              <button
                onClick={() => {
                  setDeleteEmailConfirm("");
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                style={{ fontSize: "13px", color: "#6B6B63" }}
                className="active:opacity-60 transition-opacity"
              >
                Delete account permanently
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete modal */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={(open) => !isDeleting && setShowDeleteModal(open)}
      >
        <DialogContent
          className="sm:max-w-[380px] rounded-2xl w-[90%] p-6"
          style={{ backgroundColor: "#1C1C1A", border: "1px solid #2A2A28" }}
        >
          <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#F0EEE9", marginBottom: "4px" }}>
            Delete account permanently?
          </DialogTitle>
          <DialogDescription style={{ fontSize: "14px", color: "#6B6B63", marginBottom: "20px", lineHeight: 1.5 }}>
            This will delete your profile and all your hosted events. This cannot be undone. Type your email to confirm:
          </DialogDescription>
          <input
            type="email"
            autoComplete="email"
            placeholder={user?.email || "your@email.com"}
            value={deleteEmailConfirm}
            onChange={(e) => { setDeleteEmailConfirm(e.target.value); setDeleteError(null); }}
            disabled={isDeleting}
            className="w-full outline-none transition-colors"
            style={{
              height: "48px",
              backgroundColor: "#242422",
              border: "1px solid #2A2A28",
              borderRadius: "12px",
              padding: "0 14px",
              fontSize: "16px",
              color: "#F0EEE9",
              marginBottom: "8px",
            }}
          />
          {deleteError && (
            <p style={{ fontSize: "13px", color: "#FF3B30", marginBottom: "12px" }}>{deleteError}</p>
          )}
          <div className="flex gap-3" style={{ marginTop: "4px" }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1 active:opacity-70 transition-opacity"
              style={{
                height: "44px",
                borderRadius: "999px",
                border: "1px solid #2A2A28",
                fontSize: "15px",
                fontWeight: 500,
                color: "#F0EEE9",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deleteEmailConfirm.trim()}
              className="flex-1 active:opacity-80 transition-opacity"
              style={{
                height: "44px",
                borderRadius: "999px",
                backgroundColor: "#FF3B30",
                color: "white",
                fontSize: "15px",
                fontWeight: 500,
                opacity: isDeleting || !deleteEmailConfirm.trim() ? 0.4 : 1,
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm reset location dialog */}
      <Dialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <DialogContent style={{ background: '#1C1C1A', border: '1px solid #2A2A28', borderRadius: '16px', padding: '24px', maxWidth: '320px', margin: '0 auto' }}>
          <DialogTitle style={{ color: '#F0EEE9', fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Reset Location?
          </DialogTitle>
          <DialogDescription style={{ color: '#6B6B63', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}>
            Type CONFIRM below to update your location using GPS.
          </DialogDescription>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CONFIRM"
            style={{
              width: '100%',
              background: '#242422',
              border: '1px solid #2A2A28',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#F0EEE9',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '16px',
              WebkitTextFillColor: '#F0EEE9',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowConfirmReset(false)}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#242422', border: '1px solid #2A2A28', color: '#6B6B63', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmText.trim().toUpperCase() !== 'CONFIRM') return;
                setShowConfirmReset(false);
                setConfirmText('');
                handleResetLocation();
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                background: confirmText.trim().toUpperCase() === 'CONFIRM' ? '#FF6B35' : '#242422',
                border: 'none',
                color: confirmText.trim().toUpperCase() === 'CONFIRM' ? 'white' : '#3D3D38',
                fontSize: '13px',
                fontWeight: 600,
                cursor: confirmText.trim().toUpperCase() === 'CONFIRM' ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
