import { HandCoins, User, FileText } from 'lucide-react';
import { useReportStore } from '../../store/report';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { SinglePhotoUploader } from '../photo/SinglePhotoUploader';
import { formatIDR, formatIDRInput, parseIDRInput } from '../../lib/format';

interface StepHandoverProps {
  errors: Record<string, string>;
}

export function StepHandover({ errors }: StepHandoverProps) {
  const {
    report,
    setHandover,
    setHandoverPhoto,
    removeHandoverPhoto,
    setHandoverPicPhoto,
    removeHandoverPicPhoto,
  } = useReportStore();
  const { handover } = report;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading text-foreground">Serah Terima Uang</h2>
        <p className="text-sm text-muted-foreground mt-1">Isi data penyerahan iuran/koordinasi</p>
      </div>

      {report.activityType !== 'iuran' && (
        <>
          {/* PIC selfie + name */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <h3 className="font-semibold text-sm">Data PIC (Yang Menyerahkan)</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Foto Selfie PIC</Label>
              <SinglePhotoUploader
                photo={handover.picPhoto}
                label="PIC Penyerah"
                onSet={setHandoverPicPhoto}
                onRemove={removeHandoverPicPhoto}
                buttonLabel="Ambil foto selfie PIC"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="handover-pic" className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                Nama PIC
              </Label>
              <Input
                id="handover-pic"
                type="text"
                placeholder="Nama penanggung jawab yang menyerahkan"
                value={handover.picName}
                onChange={(e) => setHandover({ picName: e.target.value })}
                className="min-h-[44px] text-base"
              />
              {errors.handoverPicName && (
                <p className="text-xs text-destructive" role="alert">{errors.handoverPicName}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Money photo */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <h3 className="font-semibold text-sm">Foto Serah Terima</h3>
        </div>
        <SinglePhotoUploader
          photo={handover.moneyPhoto}
          label="Serah Terima Uang"
          onSet={setHandoverPhoto}
          onRemove={removeHandoverPhoto}
          buttonLabel="Foto serah terima uang"
        />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="handover-amount" className="text-sm font-medium">
          Jumlah Uang
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground font-mono-num">
            Rp
          </span>
          <Input
            id="handover-amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatIDRInput(handover.amount)}
            onChange={(e) => setHandover({ amount: parseIDRInput(e.target.value) })}
            className="min-h-[48px] text-base font-mono-num pl-10 text-lg"
          />
        </div>
        {handover.amount > 0 && (
          <p className="text-xs text-muted-foreground font-mono-num">
            {formatIDR(handover.amount)}
          </p>
        )}
        {errors.handoverAmount && (
          <p className="text-xs text-destructive" role="alert">{errors.handoverAmount}</p>
        )}
      </div>

      {/* Recipient */}
      <div className="space-y-1.5">
        <Label htmlFor="handover-recipient" className="text-sm font-medium flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          Penerima
        </Label>
        <Input
          id="handover-recipient"
          type="text"
          placeholder="Nama penerima uang"
          value={handover.recipient}
          onChange={(e) => setHandover({ recipient: e.target.value })}
          className="min-h-[44px] text-base"
        />
        {errors.handoverRecipient && (
          <p className="text-xs text-destructive" role="alert">{errors.handoverRecipient}</p>
        )}
      </div>

      {/* Title/Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="handover-title" className="text-sm font-medium flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          Keterangan <span className="text-muted-foreground font-normal">(opsional)</span>
        </Label>
        <Textarea
          id="handover-title"
          placeholder="Judul atau catatan tambahan"
          value={handover.title || ''}
          onChange={(e) => setHandover({ title: e.target.value })}
          className="min-h-[88px] text-base resize-none"
        />
      </div>
    </div>
  );
}
