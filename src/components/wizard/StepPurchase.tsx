import { Plus, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '../../store/report';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { PhotoUploader } from '../photo/PhotoUploader';
import { formatIDR, formatIDRInput, parseIDRInput, parseNumberInput } from '../../lib/format';
import { useToast } from '../../hooks/use-toast';

interface StepPurchaseProps {
  errors: Record<string, string>;
}

export function StepPurchase({ errors }: StepPurchaseProps) {
  const { report, addItem, removeItem, updateItem, addGoodsPhotos, removeGoodsPhoto } =
    useReportStore();
  const { toast } = useToast();

  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);

  const handleRemoveItem = (id: string, name: string) => {
    const prevItems = report.items;
    removeItem(id);
    toast({
      title: 'Barang dihapus',
      description: name || 'Barang tanpa nama',
      action: (
        <button
          onClick={() => {
            useReportStore.setState((s) => ({
              report: { ...s.report, items: prevItems },
            }));
          }}
          className="text-sm font-semibold text-primary"
        >
          Batal
        </button>
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading text-foreground">Pembelian</h2>
        <p className="text-sm text-muted-foreground mt-1">Foto barang & struk kasir, lalu isi rincian</p>
      </div>

      {/* Goods photos */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <h3 className="font-semibold text-sm">Foto Barang</h3>
          </div>
          <span className="font-mono-num text-xs text-muted-foreground">
            {report.goodsPhotos.length}/4 foto
          </span>
        </div>
        <PhotoUploader
          photos={report.goodsPhotos}
          label="Foto Barang"
          maxPhotos={4}
          multiple
          onAdd={addGoodsPhotos}
          onRemove={removeGoodsPhoto}
          addCardLabel="Tambah foto barang"
        />
      </div>

      {/* Item table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Rincian Barang</h3>
          <span className="font-mono-num text-sm font-semibold text-foreground">
            {formatIDR(itemTotal)}
          </span>
        </div>

        {/* Desktop table header */}
        <div className="hidden sm:grid grid-cols-[1fr_70px_120px_120px_40px] gap-2 px-2 text-xs font-medium text-muted-foreground">
          <span>Nama Barang</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Harga</span>
          <span className="text-right">Subtotal</span>
          <span />
        </div>

        <AnimatePresence mode="popLayout">
          {report.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-border bg-card p-3 shadow-soft sm:p-0 sm:border-0 sm:bg-transparent sm:shadow-none"
            >
              {/* Mobile: card layout */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs text-muted-foreground font-mono-num">
                    Barang {report.items.indexOf(item) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id, item.name)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Hapus barang"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="Nama barang"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="min-h-[44px] text-base"
                  aria-label="Nama barang"
                />
                {errors[`item-${item.id}-name`] && (
                  <p className="text-xs text-destructive" role="alert">{errors[`item-${item.id}-name`]}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={item.qty || ''}
                      onChange={(e) => updateItem(item.id, { qty: parseNumberInput(e.target.value) })}
                      className="min-h-[44px] text-base font-mono-num"
                      aria-label="Jumlah"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Harga</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono-num">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatIDRInput(item.price)}
                        onChange={(e) => updateItem(item.id, { price: parseIDRInput(e.target.value) })}
                        onBlur={(e) => updateItem(item.id, { price: parseIDRInput(e.target.value) })}
                        className="min-h-[44px] text-base font-mono-num pl-9"
                        aria-label="Harga satuan"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Subtotal</span>
                  <span className="font-mono-num text-sm font-semibold text-foreground">
                    {formatIDR(item.qty * item.price)}
                  </span>
                </div>
              </div>

              {/* Desktop: row layout */}
              <div className="hidden sm:grid grid-cols-[1fr_70px_120px_120px_40px] gap-2 items-center py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <Input
                  type="text"
                  placeholder="Nama barang"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  className="h-11 text-sm"
                  aria-label="Nama barang"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={item.qty || ''}
                  onChange={(e) => updateItem(item.id, { qty: parseNumberInput(e.target.value) })}
                  className="h-11 text-sm font-mono-num text-center"
                  aria-label="Jumlah"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono-num">
                    Rp
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatIDRInput(item.price)}
                    onChange={(e) => updateItem(item.id, { price: parseIDRInput(e.target.value) })}
                    className="h-11 text-sm font-mono-num pl-8 text-right"
                    aria-label="Harga satuan"
                  />
                </div>
                <span className="font-mono-num text-sm font-semibold text-right text-foreground">
                  {formatIDR(item.qty * item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id, item.name)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Hapus barang"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
              {errors[`item-${item.id}-name`] && (
                <p className="text-xs text-destructive hidden sm:block" role="alert">
                  {errors[`item-${item.id}-name`]}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors min-h-[48px]"
        >
          <Plus className="h-4 w-4 text-primary" strokeWidth={1.75} />
          <span className="font-medium text-sm text-primary">Tambah barang</span>
        </button>
      </div>
    </div>
  );
}
