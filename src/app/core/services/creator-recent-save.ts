import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type RecentSaveKind = 'COURSE' | 'MODULE' | 'LESSON';

export type RecentSave = {
  kind: RecentSaveKind;
  title: string;
  at: string; // ISO
  courseId?: number | null;
  moduleId?: number | null;
  lessonId?: number | null;
};

@Injectable({
  providedIn: 'root',
})
export class CreatorRecentSaveService {
  private readonly changedSubject = new Subject<void>();
  readonly changed$: Observable<void> = this.changedSubject.asObservable();

  private storageKey(userId: string): string {
    return `gastro_creator_recent_save:${userId}`;
  }

  getRecent(userId: string): RecentSave | null {
    if (!userId) return null;
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.kind !== 'COURSE' && parsed.kind !== 'MODULE' && parsed.kind !== 'LESSON') return null;
      if (typeof parsed.title !== 'string') return null;
      if (typeof parsed.at !== 'string') return null;
      return parsed as RecentSave;
    } catch {
      return null;
    }
  }

  setRecent(userId: string, recent: RecentSave): void {
    if (!userId) return;
    if (!recent || typeof recent !== 'object') return;
    if (!recent.title || typeof recent.title !== 'string') return;
    if (!recent.at || typeof recent.at !== 'string') return;

    try {
      localStorage.setItem(this.storageKey(userId), JSON.stringify(recent));
      this.changedSubject.next();
    } catch {
      // ignore
    }
  }

  clear(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(this.storageKey(userId));
      this.changedSubject.next();
    } catch {
      // ignore
    }
  }
}
