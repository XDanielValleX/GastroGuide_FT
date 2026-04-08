import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { CourseDto, CourseService } from '../../../core/services/course';
import { CreatorCourseIndexService } from '../../../core/services/creator-course-index';
import {
  CreatorRecentSaveService,
  RecentSave,
  RecentSaveKind,
} from '../../../core/services/creator-recent-save';
import {
  CreatorCourseDraft,
  CreatorCourseDraftsService,
} from '../../../core/services/creator-course-drafts';

@Component({
  selector: 'app-creator-saved-courses-panel',
  standalone: false,
  templateUrl: './creator-saved-courses-panel.html',
  styleUrl: './creator-saved-courses-panel.css',
})
export class CreatorSavedCoursesPanelComponent implements OnInit, OnChanges, OnDestroy {
  private readonly courseService = inject(CourseService);
  private readonly draftsService = inject(CreatorCourseDraftsService);
  private readonly courseIndex = inject(CreatorCourseIndexService);
  private readonly recentSaveService = inject(CreatorRecentSaveService);
  private readonly cdr = inject(ChangeDetectorRef);

  // NOTE: We intentionally do NOT load a "my courses" list here,
  // because the backend in this workspace does not expose an endpoint
  // for "courses created by the authenticated creator".

  @Input() createdCourseId: number | null = null;
  @Input() modulesCount = 0;
  @Input() lessonsCount = 0;
  @Input() currentUserId: string | null = null;

  @Output() selectDraft = new EventEmitter<CreatorCourseDraft>();

  savedCourseSnapshot: (CourseDto & { fetchedAt: Date }) | null = null;
  loadingSavedSnapshot = false;
  savedSnapshotError: string | null = null;

  activeTab: 'COURSES' | 'MODULES' | 'LESSONS' = 'COURSES';

  indexedCourses: Array<CourseDto & { fetchedAt: Date }> = [];
  loadingIndexedCourses = false;
  indexedCoursesError: string | null = null;

  publishedCourses: CourseDto[] = [];
  loadingPublishedCourses = false;
  publishedCoursesError: string | null = null;
  private publishedLoaded = false;

  drafts: CreatorCourseDraft[] = [];
  recentDraft: CreatorCourseDraft | null = null;
  recentSave: RecentSave | null = null;
  private draftsSubscription: Subscription | null = null;
  private recentSaveSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.refreshSavedSnapshot();
    this.refreshDrafts();
    this.refreshRecentSave();
    this.refreshIndexedCourses();
    this.refreshPublishedFallback();

    this.draftsSubscription = this.draftsService.changed$.subscribe(() => {
      this.refreshDrafts();
      this.refreshPublishedFallback();
    });

    this.recentSaveSubscription = this.recentSaveService.changed$.subscribe(() => {
      this.refreshRecentSave();
    });
  }

  ngOnDestroy(): void {
    this.draftsSubscription?.unsubscribe();
    this.draftsSubscription = null;
    this.recentSaveSubscription?.unsubscribe();
    this.recentSaveSubscription = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['createdCourseId']) {
      this.refreshSavedSnapshot();
    }

    if (changes['currentUserId']) {
      this.refreshDrafts();
      this.refreshRecentSave();
      this.refreshSavedSnapshot();
      this.refreshIndexedCourses();
      this.refreshPublishedFallback();
    }
  }

  refreshAll(): void {
    this.refreshSavedSnapshot();
    this.refreshDrafts();
    this.refreshRecentSave();
    this.refreshIndexedCourses();
    this.refreshPublishedFallback();
  }

  setTab(tab: 'COURSES' | 'MODULES' | 'LESSONS'): void {
    this.activeTab = tab;
    this.requestViewUpdate();
  }

  refreshRecentSave(): void {
    if (!this.currentUserId) {
      this.recentSave = null;
      this.requestViewUpdate();
      return;
    }

    this.recentSave = this.recentSaveService.getRecent(this.currentUserId);

    // Keep the panel context-aware: if the last action was saving a module/lesson,
    // default to the corresponding tab so the user sees what they just saved.
    if (this.recentSave?.kind === 'MODULE') this.activeTab = 'MODULES';
    if (this.recentSave?.kind === 'LESSON') this.activeTab = 'LESSONS';
    if (this.recentSave?.kind === 'COURSE') this.activeTab = 'COURSES';

    this.requestViewUpdate();
  }

  recentKindLabel(kind: RecentSaveKind): string {
    if (kind === 'COURSE') return 'Curso';
    if (kind === 'MODULE') return 'Módulo';
    return 'Lección';
  }

  get draftForModulesAndLessons(): CreatorCourseDraft | null {
    return this.recentDraft || (this.drafts.length > 0 ? this.drafts[0] : null);
  }

  get moduleItems(): Array<{ title: string; saved: boolean; lessonsCount: number }> {
    const draft = this.draftForModulesAndLessons;
    if (!draft) return [];
    return (draft.modules || []).map((m) => ({
      title: m.title || 'Sin título',
      saved: typeof m.id === 'number' && m.id > 0,
      lessonsCount: (m.lessons || []).length,
    }));
  }

  get lessonItems(): Array<{ title: string; moduleTitle: string; saved: boolean }> {
    const draft = this.draftForModulesAndLessons;
    if (!draft) return [];
    const items: Array<{ title: string; moduleTitle: string; saved: boolean }> = [];
    for (const m of draft.modules || []) {
      const moduleTitle = m.title || 'Módulo sin título';
      for (const l of m.lessons || []) {
        items.push({
          title: l.title || 'Sin título',
          moduleTitle,
          saved: typeof l.id === 'number' && l.id > 0,
        });
      }
    }
    return items;
  }

  refreshIndexedCourses(): void {
    if (this.loadingIndexedCourses) return;
    this.indexedCoursesError = null;

    if (!this.currentUserId) {
      this.indexedCourses = [];
      this.requestViewUpdate();
      this.refreshPublishedFallback();
      return;
    }

    const ids = this.courseIndex.listCourseIds(this.currentUserId).slice(0, 30);
    if (ids.length === 0) {
      this.indexedCourses = [];
      this.requestViewUpdate();
      this.refreshPublishedFallback();
      return;
    }

    this.loadingIndexedCourses = true;
    this.requestViewUpdate();

    forkJoin(
      ids.map((id) =>
        this.courseService.getCourseById(id).pipe(
          catchError(() => of(null))
        )
      )
    )
      .pipe(
        finalize(() => {
          this.loadingIndexedCourses = false;
          this.requestViewUpdate();
          this.refreshPublishedFallback();
        })
      )
      .subscribe({
        next: (courses) => {
          const next = courses
            .filter((c): c is CourseDto => !!c)
            .map((c) => ({ ...c, fetchedAt: new Date() }));
          this.indexedCourses = next;
          this.requestViewUpdate();
          this.refreshPublishedFallback();
        },
        error: () => {
          this.indexedCoursesError = 'No se pudieron cargar tus cursos guardados.';
          this.indexedCourses = [];
          this.requestViewUpdate();
          this.refreshPublishedFallback();
        },
      });
  }

  refreshDrafts(): void {
    if (!this.currentUserId) {
      this.drafts = [];
      this.recentDraft = null;
      this.requestViewUpdate();
      return;
    }

    this.drafts = this.draftsService.listDrafts(this.currentUserId);
    this.recomputeRecentDraft();
    this.requestViewUpdate();
    this.refreshPublishedFallback();
  }

  private refreshPublishedFallback(): void {
    if (this.loadingPublishedCourses) return;

    // Only load published when there is nothing else to show.
    const hasSomething = this.drafts.length > 0 || this.indexedCourses.length > 0;
    if (hasSomething) return;
    if (this.publishedLoaded) return;
    if (!this.currentUserId) return;

    this.loadingPublishedCourses = true;
    this.publishedCoursesError = null;
    this.requestViewUpdate();

    this.courseService
      .getPublishedCourses({ pageNumber: 0, pageSize: 20, sortBy: 'id', direction: 'desc' })
      .pipe(
        finalize(() => {
          this.loadingPublishedCourses = false;
          this.requestViewUpdate();
        })
      )
      .subscribe({
        next: (res) => {
          const content = Array.isArray((res as any)?.content) ? ((res as any).content as CourseDto[]) : [];
          this.publishedCourses = content;
          this.publishedLoaded = true;
          this.requestViewUpdate();
        },
        error: () => {
          this.publishedCoursesError = 'No se pudieron cargar cursos publicados.';
          this.publishedCourses = [];
          this.publishedLoaded = true;
          this.requestViewUpdate();
        },
      });
  }

  onSelectDraft(draft: CreatorCourseDraft): void {
    this.selectDraft.emit(draft);
  }

  deleteDraft(draftId: string): void {
    if (!this.currentUserId) return;
    this.draftsService.deleteDraft(this.currentUserId, draftId);
    this.refreshDrafts();
  }

  countDraftLessons(draft: CreatorCourseDraft): number {
    return (draft.modules || []).reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);
  }

  refreshSavedSnapshot(): void {
    if (this.loadingSavedSnapshot) return;

    this.savedSnapshotError = null;

    const effectiveCourseId = this.getEffectiveCourseId();

    if (!effectiveCourseId) {
      this.savedCourseSnapshot = null;
      this.recomputeRecentDraft();
      this.requestViewUpdate();
      return;
    }

    this.loadingSavedSnapshot = true;
    this.requestViewUpdate();

    this.courseService
      .getCourseById(effectiveCourseId)
      .pipe(
        finalize(() => {
          this.loadingSavedSnapshot = false;
          this.requestViewUpdate();
        })
      )
      .subscribe({
        next: (course) => {
          this.savedCourseSnapshot = { ...course, fetchedAt: new Date() };
          this.recomputeRecentDraft();
          this.requestViewUpdate();
        },
        error: () => {
          this.savedSnapshotError = 'No se pudo cargar el guardado reciente.';
          this.recomputeRecentDraft();
          this.requestViewUpdate();
        },
      });
  }

  private recomputeRecentDraft(): void {
    if (!this.currentUserId) {
      this.recentDraft = null;
      return;
    }

    const effectiveCourseId = this.getEffectiveCourseId();
    if (effectiveCourseId) {
      const match = this.drafts.find((d) => d.courseId === effectiveCourseId);
      if (match) {
        this.recentDraft = match;
        return;
      }
    }

    this.recentDraft = this.drafts.length > 0 ? this.drafts[0] : null;
  }

  private getEffectiveCourseId(): number | null {
    if (typeof this.createdCourseId === 'number' && this.createdCourseId > 0) return this.createdCourseId;
    if (!this.currentUserId) return null;
    const ids = this.courseIndex.listCourseIds(this.currentUserId);
    return ids.length > 0 ? ids[0] : null;
  }

  private requestViewUpdate(): void {
    queueMicrotask(() => {
      const maybeDestroyed = (this.cdr as any)?.destroyed;
      if (maybeDestroyed) return;
      try {
        this.cdr.detectChanges();
      } catch {
        // Ignore if the view is destroyed.
      }
    });
  }
}
