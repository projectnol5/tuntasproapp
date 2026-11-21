import { z } from 'zod';

export const activityTypeSchema = z.enum(['meeting', 'iuran', 'repair']);

export const meetingSubTypeSchema = z.enum(['rutin', 'koordinasi', 'evaluasi', 'tamu', 'lainnya']);

export const storeEntrySchema = z.object({
  id: z.string(),
  picName: z.string().min(1, 'Nama PIC wajib diisi'),
  storeName: z.string().min(1, 'Nama toko wajib diisi'),
  address: z.string().optional(),
});

export const itemRowSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nama barang wajib diisi'),
  qty: z.number().min(1, 'Qty minimal 1'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
});

export const reportSchema = z.object({
  activityType: activityTypeSchema,
  reportDate: z.string().min(1, 'Tanggal wajib diisi'),
  stores: z.array(storeEntrySchema).min(1, 'Minimal satu toko'),
  items: z.array(itemRowSchema),
  receipt: z.object({
    receiptNumber: z.string().min(1, 'Nomor struk wajib diisi'),
    receiptTotal: z.number().min(0, 'Total struk tidak boleh negatif'),
    branchCode: z.string().min(1, 'Kode BA wajib diisi'),
    branchName: z.string().min(1, 'Nama cabang wajib diisi'),
  }),
});

export type ReportSchema = z.infer<typeof reportSchema>;
