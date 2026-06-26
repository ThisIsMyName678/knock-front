import { backendRequest } from '@/lib/backend';
import type { BackendFeedModule, BackendFeedResourceType } from '@/lib/api/feed';

// ─── Response shapes ────────────────────────────────────────────
export type BackendNotificationItem = {
  id: string;
  type: BackendFeedModule;
  eventType: string;
  title: string;
  createdAt: string;
  referenceType: BackendFeedResourceType | null;
  referenceId: string | null;
  propertyId: string | null;
  projectId: string | null;
};

export type NotificationsCursor = { createdAt: string; id: string } | null;

export type ListNotificationsResponse = {
  items: BackendNotificationItem[];
  nextCursor: NotificationsCursor;
  newItemsCount: number;
};

// ─── API functions ──────────────────────────────────────────────
export function listNotifications(params: {
  cursor?: NotificationsCursor;
  since?: string;
  limit?: number;
}): Promise<ListNotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params.cursor) {
    searchParams.set('cursorCreatedAt', params.cursor.createdAt);
    searchParams.set('cursorId', params.cursor.id);
  }
  if (params.since) searchParams.set('since', params.since);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return backendRequest<ListNotificationsResponse>(`/notifications${query ? `?${query}` : ''}`);
}
