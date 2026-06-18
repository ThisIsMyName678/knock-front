import { backendRequest } from '@/lib/backend';
import type { DashboardCalendarEvent } from '@/lib/mocks/dashboard';
import { toLocalDateKey } from '@/lib/mocks/dashboard';

export type CalendarRangeFilters = {
  propertyId?: string;
  projectId?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  kind?: string | null;
  startAt: string;
  propertyId?: string | null;
  projectId?: string | null;
  contactId?: string | null;
  reminderMinutesBefore?: number | null;
};

export type BackendCalendarEvent = {
  id: string;
  organizationId: string;
  title: string;
  kind: string | null;
  startAt: string;
  scopeType: 'PROJECT' | 'PROPERTY' | null;
  projectId: string | null;
  propertyId: string | null;
  contactId: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  reminderMinutesBefore: number | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export function getCalendarEvents(
  from: Date,
  to: Date,
  filters: CalendarRangeFilters = {},
): Promise<DashboardCalendarEvent[]> {
  const q = new URLSearchParams();
  q.set('from', toLocalDateKey(from));
  q.set('to', toLocalDateKey(to));
  if (filters.propertyId) q.set('propertyId', filters.propertyId);
  if (filters.projectId) q.set('projectId', filters.projectId);
  return backendRequest<DashboardCalendarEvent[]>(`/calendar/events?${q.toString()}`);
}

export function getAgendaForDay(
  date: Date,
  filters: CalendarRangeFilters = {},
): Promise<DashboardCalendarEvent[]> {
  const q = new URLSearchParams();
  q.set('date', toLocalDateKey(date));
  if (filters.propertyId) q.set('propertyId', filters.propertyId);
  if (filters.projectId) q.set('projectId', filters.projectId);
  return backendRequest<DashboardCalendarEvent[]>(`/calendar/agenda?${q.toString()}`);
}

export function createEvent(payload: CreateCalendarEventInput): Promise<BackendCalendarEvent> {
  return backendRequest<BackendCalendarEvent>('/calendar/events', {
    method: 'POST',
    body: payload,
  });
}

export function updateEventStatus(
  id: string,
  status: BackendCalendarEvent['status'],
): Promise<BackendCalendarEvent> {
  return backendRequest<BackendCalendarEvent>(`/calendar/events/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}
