import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ActivityType,
  MeetingSubType,
  StoreEntry,
  ItemRow,
  PhotoData,
  ReportData,
  HandoverData,
  ApproverData,
} from '../lib/types';
import { todayISO, generateReportCode } from '../lib/format';

const STORAGE_KEY = 'tuntas-pro-report';

function createEmptyStore(): StoreEntry {
  return {
    id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    picName: '',
    storeName: '',
    address: '',
  };
}

function createEmptyItem(): ItemRow {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    qty: 1,
    price: 0,
  };
}

function createEmptyReport(): ReportData {
  return {
    activityType: null,
    meetingSubType: undefined,
    meetingSubTypeOther: '',
    reportDate: todayISO(),
    stores: [createEmptyStore()],
    items: [createEmptyItem()],
    goodsPhotos: [],
    receipt: {
      photos: [],
      receiptNumber: '',
      receiptTotal: 0,
      branchCode: '',
      branchName: '',
    },
    handover: {
      amount: 0,
      picName: '',
      recipient: '',
      title: '',
    },
    createdBy: { name: '', position: '' },
    approvedBy: { name: '', position: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ReportStore {
  report: ReportData;
  currentStep: number;
  hasDraft: boolean;
  startedFromDraft: boolean;

  setActivityType: (type: ActivityType) => void;
  setMeetingSubType: (sub: MeetingSubType) => void;
  setMeetingSubTypeOther: (text: string) => void;
  setReportDate: (date: string) => void;

  addStore: () => void;
  removeStore: (id: string) => void;
  updateStore: (id: string, partial: Partial<StoreEntry>) => void;
  setStorePhoto: (storeId: string, field: 'picPhoto' | 'storefrontPhoto', photo: PhotoData) => void;
  removeStorePhoto: (storeId: string, field: 'picPhoto' | 'storefrontPhoto') => void;

  addItem: () => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, partial: Partial<ItemRow>) => void;

  addGoodsPhotos: (photos: PhotoData[]) => void;
  removeGoodsPhoto: (id: string) => void;

  addReceiptPhotos: (photos: PhotoData[]) => void;
  removeReceiptPhoto: (id: string) => void;
  setReceiptNumber: (num: string) => void;
  setReceiptTotal: (total: number) => void;
  setBranchCode: (code: string) => void;
  setBranchName: (name: string) => void;

  setHandover: (partial: Partial<HandoverData>) => void;
  setHandoverPhoto: (photo: PhotoData) => void;
  removeHandoverPhoto: () => void;
  setHandoverPicPhoto: (photo: PhotoData) => void;
  removeHandoverPicPhoto: () => void;

  setCreatedBy: (partial: Partial<ApproverData>) => void;
  setApprovedBy: (partial: Partial<ApproverData>) => void;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  loadDraft: () => void;
  startFresh: () => void;
  submitReport: () => void;
  resetReport: () => void;

  submittedReports: ReportData[];
  deleteSubmittedReport: (code: string) => void;
}

function updateTimestamp(report: ReportData): ReportData {
  return { ...report, updatedAt: new Date().toISOString() };
}

function generateReceiptNumber(receipt: ReportData['receipt']): string {
  if (!receipt.branchCode || !receipt.branchName) return '';
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${receipt.branchCode}-${ymd}-${seq}`;
}

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      report: createEmptyReport(),
      currentStep: 0,
      hasDraft: false,
      startedFromDraft: false,

      setActivityType: (type) =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, activityType: type }),
        })),

      setMeetingSubType: (sub) =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, meetingSubType: sub }),
        })),

      setMeetingSubTypeOther: (text) =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, meetingSubTypeOther: text }),
        })),

      setReportDate: (date) =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, reportDate: date }),
        })),

      addStore: () =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, stores: [...s.report.stores, createEmptyStore()] }),
        })),

      removeStore: (id) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            stores: s.report.stores.filter((st) => st.id !== id),
          }),
        })),

      updateStore: (id, partial) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            stores: s.report.stores.map((st) => (st.id === id ? { ...st, ...partial } : st)),
          }),
        })),

      setStorePhoto: (storeId, field, photo) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            stores: s.report.stores.map((st) =>
              st.id === storeId ? { ...st, [field]: photo } : st,
            ),
          }),
        })),

      removeStorePhoto: (storeId, field) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            stores: s.report.stores.map((st) =>
              st.id === storeId ? { ...st, [field]: undefined } : st,
            ),
          }),
        })),

      addItem: () =>
        set((s) => ({
          report: updateTimestamp({ ...s.report, items: [...s.report.items, createEmptyItem()] }),
        })),

      removeItem: (id) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            items: s.report.items.filter((it) => it.id !== id),
          }),
        })),

      updateItem: (id, partial) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            items: s.report.items.map((it) => (it.id === id ? { ...it, ...partial } : it)),
          }),
        })),

      addGoodsPhotos: (photos) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            goodsPhotos: [...s.report.goodsPhotos, ...photos].slice(0, 4),
          }),
        })),

      removeGoodsPhoto: (id) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            goodsPhotos: s.report.goodsPhotos.filter((p) => p.id !== id),
          }),
        })),

      addReceiptPhotos: (photos) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            receipt: { ...s.report.receipt, photos: [...s.report.receipt.photos, ...photos] },
          }),
        })),

      removeReceiptPhoto: (id) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            receipt: {
              ...s.report.receipt,
              photos: s.report.receipt.photos.filter((p) => p.id !== id),
            },
          }),
        })),

      setReceiptNumber: (num) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            receipt: { ...s.report.receipt, receiptNumber: num },
          }),
        })),

      setReceiptTotal: (total) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            receipt: { ...s.report.receipt, receiptTotal: total },
          }),
        })),

      setBranchCode: (code) =>
        set((s) => {
          const receipt = { ...s.report.receipt, branchCode: code };
          receipt.receiptNumber = generateReceiptNumber(receipt);
          return { report: updateTimestamp({ ...s.report, receipt }) };
        }),

      setBranchName: (name) =>
        set((s) => {
          const receipt = { ...s.report.receipt, branchName: name };
          receipt.receiptNumber = generateReceiptNumber(receipt);
          return { report: updateTimestamp({ ...s.report, receipt }) };
        }),

      setHandover: (partial) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            handover: { ...s.report.handover, ...partial },
          }),
        })),

      setHandoverPhoto: (photo) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            handover: { ...s.report.handover, moneyPhoto: photo },
          }),
        })),

      removeHandoverPhoto: () =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            handover: { ...s.report.handover, moneyPhoto: undefined },
          }),
        })),

      setHandoverPicPhoto: (photo) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            handover: { ...s.report.handover, picPhoto: photo },
          }),
        })),

      removeHandoverPicPhoto: () =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            handover: { ...s.report.handover, picPhoto: undefined },
          }),
        })),

      setCreatedBy: (partial) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            createdBy: { ...s.report.createdBy, ...partial },
          }),
        })),

      setApprovedBy: (partial) =>
        set((s) => ({
          report: updateTimestamp({
            ...s.report,
            approvedBy: { ...s.report.approvedBy, ...partial },
          }),
        })),

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),

      loadDraft: () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.state?.report) {
              set({
                report: parsed.state.report,
                hasDraft: false,
                startedFromDraft: true,
              });
            }
          } catch {
            // ignore
          }
        }
      },

      startFresh: () => {
        set({ report: createEmptyReport(), currentStep: 0, hasDraft: false, startedFromDraft: false });
      },

      submittedReports: [],

      submitReport: () => {
        const code = get().report.reportCode || generateReportCode(get().report.reportDate);
        const submitted = updateTimestamp({
          ...get().report,
          submittedAt: new Date().toISOString(),
          reportCode: code,
        });
        set((s) => ({
          report: submitted,
          submittedReports: [submitted, ...s.submittedReports],
        }));
      },

      resetReport: () => {
        set({ report: createEmptyReport(), currentStep: 0, hasDraft: false, startedFromDraft: false });
      },

      deleteSubmittedReport: (code) =>
        set((s) => ({
          submittedReports: s.submittedReports.filter((r) => r.reportCode !== code),
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        report: state.report,
        currentStep: state.currentStep,
        submittedReports: state.submittedReports,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.report && state.report.activityType) {
          state.hasDraft = true;
        }
      },
    },
  ),
);
