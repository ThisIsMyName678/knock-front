/**
 * Mock assets/projects for lists and dashboard (shared with EntityListScreen).
 */

export type OccupancyStatus = 'rented' | 'vacant' | 'construction';

export type UserRole = { kind: 'owner' } | { kind: 'tenant' } | { kind: 'custom'; label: string };

export type ProjectEntity = {
  id: string;
  kind: 'project';
  name: string;
  address: string;
  assetCount: number;
  rentedCount: number;
  occupancy: OccupancyStatus;
  role: UserRole;
};

export type AssetEntity = {
  id: string;
  kind: 'asset';
  name: string;
  address: string;
  occupancy: OccupancyStatus;
  role: UserRole;
  /** null = נכס ללא שיוך פרויקט (מוצג במסך הראשי של פרויקטים למנוי אנטרפרייז) */
  projectId: string | null;
  /** מספר קומה (תצוגה בלבד ב-mock) */
  floorNumber?: string;
  /** גודל במ״ר (תצוגה בלבד ב-mock) */
  sizeSqm?: string;
};

export type Entity = ProjectEntity | AssetEntity;

export const MOCK_PROJECTS: ProjectEntity[] = [
  { id: 'p1', kind: 'project', name: 'מגדלי הים', address: 'הרצל 10, תל אביב', assetCount: 12, rentedCount: 8, occupancy: 'rented', role: { kind: 'owner' } },
  { id: 'p2', kind: 'project', name: 'גני הדר', address: 'ביאליק 3, ר״ג', assetCount: 7, rentedCount: 5, occupancy: 'rented', role: { kind: 'custom', label: 'מנהל פרויקט' } },
  { id: 'p3', kind: 'project', name: 'בית ספיר', address: 'המלך ג׳ורג׳ 5, ירושלים', assetCount: 4, rentedCount: 0, occupancy: 'vacant', role: { kind: 'owner' } },
  { id: 'p4', kind: 'project', name: 'פרויקט חוף', address: 'הנמל 2, חיפה', assetCount: 9, rentedCount: 0, occupancy: 'construction', role: { kind: 'custom', label: 'מנהל אתר' } },
  { id: 'p5', kind: 'project', name: 'מתחם הפארק', address: 'רוטשילד 22, ת״א', assetCount: 3, rentedCount: 1, occupancy: 'vacant', role: { kind: 'owner' } },
  { id: 'p6', kind: 'project', name: 'שיכון דרום', address: 'שד׳ ירושלים 5, באר שבע', assetCount: 18, rentedCount: 14, occupancy: 'rented', role: { kind: 'tenant' } },
];

export const MOCK_ASSETS: AssetEntity[] = [
  { id: 'a1', kind: 'asset', name: 'דירה 4B', address: 'הרצל 10, תל אביב', occupancy: 'rented', role: { kind: 'owner' }, projectId: 'p1', floorNumber: '4', sizeSqm: '95' },
  { id: 'a2', kind: 'asset', name: 'דירה 7A', address: 'הרצל 10, תל אביב', occupancy: 'vacant', role: { kind: 'owner' }, projectId: 'p1', floorNumber: '7', sizeSqm: '110' },
  { id: 'a3', kind: 'asset', name: 'בית פרטי', address: 'הנרי דנאה 3, נהריה', occupancy: 'rented', role: { kind: 'tenant' }, projectId: null },
  { id: 'a4', kind: 'asset', name: 'משרד 201', address: 'ביאליק 3, ר״ג', occupancy: 'vacant', role: { kind: 'custom', label: 'מנהל נכס' }, projectId: 'p2' },
  { id: 'a5', kind: 'asset', name: 'חנות קרקע', address: 'דיזנגוף 120, ת״א', occupancy: 'rented', role: { kind: 'owner' }, projectId: null },
  { id: 'a6', kind: 'asset', name: 'דירת גג', address: 'שינקין 4, ת״א', occupancy: 'construction', role: { kind: 'owner' }, projectId: null },
];

export function assetsStandaloneForEnterpriseList(): AssetEntity[] {
  return MOCK_ASSETS.filter((a) => a.projectId == null);
}

export function assetsForProject(projectId: string): AssetEntity[] {
  return MOCK_ASSETS.filter((a) => a.projectId === projectId);
}

/** נכסים שאינם משויכים לאף פרויקט */
export function getUnassignedAssets(): AssetEntity[] {
  return MOCK_ASSETS.filter((a) => a.projectId == null);
}

/** שיוך נכס לפרויקט (mock — מוטציה ישירה) */
export function linkAssetToProject(assetId: string, projectId: string | null): boolean {
  const a = MOCK_ASSETS.find((x) => x.id === assetId);
  if (!a) return false;
  const oldPid = a.projectId;
  a.projectId = projectId;
  const syncProjectCount = (pid: string | null) => {
    if (!pid) return;
    const proj = MOCK_PROJECTS.find((p) => p.id === pid);
    if (proj) {
      proj.assetCount = MOCK_ASSETS.filter((x) => x.projectId === pid).length;
    }
  };
  syncProjectCount(oldPid);
  syncProjectCount(projectId);
  return true;
}

/** מושכרים / סה״כ נכסים (mock) */
export function assetOccupancyStats() {
  const total = MOCK_ASSETS.length;
  const rented = MOCK_ASSETS.filter((a) => a.occupancy === 'rented').length;
  return { rented, total };
}
