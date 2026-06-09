import { backendRequest } from '@/lib/backend';
import type {
  TaskKind,
  TaskPriority,
  WorkflowStatus,
  TaskListRow,
  TaskMessage,
} from '@/lib/mocks/tasks';

// ─── Backend enum literals ──────────────────────────────────────
export type BackendTaskType =
  | 'MAINTENANCE'
  | 'EXECUTION'
  | 'COLLECTION'
  | 'CONTRACT_RENEWAL';

export type BackendTaskUrgency = 'NORMAL' | 'URGENT';

export type BackendTaskStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type BackendMediaType = 'IMAGE' | 'VIDEO';

// ─── Response shapes ────────────────────────────────────────────
export type BackendTaskListItem = {
  id: string;
  title: string;
  taskType: BackendTaskType;
  urgency: BackendTaskUrgency;
  status: BackendTaskStatus;
  projectId: string | null;
  propertyId: string | null;
  scopeLabel: string;
  assignedContactId: string | null;
  assignedContactName: string | null;
  assignedContactPhone: string | null;
  startDate: string;       // YYYY-MM-DD
  dueDate: string | null;  // YYYY-MM-DD
  createdAt: string;
};

export type BackendTaskMessage = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: BackendMediaType | null;
  createdAt: string;
  author: { id: string; displayName: string | null; avatarUrl: string | null };
};

export type BackendTaskDetail = BackendTaskListItem & {
  description: string | null;
  cost: string | null;
  handlingTime: number | null;
  paymentId: string | null;
  createdByUserId: string;
  messages: BackendTaskMessage[];
  statusHistory: Array<{
    id: string;
    oldStatus: BackendTaskStatus;
    newStatus: BackendTaskStatus;
    changedAt: string;
    changedBy: { id: string; displayName: string | null };
  }>;
};

export type BackendTaskListResponse = {
  data: BackendTaskListItem[];
  total: number;
  page: number;
  limit: number;
};

export type BackendDashboardSummary = {
  newCount: number;
  inProgressCount: number;
  total: number;
};

// ─── Request shapes ─────────────────────────────────────────────
export type CreateTaskInput = {
  title: string;
  taskType: BackendTaskType;
  urgency?: BackendTaskUrgency;
  status?: BackendTaskStatus;
  projectId?: string | null;
  propertyId?: string | null;
  assignedContactId?: string | null;
  paymentId?: string | null;
  description?: string | null;
  cost?: string | null;
  handlingTime?: number | null;
  startDate?: string | null;  // ISO YYYY-MM-DD
  dueDate?: string | null;    // ISO YYYY-MM-DD
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type CreateTaskMessageInput = {
  content: string;
  mediaUrl?: string | null;
  mediaType?: BackendMediaType | null;
};

export type ListTasksParams = {
  search?: string;
  taskType?: BackendTaskType;
  urgency?: BackendTaskUrgency;
  status?: BackendTaskStatus;
  projectId?: string;
  propertyId?: string;
  assignedContactId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

// ─── API functions ──────────────────────────────────────────────
export function listTasks(params: ListTasksParams = {}): Promise<BackendTaskListResponse> {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set('search', params.search.trim());
  if (params.taskType) q.set('taskType', params.taskType);
  if (params.urgency) q.set('urgency', params.urgency);
  if (params.status) q.set('status', params.status);
  if (params.projectId) q.set('projectId', params.projectId);
  if (params.propertyId) q.set('propertyId', params.propertyId);
  if (params.assignedContactId) q.set('assignedContactId', params.assignedContactId);
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return backendRequest<BackendTaskListResponse>(`/tasks${suffix}`);
}

export function getTask(id: string): Promise<BackendTaskDetail> {
  return backendRequest<BackendTaskDetail>(`/tasks/${id}`);
}

export function createTask(input: CreateTaskInput): Promise<BackendTaskListItem> {
  return backendRequest<BackendTaskListItem>('/tasks', { method: 'POST', body: input });
}

export function updateTask(id: string, input: UpdateTaskInput): Promise<BackendTaskListItem> {
  return backendRequest<BackendTaskListItem>(`/tasks/${id}`, { method: 'PATCH', body: input });
}

export function deleteTask(id: string): Promise<unknown> {
  return backendRequest<unknown>(`/tasks/${id}`, { method: 'DELETE' });
}

export function listTaskMessages(
  taskId: string,
  page = 1,
  limit = 20,
): Promise<{ data: BackendTaskMessage[]; total: number; page: number; limit: number }> {
  return backendRequest(`/tasks/${taskId}/messages?page=${page}&limit=${limit}`);
}

export function createTaskMessage(
  taskId: string,
  input: CreateTaskMessageInput,
): Promise<BackendTaskMessage> {
  return backendRequest<BackendTaskMessage>(`/tasks/${taskId}/messages`, {
    method: 'POST',
    body: input,
  });
}

export function getTasksDashboardSummary(): Promise<BackendDashboardSummary> {
  return backendRequest<BackendDashboardSummary>('/tasks/dashboard-summary');
}

// ─── Mappers: backend ↔ client ──────────────────────────────────
export function backendTaskTypeToClient(t: BackendTaskType): TaskKind {
  switch (t) {
    case 'MAINTENANCE':       return 'maintenance';
    case 'EXECUTION':         return 'execution';
    case 'COLLECTION':        return 'collection_payment';
    case 'CONTRACT_RENEWAL':  return 'contract_renewal';
  }
}

export function clientTaskTypeToBackend(k: TaskKind): BackendTaskType {
  switch (k) {
    case 'maintenance':        return 'MAINTENANCE';
    case 'execution':          return 'EXECUTION';
    case 'collection_payment': return 'COLLECTION';
    case 'contract_renewal':   return 'CONTRACT_RENEWAL';
  }
}

export function backendUrgencyToClientPriority(u: BackendTaskUrgency): TaskPriority {
  return u === 'URGENT' ? 'urgent' : 'medium';
}

export function clientPriorityToBackendUrgency(p: TaskPriority): BackendTaskUrgency {
  return p === 'urgent' ? 'URGENT' : 'NORMAL';
}

export function backendStatusToClient(s: BackendTaskStatus): WorkflowStatus {
  switch (s) {
    case 'OPEN':        return 'open';
    case 'IN_PROGRESS': return 'in_progress';
    case 'COMPLETED':   return 'completed';
    case 'CANCELLED':   return 'cancelled';
  }
}

export function clientStatusToBackend(s: WorkflowStatus): BackendTaskStatus | null {
  switch (s) {
    case 'open':        return 'OPEN';
    case 'in_progress': return 'IN_PROGRESS';
    case 'completed':   return 'COMPLETED';
    case 'cancelled':   return 'CANCELLED';
    case 'not_started': return null;
  }
}

function isoToDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function ddMmYyyyToIso(date: string): string | null {
  const parts = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!parts) return null;
  const [, dd, mm, yyyy] = parts;
  return `${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
}

export { isoToDdMmYyyy, ddMmYyyyToIso };

export function backendTaskToListRow(task: BackendTaskListItem): TaskListRow {
  return {
    id: task.id,
    title: task.title,
    taskKind: backendTaskTypeToClient(task.taskType),
    priority: backendUrgencyToClientPriority(task.urgency),
    workflowStatus: backendStatusToClient(task.status),
    linkKind: task.projectId ? 'project' : 'asset',
    linkId: task.projectId ?? task.propertyId ?? '',
    linkLabel: task.scopeLabel,
    assigneeName: task.assignedContactName ?? '',
    assigneeHasUser: false,
    createdBy: '',
    isMine: false,
    dueDate: isoToDdMmYyyy(task.dueDate),
    startDate: isoToDdMmYyyy(task.startDate),
    messages: [],
  };
}

export function backendTaskDetailToRow(task: BackendTaskDetail): TaskListRow {
  const messages: TaskMessage[] = task.messages.map((m) => ({
    id: m.id,
    text: m.content,
    imageUri: m.mediaType === 'IMAGE' && m.mediaUrl ? m.mediaUrl : undefined,
    authorName: m.author.displayName ?? 'Unknown',
    sentAt: new Date(m.createdAt).toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return {
    ...backendTaskToListRow(task),
    costNotes: task.cost ?? undefined,
    messages,
  };
}
