import { motion } from 'framer-motion';
import {
  Check,
  AlertTriangle,
  Download,
  RotateCcw,
  ChevronRight,
  PartyPopper,
  ClipboardList,
  Eye,
  Store,
  Receipt,
  Camera,
  Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { useReportStore } from '../../store/report';
import {
  formatIDR,
  formatDate,
  formatDateTime,
  generateReportCode,
} from '../../lib/format';
import type { ReportData } from '../../lib/types';
import { cn } from '../../lib/utils';
import { ReportCard } from '../receipt/ReportCard';

const ACTIVITY_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  iuran: 'Iuran/Koordinasi',
  repair: 'Repair/Maintenance',
};

const MEETING_SUB_LABELS: Record<string, string> = {
  rutin: 'Rapat Rutin',
  koordinasi: 'Koordinasi',
  evaluasi: 'Evaluasi',
  tamu: 'Tamu',
  lainnya: 'Lainnya',
};

interface StepSummaryProps {
  incompleteItems: { stepIndex: number; label: string }[];
  onJump: (step: number) => void;
}

export function StepSummary({ incompleteItems, onJump }: StepSummaryProps) {
  const { report, submitReport, resetReport } = useReportStore();
  const [submitted, setSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (submitted) {
    return <SuccessScreen report={report} onReset={resetReport} />;
  }

  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const diff = report.receipt.receiptTotal - itemTotal;
  const isMatch = diff === 0;
  const code = report.reportCode || generateReportCode(report.reportDate);

  const activityLabel = (() => {
    if (!report.activityType) return '-';
    const base = ACTIVITY_LABELS[report.activityType] || '-';
    if (report.activityType === 'meeting' && report.meetingSubType) {
      const sub = report.meetingSubType === 'lainnya'
        ? (report.meetingSubTypeOther || 'Lainnya')
        : MEETING_SUB_LABELS[report.meetingSubType] || '';
      return sub ? `${base} — ${sub}` : base;
    }
    return base;
  })();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { exportPDF } = await import('../../lib/pdf');
      await exportPDF(report);
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = () => {
    submitReport();
    setSubmitted(true);
  };

  const photoCount = report.stores.reduce(
    (sum, s) => sum + (s.picPhoto ? 1 : 0) + (s.storefrontPhoto ? 1 : 0),
    0,
  ) + report.goodsPhotos.length + report.receipt.photos.length
    + (report.handover.picPhoto ? 1 : 0) + (report.handover.moneyPhoto ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading text-foreground">Ringkasan</h2>
        <p className="text-sm text-muted-foreground mt-1">Periksa laporan sebelum mengirim</p>
      </div>

      {/* Incomplete items */}
      {incompleteItems.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-warning">Belum Lengkap</h3>
          </div>
          <div className="space-y-1.5">
            {incompleteItems.map((item) => (
              <button
                key={item.stepIndex}
                type="button"
                onClick={() => onJump(item.stepIndex)}
                className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg bg-warning/10 hover:bg-warning/15 transition-colors min-h-[44px]"
              >
                <span className="text-sm text-foreground/80">{item.label}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-warning">
                  Buka
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paper receipt style summary */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground tracking-tight">Tuntas Pro</h3>
          <p className="font-mono-num text-xs text-muted-foreground">Kode: {code}</p>
          <div className="h-px gradient-line my-3 mx-8" />
        </div>

        <div className="font-mono-num text-xs space-y-1.5">
          <ReceiptRow label="Tanggal" value={formatDate(report.reportDate)} />
          <ReceiptRow label="Aktivitas" value={activityLabel} />
          {report.receipt.branchCode && (
            <ReceiptRow label="BA" value={report.receipt.branchCode} />
          )}
          {report.receipt.branchName && (
            <ReceiptRow label="Cabang" value={report.receipt.branchName} />
          )}
          {report.receipt.receiptNumber && (
            <ReceiptRow label="No. Struk" value={report.receipt.receiptNumber} />
          )}
          {report.stores.map((store, i) => (
            <div key={store.id}>
              {report.stores.length > 1 && (
                <p className="text-muted-foreground font-semibold mt-2">Toko {i + 1}</p>
              )}
              <ReceiptRow label="PIC" value={store.picName || '-'} />
              <ReceiptRow label="Toko" value={store.storeName || '-'} />
              {store.address && <ReceiptRow label="Alamat" value={store.address} />}
            </div>
          ))}

          {report.activityType === 'iuran' && (
            <>
              <div className="border-t border-dashed border-border my-2" />
              <ReceiptRow label="PIC" value={report.handover.picName || '-'} />
              <ReceiptRow label="Jumlah" value={formatIDR(report.handover.amount)} />
              <ReceiptRow label="Penerima" value={report.handover.recipient || '-'} />
              {report.handover.title && (
                <ReceiptRow label="Keterangan" value={report.handover.title} />
              )}
            </>
          )}

          {/* Items */}
          {report.items.filter((it) => it.name).length > 0 && (
            <>
              <div className="border-t border-dashed border-border my-2" />
              {report.items
                .filter((it) => it.name)
                .map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-foreground/80 truncate mr-2">
                        {item.name} ×{item.qty}
                      </span>
                      <span className="text-foreground whitespace-nowrap">
                        {formatIDR(item.qty * item.price)}
                      </span>
                    </div>
                    {item.price > 0 && (
                      <p className="text-muted-foreground text-[10px] pl-2">
                        @ {formatIDR(item.price)}
                      </p>
                    )}
                  </div>
                ))}
            </>
          )}

          {/* Totals */}
          <div className="border-t border-dashed border-border my-2" />
          <ReceiptRow label="Total Item" value={formatIDR(itemTotal)} bold />
          <ReceiptRow label="Total Struk" value={formatIDR(report.receipt.receiptTotal)} />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selisih</span>
            <span className={isMatch ? 'text-success font-semibold' : 'text-warning font-semibold'}>
              {isMatch ? 'COCOK' : formatIDR(Math.abs(diff))}
            </span>
          </div>

          {/* Photo summary */}
          <div className="border-t border-dashed border-border my-2" />
          <ReceiptRow label="Total Foto" value={String(photoCount)} />
        </div>

        <div className="text-center mt-4 pt-3 border-t border-dashed border-border">
          <p className="font-mono-num text-[10px] text-muted-foreground">
            Dibuat: {formatDateTime(report.createdAt)}
          </p>
          <p className="font-mono-num text-[10px] text-muted-foreground">
            Diperbarui: {formatDateTime(report.updatedAt)}
          </p>
        </div>
      </div>

      {/* Preview card */}
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="w-full rounded-2xl border border-border bg-card p-4 shadow-soft flex items-center gap-4 transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
      >
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Eye className="h-5 w-5 text-primary" strokeWidth={1.75} />
        </div>
        <div className="text-left flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Preview Laporan</p>
          <p className="text-xs text-muted-foreground">Lihat pratinjau laporan lengkap</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
      </button>

      {/* Download PDF */}
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 transition-all hover:bg-primary/90 active:scale-[0.98] shadow-soft disabled:opacity-50"
      >
        <Download className="h-5 w-5" strokeWidth={1.75} />
        {downloading ? 'Memproses…' : 'Download PDF'}
      </button>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={incompleteItems.length > 0}
        className={cn(
          'w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
          incompleteItems.length > 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-success text-success-foreground hover:bg-success/90 shadow-soft',
        )}
      >
        <Check className="h-5 w-5" strokeWidth={1.75} />
        {incompleteItems.length > 0
          ? `Lengkapi ${incompleteItems.length} item lagi`
          : 'Simpan Laporan'}
      </button>

      {/* Preview overlay */}
      {showPreview && (
        <PreviewOverlay report={report} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span
        className={cn(
          'text-right truncate',
          bold ? 'font-bold text-foreground' : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PreviewOverlay({
  report,
  onClose,
}: {
  report: ReportData;
  onClose: () => void;
}) {
  const code = report.reportCode || generateReportCode(report.reportDate);
  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const diff = report.receipt.receiptTotal - itemTotal;
  const isMatch = diff === 0;

  const storePhotoCount = report.stores.reduce(
    (sum, s) => sum + (s.picPhoto ? 1 : 0) + (s.storefrontPhoto ? 1 : 0),
    0,
  );
  const totalPhotos = storePhotoCount + report.goodsPhotos.length
    + report.receipt.photos.length + (report.handover.picPhoto ? 1 : 0)
    + (report.handover.moneyPhoto ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background w-full max-w-2xl rounded-2xl shadow-xl my-8"
      >
        {/* Header bar */}
        <div className="sticky top-0 bg-background border-b border-border px-5 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-bold text-base text-foreground">Preview Laporan</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40"
            aria-label="Tutup"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto">
          {/* Report header */}
          <div className="text-center pb-3 border-b border-border">
            <h4 className="text-lg font-bold text-foreground">Tuntas Pro</h4>
            <p className="font-mono-num text-xs text-muted-foreground">Kode: {code}</p>
          </div>

          {/* Info sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PreviewSection icon={<Calendar />} title="Tanggal" value={formatDate(report.reportDate)} />
            <PreviewSection icon={<ClipboardList className="h-4 w-4" />} title="Aktivitas" value={ACTIVITY_LABELS[report.activityType || ''] || '-'} />
            {report.receipt.branchCode && (
              <PreviewSection icon={<Store className="h-4 w-4" />} title="BA" value={report.receipt.branchCode} />
            )}
            {report.receipt.branchName && (
              <PreviewSection icon={<Store className="h-4 w-4" />} title="Cabang" value={report.receipt.branchName} />
            )}
            {report.receipt.receiptNumber && (
              <PreviewSection icon={<Receipt className="h-4 w-4" />} title="No. Struk" value={report.receipt.receiptNumber} />
            )}
            <PreviewSection icon={<Camera className="h-4 w-4" />} title="Total Foto" value={String(totalPhotos)} />
          </div>

          {/* Stores */}
          {report.stores.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Toko</p>
              {report.stores.map((store, i) => (
                <div key={store.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  {report.stores.length > 1 && <p className="font-semibold text-xs text-primary mb-1">Toko {i + 1}</p>}
                  <p><span className="text-muted-foreground">PIC: </span>{store.picName || '-'}</p>
                  <p><span className="text-muted-foreground">Toko: </span>{store.storeName || '-'}</p>
                  {store.address && <p className="text-xs text-muted-foreground mt-0.5">{store.address}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Items */}
          {report.items.filter((it) => it.name).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rincian Pembelian</p>
              <div className="rounded-lg border border-border overflow-hidden">
                {report.items.filter((it) => it.name).map((item, i) => (
                  <div
                    key={item.id}
                    className={cn('flex items-center justify-between px-3 py-2 text-sm', i > 0 && 'border-t border-border')}
                  >
                    <span className="text-foreground/80">{item.name} ×{item.qty}</span>
                    <span className="font-mono-num text-foreground">{formatIDR(item.qty * item.price)}</span>
                  </div>
                ))}
                <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
                  <span className="font-semibold text-sm">Total Item</span>
                  <span className="font-mono-num font-bold text-sm">{formatIDR(itemTotal)}</span>
                </div>
                <div className="border-t border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Struk</span>
                  <span className="font-mono-num text-sm">{formatIDR(report.receipt.receiptTotal)}</span>
                </div>
                <div className="border-t border-border px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selisih</span>
                  <span className={cn('font-mono-num font-bold text-sm', isMatch ? 'text-success' : 'text-warning')}>
                    {isMatch ? 'COCOK' : formatIDR(Math.abs(diff))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Photo thumbnails */}
          {totalPhotos > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Foto ({totalPhotos})</p>
              <div className="grid grid-cols-3 gap-2">
                {report.stores.filter(s => s.picPhoto?.dataUrl).map((s, i) => (
                  <PreviewThumb key={`pic-${i}`} dataUrl={s.picPhoto!.dataUrl} label="PIC" />
                ))}
                {report.stores.filter(s => s.storefrontPhoto?.dataUrl).map((s, i) => (
                  <PreviewThumb key={`store-${i}`} dataUrl={s.storefrontPhoto!.dataUrl} label="Toko" />
                ))}
                {report.goodsPhotos.map((p, i) => (
                  <PreviewThumb key={`goods-${i}`} dataUrl={p.dataUrl} label={p.label} />
                ))}
                {report.receipt.photos.map((p, i) => (
                  <PreviewThumb key={`receipt-${i}`} dataUrl={p.dataUrl} label="Struk" />
                ))}
                {report.handover.picPhoto?.dataUrl && (
                  <PreviewThumb dataUrl={report.handover.picPhoto.dataUrl} label="PIC Penyerah" />
                )}
                {report.handover.moneyPhoto?.dataUrl && (
                  <PreviewThumb dataUrl={report.handover.moneyPhoto.dataUrl} label="Serah Terima" />
                )}
              </div>
              {totalPhotos > 6 && (
                <p className="text-xs text-muted-foreground text-center">
                  Menampilkan {Math.min(6, totalPhotos)} dari {totalPhotos} foto — semua foto tersedia di PDF
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function PreviewSection({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

function PreviewThumb({ dataUrl, label }: { dataUrl: string; label: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="aspect-square bg-muted">
        <img src={dataUrl} alt={label} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <p className="text-[10px] text-center py-1 bg-surface text-foreground/80 truncate">{label}</p>
    </div>
  );
}

function SuccessScreen({
  report,
  onReset,
}: {
  report: ReportData;
  onReset: () => void;
}) {
  const { submittedReports, deleteSubmittedReport } = useReportStore();
  const [downloading, setDownloading] = useState(false);
  const code = report.reportCode || generateReportCode(report.reportDate);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const { exportPDF } = await import('../../lib/pdf');
      await exportPDF(report);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Success header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 pt-6">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 15 }}
            className="h-14 w-14 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="h-8 w-8 text-success-foreground" strokeWidth={2.5} />
          </motion.div>
        </motion.div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="text-heading text-foreground">Laporan Tersimpan!</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Laporan Anda berhasil disimpan dengan kode berikut:
          </p>
          <p className="font-mono-num text-lg font-bold text-primary tracking-wide">{code}</p>
          <p className="font-mono-num text-xs text-muted-foreground">
            {formatDateTime(report.submittedAt || new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Download PDF */}
      <button
        type="button"
        onClick={handleDownloadPDF}
        disabled={downloading}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
      >
        <Download className="h-4 w-4" strokeWidth={1.75} />
        {downloading ? 'Memproses…' : 'Download PDF'}
      </button>

      {/* New report button */}
      <button
        type="button"
        onClick={onReset}
        className="w-full h-12 rounded-xl border border-border bg-card text-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-muted/40 active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
        Buat Laporan Baru
      </button>

      {/* Submitted reports list */}
      {submittedReports.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h3 className="font-bold text-base text-foreground">
              Laporan Tersimpan
            </h3>
            <span className="font-mono-num text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
              {submittedReports.length}
            </span>
          </div>

          <div className="space-y-3">
            {submittedReports.map((r) => (
              <ReportCard
                key={r.reportCode}
                report={r}
                onDelete={deleteSubmittedReport}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
