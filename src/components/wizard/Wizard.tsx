import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Plus, History, X } from 'lucide-react';
import { useReportStore } from '../../store/report';
import { Stepper, type StepDef } from './Stepper';
import { ActionBar, DesktopActions } from './ActionBar';
import { SidePanel } from './SidePanel';
import { StepActivity } from './StepActivity';
import { StepStore } from './StepStore';
import { StepPurchase } from './StepPurchase';
import { StepReceipt } from './StepReceipt';
import { StepHandover } from './StepHandover';
import { StepSummary } from './StepSummary';

const ALL_STEPS: StepDef[] = [
  { id: 'activity', label: 'Data Aktivitas', shortLabel: 'Aktivitas' },
  { id: 'store', label: 'Data Toko', shortLabel: 'Toko' },
  { id: 'purchase', label: 'Pembelian', shortLabel: 'Beli' },
  { id: 'receipt', label: 'Struk', shortLabel: 'Struk' },
  { id: 'summary', label: 'Ringkasan', shortLabel: 'Rangkum' },
];

const IURAN_STEPS: StepDef[] = [
  { id: 'activity', label: 'Data Aktivitas', shortLabel: 'Aktivitas' },
  { id: 'handover', label: 'Serah Terima', shortLabel: 'Serah' },
  { id: 'summary', label: 'Ringkasan', shortLabel: 'Rangkum' },
];

interface WizardProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Wizard({ darkMode, onToggleDark }: WizardProps) {
  const {
    report,
    currentStep,
    setStep,
    nextStep,
    prevStep,
    loadDraft,
    startFresh,
  } = useReportStore();

  const hasDraft = useReportStore((s) => s.hasDraft);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hasDraft) {
      setShowDraftPrompt(true);
    }
  }, [hasDraft]);

  const isIuran = report.activityType === 'iuran';
  const steps = isIuran ? IURAN_STEPS : ALL_STEPS;

  const validateStep = useCallback(
    (step: number): Record<string, string> => {
      const errs: Record<string, string> = {};
      const stepId = steps[step]?.id;

      if (stepId === 'activity') {
        if (!report.activityType) errs.activityType = 'Pilih jenis aktivitas terlebih dahulu';
        if (report.activityType === 'meeting' && !report.meetingSubType) {
          errs.meetingSubType = 'Pilih jenis meeting';
        }
        if (!report.reportDate) errs.reportDate = 'Tanggal wajib diisi';
      }

      if (stepId === 'store') {
        report.stores.forEach((store) => {
          if (!store.picName) errs[`store-${store.id}-picName`] = 'Nama PIC wajib diisi';
          if (!store.storeName) errs[`store-${store.id}-storeName`] = 'Nama toko wajib diisi';
        });
      }

      if (stepId === 'purchase') {
        report.items.forEach((item) => {
          if (!item.name) errs[`item-${item.id}-name`] = 'Nama barang wajib diisi';
        });
      }

      if (stepId === 'receipt') {
        if (report.receipt.photos.length === 0) errs.receiptPhotos = 'Minimal 1 foto struk';
        if (!report.receipt.branchCode) errs.branchCode = 'Kode BA wajib diisi';
        if (!report.receipt.branchName) errs.branchName = 'Nama cabang wajib diisi';
        if (!report.receipt.receiptNumber) errs.receiptNumber = 'Nomor struk wajib diisi';
        if (report.receipt.receiptTotal <= 0) errs.receiptTotal = 'Total struk wajib diisi';
      }

      if (stepId === 'handover') {
        if (report.activityType !== 'iuran' && !report.handover.picName) {
          errs.handoverPicName = 'Nama PIC wajib diisi';
        }
        if (report.handover.amount <= 0) errs.handoverAmount = 'Jumlah uang wajib diisi';
        if (!report.handover.recipient) errs.handoverRecipient = 'Nama penerima wajib diisi';
      }

      return errs;
    },
    [report, steps],
  );

  const incompleteItems = useMemo(() => {
    const items: { stepIndex: number; label: string }[] = [];
    steps.forEach((step, i) => {
      const stepErrs = validateStep(i);
      if (Object.keys(stepErrs).length > 0) {
        items.push({ stepIndex: i, label: step.label });
      }
    });
    return items;
  }, [steps, validateStep]);

  const handleNext = () => {
    const stepErrs = validateStep(currentStep);
    if (Object.keys(stepErrs).length > 0) {
      setErrors(stepErrs);
      const firstKey = Object.keys(stepErrs)[0];
      if (firstKey) {
        const el = document.querySelector(`[data-error-key="${firstKey}"]`) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setErrors({});
    if (currentStep < steps.length - 1) {
      nextStep();
    }
  };

  const handleBack = () => {
    setErrors({});
    prevStep();
  };

  const handleJump = (step: number) => {
    setErrors({});
    setStep(step);
  };

  const stepId = steps[currentStep]?.id;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border safe-top">
        <div className="mx-auto max-w-[1200px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                <path
                  d="M9 16.5l4.5 4.5L23 11.5"
                  stroke="hsl(var(--primary-foreground))"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground leading-none">
                Tuntas Pro
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono-num uppercase tracking-wide mt-0.5">
                Laporan Aktivitas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDark}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors"
            aria-label={darkMode ? 'Mode terang' : 'Mode gelap'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            ) : (
              <Moon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            )}
          </button>
        </div>
        {/* Stepper */}
        <div className="mx-auto max-w-[680px] px-4 pb-2 lg:max-w-[1200px]">
          <Stepper steps={steps} currentStep={currentStep} onStepClick={handleJump} />
        </div>
      </header>

      {/* Draft prompt */}
      <AnimatePresence>
        {showDraftPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="rounded-2xl border border-primary/30 bg-card p-4 shadow-layered">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <History className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Lanjutkan laporan sebelumnya?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ada draf yang tersimpan dari sesi sebelumnya.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        loadDraft();
                        setShowDraftPrompt(false);
                      }}
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Lanjutkan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        startFresh();
                        setShowDraftPrompt(false);
                      }}
                      className="h-9 px-4 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted/40 transition-colors"
                    >
                      Mulai Baru
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDraftPrompt(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] px-4 py-6 pb-32 lg:pb-12">
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
          {/* Form column */}
          <div className="mx-auto w-full max-w-[680px] lg:max-w-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepId}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                {stepId === 'activity' && <StepActivity errors={errors} />}
                {stepId === 'store' && <StepStore errors={errors} />}
                {stepId === 'purchase' && <StepPurchase errors={errors} />}
                {stepId === 'receipt' && <StepReceipt errors={errors} />}
                {stepId === 'handover' && <StepHandover errors={errors} />}
                {stepId === 'summary' && (
                  <StepSummary incompleteItems={incompleteItems} onJump={handleJump} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Desktop navigation buttons */}
            {stepId !== 'summary' && (
              <DesktopActions
                onBack={currentStep > 0 ? handleBack : undefined}
                onNext={handleNext}
                nextDisabled={false}
              />
            )}
          </div>

          {/* Side panel (desktop) */}
          <div className="hidden lg:block">
            <SidePanel
              report={report}
              steps={steps}
              currentStep={currentStep}
              incompleteItems={incompleteItems}
              onJump={handleJump}
            />
          </div>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      {stepId !== 'summary' && (
        <ActionBar
          onBack={currentStep > 0 ? handleBack : undefined}
          onNext={handleNext}
          nextLabel={isLastStep ? 'Selesai' : 'Lanjut'}
          isLastStep={isLastStep}
        />
      )}

    </div>
  );
}


