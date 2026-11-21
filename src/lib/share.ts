import type { ReportData } from './types';
import {
  formatIDR,
  formatDate,
  generateReportCode,
} from './format';

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
    const sub =
      report.meetingSubType === 'lainnya'
        ? report.meetingSubTypeOther || 'Lainnya'
        : MEETING_SUB_LABELS[report.meetingSubType] || '';
    return sub ? `${base} — ${sub}` : base;
  }
  return base;
}

export function buildReportMessage(report: ReportData): string {
  const code = report.reportCode || generateReportCode(report.reportDate);
  const itemTotal = report.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const diff = report.receipt.receiptTotal - itemTotal;
  const isMatch = diff === 0;

  const lines: string[] = [
    '*Tuntas Pro — Laporan Aktivitas*',
    '',
    `Kode: ${code}`,
    `Tanggal: ${formatDate(report.reportDate)}`,
    `Jenis: ${getActivityLabel(report)}`,
  ];

  if (report.receipt.branchCode || report.receipt.branchName) {
    lines.push(
      `BA: ${report.receipt.branchCode || '-'}`,
      `Cabang: ${report.receipt.branchName || '-'}`,
    );
  }
  if (report.receipt.receiptNumber) {
    lines.push(`No. Struk: ${report.receipt.receiptNumber}`);
  }

  if (report.stores.length > 0) {
    if (report.stores.length === 1) {
      const s = report.stores[0];
      lines.push('', `PIC: ${s.picName || '-'}`, `Toko: ${s.storeName || '-'}`);
      if (s.address) lines.push(`Alamat: ${s.address}`);
    } else {
      report.stores.forEach((s, i) => {
        lines.push('', `*Toko ${i + 1}*`, `PIC: ${s.picName || '-'}`, `Toko: ${s.storeName || '-'}`);
        if (s.address) lines.push(`Alamat: ${s.address}`);
      });
    }
  }

  if (report.activityType === 'iuran' && report.handover.amount > 0) {
    lines.push(
      '',
      `PIC: ${report.handover.picName || '-'}`,
      `Jumlah: ${formatIDR(report.handover.amount)}`,
      `Penerima: ${report.handover.recipient || '-'}`,
    );
    if (report.handover.title) lines.push(`Keterangan: ${report.handover.title}`);
  }

  const namedItems = report.items.filter((it) => it.name);
  if (namedItems.length > 0) {
    lines.push('', '*Rincian Pembelian*');
    namedItems.forEach((it) => {
      lines.push(`${it.name} x${it.qty} — ${formatIDR(it.qty * it.price)}`);
    });
  }

  lines.push(
    '',
    `Total Item: ${formatIDR(itemTotal)}`,
    `Total Struk: ${formatIDR(report.receipt.receiptTotal)}`,
    `Selisih: ${isMatch ? 'COCOK' : formatIDR(Math.abs(diff))}`,
  );

  return lines.join('\n');
}

export function buildReportSubject(report: ReportData): string {
  const code = report.reportCode || generateReportCode(report.reportDate);
  return `Laporan Aktivitas ${code}`;
}

export function sendViaWhatsApp(phone: string, report: ReportData): void {
  const message = encodeURIComponent(buildReportMessage(report));
  const cleanPhone = phone.replace(/[^\d]/g, '');
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${message}`
    : `https://wa.me/?text=${message}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function sendViaEmail(email: string, report: ReportData): void {
  const subject = encodeURIComponent(buildReportSubject(report));
  const body = encodeURIComponent(buildReportMessage(report));
  const url = `mailto:${email}?subject=${subject}&body=${body}`;
  window.location.href = url;
}
