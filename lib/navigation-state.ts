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
