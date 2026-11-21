import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Store, User, MapPin } from 'lucide-react';
import { useReportStore } from '../../store/report';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { SinglePhotoUploader } from '../photo/SinglePhotoUploader';
import { useToast } from '../../hooks/use-toast';

interface StepStoreProps {
  errors: Record<string, string>;
}

export function StepStore({ errors }: StepStoreProps) {
  const { report, addStore, removeStore, updateStore, setStorePhoto, removeStorePhoto } =
    useReportStore();
  const { toast } = useToast();

  const handleRemoveStore = (id: string, storeName: string) => {
    if (report.stores.length <= 1) return;
    const prevStores = report.stores;
    removeStore(id);
    toast({
      title: 'Toko dihapus',
      description: storeName || 'Toko tanpa nama',
      action: (
        <button
          onClick={() => {
            useReportStore.setState((s) => ({
              report: { ...s.report, stores: prevStores },
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
        <h2 className="text-heading text-foreground">Data Toko</h2>
        <p className="text-sm text-muted-foreground mt-1">Foto PIC & toko, lalu isi data</p>
      </div>

      <AnimatePresence mode="popLayout">
        {report.stores.map((store, index) => (
          <motion.div
            key={store.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" strokeWidth={1.75} />
                Toko {index + 1}
              </h3>
              {report.stores.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveStore(store.id, store.storeName)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Hapus toko"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>

            {/* Photos */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Foto Selfie PIC</Label>
                <SinglePhotoUploader
                  photo={store.picPhoto}
                  label="PIC"
                  onSet={(photo) => setStorePhoto(store.id, 'picPhoto', photo)}
                  onRemove={() => removeStorePhoto(store.id, 'picPhoto')}
                  buttonLabel="Ambil foto selfie PIC"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Foto Toko</Label>
                <SinglePhotoUploader
                  photo={store.storefrontPhoto}
                  label="Toko"
                  onSet={(photo) => setStorePhoto(store.id, 'storefrontPhoto', photo)}
                  onRemove={() => removeStorePhoto(store.id, 'storefrontPhoto')}
                  buttonLabel="Ambil foto toko"
                />
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`pic-${store.id}`} className="text-sm font-medium flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Nama PIC
                </Label>
                <Input
                  id={`pic-${store.id}`}
                  type="text"
                  placeholder="Nama penanggung jawab"
                  value={store.picName}
                  onChange={(e) => updateStore(store.id, { picName: e.target.value })}
                  className="min-h-[44px] text-base"
                />
                {errors[`store-${store.id}-picName`] && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors[`store-${store.id}-picName`]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`store-${store.id}`} className="text-sm font-medium flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Nama Toko
                </Label>
                <Input
                  id={`store-${store.id}`}
                  type="text"
                  placeholder="Nama toko/lokasi"
                  value={store.storeName}
                  onChange={(e) => updateStore(store.id, { storeName: e.target.value })}
                  className="min-h-[44px] text-base"
                />
                {errors[`store-${store.id}-storeName`] && (
                  <p className="text-xs text-destructive" role="alert">
                    {errors[`store-${store.id}-storeName`]}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`addr-${store.id}`} className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  Alamat/Area <span className="text-muted-foreground font-normal">(opsional)</span>
                </Label>
                <Input
                  id={`addr-${store.id}`}
                  type="text"
                  placeholder="Alamat atau area toko"
                  value={store.address || ''}
                  onChange={(e) => updateStore(store.id, { address: e.target.value })}
                  className="min-h-[44px] text-base"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addStore}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors min-h-[52px]"
      >
        <Plus className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <span className="font-medium text-sm text-primary">Tambah toko lain</span>
      </button>
    </div>
  );
}
