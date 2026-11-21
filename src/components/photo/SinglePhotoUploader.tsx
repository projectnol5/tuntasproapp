import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, Trash2, ZoomIn } from 'lucide-react';
import type { PhotoData } from '../../lib/types';
import { processPhoto, isHEIC } from '../../lib/image';
import { formatTime, formatCoords } from '../../lib/format';
import { Lightbox } from './Lightbox';
import { useToast } from '../../hooks/use-toast';

interface SinglePhotoUploaderProps {
  photo?: PhotoData;
  label: string;
  onSet: (photo: PhotoData) => void;
  onRemove: () => void;
  buttonLabel: string;
}

export function SinglePhotoUploader({
  photo,
  label,
  onSet,
  onRemove,
  buttonLabel,
}: SinglePhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      if (isHEIC(file)) {
        toast({
          title: 'Format HEIC tidak didukung',
          description: 'Ubah format kamera ke "Most Compatible" di Pengaturan > Kamera > Format.',
          variant: 'destructive',
        });
        return;
      }

      setProcessing(true);
      const result = await processPhoto(file, label);
      setProcessing(false);

      if (result.success && result.photo.dataUrl) {
        onSet(result.photo);
      } else {
        toast({
          title: 'Gagal memproses foto',
          description: 'Coba foto lain atau periksa koneksi.',
          variant: 'destructive',
        });
      }
    },
    [label, onSet, toast],
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {photo && photo.dataUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border shadow-soft group">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full aspect-[4/3] overflow-hidden bg-muted"
            aria-label="Buka foto"
          >
            <img
              src={photo.dataUrl}
              alt={label}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          </button>

          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-mono-num uppercase tracking-wide">
              <Camera className="h-3 w-3" strokeWidth={1.75} />
              {label}
            </span>
          </div>

          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              aria-label="Perbesar"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="h-11 w-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-destructive text-white transition-colors"
              aria-label="Hapus foto"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="px-3 py-2 bg-surface border-t border-border">
            <p className="text-xs font-medium text-foreground/80">{photo.label}</p>
            {photo.dateTime && (
              <p className="text-[10px] font-mono-num text-muted-foreground">
                {formatTime(photo.dateTime)}
              </p>
            )}
            {photo.lat != null && photo.lng != null && (
              <p className="text-[10px] font-mono-num text-muted-foreground">
                {formatCoords(photo.lat, photo.lng)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-colors aspect-[4/3] disabled:opacity-50"
          aria-label={buttonLabel}
        >
          {processing ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" strokeWidth={1.75} />
              <span className="text-sm text-muted-foreground font-medium">Memproses…</span>
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-7 w-7 text-primary" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-medium text-foreground/70">{buttonLabel}</span>
              </motion.div>
            </AnimatePresence>
          )}
        </button>
      )}

      <Lightbox
        photos={photo && photo.dataUrl ? [photo] : []}
        index={0}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={() => {}}
      />
    </div>
  );
}
