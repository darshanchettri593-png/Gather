import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FLAT_LOCATIONS } from "@/lib/india-locations";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

// Sort bringing Siliguri to top
const LOCATIONS = ["Siliguri, West Bengal", ...FLAT_LOCATIONS.filter(l => l !== "Siliguri, West Bengal")];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, openAuthModal } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { display_name?: string; location?: string; avatar_url?: string }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    }
  });

  const { toast } = useToast();

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
      console.log("[DeleteAccount] Starting deletion for:", user.id);

      // 1. Avatar storage cleanup — best effort, do while session is still valid
      if (profile?.avatar_url) {
        const path = profile.avatar_url.split("/avatars/")[1];
        if (path) {
          await supabase.storage
            .from("avatars")
            .remove([path])
            .catch((e) => console.warn("[DeleteAccount] Avatar cleanup failed:", e));
        }
      }

      // 2. Get current session so we can pass the JWT to the edge function
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expired. Please log in again.");

      // 3. Call the delete-user Edge Function.
      //    It uses the service_role key to call auth.admin.deleteUser() —
      //    the only API that permanently removes the auth.users record and
      //    frees the email for immediate re-registration.
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

      // 4. Clear local session — auth record is already gone so a normal
      //    signOut() would get a 403. scope:'local' only clears the JWT from
      //    localStorage and fires the SIGNED_OUT event so AuthContext resets.
      ["pending_rsvp_event_id", "pending_host_intent", "gather_pending_action"].forEach(
        (k) => localStorage.removeItem(k)
      );
      await supabase.auth.signOut({ scope: "local" });

      toast("Account deleted");
      navigate("/");
    } catch (err: any) {
      console.error("[DeleteAccount] Error:", err);
      setDeleteError(err.message || "Something went wrong. Try again.");
      setIsDeleting(false);
    }
  };

  const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h2 className="px-5 mb-2 text-[12px] font-semibold tracking-widest text-neutral-400 uppercase" style={{ paddingTop: '20px' }}>
      {children}
    </h2>
  );

  const CardRow = ({ 
    label, 
    value, 
    onClick, 
    hasChevron, 
    isLast,
    children, 
    subLabel
  }: { 
    label?: string | React.ReactNode;
    value?: string | React.ReactNode; 
    onClick?: () => void; 
    hasChevron?: boolean; 
    isLast?: boolean;
    children?: React.ReactNode;
    subLabel?: string;
  }) => (
    <div 
      className={`flex items-center justify-between min-h-[52px] bg-white px-4 ${onClick ? 'cursor-pointer active:bg-neutral-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex-1 py-1">
        {label && <span className="text-[17px] text-[#1A1A1A]">{label}</span>}
        {subLabel && <p className="text-[12px] text-neutral-400 leading-tight mt-0.5">{subLabel}</p>}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[17px] text-neutral-400">{value}</span>}
        {hasChevron && <ChevronRight className="h-5 w-5 text-neutral-400" />}
      </div>
    </div>
  );

  const Separator = () => (
    <div className="pl-4 bg-white">
      <div className="h-[1px] bg-[#F0F0ED] w-full" />
    </div>
  );

  return (
    <div className="page-transition w-full bg-[#F2F2EF] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-[#E5E5E0] h-[56px] px-2">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center justify-center w-10 h-10 bg-transparent border-0 text-neutral-600 active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2} />
        </button>
        
        <h1 className="text-[17px] font-semibold text-[#1A1A1A] absolute left-1/2 -translate-x-1/2">
          Settings
        </h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <div className="pt-4 pb-[100px] max-w-md mx-auto space-y-2">
        
        {/* ACCOUNT */}
        <section>
          <SectionHeader>Account</SectionHeader>
          
          {!user ? (
            <div className="bg-white rounded-2xl overflow-hidden mx-4 p-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center mb-3">
                <User className="h-5 w-5 text-neutral-500" />
              </div>
              <p className="text-[14px] text-neutral-700 mb-5">
                Sign in to save your events and customize your profile
              </p>
              <button 
                onClick={() => openAuthModal("Sign in to save your events and customize your profile", "/settings")}
                className="w-full h-[44px] rounded-full bg-[#FF6B35] text-white text-[16px] font-semibold shadow-none active:scale-[0.98] transition-transform"
              >
                Sign in
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden mx-4">
              <div className="flex items-center justify-between min-h-[52px] bg-white px-4">
                <span className="text-[17px] text-[#1A1A1A]">Name</span>
                <input
                   type="text"
                   value={displayName}
                   onChange={(e) => setDisplayName(e.target.value)}
                   onBlur={() => updateProfileMutation.mutate({ display_name: displayName })}
                   className="text-right text-[17px] text-neutral-500 focus:outline-none focus:text-[#1A1A1A] bg-transparent flex-1 ml-4"
                   placeholder="Your name"
                />
              </div>
              <Separator />
              <CardRow label="Email" value={user.email} />
              <Separator />
              <div className="flex items-center justify-between min-h-[52px] bg-white px-4 py-2">
                <span className="text-[17px] text-[#1A1A1A]">Profile photo</span>
                <div className="w-10 h-10 rounded-full bg-[#F5F5F2] overflow-hidden relative cursor-pointer">
                  <ImageUploader 
                    bucket="avatars"
                    folder={user.id}
                    aspectRatio="1/1"
                    defaultImage={profile?.avatar_url}
                    onUploadSuccess={(url) => updateProfileMutation.mutate({ avatar_url: url })}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* PREFERENCES */}
        <section>
          <SectionHeader>Preferences</SectionHeader>
          <div className="bg-white rounded-2xl overflow-hidden mx-4">
            <CardRow 
              label="Location" 
              value={profile?.location || "Select location"} 
              hasChevron 
              onClick={() => setShowLocationModal(true)} 
            />
            <Separator />
            <div className="flex items-center justify-between min-h-[52px] bg-white px-4">
              <span className="text-[17px] text-[#1A1A1A]">Notifications</span>
              <Switch defaultChecked className="data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-neutral-200" />
            </div>
            <Separator />
            <div className="flex items-center justify-between min-h-[52px] bg-white px-4 py-2">
              <div className="flex flex-col">
                <span className="text-[17px] text-[#1A1A1A]">Email updates</span>
                <span className="text-[12px] text-neutral-400 mt-0.5">Weekly digest of events near you</span>
              </div>
              <Switch className="data-[state=checked]:bg-[#34C759] data-[state=unchecked]:bg-neutral-200" />
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section>
          <SectionHeader>About</SectionHeader>
          <div className="bg-white rounded-2xl overflow-hidden mx-4">
            <CardRow label="Community guidelines" hasChevron onClick={() => navigate('/settings/community-guidelines')} />
            <Separator />
            <CardRow label="Privacy policy" hasChevron />
            <Separator />
            <CardRow label="Terms of service" hasChevron />
            <Separator />
            <CardRow label="App version" value="1.0.0" />
          </div>
        </section>

        {/* DANGER ZONE */}
        {user && (
          <section className="mb-4">
            <div className="bg-white rounded-2xl overflow-hidden mx-4">
              <button
                onClick={handleLogout}
                className="w-full min-h-[52px] flex items-center justify-center text-[17px] font-semibold text-[#FF3B30] bg-white active:bg-neutral-50 transition-colors"
              >
                Log out
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setDeleteEmailConfirm("");
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="text-[13px] text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Delete account permanently
              </button>
            </div>
          </section>
        )}

      </div>

      {/* Delete Account Modal */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={(open) => !isDeleting && setShowDeleteModal(open)}
      >
        <DialogContent className="sm:max-w-[380px] rounded-2xl w-[90%] p-6">
          <DialogTitle className="text-[18px] font-semibold text-[#1A1A1A] mb-1">
            Delete account permanently?
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-600 mb-5 leading-relaxed">
            This will delete your profile and all your hosted events. This cannot be undone.
            Type your email to confirm:
          </DialogDescription>

          <input
            type="email"
            autoComplete="email"
            placeholder={user?.email || "your@email.com"}
            value={deleteEmailConfirm}
            onChange={(e) => { setDeleteEmailConfirm(e.target.value); setDeleteError(null); }}
            disabled={isDeleting}
            className="w-full h-[44px] border border-[#E5E5E0] rounded-lg px-3 text-[15px] text-[#1A1A1A] placeholder:text-neutral-300 outline-none focus:border-[#FF3B30] transition-colors mb-3 bg-transparent"
          />

          {deleteError && (
            <p className="text-[13px] text-[#FF3B30] mb-3">{deleteError}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1 h-[44px] rounded-full border border-[#E5E5E0] font-medium text-neutral-700 active:bg-neutral-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deleteEmailConfirm.trim()}
              className="flex-1 h-[44px] rounded-full bg-[#FF3B30] text-white font-medium active:opacity-90 disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center">
          <div className="bg-[#F2F2EF] w-full max-w-md h-[80vh] sm:h-[500px] sm:rounded-2xl rounded-t-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5E0] sm:rounded-t-2xl rounded-t-2xl">
              <button onClick={() => setShowLocationModal(false)} className="text-[#FF6B35] font-medium text-[17px]">Cancel</button>
              <h3 className="text-[17px] font-semibold text-[#1A1A1A]">Select Location</h3>
              <div className="w-16" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {LOCATIONS.map((loc) => (
                <button 
                  key={loc}
                  className="w-full text-left px-4 py-3 bg-white rounded-xl text-[17px] text-[#1A1A1A] active:bg-neutral-50 hover:bg-neutral-50 transition-colors"
                  onClick={() => {
                    updateProfileMutation.mutate({ location: loc });
                    setShowLocationModal(false);
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
