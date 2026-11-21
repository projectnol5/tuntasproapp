import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import type { PhotoData } from '../../lib/types';
import {
  processPhotosSequentially,
  isHEIC,
} from '../../lib/image';
import { formatTime, formatCoords } from '../../lib/format';
import { Lightbox } from './Lightbox';
import { useToast } from '../../hooks/use-toast';

interface PhotoUploaderProps {
  photos: PhotoData[];
  label: string;
  /** max photos, 0 = unlimited */
  maxPhotos?: number;
  multiple?: boolean;
  onAdd: (photos: PhotoData[]) => void;
  onRemove: (id: string) => void;
  addCardLabel?: string;
}

export function PhotoUploader({
  photos,
  label,
  maxPhotos = 0,
  multiple = false,
  onAdd,
  onRemove,
  addCardLabel = 'Tambah foto dari galeri',
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const remaining = maxPhotos > 0 ? maxPhotos - photos.length : Infinity;
  const canAddMore = remaining > 0;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      e.target.value = '';

      // Check HEIC
      const heicFiles = files.filter(isHEIC);
      if (heicFiles.length > 0) {
        toast({
          title: 'Format HEIC tidak didukung',
          description: 'Ubah format kamera ke "Most Compatible" di Pengaturan > Kamera > Format, lalu ambil foto ulang.',
          variant: 'destructive',
        });
      }

      const validFiles = files.filter((f) => !isHEIC(f));
      if (validFiles.length === 0) return;

      // Cap to remaining
      const filesToProcess = maxPhotos > 0 ? validFiles.slice(0, remaining) : validFiles;
      if (maxPhotos > 0 && validFiles.length > remaining) {
        toast({
          title: `Maksimal ${maxPhotos} foto`,
          description: `Hanya ${remaining} foto pertama yang ditambahkan.`,
          variant: 'default',
        });
      }

      setProcessing(true);
      setProgress({ current: 0, total: filesToProcess.length });

      const { photos: newPhotos, failures } = await processPhotosSequentially(
        filesToProcess,
        label,
        (current, total) => setProgress({ current, total }),
      );

      if (newPhotos.length > 0) {
        onAdd(newPhotos);
      }

      if (failures > 0 && newPhotos.length === 0) {
        toast({
          title: 'Gagal memproses foto',
          description: `${failures} foto gagal diproses.`,
          variant: 'destructive',
        });
      } else if (failures > 0) {
        toast({
          title: `${failures} foto gagal diproses`,
          description: `${newPhotos.length} foto berhasil ditambahkan.`,
          variant: 'default',
        });
      }

      setProcessing(false);
      setProgress({ current: 0, total: 0 });
    },
    [label, maxPhotos, remaining, onAdd, toast],
  );

  const handleRemove = (id: string) => {
    onRemove(id);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
        <AnimatePresence>
          {photos.map((photo, i) => (
            <PhotoThumb
              key={photo.id}
              photo={photo}
              index={i}
              onOpen={() => setLightboxIndex(i)}
              onRemove={() => handleRemove(photo.id)}
            />
          ))}
        </AnimatePresence>

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={processing}
            className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 transition-colors aspect-square min-h-[150px] disabled:opacity-50"
            aria-label={addCardLabel}
          >
            {processing ? (
              <>
                <Loader2 className="h-7 w-7 text-primary animate-spin" strokeWidth={1.75} />
                <span className="text-xs text-muted-foreground font-medium px-2 text-center">
                  Memproses foto {progress.current} dari {progress.total}…
                </span>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>
                <span className="text-xs font-medium text-foreground/70 px-2 text-center">
                  {addCardLabel}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {processing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full gradient-line rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="font-mono-num whitespace-nowrap">
            {progress.current}/{progress.total}
          </span>
        </div>
      )}

      <Lightbox
        photos={photos}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}

interface PhotoThumbProps {
  photo: PhotoData;
  index: number;
  onOpen: () => void;
  onRemove: () => void;
}

function PhotoThumb({ photo, onOpen, onRemove }: PhotoThumbProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative group rounded-xl overflow-hidden border border-border shadow-soft"
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full aspect-square overflow-hidden bg-muted"
        aria-label="Buka foto"
      >
        <img
          src={photo.dataUrl}
          alt={photo.label}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* Caption band */}
      <div className="px-2 py-1.5 bg-surface border-t border-border">
        <p className="text-[10px] font-medium text-foreground/80 truncate">{photo.label}</p>
        {photo.dateTime && (
          <p className="text-[9px] font-mono-num text-muted-foreground truncate">
            {formatTime(photo.dateTime)}
          </p>
        )}
        {photo.lat != null && photo.lng != null && (
          <p className="text-[9px] font-mono-num text-muted-foreground truncate">
            {formatCoords(photo.lat, photo.lng)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 h-11 w-11 flex items-center justify-center rounded-full bg-black/60 hover:bg-destructive text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Hapus foto"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </motion.div>
  );
}
