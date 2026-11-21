import { jsPDF } from 'jspdf';
import type { ReportData, PhotoData } from './types';
import {
  formatIDR,
  formatDate,
  formatTime,
  formatCoords,
  generateReportCode,
  formatDateForFilename,
} from './format';

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ACTIVITY_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  iuran: 'Iuran/Koordinasi',
  repair: 'Repair/Maintenance',
};

const MEETING_SUB_LABELS: Record<string, string> = {
  rutin: 'Rapat Rutin',
  koordinasi: 'Koordinasi',
  evaluasi: 'Evaluasi',
  tamu: 'Tamu',
  lainnya: 'Lainnya',
};

export function generateFileName(report: ReportData): string {
  const date = formatDateForFilename(report.reportDate);
  const code = report.reportCode || generateReportCode(report.reportDate);
  return `Tuntas_Pro_${code}_${date}`;
}

function getActivityLabel(report: ReportData): string {
  if (!report.activityType) return '-';
  const base = ACTIVITY_LABELS[report.activityType] || '-';
  if (report.activityType === 'meeting' && report.meetingSubType) {
    const sub = report.meetingSubType === 'lainnya'
      ? (report.meetingSubTypeOther || 'Lainnya')
      : MEETING_SUB_LABELS[report.meetingSubType] || '';
    return sub ? `${base} — ${sub}` : base;
  }
  return base;
}

function addHeader(doc: jsPDF, report: ReportData, code: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Tuntas Pro', MARGIN, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Kode: ${code}`, MARGIN, 28);
  doc.text(`Tanggal: ${formatDate(report.reportDate)}`, MARGIN, 33);

  // Line separator
  doc.setDrawColor(36, 69, 200);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, 37, PAGE_W - MARGIN, 37);
  doc.setTextColor(0);

  let y = 44;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN AKTIVITAS', MARGIN, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Jenis: ${getActivityLabel(report)}`, MARGIN, y);
  y += 6;

  if (report.receipt.branchCode || report.receipt.branchName) {
    const baParts: string[] = [];
    if (report.receipt.branchCode) baParts.push(`BA: ${report.receipt.branchCode}`);
    if (report.receipt.branchName) baParts.push(`Cabang: ${report.receipt.branchName}`);
    doc.text(baParts.join('  |  '), MARGIN, y);
    y += 5;
  }
  if (report.receipt.receiptNumber) {
    doc.text(`No. Struk: ${report.receipt.receiptNumber}`, MARGIN, y);
    y += 5;
  }

  if (report.activityType === 'iuran' && report.handover.amount > 0) {
    y += 2;
    doc.text(`PIC: ${report.handover.picName || '-'}`, MARGIN, y);
    y += 5;
    doc.text(`Penyerahan: ${formatIDR(report.handover.amount)}`, MARGIN, y);
    y += 5;
    doc.text(`Penerima: ${report.handover.recipient || '-'}`, MARGIN, y);
    y += 5;
    if (report.handover.title) {
      doc.text(`Keterangan: ${report.handover.title}`, MARGIN, y);
      y += 5;
    }
  } else if (report.stores.length === 1) {
    const store = report.stores[0];
    doc.text(`PIC: ${store.picName || '-'}`, MARGIN, y);
    y += 5;
    doc.text(`Toko: ${store.storeName || '-'}`, MARGIN, y);
    y += 5;
    if (store.address) {
      const addrLines = doc.splitTextToSize(`Alamat: ${store.address}`, CONTENT_W);
      doc.text(addrLines, MARGIN, y);
      y += addrLines.length * 5;
    }
  } else if (report.stores.length > 1) {
    for (let i = 0; i < report.stores.length; i++) {
      const store = report.stores[i];
      doc.setFont('helvetica', 'bold');
      doc.text(`Toko ${i + 1}`, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
      doc.text(`PIC: ${store.picName || '-'}`, MARGIN + 4, y);
      y += 5;
      doc.text(`Toko: ${store.storeName || '-'}`, MARGIN + 4, y);
      y += 5;
      if (store.address) {
        const addrLines = doc.splitTextToSize(`Alamat: ${store.address}`, CONTENT_W - 4);
        doc.text(addrLines, MARGIN + 4, y);
        y += addrLines.length * 5;
      }
      y += 2;
    }
  }

  return y + 4;
}

function addItemsTable(doc: jsPDF, report: ReportData, startY: number): number {
  if (report.items.length === 0) return startY;

  let y = startY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Rincian Pembelian', MARGIN, y);
  y += 5;

  // Table header
  doc.setFillColor(237, 240, 236);
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50);
  doc.text('Nama Barang', MARGIN + 2, y + 5);
  doc.text('Qty', MARGIN + 100, y + 5, { align: 'right' });
  doc.text('Harga', MARGIN + 140, y + 5, { align: 'right' });
  doc.text('Subtotal', MARGIN + CONTENT_W - 2, y + 5, { align: 'right' });
  doc.setTextColor(0);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  let itemTotal = 0;
  for (const item of report.items) {
    if (y > PAGE_H - 30) {
      doc.addPage();
      y = MARGIN;
    }
    const subtotal = item.qty * item.price;
    itemTotal += subtotal;

    doc.text(item.name || '-', MARGIN + 2, y + 4);
    doc.text(String(item.qty), MARGIN + 100, y + 4, { align: 'right' });
    doc.text(formatIDR(item.price), MARGIN + 140, y + 4, { align: 'right' });
    doc.text(formatIDR(subtotal), MARGIN + CONTENT_W - 2, y + 4, { align: 'right' });
    y += 5;
  }

  // Total row
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Item', MARGIN + 100, y, { align: 'right' });
  doc.text(formatIDR(itemTotal), MARGIN + CONTENT_W - 2, y, { align: 'right' });
  y += 6;

  // Receipt total comparison
  const receiptTotal = report.receipt.receiptTotal;
  doc.setFont('helvetica', 'normal');
  doc.text('Total Struk', MARGIN + 100, y, { align: 'right' });
  doc.text(formatIDR(receiptTotal), MARGIN + CONTENT_W - 2, y, { align: 'right' });
  y += 6;

  const diff = receiptTotal - itemTotal;
  doc.setFont('helvetica', 'bold');
  if (diff === 0) {
    doc.setTextColor(21, 128, 61);
    doc.text('Selisih: COCOK', MARGIN + CONTENT_W - 2, y, { align: 'right' });
  } else {
    doc.setTextColor(154, 91, 0);
    doc.text(`Selisih: ${formatIDR(Math.abs(diff))}`, MARGIN + CONTENT_W - 2, y, { align: 'right' });
  }
  doc.setTextColor(0);

  return y + 8;
}

async function addPhotoGrid(
  doc: jsPDF,
  photos: PhotoData[],
  sectionTitle: string,
): Promise<void> {
  if (photos.length === 0) return;

  const colCount = 2;
  const rowCount = 3;
  const gap = 3;
  const colW = (CONTENT_W - gap * (colCount - 1)) / colCount;
  // Fixed grid sized so 6 photos fit on a single A4 page
  const gridH = PAGE_H - MARGIN * 2 - 10; // leave room for section title
  const imgH = (gridH - gap * (rowCount - 1)) / rowCount;
  const imgW = colW;
  const captionH = 6;

  for (let i = 0; i < photos.length; i++) {
    const idxInPage = i % (colCount * rowCount);
    const pageNum = Math.floor(i / (colCount * rowCount));

    if (idxInPage === 0) {
      if (i > 0) doc.addPage();
      // Section title at top of each page batch
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(sectionTitle, MARGIN, MARGIN + 4);
    }

    const col = idxInPage % colCount;
    const row = Math.floor(idxInPage / colCount);
    const x = MARGIN + col * (colW + gap);
    const yBase = MARGIN + 8 + row * (imgH + gap);

    // Maintain aspect ratio within the fixed cell, centering the image
    let drawW = imgW;
    let drawH = imgH;
    try {
      const img = new Image();
      img.src = photos[i].dataUrl;
      if (img.width && img.height) {
        const ar = img.width / img.height;
        const cellAr = imgW / imgH;
        if (ar > cellAr) {
          drawW = imgW;
          drawH = imgW / ar;
        } else {
          drawH = imgH;
          drawW = imgH * ar;
        }
      }
    } catch {
      // use full cell
    }
    const drawX = x + (imgW - drawW) / 2;
    const drawY = yBase + (imgH - drawH) / 2 - captionH / 2;

    try {
      doc.addImage(photos[i].dataUrl, 'JPEG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    } catch {
      // skip broken image
    }

    // Caption band at bottom of cell
    const capY = yBase + imgH - captionH;
    doc.setFillColor(245, 245, 245);
    doc.rect(x, capY, imgW, captionH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(80);
    let caption = photos[i].label;
    const dt = photos[i].dateTime;
    if (dt) caption += ` • ${formatTime(dt)}`;
    doc.text(caption, x + 1, capY + 4);
    if (photos[i].lat != null && photos[i].lng != null) {
      doc.text(formatCoords(photos[i].lat, photos[i].lng), x + imgW - 1, capY + 4, { align: 'right' });
    }
    doc.setTextColor(0);
  }
}

export async function exportPDF(report: ReportData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const code = report.reportCode || generateReportCode(report.reportDate);

  let y = addHeader(doc, report, code);
  y = addItemsTable(doc, report, y);

  // Collect ALL photos into a single array
  const allPhotos: PhotoData[] = [];
  for (const store of report.stores) {
    if (store.picPhoto?.dataUrl) allPhotos.push({ ...store.picPhoto, label: 'PIC' });
    if (store.storefrontPhoto?.dataUrl) allPhotos.push({ ...store.storefrontPhoto, label: 'Toko' });
  }
  for (const photo of report.goodsPhotos) {
    if (photo.dataUrl) allPhotos.push(photo);
  }
  for (const photo of report.receipt.photos) {
    if (photo.dataUrl) allPhotos.push(photo);
  }
  if (report.handover.picPhoto?.dataUrl) {
    allPhotos.push({ ...report.handover.picPhoto, label: 'PIC Penyerah' });
  }
  if (report.handover.moneyPhoto?.dataUrl) {
    allPhotos.push({ ...report.handover.moneyPhoto, label: 'Serah Terima Uang' });
  }

  if (allPhotos.length > 0) {
    doc.addPage();
    await addPhotoGrid(doc, allPhotos, 'Lampiran Foto');
  }

  doc.save(`${generateFileName(report)}.pdf`);
}
