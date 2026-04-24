import { useState, useRef, useEffect } from "react";
import type React from "react";
import { Camera, X, Check, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";

interface ImageUploaderProps {
  bucket: "event-covers" | "avatars";
  folder?: string;
  defaultImage?: string | null;
  onUploadSuccess: (url: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  aspectRatio?: "16/9" | "1/1";
  showCameraBadge?: boolean;
}

export function ImageUploader({ 
  bucket, 
  folder = "general", 
  defaultImage, 
  onUploadSuccess, 
  onUploadStart,
  onUploadEnd,
  aspectRatio = "16/9" 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultImage && !previewUrl && !isUploading) {
      setPreviewUrl(defaultImage);
    }
  }, [defaultImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      if (onUploadStart) onUploadStart();
      setError(null);
      setIsSuccess(false);

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      console.log('[Upload] File selected:', file.name, file.size);

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log('[Upload] Compressed:', compressedFile.size);
      
      const fileName = `${folder}/${crypto.randomUUID()}.jpg`;
      console.log('[Upload] Uploading to:', fileName);

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          contentType: 'image/jpeg',
          upsert: false
        });

      console.log('[Upload] Response:', { data, error: uploadError });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('[Upload] Public URL:', publicUrl);

      onUploadSuccess(publicUrl);
      setIsSuccess(true);
      
      // Auto dismiss success tick after 1s
      setTimeout(() => setIsSuccess(false), 1000);
    } catch (err: any) {
      setError(err.message || "Upload failed. Tap to retry.");
      setPreviewUrl(defaultImage || null);
    } finally {
      setIsUploading(false);
      if (onUploadEnd) onUploadEnd();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUploadSuccess("");
  };

  return (
    <div className="relative w-full h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`w-full h-full overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer group ${aspectRatio === '1/1' ? 'rounded-full aspect-square bg-transparent' : 'rounded-[12px] aspect-[16/9] bg-[#F5F5F2]'} ${error ? 'border border-destructive bg-destructive/5' : ''} ${isUploading ? 'pointer-events-none' : ''}`}
      >
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className={`w-full h-full object-cover transition-all duration-300 ${isUploading ? 'opacity-70 grayscale-[0.3]' : 'opacity-100'}`} 
              onLoad={(e) => {
                (e.target as HTMLImageElement).animate([
                   { opacity: 0 },
                   { opacity: isUploading ? 0.7 : 1 }
                ], { duration: 200, fill: 'forwards' });
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />
            )}
            
            {isUploading ? (
               <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full backdrop-blur-sm shadow-sm">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
               </div>
            ) : isSuccess ? (
               <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 rounded-full animate-in zoom-in fade-in duration-300">
                  <Check className="h-8 w-8 text-white" strokeWidth={3} />
               </div>
            ) : (
              aspectRatio !== '1/1' && (
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 flex items-center justify-center w-[30px] h-[30px] bg-black/60 text-white rounded-full z-10 transition-colors hover:bg-black/80"
                >
                  <X className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
              )
            )}
          </div>
        ) : (
          aspectRatio !== '1/1' ? (
            <div className="flex flex-col items-center justify-center text-neutral-400">
              <Camera className="h-[24px] w-[24px] mb-2 text-neutral-400" strokeWidth={1.5} />
              <span className="text-[14px] text-neutral-500 font-medium">Add cover photo</span>
            </div>
          ) : null
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-[13px] text-destructive font-medium text-center">
          {error}
        </div>
      )}
    </div>
  );
}
