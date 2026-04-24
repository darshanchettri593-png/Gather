import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useAuth } from "@/lib/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { EventVibe } from "@/types";
import { useToast } from "@/components/ui/toast";

const VIBES: { id: EventVibe, label: string, helper: string }[] = [
  { id: "move", label: "Move", helper: "Running, gym, hiking, yoga, sports, anything active" },
  { id: "create", label: "Create", helper: "Art sessions, jam sessions, writing, photography, crafts, making things" },
  { id: "hang", label: "Hang", helper: "Parties, dinners, drinks, game nights, casual meetups, social gatherings" },
  { id: "learn", label: "Learn", helper: "Workshops, book clubs, talks, study groups, skill-shares" },
  { id: "explore", label: "Explore", helper: "Trips, hikes with travel, food tours, visiting new places, adventures" }
];

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, openAuthModal } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auth guard — open modal and send guest home
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal(
        "Quick sign up to host — we just need your name so people know who is hosting. Takes 10 seconds.",
        "/host"
      );
      navigate("/");
    }
  }, [user, authLoading]);
  
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [vibe, setVibe] = useState<EventVibe>("move");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [description, setDescription] = useState("");

  const isFormValid = coverUrl && title && vibe && locationStr && date && time;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in to host");
      
      const eventDateTime = new Date(`${date}T${time}`);
      if (eventDateTime <= new Date()) {
        throw new Error("Date must be in the future");
      }

      const { data, error } = await supabase.from('events').insert({
        host_id: user.id,
        title,
        vibe,
        location_text: locationStr,
        description: description || null,
        event_datetime: eventDateTime.toISOString(),
        cover_image_url: coverUrl || null
      }).select().single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast("Your event is live!", "success");
      console.log('[CreateEvent] Published event:', data.id);
      navigate(`/event/${data.id}`);
    }
  });

  const handleSubmit = () => {
    if (!isFormValid || createMutation.isPending || isUploadingImage) return;
    createMutation.mutate();
  };

  const selectedVibeObj = VIBES.find(v => v.id === vibe);

  return (
    <div className="page-transition max-w-md mx-auto pb-[100px] bg-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white border-b border-[#E5E5E0] h-[56px] px-2">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center justify-center w-10 h-10 bg-transparent border-0 text-neutral-600 active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        
        <h1 className="text-[17px] font-semibold text-black absolute left-1/2 -translate-x-1/2">
          Host a thing
        </h1>
        
        <div className="flex items-center">
          {isUploadingImage && (
             <span className="text-[11px] text-[#FF6B35] font-medium mr-2">Uploading...</span>
          )}
          <button 
            onClick={handleSubmit}
            disabled={!isFormValid || createMutation.isPending || isUploadingImage}
            className={`px-4 text-[15px] transition-colors ${
              isFormValid && !createMutation.isPending && !isUploadingImage
                ? 'text-[#FF6B35] font-bold active:text-[#FF6B35]/70' 
                : 'text-neutral-300 font-medium'
            }`}
          >
            Publish
          </button>
        </div>
      </header>

      {/* Form Content */}
      <div className="px-5 pt-6 space-y-6">
        
        {createMutation.error && (
          <div className="text-[13px] font-medium text-destructive text-center mb-2">
            {createMutation.error.message}
          </div>
        )}

        {/* 1. Cover Image */}
        <div className="w-full">
          <ImageUploader 
            bucket="event-covers"
            folder={user?.id}
            onUploadStart={() => setIsUploadingImage(true)}
            onUploadEnd={() => setIsUploadingImage(false)}
            onUploadSuccess={(url) => setCoverUrl(url)}
          />
        </div>

        {/* 2. Event Title Input */}
        <div>
          <input 
            type="text" 
            placeholder="What's the vibe?"
            maxLength={60}
            className="w-full text-[26px] font-semibold text-[#1A1A1A] bg-transparent border-none placeholder:text-[#C0C0BB] focus:outline-none focus:ring-0 py-3"
            style={{ marginTop: '20px', marginBottom: '24px' }}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          {title.length >= 50 && (
             <div className="text-right px-4">
                <span className={`text-[11px] font-medium ${title.length === 60 ? 'text-destructive' : 'text-neutral-400'}`}>
                  {title.length} / 60
                </span>
             </div>
          )}
        </div>

        {/* 3. Vibe */}
        <div className="space-y-2">
          <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
            Vibe
          </label>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-nowrap">
            {VIBES.map(v => {
               const isActive = vibe === v.id;
               return (
                 <button
                   key={v.id}
                   onClick={() => setVibe(v.id)}
                   className={`flex-shrink-0 px-[14px] h-[34px] text-[14px] font-medium rounded-full transition-colors ${
                     isActive 
                       ? 'bg-[#1A1A1A] text-white' 
                       : 'bg-white text-[#1A1A1A] border border-[#E5E5E0]'
                   }`}
                 >
                   {v.label}
                 </button>
               );
            })}
          </div>
          
          {selectedVibeObj && (
            <div className="pt-1 animate-in fade-in duration-300">
              <p className="text-[11px] text-neutral-400 italic">
                {selectedVibeObj.helper}
              </p>
            </div>
          )}
        </div>

        {/* 4. Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
              Date
            </label>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`w-full bg-transparent border-0 border-b border-[#E5E5E0] focus:ring-0 focus:border-black px-0 py-2 outline-none transition-colors text-[16px] min-h-[44px] ${date ? 'text-black font-medium' : 'text-neutral-400 font-normal'}`} 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
              Time
            </label>
            <input 
              type="time" 
              value={time}
              onChange={e => setTime(e.target.value)}
              className={`w-full bg-transparent border-0 border-b border-[#E5E5E0] focus:ring-0 focus:border-black px-0 py-2 outline-none transition-colors text-[16px] min-h-[44px] ${time ? 'text-black font-medium' : 'text-neutral-400 font-normal'}`} 
            />
          </div>
        </div>

        {/* 5. Location */}
        <div className="space-y-2">
          <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
            Location
          </label>
          <input 
            type="text" 
            placeholder="Where's it happening?"
            maxLength={120}
            className="w-full text-[16px] font-medium bg-transparent border-0 border-b border-[#E5E5E0] placeholder:font-normal placeholder:text-neutral-300 text-black focus:ring-0 focus:border-black px-0 py-2 outline-none transition-colors"
            value={locationStr}
            onChange={e => setLocationStr(e.target.value)}
          />
        </div>

        {/* 6. Description */}
        <div className="space-y-2">
          <label className="block text-[12px] font-semibold text-neutral-400 uppercase tracking-wider">
            Description <span className="text-neutral-400 normal-case font-normal">(optional)</span>
          </label>
          <textarea 
            placeholder="Tell people what to expect..."
            rows={4}
            maxLength={500}
            className="w-full text-[15px] font-medium leading-relaxed bg-transparent border-0 border-b border-[#E5E5E0] placeholder:font-normal placeholder:text-neutral-400 text-black focus:ring-0 focus:border-black px-0 py-2 resize-none outline-none transition-colors"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex justify-end min-h-[16px]">
            {description.length >= 400 && (
              <span className="text-[11px] text-neutral-400 font-normal">
                {description.length} / 500
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
