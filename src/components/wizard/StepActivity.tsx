import { motion } from 'framer-motion';
import { Users, HandCoins, Wrench, ChevronRight } from 'lucide-react';
import type { ActivityType, MeetingSubType } from '../../lib/types';
import { useReportStore } from '../../store/report';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const ACTIVITY_CARDS: {
  type: ActivityType;
  label: string;
  desc: string;
  icon: typeof Users;
}[] = [
  { type: 'meeting', label: 'Meeting', desc: 'Rapat, koordinasi, evaluasi', icon: Users },
  { type: 'iuran', label: 'Iuran/Koordinasi', desc: 'Serah terima uang', icon: HandCoins },
  { type: 'repair', label: 'Repair/Maintenance', desc: 'Perbaikan & pemeliharaan', icon: Wrench },
];

const MEETING_SUBTYPES: { value: MeetingSubType; label: string }[] = [
  { value: 'rutin', label: 'Rapat Rutin' },
  { value: 'koordinasi', label: 'Koordinasi' },
  { value: 'evaluasi', label: 'Evaluasi' },
  { value: 'tamu', label: 'Tamu' },
  { value: 'lainnya', label: 'Lainnya' },
];

interface StepActivityProps {
  errors: Record<string, string>;
}

export function StepActivity({ errors }: StepActivityProps) {
  const {
    report,
    setActivityType,
    setMeetingSubType,
    setMeetingSubTypeOther,
    setReportDate,
    setCreatedBy,
    setApprovedBy,
  } = useReportStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading text-foreground">Data Aktivitas</h2>
        <p className="text-sm text-muted-foreground mt-1">Pilih jenis aktivitas yang dilaporkan</p>
      </div>

      {/* Activity type cards */}
      <div className="space-y-3">
        {ACTIVITY_CARDS.map((card) => {
          const isActive = report.activityType === card.type;
          const Icon = card.icon;
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => setActivityType(card.type)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.99]',
                isActive
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-border bg-card hover:border-primary/30',
              )}
              aria-pressed={isActive}
            >
              <div
                className={cn(
                  'h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="h-7 w-7" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold text-base', isActive ? 'text-primary' : 'text-foreground')}>
                  {card.label}
                </p>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </div>
              <ChevronRight
                className={cn('h-5 w-5 flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground/40')}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      {errors.activityType && (
        <p className="text-sm text-destructive" role="alert">{errors.activityType}</p>
      )}

      {/* Follow-up for meeting */}
      {report.activityType === 'meeting' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <Label className="text-sm font-semibold">Jenis Meeting</Label>
          <div className="flex flex-wrap gap-2">
            {MEETING_SUBTYPES.map((sub) => {
              const isActive = report.meetingSubType === sub.value;
              return (
                <button
                  key={sub.value}
                  type="button"
                  onClick={() => setMeetingSubType(sub.value)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px] active:scale-[0.98]',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/30',
                  )}
                  aria-pressed={isActive}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
          {report.meetingSubType === 'lainnya' && (
            <Input
              type="text"
              placeholder="Tulis jenis meeting lainnya…"
              value={report.meetingSubTypeOther || ''}
              onChange={(e) => setMeetingSubTypeOther(e.target.value)}
              className="min-h-[44px] text-base"
              aria-label="Jenis meeting lainnya"
            />
          )}
        </motion.div>
      )}

      {/* Report date */}
      <div className="space-y-2">
        <Label htmlFor="report-date" className="text-sm font-semibold">
          Tanggal Laporan
        </Label>
        <Input
          id="report-date"
          type="date"
          value={report.reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="min-h-[44px] text-base font-mono-num"
        />
        {errors.reportDate && (
          <p className="text-sm text-destructive" role="alert">{errors.reportDate}</p>
        )}
      </div>

      {/* Dibuat oleh & Disetujui oleh */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-soft">
        <div>
          <p className="text-sm font-semibold text-foreground">Dibuat Oleh</p>
          <p className="text-xs text-muted-foreground mt-0.5">Identitas penyusun laporan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="created-name" className="text-sm">Nama</Label>
            <Input
              id="created-name"
              type="text"
              placeholder="Nama lengkap"
              value={report.createdBy.name}
              onChange={(e) => setCreatedBy({ name: e.target.value })}
              className="min-h-[44px] text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="created-position" className="text-sm">Jabatan</Label>
            <Input
              id="created-position"
              type="text"
              placeholder="Jabatan"
              value={report.createdBy.position}
              onChange={(e) => setCreatedBy({ position: e.target.value })}
              className="min-h-[44px] text-base"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-4 shadow-soft">
        <div>
          <p className="text-sm font-semibold text-foreground">Disetujui Oleh</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pemberi persetujuan laporan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="approved-name" className="text-sm">Nama</Label>
            <Input
              id="approved-name"
              type="text"
              placeholder="Nama lengkap"
              value={report.approvedBy.name}
              onChange={(e) => setApprovedBy({ name: e.target.value })}
              className="min-h-[44px] text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="approved-position" className="text-sm">Jabatan</Label>
            <Input
              id="approved-position"
              type="text"
              placeholder="Jabatan"
              value={report.approvedBy.position}
              onChange={(e) => setApprovedBy({ position: e.target.value })}
              className="min-h-[44px] text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
