import { backendRequest } from '@/lib/backend';
import type { DashboardCalendarEvent } from '@/lib/mocks/dashboard';
import { toLocalDateKey } from '@/lib/mocks/dashboard';

export type CalendarRangeFilters = {
  propertyId?: string;
  projectId?: string;
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
