import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StepDef {
  id: string;
  label: string;
  shortLabel: string;
}

interface StepperProps {
  steps: StepDef[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          const isClickable = onStepClick && i <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(i)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
                  isClickable && 'hover:bg-muted/60',
                )}
                aria-label={`Langkah ${i + 1}: ${step.label}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-mono-num font-semibold transition-all',
                    isComplete && 'bg-success text-success-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                    !isComplete && !isActive && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isComplete ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    </motion.span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap hidden sm:inline',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.shortLabel}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className="w-3 h-px bg-border mx-0.5 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      {/* Active step label */}
      <div className="mt-1 px-2">
        <p className="text-sm font-semibold text-foreground">
          {steps[currentStep]?.label}
        </p>
      </div>
    </div>
  );
}
