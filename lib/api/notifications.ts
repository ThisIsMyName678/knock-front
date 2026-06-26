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
