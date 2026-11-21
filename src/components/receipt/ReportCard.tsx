import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileSpreadsheet,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  HandCoins,
  MapPin,
} from 'lucide-react';
import type { ReportData, PhotoData } from '../../lib/types';
import {
  formatIDR,
  formatDate,
  formatDateTime,
  formatTime,
  formatCoords,
} from '../../lib/format';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';
import { Lightbox } from '../photo/Lightbox';

const ACTIVITY_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  iuran: 'Iuran/Koordinasi',
  repair: 'Repair/Maintenance',
};

interface ReportCardProps {
  report: ReportData;
  onDelete: (code: string) => void;
}

export function ReportCard({ report, onDelete }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<{ photos: PhotoData[]; index: number } | null>(null);
  const { toast } = useToast();

  const code = report.reportCode || 'N/A';
  const isIuran = report.activityType === 'iuran';
  const activityLabel = ACTIVITY_LABELS[report.activityType || ''] || '-';

  const allPhotos = collectAllPhotos(report);

  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    try {
      const { exportPDF } = await import('../../lib/pdf');
      await exportPDF(report);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading('excel');
    try {
      const { exportExcel } = await import('../../lib/excel');
      await exportExcel(report);
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = () => {
    onDelete(code);
    toast({
      title: 'Laporan dihapus',
      description: `Kode: ${code}`,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
    >
      {/* Card header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0',
              isIuran ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success',
            )}
          >
            {isIuran ? (
              <HandCoins className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Camera className="h-5 w-5" strokeWidth={1.75} />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{activityLabel}</p>
            <p className="font-mono-num text-xs text-muted-foreground">{code}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(report.reportDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading !== null}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted/40 transition-colors disabled:opacity-50"
            aria-label="Download PDF"
            title="Download PDF"
          >
            <Download className="h-4 w-4 text-foreground" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloading !== null}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-border hover:bg-muted/40 transition-colors disabled:opacity-50"
            aria-label="Download Excel"
            title="Download Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-foreground" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Hapus laporan"
            title="Hapus laporan"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Quick info */}
      <div className="px-4 pb-3 font-mono-num text-xs space-y-1">
        {isIuran ? (
          <>
            <InfoRow label="PIC" value={report.handover.picName || '-'} />
            <InfoRow label="Jumlah" value={formatIDR(report.handover.amount)} />
            <InfoRow label="Penerima" value={report.handover.recipient || '-'} />
          </>
        ) : (
          <>
            {report.stores[0] && <InfoRow label="PIC" value={report.stores[0].picName || '-'} />}
            {report.stores[0] && <InfoRow label="Toko" value={report.stores[0].storeName || '-'} />}
            <InfoRow
              label="Total"
              value={formatIDR(report.items.reduce((s, it) => s + it.qty * it.price, 0))}
            />
          </>
        )}
        <InfoRow label="Foto" value={`${allPhotos.length} foto`} />
      </div>

      {/* Photo preview thumbnails (always visible) */}
      {allPhotos.length > 0 && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
            {allPhotos.slice(0, expanded ? undefined : 6).map((photo, i) => (
              <button
                key={photo.id + i}
                type="button"
                onClick={() => setLightboxPhotos({ photos: allPhotos, index: i })}
                className="aspect-square rounded-lg overflow-hidden border border-border bg-muted hover:ring-2 hover:ring-primary/40 transition-all"
                aria-label={`Foto ${i + 1}: ${photo.label}`}
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {!expanded && allPhotos.length > 6 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="aspect-square rounded-lg border border-border bg-muted/40 flex flex-col items-center justify-center gap-0.5 hover:bg-muted/60 transition-colors"
              >
                <span className="font-mono-num text-sm font-bold text-foreground">
                  +{allPhotos.length - 6}
                </span>
                <span className="text-[9px] text-muted-foreground">foto</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expand toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1 py-2.5 border-t border-border text-xs text-muted-foreground hover:bg-muted/30 transition-colors min-h-[40px]"
      >
        {expanded ? (
          <>
            Tutup detail
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
          </>
        ) : (
          <>
            Lihat detail
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
          </>
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border space-y-3">
              {/* Photo grid with captions */}
              {allPhotos.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                  {allPhotos.map((photo, i) => (
                    <PhotoWithCaption
                      key={photo.id + i}
                      photo={photo}
                      onOpen={() => setLightboxPhotos({ photos: allPhotos, index: i })}
                    />
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="font-mono-num text-[10px] text-muted-foreground space-y-0.5 pt-2 border-t border-border/50">
                <p>Dikirim: {formatDateTime(report.submittedAt || report.updatedAt)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <Lightbox
        photos={lightboxPhotos?.photos || []}
        index={lightboxPhotos?.index || 0}
        open={lightboxPhotos !== null}
        onClose={() => setLightboxPhotos(null)}
        onNavigate={(idx) => setLightboxPhotos((prev) => (prev ? { ...prev, index: idx } : null))}
      />
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right truncate">{value}</span>
    </div>
  );
}

function PhotoWithCaption({
  photo,
  onOpen,
}: {
  photo: PhotoData;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-soft">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full aspect-square overflow-hidden bg-muted"
        aria-label={`Buka foto: ${photo.label}`}
      >
        <img
          src={photo.dataUrl}
          alt={photo.label}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>
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
    </div>
  );
}

function collectAllPhotos(report: ReportData): PhotoData[] {
  const photos: PhotoData[] = [];
  if (report.activityType !== 'iuran') {
    for (const store of report.stores) {
      if (store.picPhoto?.dataUrl) photos.push({ ...store.picPhoto, label: 'PIC' });
      if (store.storefrontPhoto?.dataUrl) photos.push({ ...store.storefrontPhoto, label: 'Toko' });
    }
  }
  for (const photo of report.goodsPhotos) {
    if (photo.dataUrl) photos.push(photo);
  }
  for (const photo of report.receipt.photos) {
    if (photo.dataUrl) photos.push(photo);
  }
  if (report.activityType !== 'iuran' && report.handover.picPhoto?.dataUrl) {
    photos.push({ ...report.handover.picPhoto, label: 'PIC Penyerah' });
  }
  if (report.handover.moneyPhoto?.dataUrl) {
    photos.push({ ...report.handover.moneyPhoto, label: 'Serah Terima Uang' });
  }
  return photos;
}
