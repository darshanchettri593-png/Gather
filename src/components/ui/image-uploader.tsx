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
      if (!cropImageUrl) return;
    }

    try {
      setCropImageUrl(null);
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
          className={`w-full h-full overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer group ${aspectRatio === '1/1' ? 'rounded-full aspect-square bg-transparent' : 'rounded-2xl aspect-[16/9] bg-[#242422] border border-[#2E2E2C]'} ${error ? 'border border-red-500 bg-red-500/5' : ''} ${isUploading ? 'pointer-events-none' : ''}`}
        >
          {previewUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className={`w-full h-full object-cover transition-all duration-300 ${isUploading ? 'opacity-50 grayscale-[0.5]' : 'opacity-100 group-hover:scale-105'}`} 
              />
              {isUploading && (
                <div className="absolute inset-0 bg-[#FF6B35]/10 animate-pulse" />
              )}
              
              {isUploading ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <Loader2 className="h-8 w-8 text-[#FF6B35] animate-spin" strokeWidth={3} />
                 </div>
              ) : isSuccess ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 animate-in zoom-in fade-in duration-300">
                    <Check className="h-10 w-10 text-white" strokeWidth={4} />
                 </div>
              ) : (
                aspectRatio !== '1/1' && (
                  <button
                    onClick={handleClear}
                    className="absolute top-4 right-4 flex items-center justify-center w-[36px] h-[36px] bg-black/60 backdrop-blur-md text-white rounded-full z-10 transition-all hover:bg-black/80 active:scale-90"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                )
              )}
            </div>
          ) : (
            aspectRatio !== '1/1' ? (
              <div className="flex flex-col items-center justify-center text-[#5A5A52] group-hover:text-[#9A9A8E] transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#2C2C2A] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-[#383836]">
                  <Camera className="h-6 w-6" strokeWidth={2} />
                </div>
                <span className="text-[14px] font-bold uppercase tracking-widest">Add Cover Image</span>
              </div>
            ) : null
          )}
        </div>
        
        {error && (
          <div className="mt-3 text-[13px] text-red-500 font-bold text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}
      </div>

      {cropImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#2C2C2A] border border-[#383836] rounded-3xl p-6 w-full max-w-[400px] flex flex-col items-center shadow-2xl animate-in zoom-in fade-in duration-200">
            <h3 className="text-[18px] font-bold text-[#F0F0EA] mb-5 text-center uppercase tracking-wider">
              {aspectRatio === '1/1' ? 'Crop Profile Photo' : 'Crop Cover Photo'}
            </h3>
            
            <div className="w-full max-h-[50vh] overflow-hidden flex justify-center bg-[#1C1C1A] rounded-2xl border border-[#383836]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop={aspectRatio === '1/1'}
                className="max-h-[50vh]"
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

            <div className="flex w-full gap-4 mt-8">
              <button
                onClick={handleCropCancel}
                className="flex-1 h-[52px] rounded-2xl border border-[#383836] text-[#F0F0EA] font-bold active:bg-[#343432] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 h-[52px] rounded-2xl bg-[#FF6B35] text-white font-bold active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(255,107,53,0.3)]"
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
