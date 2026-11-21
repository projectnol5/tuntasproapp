export type ActivityType = 'meeting' | 'iuran' | 'repair';

export type MeetingSubType = 'rutin' | 'koordinasi' | 'evaluasi' | 'tamu' | 'lainnya';

export interface PhotoData {
  id: string;
  /** Compressed base64 JPEG data URL */
  dataUrl: string;
  label: string;
  /** ISO string if EXIF date present */
  dateTime?: string;
  /** Latitude/longitude if EXIF GPS present */
  lat?: number;
  lng?: number;
  /** Address string if available */
  address?: string;
  /** Original filename */
  fileName?: string;
}

export interface StoreEntry {
  id: string;
  picPhoto?: PhotoData;
  storefrontPhoto?: PhotoData;
  picName: string;
  storeName: string;
  address?: string;
}

export interface ItemRow {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptData {
  photos: PhotoData[];
  receiptNumber: string;
  receiptTotal: number;
  branchCode: string;
  branchName: string;
}

export interface HandoverData {
  amount: number;
  /** PIC yang menyerahkan uang */
  picName: string;
  /** Foto selfie PIC yang menyerahkan */
  picPhoto?: PhotoData;
  recipient: string;
  title?: string;
  moneyPhoto?: PhotoData;
}

export interface ApproverData {
  name: string;
  position: string;
}

export interface ReportData {
  activityType: ActivityType | null;
  meetingSubType?: MeetingSubType;
  meetingSubTypeOther?: string;
  reportDate: string;
  stores: StoreEntry[];
  items: ItemRow[];
  goodsPhotos: PhotoData[];
  receipt: ReceiptData;
  handover: HandoverData;
  createdBy: ApproverData;
  approvedBy: ApproverData;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reportCode?: string;
}
