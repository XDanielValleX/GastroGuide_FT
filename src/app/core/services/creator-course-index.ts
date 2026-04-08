import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CreatorCourseIndexService {
  private storageKey(userId: string): string {
    return `gastro_creator_course_ids:${userId}`;
  }

  listCourseIds(userId: string): number[] {
    if (!userId) return [];
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v) && v > 0);
    } catch {
      return [];
    }
  }

  addCourseId(userId: string, courseId: number): void {
    if (!userId) return;
    const id = Number(courseId);
    if (!Number.isFinite(id) || id <= 0) return;

    const existing = this.listCourseIds(userId);
    if (existing.includes(id)) return;

    const next = [id, ...existing].slice(0, 200);
    try {
      localStorage.setItem(this.storageKey(userId), JSON.stringify(next));
    } catch {
      // ignore
    }
  }
}
