import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import type { ReportData } from '../../lib/types';
import { formatIDR, formatDate } from '../../lib/format';
import { cn } from '../../lib/utils';
import type { StepDef } from './Stepper';

interface SidePanelProps {
  report: ReportData;
  steps: StepDef[];
  currentStep: number;
  incompleteItems: { stepIndex: number; label: string }[];
  onJump: (step: number) => void;
}

export function SidePanel({ report, steps, currentStep, incompleteItems, onJump }: SidePanelProps) {
  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const diff = report.receipt.receiptTotal - itemTotal;
  const completedCount = steps.length - incompleteItems.length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="hidden lg:flex flex-col gap-4 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin pr-2">
      {/* Progress card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Progres Laporan</h3>
          <span className="font-mono-num text-xs text-muted-foreground">
            {completedCount}/{steps.length}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <motion.div
            className="h-full gradient-line rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="space-y-1.5">
          {steps.map((step, i) => {
            const isComplete = !incompleteItems.some((item) => item.stepIndex === i);
            const isActive = i === currentStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onJump(i)}
                className={cn(
                  'w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg transition-colors',
                  isActive && 'bg-primary/5',
                  !isActive && 'hover:bg-muted/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono-num flex-shrink-0',
                    isComplete ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className={cn('text-xs', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Incomplete items */}
      {incompleteItems.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />
            <h3 className="text-sm font-semibold text-warning">Belum Lengkap</h3>
          </div>
          <div className="space-y-1">
            {incompleteItems.map((item) => (
              <button
                key={item.stepIndex}
                type="button"
                onClick={() => onJump(item.stepIndex)}
                className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg hover:bg-warning/10 transition-colors"
              >
                <span className="text-xs text-foreground/80">{item.label}</span>
                <span className="text-xs font-semibold text-warning">Buka</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live receipt preview */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold">Pratinjau Struk</h3>
        </div>
        <div className="font-mono-num text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal</span>
            <span className="text-foreground">{report.reportDate ? formatDate(report.reportDate) : '-'}</span>
          </div>
          {report.stores[0] && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">PIC</span>
              <span className="text-foreground truncate ml-2 max-w-[140px]">
                {report.stores[0].picName || '-'}
              </span>
            </div>
          )}
          <div className="border-t border-border my-2" />
          {report.items.filter((it) => it.name).map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-foreground/80 truncate mr-2">
                {item.name} ×{item.qty}
              </span>
              <span className="text-foreground whitespace-nowrap">{formatIDR(item.qty * item.price)}</span>
            </div>
          ))}
          {report.items.filter((it) => it.name).length > 0 && (
            <div className="border-t border-border my-2" />
          )}
          <div className="flex justify-between font-semibold">
            <span className="text-muted-foreground">Total Item</span>
            <span className="text-foreground">{formatIDR(itemTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Struk</span>
            <span className="text-foreground">{formatIDR(report.receipt.receiptTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selisih</span>
            <span className={diff === 0 ? 'text-success' : 'text-warning'}>
              {diff === 0 ? 'COCOK' : formatIDR(Math.abs(diff))}
            </span>
          </div>
        </div>
      </div>

      {/* Photo count summary */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="text-sm font-semibold">Total Foto</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <PhotoCount label="Toko" count={countStorePhotos(report)} />
          <PhotoCount label="Barang" count={report.goodsPhotos.length} />
          <PhotoCount label="Struk" count={report.receipt.photos.length} />
        </div>
      </div>
    </div>
  );
}

function PhotoCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="font-mono-num text-lg font-semibold text-foreground">{count}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function countStorePhotos(report: ReportData): number {
  return report.stores.reduce(
    (sum, s) => sum + (s.picPhoto ? 1 : 0) + (s.storefrontPhoto ? 1 : 0),
    0,
  );
}

export { countStorePhotos };
