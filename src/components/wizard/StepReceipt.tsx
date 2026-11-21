import { Receipt, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReportStore } from '../../store/report';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PhotoUploader } from '../photo/PhotoUploader';
import { formatIDR, formatIDRInput, parseIDRInput } from '../../lib/format';
import { cn } from '../../lib/utils';

interface StepReceiptProps {
  errors: Record<string, string>;
}

export function StepReceipt({ errors }: StepReceiptProps) {
  const {
    report,
    addReceiptPhotos,
    removeReceiptPhoto,
    setReceiptTotal,
    setBranchCode,
    setBranchName,
  } = useReportStore();

  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const diff = report.receipt.receiptTotal - itemTotal;
  const isMatch = diff === 0 && report.receipt.receiptTotal > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading text-foreground">Struk Belanja</h2>
        <p className="text-sm text-muted-foreground mt-1">Foto struk & isi nomor serta total</p>
      </div>

      {/* Receipt photos */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <h3 className="font-semibold text-sm">Foto Struk</h3>
          </div>
          <span className="font-mono-num text-xs text-muted-foreground">
            {report.receipt.photos.length} foto
          </span>
        </div>
        <PhotoUploader
          photos={report.receipt.photos}
          label="Foto Struk"
          maxPhotos={0}
          multiple
          onAdd={addReceiptPhotos}
          onRemove={removeReceiptPhoto}
          addCardLabel="Tambah foto struk"
        />
      </div>

      {/* Branch code & name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="branch-code" className="text-sm font-medium">
            Kode Branch Area (BA)
          </Label>
          <Input
            id="branch-code"
            type="text"
            placeholder="Contoh: JKT"
            value={report.receipt.branchCode}
            onChange={(e) => setBranchCode(e.target.value)}
            className="min-h-[44px] text-base font-mono-num"
          />
          {errors.branchCode && (
            <p className="text-xs text-destructive" role="alert">{errors.branchCode}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="branch-name" className="text-sm font-medium">
            Nama Cabang
          </Label>
          <Input
            id="branch-name"
            type="text"
            placeholder="Contoh: Jakarta Pusat"
            value={report.receipt.branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="min-h-[44px] text-base"
          />
          {errors.branchName && (
            <p className="text-xs text-destructive" role="alert">{errors.branchName}</p>
          )}
        </div>
      </div>

      {/* Auto-generated receipt number */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Nomor Struk</Label>
        <div className={cn(
          'min-h-[44px] rounded-xl border px-3 flex items-center text-base font-mono-num',
          report.receipt.receiptNumber
            ? 'border-border bg-muted/40 text-foreground'
            : 'border-dashed border-border bg-muted/20 text-muted-foreground',
        )}>
          {report.receipt.receiptNumber || 'Otomatis setelah BA & Cabang terisi'}
        </div>
        {errors.receiptNumber && (
          <p className="text-xs text-destructive" role="alert">{errors.receiptNumber}</p>
        )}
      </div>

      {/* Receipt total */}
      <div className="space-y-1.5">
        <Label htmlFor="receipt-total" className="text-sm font-medium">
          Total Struk
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-mono-num">
            Rp
          </span>
          <Input
            id="receipt-total"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatIDRInput(report.receipt.receiptTotal)}
            onChange={(e) => setReceiptTotal(parseIDRInput(e.target.value))}
            className="min-h-[48px] text-base font-mono-num pl-10 text-lg"
          />
        </div>
        {errors.receiptTotal && (
          <p className="text-xs text-destructive" role="alert">{errors.receiptTotal}</p>
        )}
      </div>

      {/* Comparison */}
      {itemTotal > 0 || report.receipt.receiptTotal > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 space-y-2 ${
            isMatch
              ? 'border-success/30 bg-success/5'
              : 'border-warning/30 bg-warning/5'
          }`}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total dari rincian barang</span>
            <span className="font-mono-num font-semibold text-foreground">
              {formatIDR(itemTotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total dari struk</span>
            <span className="font-mono-num font-semibold text-foreground">
              {formatIDR(report.receipt.receiptTotal)}
            </span>
          </div>
          <div className="border-t border-border/50 pt-2 flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-1.5">
              {isMatch ? (
                <>
                  <Check className="h-4 w-4 text-success" strokeWidth={2} />
                  <span className="text-success">Cocok</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
                  <span className="text-warning">Selisih</span>
                </>
              )}
            </span>
            <span
              className={`font-mono-num font-bold text-lg ${
                isMatch ? 'text-success' : 'text-warning'
              }`}
            >
              {isMatch ? 'Rp 0' : formatIDR(Math.abs(diff))}
            </span>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
