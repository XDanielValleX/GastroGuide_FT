import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  CourseCategory,
  CourseState,
  CuisineType,
  DifficultyLevel,
} from './course';

export type DraftLessonVm = {
  id?: number;
  title: string;
  content: string;
};

export type DraftModuleVm = {
  id?: number;
  title: string;
  description: string;
  lessons: DraftLessonVm[];
};

export type CreatorCourseDraft = {
  draftId: string;
  courseId: number | null;

  title: string;
  description: string;
  state: CourseState;

  difficultyLevel: DifficultyLevel;
  category: CourseCategory;
  cuisineType: CuisineType;

  coverImageUrl: string;
  tags: string;
  language: string;

  modules: DraftModuleVm[];

  createdAt: string; // ISO
  updatedAt: string; // ISO
};

@Injectable({
  providedIn: 'root',
})
export class CreatorCourseDraftsService {
  private readonly changedSubject = new Subject<void>();
  readonly changed$: Observable<void> = this.changedSubject.asObservable();

  listDrafts(userId: string): CreatorCourseDraft[] {
    this.maybeMigrateLegacyDrafts(userId);
    const drafts = this.read(userId);
    return drafts.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  upsertDraft(userId: string, draft: CreatorCourseDraft): void {
    if (!userId) return;

    const drafts = this.read(userId);
    const existingIndex = drafts.findIndex((d) => d.draftId === draft.draftId);

    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }

    this.write(userId, drafts);
    this.changedSubject.next();
  }

  deleteDraft(userId: string, draftId: string): void {
    if (!userId) return;
    const drafts = this.read(userId).filter((d) => d.draftId !== draftId);
    this.write(userId, drafts);
    this.changedSubject.next();
  }

  generateDraftId(): string {
    const randomUUID = (globalThis as any)?.crypto?.randomUUID;
    if (typeof randomUUID === 'function') return randomUUID.call((globalThis as any).crypto);
    return `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  private storageKey(userId: string): string {
    return `gastro_creator_drafts:${userId}`;
  }

  private maybeMigrateLegacyDrafts(stableUserId: string): void {
    // Legacy bug: drafts were stored under JWT `jti` (token id), which changes per login/refresh.
    // If we can still read the current token's `jti`, migrate any drafts to the stable key.
    if (!stableUserId) return;

    const token = localStorage.getItem('gastro_token');
    if (!token) return;

    const legacyTokenId = this.extractJwtJti(token);
    if (!legacyTokenId) return;
    if (legacyTokenId === stableUserId) return;

    const legacyKey = this.storageKey(legacyTokenId);
    const currentKey = this.storageKey(stableUserId);
    const legacyRaw = localStorage.getItem(legacyKey);
    if (!legacyRaw) return;

    const legacyDrafts = this.safeParseDrafts(legacyRaw);
    if (legacyDrafts.length === 0) return;

    const currentDrafts = this.read(stableUserId);
    const merged: CreatorCourseDraft[] = [...currentDrafts];
    const seen = new Set(merged.map((d) => d.draftId));

    for (const d of legacyDrafts) {
      if (!d?.draftId) continue;
      if (seen.has(d.draftId)) continue;
      merged.push(d);
      seen.add(d.draftId);
    }

    this.write(stableUserId, merged);
    // Clean up legacy key to avoid confusion.
    localStorage.removeItem(legacyKey);
  }

  private safeParseDrafts(raw: string): CreatorCourseDraft[] {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as CreatorCourseDraft[];
    } catch {
      return [];
    }
  }

  private extractJwtJti(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = atob(padded);
      const obj = JSON.parse(json);
      return typeof obj?.jti === 'string' ? obj.jti : null;
    } catch {
      return null;
    }
  }

  private read(userId: string): CreatorCourseDraft[] {
    try {
      const raw = localStorage.getItem(this.storageKey(userId));
      if (!raw) return [];
      return this.safeParseDrafts(raw);
    } catch {
      return [];
    }
  }

  private write(userId: string, drafts: CreatorCourseDraft[]): void {
    try {
      localStorage.setItem(this.storageKey(userId), JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }
}
