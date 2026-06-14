import { backendRequest } from '@/lib/backend';

// ─── Backend enum literals ──────────────────────────────────────
export type BackendFeedModule =
  | 'DASHBOARD'
  | 'PROJECTS'
  | 'PROPERTIES'
  | 'CONTRACTS'
  | 'PAYMENTS'
  | 'MAINTENANCE'
  | 'DOCUMENTS'
  | 'TASKS'
  | 'CONTACTS'
  | 'REPORTS'
  | 'MESSAGES'
  | 'CALENDAR'
  | 'SETTINGS';

export type BackendFeedResourceType =
  | 'ORGANIZATION'
  | 'PROJECT'
  | 'PROPERTY'
  | 'CONTRACT'
  | 'DOCUMENT'
  | 'PAYMENT'
  | 'MAINTENANCE_REQUEST'
  | 'TASK'
  | 'CONTACT'
  | 'EVENT'
  | 'NOTE';

// ─── Response shapes ────────────────────────────────────────────
export type BackendFeedEvent = {
  id: string;
  type: BackendFeedModule;
  eventType: string;
  title: string;
  createdAt: string;
  referenceType: BackendFeedResourceType | null;
  referenceId: string | null;
};

// ─── UI shapes ───────────────────────────────────────────────────
export type FeedKind = 'task' | 'payment' | 'message' | 'contract' | 'document';

export type FeedItem = {
  id: string;
  kind: FeedKind;
  title: string;
  dateIso: string;
  targetId?: string;
};

const MODULE_TO_KIND: Record<BackendFeedModule, FeedKind | null> = {
  TASKS: 'task',
  PAYMENTS: 'payment',
  CONTRACTS: 'contract',
  DOCUMENTS: 'document',
  CONTACTS: 'message',
  MESSAGES: 'message',
  DASHBOARD: null,
  PROJECTS: null,
  PROPERTIES: null,
  MAINTENANCE: null,
  REPORTS: null,
  CALENDAR: null,
  SETTINGS: null,
};

// ─── API functions ──────────────────────────────────────────────
export function listPropertyFeed(propertyId: string, type?: BackendFeedModule): Promise<BackendFeedEvent[]> {
  const suffix = type ? `?type=${type}` : '';
  return backendRequest<BackendFeedEvent[]>(`/properties/${propertyId}/feed${suffix}`);
}

export function listProjectFeed(projectId: string, type?: BackendFeedModule): Promise<BackendFeedEvent[]> {
  const suffix = type ? `?type=${type}` : '';
  return backendRequest<BackendFeedEvent[]>(`/projects/${projectId}/feed${suffix}`);
}

export function feedEventToItem(event: BackendFeedEvent): FeedItem | null {
  const kind = MODULE_TO_KIND[event.type];
  if (!kind) return null;
  return {
    id: event.id,
    kind,
    title: event.title,
    dateIso: event.createdAt,
    targetId: event.referenceId ?? undefined,
  };
}
