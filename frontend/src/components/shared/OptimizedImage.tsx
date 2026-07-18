'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { HiOutlinePhotograph } from 'react-icons/hi';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/trips/kottiyoor.png', // safe default fallback
  containerClassName = '',
  className = '',
  fill,
  sizes,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleError = () => {
    setError(true);
    setLoading(false);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative overflow-hidden w-full h-full ${containerClassName}`}>
      {/* Loading Skeleton */}
      {loading && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Fallback Display if error and no fallback source resolved */}
      {error && !currentSrc && (
        <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-slate-500 z-10 p-4">
          <HiOutlinePhotograph className="w-8 h-8 mb-2 animate-bounce" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Image Unavailable</span>
        </div>
      )}

      {currentSrc && (
        <Image
          {...props}
          src={currentSrc}
          alt={alt}
          fill={fill}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          className={`transition-all duration-500 ease-out ${
            loading ? 'scale-105 blur-md' : 'scale-100 blur-0'
          } ${className}`}
          onLoad={() => setLoading(false)}
          onError={handleError}
          loading={props.priority ? undefined : 'lazy'}
        />
      )}
    </div>
  );
}
