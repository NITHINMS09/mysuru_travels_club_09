'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineUpload, HiOutlineTrash, HiOutlinePhotograph, 
  HiOutlineCamera, HiOutlineRefresh, HiOutlineCheckCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onFileSelect?: (file: File | null) => void;
  label?: string;
  maxSizeMB?: number;
  aspectRatio?: string; // e.g. "aspect-video", "aspect-square", "aspect-auto"
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onFileSelect,
  label = "Upload Image",
  maxSizeMB = 10,
  aspectRatio = "aspect-video",
  className = ""
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Client-side image compression and resizing
  const compressAndResizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1600px for optimal loading/display
          const MAX_DIM = 1600;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // WebP format conversion for modern optimization
          const outputType = 'image/webp';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
              const compressedFile = new File([blob], `${nameWithoutExt}.webp`, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            outputType,
            0.8 // 80% quality compression (lossless to human eye but 70-80% smaller file size)
          );
        };
        img.onerror = () => reject(new Error('Failed to load image structure.'));
      };
      reader.onerror = () => reject(new Error('Failed to read selected file.'));
    });
  };

  const handleUpload = async (file: File) => {
    // 1. Validation
    if (file.size > maxSizeMB * 1024 * 1024) {
      const errMsg = `File is too large. Maximum allowed size is ${maxSizeMB}MB.`;
      setError(errMsg);
      toast.error(errMsg);
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10); // Start progress indication

    try {
      // 2. Client-side compression & resizing
      setProgress(25);
      const optimizedFile = await compressAndResizeImage(file);
      setProgress(45);

      if (onFileSelect) {
        setProgress(100);
        onFileSelect(optimizedFile);
        onChange(URL.createObjectURL(optimizedFile));
        setUploading(false);
        setTimeout(() => setProgress(0), 1000);
        return;
      }

      // 3. Upload to backend (which goes directly to Cloudinary)
      const res = await api.upload.single(optimizedFile);
      setProgress(90);

      if (res && res.url) {
        setProgress(100);
        onChange(res.url);
        toast.success('Image uploaded and optimized successfully!');
      } else {
        throw new Error('No secure URL returned from the server.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Upload failed. Please check your storage settings.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
      // Reset progress after animation delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onFileSelect) {
      onFileSelect(null);
    }
    setError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-1">
          {label}
        </span>
      )}

      <div className="relative group">
        <AnimatePresence mode="wait">
          {value ? (
            // Image Preview & Actions State
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative ${aspectRatio} rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 shadow-sm`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={value} 
                alt="Uploaded preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              
              {/* Premium overlay with replace & delete buttons */}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white text-slate-800 hover:bg-slate-50 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-bold flex items-center gap-2 text-xs"
                >
                  <HiOutlineRefresh className="w-4 h-4 animate-spin-hover" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={clearImage}
                  className="p-3 bg-rose-600 text-white hover:bg-rose-500 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 font-bold flex items-center gap-2 text-xs"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ) : (
            // Drag and Drop Area / Uploader Active State
            <motion.div
              key="uploader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] ${
                dragActive 
                  ? 'border-violet-500 bg-violet-50/20 shadow-inner' 
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
              }`}
            >
              {uploading ? (
                // Uploading progress interface
                <div className="w-full max-w-[200px] space-y-3">
                  <div className="w-10 h-10 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto text-violet-600 animate-spin">
                    <HiOutlineRefresh className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">Uploading & Optimizing...</p>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-violet-600 h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Idle Upload Prompts
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-500 group-hover:bg-slate-200 transition-colors shadow-sm">
                    <HiOutlinePhotograph className="w-6 h-6" />
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      Drag & Drop or <span className="text-violet-600 hover:text-violet-700 underline">Browse</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPG, PNG, WEBP, SVG (Max {maxSizeMB}MB)
                    </p>
                  </div>

                  {/* Native mobile helpers */}
                  <div className="flex gap-2 pt-1 md:hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg flex items-center gap-1 hover:bg-slate-50 shadow-sm"
                    >
                      <HiOutlineCamera className="w-3.5 h-3.5" /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-lg flex items-center gap-1 hover:bg-slate-50 shadow-sm"
                    >
                      <HiOutlinePhotograph className="w-3.5 h-3.5" /> Gallery
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml" 
        className="hidden" 
      />
      
      {/* Mobile camera direct input */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileChange} 
        accept="image/*"
        capture="environment"
        className="hidden" 
      />

      {/* Display error message if present */}
      {error && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
