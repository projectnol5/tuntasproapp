import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PhotoData } from '../../lib/types';
import { formatTime, formatCoords } from '../../lib/format';

interface LightboxProps {
  photos: PhotoData[];
  index: number;
  open: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ photos, index, open, onClose, onNavigate }: LightboxProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
    },
    [index, photos.length, onClose, onNavigate],
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, handleKey]);

  if (!open || photos.length === 0) return null;

  const photo = photos[index];

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Pratinjau foto"
      >
        <div className="flex items-center justify-between p-4 text-white safe-top">
          <span className="font-mono-num text-sm">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div
          className="flex-1 flex items-center justify-center overflow-auto p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            key={photo.id}
            src={photo.dataUrl}
            alt={photo.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="p-4 text-center text-white/80 safe-bottom">
          <p className="text-sm font-medium">{photo.label}</p>
          {photo.dateTime && <p className="text-xs font-mono-num mt-1">{formatTime(photo.dateTime)}</p>}
          {photo.lat != null && photo.lng != null && (
            <p className="text-xs font-mono-num mt-0.5">{formatCoords(photo.lat, photo.lng)}</p>
          )}
        </div>

        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(index - 1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(index + 1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
          </button>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
