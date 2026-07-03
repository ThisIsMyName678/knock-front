import type { CreatePaymentInput } from '@/lib/api/payments';

type ProjectCtx = { projectId: string; projectName: string };

// globalThis מבטיח singleton יחיד גם אם המודול נטען בכמה chunks
const KEY = '__knock_preloaded_project__';

declare global {
  // eslint-disable-next-line no-var
  var __knock_preloaded_project__: ProjectCtx | null | undefined;
}

export function setPreloadedProject(projectId: string, projectName: string): void {
  (globalThis as any)[KEY] = { projectId, projectName };
}

export function consumePreloadedProject(): ProjectCtx | null {
  const ctx = ((globalThis as any)[KEY] as ProjectCtx | null | undefined) ?? null;
  (globalThis as any)[KEY] = null;
  return ctx;
}

// תשלומים שתועדו בתוך אשף יצירת חוזה לפני שהחוזה עצמו קיים בשרת (אין עדיין UUID אמיתי
// להעביר כ-contractId). נשמרים בתור עד שהחוזה נשמר, ואז נוצרים בפועל עם ה-contractId האמיתי.
export type DraftContractPayment = {
  id: string;
  summaryLabel: string;
  input: Omit<CreatePaymentInput, 'contractId'>;
};

const DRAFTS_KEY = '__knock_draft_contract_payments__';

declare global {
  // eslint-disable-next-line no-var
  var __knock_draft_contract_payments__: DraftContractPayment[] | undefined;
}

function draftsArray(): DraftContractPayment[] {
  if (!(globalThis as any)[DRAFTS_KEY]) (globalThis as any)[DRAFTS_KEY] = [];
  return (globalThis as any)[DRAFTS_KEY];
}

export function addDraftContractPayment(draft: DraftContractPayment): void {
  draftsArray().push(draft);
}

export function getDraftContractPayments(): DraftContractPayment[] {
  return [...draftsArray()];
}

export function removeDraftContractPayment(id: string): void {
  const arr = draftsArray();
  const idx = arr.findIndex((d) => d.id === id);
  if (idx >= 0) arr.splice(idx, 1);
}

export function clearDraftContractPayments(): void {
  (globalThis as any)[DRAFTS_KEY] = [];
}
