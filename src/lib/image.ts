import exifr from 'exifr';
import type { PhotoData } from './types';

const MAX_LONG_SIDE = 1600;
const JPEG_QUALITY = 0.8;
const TARGET_BYTES = 300 * 1024;

export interface ExifInfo {
  dateTime?: string;
  lat?: number;
  lng?: number;
}

export interface ProcessResult {
  photo: PhotoData;
  success: boolean;
  error?: string;
}

export function isHEIC(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    type === 'image/heic' ||
    type === 'image/heif'
  );
}

async function readExif(file: File): Promise<ExifInfo> {
  try {
    const data = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
    });
    if (!data) return {};
    const info: ExifInfo = {};
    if (data.DateTimeOriginal || data.DateTime || data.CreateDate) {
      const d = data.DateTimeOriginal || data.DateTime || data.CreateDate;
      info.dateTime = d instanceof Date ? d.toISOString() : new Date(d).toISOString();
    }
    if (data.latitude != null && data.longitude != null) {
      info.lat = data.latitude;
      info.lng = data.longitude;
    }
    return info;
  } catch {
    return {};
  }
}

function drawWithOrientation(
  img: HTMLImageElement,
  orientation: number,
  ctx: CanvasRenderingContext2D,
  maxW: number,
  maxH: number,
): { width: number; height: number } {
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  let w = naturalW;
  let h = naturalH;

  // Scale down
  if (w > maxW || h > maxH) {
    const ratio = Math.min(maxW / w, maxH / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  // EXIF orientation transforms
  const canvas = ctx.canvas;
  switch (orientation) {
    case 2:
      canvas.width = w; canvas.height = h;
      ctx.translate(w, 0); ctx.scale(-1, 1);
      break;
    case 3:
      canvas.width = w; canvas.height = h;
      ctx.translate(w, h); ctx.rotate(Math.PI);
      break;
    case 4:
      canvas.width = w; canvas.height = h;
      ctx.translate(0, h); ctx.scale(1, -1);
      break;
    case 5:
      canvas.width = h; canvas.height = w;
      ctx.translate(w, 0); ctx.rotate(0.5 * Math.PI); ctx.scale(-1, 1);
      break;
    case 6:
      canvas.width = h; canvas.height = w;
      ctx.translate(w, 0); ctx.rotate(0.5 * Math.PI);
      break;
    case 7:
      canvas.width = h; canvas.height = w;
      ctx.translate(w, h); ctx.rotate(0.5 * Math.PI); ctx.scale(-1, -1);
      break;
    case 8:
      canvas.width = h; canvas.height = w;
      ctx.translate(0, w); ctx.rotate(-0.5 * Math.PI);
      break;
    default:
      canvas.width = w; canvas.height = h;
  }

  ctx.drawImage(img, 0, 0, w, h);
  return { width: canvas.width, height: canvas.height };
}

async function getOrientation(file: File): Promise<number> {
  try {
    const data = await exifr.parse(file, { tiff: true });
    if (data && typeof data.Orientation === 'number') return data.Orientation;
  } catch {
    // ignore
  }
  return 1;
}

async function compressToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  let quality = JPEG_QUALITY;
  let dataUrl = '';

  // Draw with orientation fix
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
  });

  const orientation = await getOrientation(file);
  drawWithOrientation(img, orientation, ctx, MAX_LONG_SIDE, MAX_LONG_SIDE);
  URL.revokeObjectURL(img.src);

  // First pass
  dataUrl = canvas.toDataURL('image/jpeg', quality);

  // Progressive compression if too large
  while (dataUrl.length * 0.75 > TARGET_BYTES && quality > 0.3) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  // If still too large, scale down
  while (dataUrl.length * 0.75 > TARGET_BYTES && canvas.width > 400) {
    const scale = 0.8;
    canvas.width = Math.round(canvas.width * scale);
    canvas.height = Math.round(canvas.height * scale);
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  bitmap.close?.();
  return dataUrl;
}

export async function processPhoto(
  file: File,
  label: string,
): Promise<ProcessResult> {
  try {
    if (isHEIC(file)) {
      return {
        photo: createEmptyPhoto(label),
        success: false,
        error: 'HEIC',
      };
    }

    const [dataUrl, exifInfo] = await Promise.all([
      compressToDataUrl(file),
      readExif(file),
    ]);

    const photo: PhotoData = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      dataUrl,
      label,
      dateTime: exifInfo.dateTime,
      lat: exifInfo.lat,
      lng: exifInfo.lng,
      fileName: file.name,
    };

    return { photo, success: true };
  } catch (err) {
    return {
      photo: createEmptyPhoto(label),
      success: false,
      error: err instanceof Error ? err.message : 'Gagal memproses foto',
    };
  }
}

function createEmptyPhoto(label: string): PhotoData {
  return {
    id: '',
    dataUrl: '',
    label,
  };
}

export async function processPhotosSequentially(
  files: File[],
  label: string,
  onProgress: (current: number, total: number) => void,
): Promise<{ photos: PhotoData[]; failures: number }> {
  const photos: PhotoData[] = [];
  let failures = 0;

  for (let i = 0; i < files.length; i++) {
    onProgress(i + 1, files.length);
    const result = await processPhoto(files[i], label);
    if (result.success && result.photo.dataUrl) {
      photos.push(result.photo);
    } else {
      failures++;
    }
  }

  return { photos, failures };
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil(base64.length * 0.75);
}
