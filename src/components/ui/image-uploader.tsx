import { useState, useRef, useEffect } from "react";
import type React from "react";
import { Camera, X, Check, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
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

  // Crop states
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const aspect = aspectRatio === "16/9" ? 16 / 9 : 1;

  useEffect(() => {
    if (defaultImage && !previewUrl && !isUploading) {
      setPreviewUrl(defaultImage);
    }
  }, [defaultImage]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropImageUrl(objectUrl);
    setCrop(undefined); // Reset crop
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    setCropImageUrl(null);
    setCompletedCrop(null);
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<File> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 1);
    });
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      // Fallback if no crop was drawn
      if (!cropImageUrl) return;
      // ... we should probably force a crop
    }

    try {
      setCropImageUrl(null); // Close modal
      setIsUploading(true);
      if (onUploadStart) onUploadStart();
      setError(null);
      setIsSuccess(false);

      const croppedFile = await getCroppedImg(imgRef.current!, completedCrop || crop!);
      
      const objectUrl = URL.createObjectURL(croppedFile);
      setPreviewUrl(objectUrl);

      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };
      
      const compressedFile = await imageCompression(croppedFile, options);
      
      const fileName = `${folder}/${crypto.randomUUID()}.jpg`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUploadSuccess(publicUrl);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1000);
    } catch (err: any) {
      setError(err.message || "Upload failed. Tap to retry.");
      setPreviewUrl(defaultImage || null);
    } finally {
      setIsUploading(false);
      if (onUploadEnd) onUploadEnd();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUploadSuccess("");
  };

  return (
    <>
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

      {cropImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[380px] flex flex-col items-center shadow-xl">
            <h3 className="text-[17px] font-semibold text-[#1A1A1A] mb-4 text-center">
              {aspectRatio === '1/1' ? 'Crop profile photo' : 'Crop cover photo'}
            </h3>
            
            <div className="w-full max-h-[50vh] overflow-hidden flex justify-center bg-neutral-50 rounded-lg">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop={aspectRatio === '1/1'}
                className="max-h-[50vh]"
                renderSelectionAddon={() => (
                  <div className="absolute inset-0 border-2 border-[#FF6B35] pointer-events-none" />
                )}
              >
                <img
                  ref={imgRef}
                  src={cropImageUrl}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </ReactCrop>
            </div>

            <div className="flex w-full gap-3 mt-6">
              <button
                onClick={handleCropCancel}
                className="flex-1 py-3 px-4 rounded-full border border-neutral-300 text-[#1A1A1A] font-medium active:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 py-3 px-4 rounded-full bg-[#FF6B35] text-white font-medium active:opacity-80"
              >
                Use photo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
