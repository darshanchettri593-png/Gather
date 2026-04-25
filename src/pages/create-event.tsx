import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronDown } from "lucide-react";
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

const DISTRICTS = [
  "Matigara",
  "Pradhan Nagar",
  "Sevoke Road",
  "Panitanki",
  "Hakimpara",
  "Khalpara",
  "Bhakti Nagar",
  "Other"
];

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, openAuthModal } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auth guard
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
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [description, setDescription] = useState("");

  const isFormValid = coverUrl && title && vibe && district && locationStr && date && time;

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
        district,
        city: localStorage.getItem('gather_city') || 'Siliguri',
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
      navigate(`/event/${data.id}`);
    }
  });

  const handleSubmit = () => {
    if (!isFormValid || createMutation.isPending || isUploadingImage) return;
    createMutation.mutate();
  };

  const selectedVibeObj = VIBES.find(v => v.id === vibe);

  return (
    <div className="page-transition max-w-md mx-auto pb-[100px] bg-[#131312] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#131312]/90 backdrop-blur-xl border-b border-[#2E2E2C] h-[56px] px-2">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center justify-center w-10 h-10 bg-transparent border-0 text-[#E5E2DE] active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
        </button>
        
        <h1 className="text-[17px] font-bold text-[#E5E2DE] absolute left-1/2 -translate-x-1/2">
          Host
        </h1>
        
        <div className="flex items-center">
          <button 
            onClick={handleSubmit}
            disabled={!isFormValid || createMutation.isPending || isUploadingImage}
            className={`px-4 h-[36px] rounded-full text-[14px] font-bold transition-all ${
              isFormValid && !createMutation.isPending && !isUploadingImage
                ? 'bg-[#FF6B35] text-white active:scale-95' 
                : 'bg-[#2C2C2A] text-[#5A5A52]'
            }`}
          >
            {createMutation.isPending ? "..." : "Publish"}
          </button>
        </div>
      </header>

      {/* Form Content */}
      <div className="px-5 pt-6 space-y-8">
        
        {createMutation.error && (
          <div className="text-[13px] font-medium text-red-500 text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            {createMutation.error.message}
          </div>
        )}

        {/* 1. Cover Image */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#242422",
            border: "1.5px dashed #383836",
          }}
        >
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
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] mb-1 px-1">
            Title
          </label>
          <input 
            type="text" 
            placeholder="Give it a catchy name"
            maxLength={60}
            className="w-full text-[28px] font-bold text-[#E5E2DE] bg-transparent border-none placeholder:text-[#5A5A52] focus:outline-none focus:ring-0 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="h-[1px] w-full bg-[#2E2E2C]" />
        </div>

        {/* 3. Vibe */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
            Category
          </label>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar flex-nowrap -mx-1 px-1">
            {VIBES.map(v => {
               const isActive = vibe === v.id;
               return (
                 <button
                   key={v.id}
                   onClick={() => setVibe(v.id)}
                   className={`flex-shrink-0 px-4 h-[36px] text-[14px] font-semibold rounded-full transition-all border ${
                     isActive 
                       ? 'bg-[#FF6B35] text-white border-[#FF6B35]' 
                       : 'bg-[#242422] text-[#9A9A8E] border-[#2E2E2C]'
                   }`}
                 >
                   {v.label}
                 </button>
               );
            })}
          </div>
          
          {selectedVibeObj && (
            <div className="bg-[#242422] p-3 rounded-xl border border-[#2E2E2C] animate-in fade-in duration-300">
              <p className="text-[12px] text-[#9A9A8E] leading-relaxed">
                {selectedVibeObj.helper}
              </p>
            </div>
          )}
        </div>

        {/* 4. Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
              Date
            </label>
            <div className="bg-[#242422] rounded-xl border border-[#2E2E2C] focus-within:border-[#FF6B35]/50 px-3 py-2">
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#E5E2DE] outline-none" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
              Time
            </label>
            <div className="bg-[#242422] rounded-xl border border-[#2E2E2C] focus-within:border-[#FF6B35]/50 px-3 py-2">
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#E5E2DE] outline-none" 
              />
            </div>
          </div>
        </div>

        {/* 5. District Selector (Part 6) */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
            District
          </label>
          <div className="relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full h-[48px] bg-[#242422] border border-[#2E2E2C] rounded-xl px-4 text-[15px] text-[#E5E2DE] appearance-none focus:outline-none focus:border-[#FF6B35]/50 transition-all"
              style={{ colorScheme: "dark" }}
            >
              {DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A5A52] pointer-events-none" />
          </div>
        </div>

        {/* 6. Location */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
            Exact Location
          </label>
          <div className="bg-[#242422] rounded-xl border border-[#2E2E2C] focus-within:border-[#FF6B35]/50 px-4 py-3">
            <input 
              type="text" 
              placeholder="Building, cafe, or park name"
              maxLength={120}
              className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#E5E2DE] placeholder:text-[#5A5A52] outline-none"
              value={locationStr}
              onChange={e => setLocationStr(e.target.value)}
            />
          </div>
        </div>

        {/* 7. Description */}
        <div className="space-y-2 pb-8">
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-[#5A5A52] px-1">
            About the event
          </label>
          <div className="bg-[#242422] rounded-xl border border-[#2E2E2C] focus-within:border-[#FF6B35]/50 px-4 py-3">
            <textarea 
              placeholder="What should people know? Any dress code or things to bring?"
              rows={4}
              maxLength={500}
              className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#E5E2DE] placeholder:text-[#5A5A52] resize-none outline-none leading-relaxed"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
