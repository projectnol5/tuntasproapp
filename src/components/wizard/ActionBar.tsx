import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ActionBarProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  isLastStep?: boolean;
}

export function ActionBar({
  onBack,
  onNext,
  nextLabel = 'Lanjut',
  backLabel = 'Kembali',
  nextDisabled = false,
  isLastStep = false,
}: ActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border safe-bottom lg:hidden">
      <div className="mx-auto max-w-[680px] flex items-center gap-3 p-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-5 rounded-xl border border-border bg-surface text-foreground font-medium text-sm flex items-center gap-1.5 transition-colors hover:bg-muted/50 active:scale-[0.98] min-w-[88px] justify-center"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            {backLabel}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={cn(
              'h-11 flex-1 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] min-h-[44px]',
              isLastStep
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
              nextDisabled && 'opacity-50 pointer-events-none',
            )}
          >
            {nextLabel}
            {!isLastStep && <ChevronRight className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  );
}

export function DesktopActions({
  onBack,
  onNext,
  nextLabel = 'Lanjut',
  backLabel = 'Kembali',
  nextDisabled = false,
  isLastStep = false,
}: ActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden lg:flex items-center gap-3 mt-6"
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-6 rounded-xl border border-border bg-surface text-foreground font-medium text-sm flex items-center gap-1.5 transition-colors hover:bg-muted/50 active:scale-[0.98]"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          {backLabel}
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'h-11 px-8 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] min-h-[44px]',
            isLastStep
              ? 'bg-success text-success-foreground hover:bg-success/90'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            nextDisabled && 'opacity-50 pointer-events-none',
          )}
        >
          {nextLabel}
          {!isLastStep && <ChevronRight className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      )}
    </motion.div>
  );
}
