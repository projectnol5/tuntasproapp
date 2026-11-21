import ExcelJS from 'exceljs';
import type { ReportData } from './types';
import { formatIDR, formatDate, formatTime, formatCoords, generateReportCode, formatDateForFilename } from './format';

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

function generateFileName(report: ReportData): string {
  const date = formatDateForFilename(report.reportDate);
  const code = report.reportCode || generateReportCode(report.reportDate);
  return `Tuntas_Pro_${code}_${date}`;
}

export async function exportExcel(report: ReportData): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tuntas Pro';
  workbook.created = new Date();

  // === Laporan sheet ===
  const sheet = workbook.addWorksheet('Laporan', {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: 'Nama Barang', key: 'name', width: 30 },
    { header: 'Qty', key: 'qty', width: 8 },
    { header: 'Harga Satuan', key: 'price', width: 18 },
    { header: 'Subtotal', key: 'subtotal', width: 18 },
  ];

  // Header info rows
  const code = report.reportCode || generateReportCode(report.reportDate);
  sheet.insertRow(1, ['Tuntas Pro - Laporan Aktivitas']);
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.insertRow(2, ['Kode', code, '', '']);
  sheet.insertRow(3, ['Tanggal', formatDate(report.reportDate), '', '']);
  sheet.insertRow(4, ['Jenis Aktivitas', getActivityLabel(report), '', '']);
  let headerRows = 4;
  if (report.receipt.branchCode) {
    sheet.insertRow(5, ['BA', report.receipt.branchCode, '', '']);
    headerRows = 5;
  }
  if (report.receipt.branchName) {
    sheet.insertRow(headerRows + 1, ['Cabang', report.receipt.branchName, '', '']);
    headerRows += 1;
  }
  if (report.receipt.receiptNumber) {
    sheet.insertRow(headerRows + 1, ['No. Struk', report.receipt.receiptNumber, '', '']);
    headerRows += 1;
  }
  let storeStart = headerRows + 1;
  if (report.activityType !== 'iuran' && report.stores.length === 1) {
    const store = report.stores[0];
    sheet.insertRow(storeStart, ['PIC', store.picName || '-', '', '']);
    sheet.insertRow(storeStart + 1, ['Toko', store.storeName || '-', '', '']);
    sheet.insertRow(storeStart + 2, ['Alamat', store.address || '-', '', '']);
    headerRows = storeStart + 2;
  } else if (report.activityType !== 'iuran' && report.stores.length > 1) {
    report.stores.forEach((store, i) => {
      const base = storeStart + i * 4;
      sheet.insertRow(base, [`Toko ${i + 1}`, '', '', '']);
      sheet.getCell(`A${base}`).font = { bold: true };
      sheet.insertRow(base + 1, ['PIC', store.picName || '-', '', '']);
      sheet.insertRow(base + 2, ['Toko', store.storeName || '-', '', '']);
      sheet.insertRow(base + 3, ['Alamat', store.address || '-', '', '']);
    });
    headerRows = storeStart - 1 + report.stores.length * 4;
  }

  if (report.activityType === 'iuran' && report.handover.amount > 0) {
    const offset = headerRows + 1;
    sheet.insertRow(offset, ['Jumlah Serah Terima', formatIDR(report.handover.amount), '', '']);
    sheet.insertRow(offset + 1, ['Penerima', report.handover.recipient || '-', '', '']);
    sheet.insertRow(offset + 2, ['Keterangan', report.handover.title || '-', '', '']);
    headerRows = offset + 2;
  }

  // Items table header row
  const tableHeaderRow = sheet.rowCount + 2;
  sheet.getRow(tableHeaderRow).values = ['Nama Barang', 'Qty', 'Harga Satuan', 'Subtotal'];
  sheet.getRow(tableHeaderRow).font = { bold: true };
  sheet.getRow(tableHeaderRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDF0EC' },
  };

  let itemTotal = 0;
  report.items.forEach((item, i) => {
    const subtotal = item.qty * item.price;
    itemTotal += subtotal;
    const row = tableHeaderRow + 1 + i;
    sheet.getRow(row).values = [item.name, item.qty, item.price, subtotal];
    sheet.getCell(`C${row}`).numFmt = '"Rp" #,##0';
    sheet.getCell(`D${row}`).numFmt = '"Rp" #,##0';
  });

  const totalRow = tableHeaderRow + 1 + report.items.length;
  sheet.getRow(totalRow).values = ['', '', 'Total Item', itemTotal];
  sheet.getCell(`D${totalRow}`).font = { bold: true };
  sheet.getCell(`D${totalRow}`).numFmt = '"Rp" #,##0';

  const receiptRow = totalRow + 1;
  sheet.getRow(receiptRow).values = ['', '', 'Total Struk', report.receipt.receiptTotal];
  sheet.getCell(`D${receiptRow}`).numFmt = '"Rp" #,##0';

  const diffRow = receiptRow + 1;
  const diff = report.receipt.receiptTotal - itemTotal;
  sheet.getRow(diffRow).values = ['', '', 'Selisih', diff];
  sheet.getCell(`D${diffRow}`).font = { bold: true };
  if (diff === 0) {
    sheet.getCell(`D${diffRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
    sheet.getCell(`D${diffRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  } else {
    sheet.getCell(`D${diffRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9A5B00' } };
    sheet.getCell(`D${diffRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  }

  // === Foto sheet ===
  const photoSheet = workbook.addWorksheet('Foto', {
    properties: { defaultColWidth: 22 },
  });

  photoSheet.columns = [
    { header: 'Jenis Foto', key: 'label', width: 22 },
    { header: 'Waktu', key: 'time', width: 20 },
    { header: 'Koordinat', key: 'coords', width: 30 },
    { header: 'Alamat', key: 'address', width: 30 },
  ];

  photoSheet.getRow(1).font = { bold: true };
  photoSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDF0EC' },
  };

  let rowIdx = 2;
  for (const store of report.stores) {
    if (store.picPhoto) {
      addPhotoRow(photoSheet, rowIdx++, 'Foto PIC', store.picPhoto);
    }
    if (store.storefrontPhoto) {
      addPhotoRow(photoSheet, rowIdx++, 'Foto Toko', store.storefrontPhoto);
    }
  }
  for (const photo of report.goodsPhotos) {
    addPhotoRow(photoSheet, rowIdx++, 'Foto Barang', photo);
  }
  for (const photo of report.receipt.photos) {
    addPhotoRow(photoSheet, rowIdx++, 'Foto Struk', photo);
  }
  if (report.activityType !== 'iuran' && report.handover.picPhoto) {
    addPhotoRow(photoSheet, rowIdx++, 'Foto PIC Penyerah', report.handover.picPhoto);
  }
  if (report.handover.moneyPhoto) {
    addPhotoRow(photoSheet, rowIdx++, 'Foto Serah Terima', report.handover.moneyPhoto);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${generateFileName(report)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function addPhotoRow(
  sheet: ExcelJS.Worksheet,
  rowIdx: number,
  label: string,
  photo: { label: string; dateTime?: string; lat?: number; lng?: number; address?: string },
): void {
  sheet.getRow(rowIdx).values = [
    label,
    photo.dateTime ? formatTime(photo.dateTime) : '-',
    photo.lat != null && photo.lng != null ? formatCoords(photo.lat, photo.lng) : '-',
    photo.address || '-',
  ];
}
