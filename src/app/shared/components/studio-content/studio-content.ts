import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { CreatorCourseIndexService } from '../../../core/services/creator-course-index';
import {
  CourseCategory,
  CourseDto,
  CourseService,
  CourseState,
  CuisineType,
  DifficultyLevel,
  PaginationResult,
} from '../../../core/services/course';
import {
  CreatorCourseDraft,
  CreatorCourseDraftsService,
  DraftLessonVm,
  DraftModuleVm,
} from '../../../core/services/creator-course-drafts';

@Component({
  selector: 'app-studio-content',
  standalone: false,
  templateUrl: './studio-content.html',
  styleUrl: './studio-content.css',
})
export class StudioContentComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly draftsService = inject(CreatorCourseDraftsService);
  private readonly courseService = inject(CourseService);
  private readonly courseIndex = inject(CreatorCourseIndexService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly subscription = new Subscription();

  activeTab: 'courses' | 'modules' | 'lessons' = 'courses';

  createModal: 'course' | 'module' | 'lesson' | null = null;
  modalBusy = false;
  modalError: string | null = null;
  modalSuccess: string | null = null;

  openDropdown:
    | 'courseDifficulty'
    | 'courseCategory'
    | 'courseCuisine'
    | 'moduleDraft'
    | 'lessonDraft'
    | 'lessonModule'
    | null = null;

  currentUserId: string | null = null;

  drafts: CreatorCourseDraft[] = [];
  moduleCards: Array<{ key: string; courseTitle: string; module: DraftModuleVm; updatedAt: string }> = [];
  lessonCards: Array<{
    key: string;
    courseTitle: string;
    moduleTitle: string;
    lesson: DraftLessonVm;
    updatedAt: string;
  }> = [];

  private readonly courseDetailsById = new Map<number, CourseDto>();
  private lastLoadedUserId: string | null = null;

  private publishedFallbackLoadedForUserId: string | null = null;
  private publishedFallbackBusy = false;
  publishedFallbackDrafts: CreatorCourseDraft[] = [];

  private indexedFallbackLoadedForUserId: string | null = null;
  private indexedFallbackBusy = false;
  indexedFallbackDrafts: CreatorCourseDraft[] = [];

  readonly difficultyOptions: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  readonly categoryOptions: CourseCategory[] = [
    'BASIC_TECHNIQUES',
    'PASTRY',
    'INTERNATIONAL_CUISINE',
    'MIXOLOGY',
    'RESTAURANT_MANAGEMENT',
    'MOLECULAR_CUISNE',
    'BAKING',
    'SMMELIER',
    'NUTRION',
    'FOOD_PHOTOGRAPHY',
  ];
  readonly cuisineOptions: CuisineType[] = [
    'ITALIAN',
    'FRENCH',
    'ASIAN',
    'LATIN_AMERICAN',
    'FUSION',
    'MEDITERRANEAN',
    'MIDDLE_EASTERN',
    'AFRICAN',
    'AMERICAN',
    'NONE',
    'OTHER',
  ];

  // Course modal
  courseForm: {
    title: string;
    description: string;
    difficultyLevel: DifficultyLevel;
    category: CourseCategory;
    cuisineType: CuisineType;
  } = {
    title: '',
    description: '',
    difficultyLevel: 'BEGINNER',
    category: 'BASIC_TECHNIQUES',
    cuisineType: 'NONE',
  };

  // Module modal
  moduleForm: { draftId: string; title: string; description: string } = {
    draftId: '',
    title: '',
    description: '',
  };

  // Lesson modal
  lessonForm: { draftId: string; moduleIndex: number; title: string; content: string } = {
    draftId: '',
    moduleIndex: 0,
    title: '',
    content: '',
  };

  ngOnInit(): void {
    this.subscription.add(
      this.auth.currentUser$.subscribe((user) => {
        this.currentUserId = user?.id ?? null;
        this.refreshDrafts();
      })
    );

    this.subscription.add(
      this.draftsService.changed$.subscribe(() => {
        this.refreshDrafts();
      })
    );

    // First paint.
    this.refreshDrafts();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private requestViewUpdate(): void {
    queueMicrotask(() => {
      const maybeDestroyed = (this.cdr as any)?.destroyed;
      if (maybeDestroyed) return;
      try {
        this.cdr.detectChanges();
      } catch {
        // ignore
      }
    });
  }

  setTab(tab: 'courses' | 'modules' | 'lessons'): void {
    this.activeTab = tab;
  }

  openCreateCourse(): void {
    this.resetModalState();
    this.createModal = 'course';
    this.openDropdown = null;
  }

  openCreateModule(): void {
    this.resetModalState();
    this.createModal = 'module';
    this.openDropdown = null;
    this.moduleForm = {
      draftId: this.drafts[0]?.draftId ?? '',
      title: '',
      description: '',
    };
  }

  openCreateLesson(): void {
    this.resetModalState();
    this.createModal = 'lesson';
    this.openDropdown = null;
    const firstDraft = this.drafts[0];
    this.lessonForm = {
      draftId: firstDraft?.draftId ?? '',
      moduleIndex: 0,
      title: '',
      content: '',
    };
  }

  closeModal(): void {
    if (this.modalBusy) return;
    this.createModal = null;
    this.resetModalState();
    this.openDropdown = null;
  }

  onModalClick(event: MouseEvent): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    if (el.closest('.dd')) return;
    this.openDropdown = null;
  }

  toggleDropdown(which: NonNullable<StudioContentComponent['openDropdown']>): void {
    if (this.modalBusy) return;
    this.openDropdown = this.openDropdown === which ? null : which;
  }

  closeDropdown(): void {
    this.openDropdown = null;
  }

  labelCourseDifficulty(value: DifficultyLevel): string {
    if (value === 'BEGINNER') return 'Principiante';
    if (value === 'INTERMEDIATE') return 'Intermedio';
    return 'Avanzado';
  }

  labelCourseCategory(value: CourseCategory): string {
    const pretty = String(value)
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    return pretty;
  }

  labelCuisine(value: CuisineType): string {
    const pretty = String(value)
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
    return pretty;
  }

  labelDraft(draft: CreatorCourseDraft): string {
    const title = (draft.title || '').trim() || 'Curso sin título';
    return draft.courseId ? `${title} (ID: ${draft.courseId})` : title;
  }

  setCourseDifficulty(value: DifficultyLevel): void {
    this.courseForm.difficultyLevel = value;
    this.closeDropdown();
  }

  setCourseCategory(value: CourseCategory): void {
    this.courseForm.category = value;
    this.closeDropdown();
  }

  setCourseCuisine(value: CuisineType): void {
    this.courseForm.cuisineType = value;
    this.closeDropdown();
  }

  setModuleDraft(draftId: string): void {
    this.moduleForm.draftId = draftId;
    this.closeDropdown();
  }

  submitCreateCourse(): void {
    if (this.modalBusy) return;
    if (!this.currentUserId) {
      this.modalError = 'Debes iniciar sesión.';
      return;
    }

    this.modalBusy = true;
    this.modalError = null;
    this.modalSuccess = null;

    const payload = {
      title: (this.courseForm.title || '').trim(),
      description: (this.courseForm.description || '').trim(),
      difficultyLevel: this.courseForm.difficultyLevel,
      category: this.courseForm.category,
      cuisineType: this.courseForm.cuisineType,
    };

    if (!payload.title) {
      this.modalBusy = false;
      this.modalError = 'El título es obligatorio.';
      return;
    }

    const nowIso = new Date().toISOString();
    const draftId = this.draftsService.generateDraftId();

    // Create in backend, then mirror as a local draft so it appears in the manager.
    this.courseService
      .createCourse(payload)
      .pipe(
        finalize(() => {
          this.modalBusy = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.courseIndex.addCourseId(this.currentUserId!, res.id);
          const draft: CreatorCourseDraft = {
            draftId,
            courseId: res.id,
            title: payload.title,
            description: payload.description,
            state: 'DRAFT' as CourseState,
            difficultyLevel: payload.difficultyLevel,
            category: payload.category,
            cuisineType: payload.cuisineType,
            coverImageUrl: '',
            tags: '',
            language: 'es',
            modules: [],
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          this.draftsService.upsertDraft(this.currentUserId!, draft);
          this.refreshDrafts();
          this.modalSuccess = `Curso creado (ID: ${res.id}).`;
          this.courseForm = {
            title: '',
            description: '',
            difficultyLevel: 'BEGINNER',
            category: 'BASIC_TECHNIQUES',
            cuisineType: 'NONE',
          };
        },
        error: () => {
          this.modalError = 'No se pudo crear el curso.';
        },
      });
  }

  submitCreateModule(): void {
    if (this.modalBusy) return;
    if (!this.currentUserId) {
      this.modalError = 'Debes iniciar sesión.';
      return;
    }

    const title = (this.moduleForm.title || '').trim();
    const description = (this.moduleForm.description || '').trim();
    if (!title) {
      this.modalError = 'El título del módulo es obligatorio.';
      return;
    }

    const targetDraft = this.drafts.find((d) => d.draftId === this.moduleForm.draftId);
    if (!targetDraft) {
      this.modalError = 'Selecciona un curso.';
      return;
    }

    this.modalBusy = true;
    this.modalError = null;
    this.modalSuccess = null;

    const nowIso = new Date().toISOString();

    const addModuleToDraft = (moduleId?: number) => {
      const nextDraft: CreatorCourseDraft = {
        ...targetDraft,
        modules: [
          ...(targetDraft.modules || []),
          {
            id: moduleId,
            title,
            description,
            lessons: [],
          },
        ],
        updatedAt: nowIso,
      };

      this.draftsService.upsertDraft(this.currentUserId!, nextDraft);
      this.refreshDrafts();
    };

    if (typeof targetDraft.courseId === 'number') {
      this.courseService
        .createModule({ courseId: targetDraft.courseId, title, description })
        .pipe(
          finalize(() => {
            this.modalBusy = false;
          })
        )
        .subscribe({
          next: (res) => {
            addModuleToDraft(res.id);
            this.modalSuccess = `Módulo creado (ID: ${res.id}).`;
          },
          error: () => {
            this.modalError = 'No se pudo crear el módulo.';
          },
        });
      return;
    }

    // No backend courseId available; persist only as draft.
    addModuleToDraft(undefined);
    this.modalBusy = false;
    this.modalSuccess = 'Módulo guardado en borrador.';
  }

  submitCreateLesson(): void {
    if (this.modalBusy) return;
    if (!this.currentUserId) {
      this.modalError = 'Debes iniciar sesión.';
      return;
    }

    const title = (this.lessonForm.title || '').trim();
    const content = (this.lessonForm.content || '').trim();
    if (!title) {
      this.modalError = 'El título de la lección es obligatorio.';
      return;
    }

    const targetDraft = this.drafts.find((d) => d.draftId === this.lessonForm.draftId);
    if (!targetDraft) {
      this.modalError = 'Selecciona un curso.';
      return;
    }

    const modules = targetDraft.modules || [];
    const moduleIndex = Number(this.lessonForm.moduleIndex || 0);
    const targetModule = modules[moduleIndex];
    if (!targetModule) {
      this.modalError = 'Selecciona un módulo.';
      return;
    }

    this.modalBusy = true;
    this.modalError = null;
    this.modalSuccess = null;

    const nowIso = new Date().toISOString();

    const addLessonToDraft = (lessonId?: number) => {
      const nextModules = modules.map((m, idx) => {
        if (idx !== moduleIndex) return m;
        return {
          ...m,
          lessons: [
            ...(m.lessons || []),
            {
              id: lessonId,
              title,
              content,
            },
          ],
        };
      });

      const nextDraft: CreatorCourseDraft = {
        ...targetDraft,
        modules: nextModules,
        updatedAt: nowIso,
      };

      this.draftsService.upsertDraft(this.currentUserId!, nextDraft);
      this.refreshDrafts();
    };

    if (typeof targetModule.id === 'number') {
      this.courseService
        .createLesson({ moduleId: targetModule.id, title, content })
        .pipe(
          finalize(() => {
            this.modalBusy = false;
          })
        )
        .subscribe({
          next: (res) => {
            addLessonToDraft(res.id);
            this.modalSuccess = `Lección creada (ID: ${res.id}).`;
          },
          error: () => {
            this.modalError = 'No se pudo crear la lección.';
          },
        });
      return;
    }

    // No backend moduleId available; persist only as draft.
    addLessonToDraft(undefined);
    this.modalBusy = false;
    this.modalSuccess = 'Lección guardada en borrador.';
  }

  countDraftModules(draft: CreatorCourseDraft): number {
    return (draft.modules || []).length;
  }

  countDraftLessons(draft: CreatorCourseDraft): number {
    return (draft.modules || []).reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);
  }

  trackDraft = (_: number, draft: CreatorCourseDraft) => draft.draftId;
  trackModuleCard = (_: number, card: { key: string }) => card.key;
  trackLessonCard = (_: number, card: { key: string }) => card.key;

  getDraftById(draftId: string): CreatorCourseDraft | null {
    if (!draftId) return null;
    return this.drafts.find((d) => d.draftId === draftId) ?? null;
  }

  getDraftModules(draftId: string): DraftModuleVm[] {
    return this.getDraftById(draftId)?.modules || [];
  }

  onLessonDraftChange(draftId: string): void {
    // When switching course, reset module selection.
    this.lessonForm.draftId = draftId;
    this.lessonForm.moduleIndex = 0;
    this.closeDropdown();
  }

  setLessonModuleIndex(index: number): void {
    this.lessonForm.moduleIndex = Number(index || 0);
    this.closeDropdown();
  }

  labelLessonModule(draftId: string, moduleIndex: number): string {
    const modules = this.getDraftModules(draftId);
    const mod = modules[Number(moduleIndex || 0)];
    if (!mod) return 'Selecciona un módulo';
    const title = (mod.title || '').trim() || 'Módulo sin título';
    return mod.id ? `${title} (ID: ${mod.id})` : title;
  }

  private refreshDrafts(): void {
    if (!this.currentUserId) {
      this.drafts = [];
      this.moduleCards = [];
      this.lessonCards = [];
      this.courseDetailsById.clear();
      this.lastLoadedUserId = null;
      this.publishedFallbackLoadedForUserId = null;
      this.publishedFallbackDrafts = [];
      this.indexedFallbackLoadedForUserId = null;
      this.indexedFallbackDrafts = [];
      return;
    }

    if (this.lastLoadedUserId !== this.currentUserId) {
      this.courseDetailsById.clear();
      this.lastLoadedUserId = this.currentUserId;
      this.publishedFallbackLoadedForUserId = null;
      this.publishedFallbackDrafts = [];
      this.indexedFallbackLoadedForUserId = null;
      this.indexedFallbackDrafts = [];
    }

    this.drafts = this.draftsService.listDrafts(this.currentUserId);

    // Always attempt to load indexed ids (created courses) so backend items appear as soon as the view is opened.
    this.loadIndexedFallbackIfNeeded();

    // If there are no local drafts, the backend does not provide an endpoint for "my courses".
    // As a best-effort fallback (read-only), fetch published courses so the view can show something.
    if (this.drafts.length === 0) {
      this.loadPublishedFallbackIfNeeded();
    } else {
      // When drafts exist, don't show backend fallback.
      this.publishedFallbackDrafts = [];
      this.publishedFallbackLoadedForUserId = this.currentUserId;
    }

    this.prefetchCourseDetails();
    this.rebuildCards();

    // Force UI update so backend-loaded items appear immediately on route entry.
    this.requestViewUpdate();
  }

  get displayDrafts(): CreatorCourseDraft[] {
    if (this.drafts.length > 0) {
      // Merge local drafts with any indexed backend courses not present locally.
      const seen = new Set(
        this.drafts
          .map((d) => d.courseId)
          .filter((id): id is number => typeof id === 'number')
      );
      const extras = this.indexedFallbackDrafts.filter((d) => typeof d.courseId === 'number' && !seen.has(d.courseId));
      return extras.length > 0 ? [...this.drafts, ...extras] : this.drafts;
    }

    // Prefer creator-indexed ids (created by the current user). If none, fall back to published listing.
    return this.indexedFallbackDrafts.length > 0 ? this.indexedFallbackDrafts : this.publishedFallbackDrafts;
  }

  private loadIndexedFallbackIfNeeded(): void {
    if (!this.currentUserId) return;
    if (this.indexedFallbackBusy) return;
    if (this.indexedFallbackLoadedForUserId === this.currentUserId) return;

    const ids = this.courseIndex.listCourseIds(this.currentUserId);
    if (ids.length === 0) {
      this.indexedFallbackLoadedForUserId = this.currentUserId;
      this.indexedFallbackDrafts = [];
      return;
    }

    this.indexedFallbackBusy = true;
    this.subscription.add(
      forkJoin(ids.map((id) => this.courseService.getCourseById(id).pipe(catchError(() => of(null)))))
        .pipe(
          finalize(() => {
            this.indexedFallbackBusy = false;
          })
        )
        .subscribe((results) => {
          this.indexedFallbackLoadedForUserId = this.currentUserId;
          const nowIso = new Date().toISOString();

          for (const c of results) {
            if (!c) continue;
            this.courseDetailsById.set(c.id, c);
          }

          this.indexedFallbackDrafts = results
            .filter((c): c is CourseDto => !!c && typeof c.id === 'number')
            .map((c) => {
              const draft: CreatorCourseDraft = {
                draftId: `indexed_${c.id}`,
                courseId: c.id,
                title: c.title ?? '',
                description: c.description ?? '',
                state: (c.state ?? 'DRAFT') as CourseState,
                difficultyLevel: (c.difficultyLevel ?? 'BEGINNER') as DifficultyLevel,
                category: (c.category ?? 'BASIC_TECHNIQUES') as CourseCategory,
                cuisineType: (c.cuisineType ?? 'NONE') as CuisineType,
                coverImageUrl: c.coverImageUrl ?? '',
                tags: c.tags ?? '',
                language: c.language ?? 'es',
                modules: [],
                createdAt: nowIso,
                updatedAt: nowIso,
              };
              return draft;
            });

        this.requestViewUpdate();
        })
    );
  }

  private loadPublishedFallbackIfNeeded(): void {
    if (!this.currentUserId) return;
    if (this.publishedFallbackBusy) return;
    if (this.publishedFallbackLoadedForUserId === this.currentUserId) return;

    this.publishedFallbackBusy = true;
    this.courseService
      .getPublishedCourses({ pageNumber: 0, pageSize: 20, sortBy: 'id', direction: 'desc' })
      .pipe(
        catchError(() => of(null as PaginationResult<CourseDto> | null)),
        finalize(() => {
          this.publishedFallbackBusy = false;
        })
      )
      .subscribe((res) => {
        this.publishedFallbackLoadedForUserId = this.currentUserId;
        const courses = res?.content ?? [];
        const nowIso = new Date().toISOString();

        // Seed cache to avoid N extra getCourseById calls.
        for (const c of courses) {
          if (c && typeof c.id === 'number') {
            this.courseDetailsById.set(c.id, c);
          }
        }

        // Create in-memory drafts so the existing UI can render rows.
        this.publishedFallbackDrafts = courses
          .filter((c): c is CourseDto => !!c && typeof c.id === 'number')
          .map((c) => {
            const draft: CreatorCourseDraft = {
              draftId: `published_${c.id}`,
              courseId: c.id,
              title: c.title ?? '',
              description: c.description ?? '',
              state: (c.state ?? 'PUBLISHED') as CourseState,
              difficultyLevel: (c.difficultyLevel ?? 'BEGINNER') as DifficultyLevel,
              category: (c.category ?? 'BASIC_TECHNIQUES') as CourseCategory,
              cuisineType: (c.cuisineType ?? 'NONE') as CuisineType,
              coverImageUrl: c.coverImageUrl ?? '',
              tags: c.tags ?? '',
              language: c.language ?? 'es',
              modules: [],
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            return draft;
          });

          this.requestViewUpdate();
      });
  }

  getCourseDetails(courseId: number | null): CourseDto | null {
    if (typeof courseId !== 'number') return null;
    return this.courseDetailsById.get(courseId) ?? null;
  }

  getCourseView(draft: CreatorCourseDraft): CourseDto {
    const backend = this.getCourseDetails(draft.courseId);
    const merged: CourseDto = {
      id: backend?.id ?? (draft.courseId ?? 0),
      title: (backend?.title ?? draft.title) || '',
      description: (backend?.description ?? draft.description) || '',
      state: (backend?.state ?? draft.state) as CourseDto['state'],
      difficultyLevel: (backend?.difficultyLevel ?? draft.difficultyLevel) as CourseDto['difficultyLevel'],
      category: (backend?.category ?? draft.category) as CourseDto['category'],
      cuisineType: (backend?.cuisineType ?? draft.cuisineType) as CourseDto['cuisineType'],
      coverImageUrl: backend?.coverImageUrl ?? draft.coverImageUrl ?? null,
      tags: backend?.tags ?? draft.tags ?? null,
      language: backend?.language ?? draft.language ?? null,
      price: backend?.price ?? null,
      isFree: backend?.isFree ?? null,
      estimatedDurationMinutes: backend?.estimatedDurationMinutes ?? null,
      creator: backend?.creator ?? null,
    };

    return merged;
  }

  labelCourseState(state: CourseState): string {
    if (state === 'PUBLISHED') return 'Publicado';
    if (state === 'ARCHIVED') return 'Archivado';
    return 'Borrador';
  }

  labelBoolean(value: boolean | null | undefined): string {
    if (value === true) return 'Sí';
    if (value === false) return 'No';
    return '—';
  }

  labelPrice(price: number | null | undefined, isFree: boolean | null | undefined): string {
    if (isFree === true) return 'Gratis';
    if (typeof price === 'number') return String(price);
    return '—';
  }

  labelCreator(creator: CourseDto['creator']): string {
    const first = (creator?.firstName || '').trim();
    const last = (creator?.lastName || '').trim();
    const name = `${first} ${last}`.trim();
    return name || '—';
  }

  private prefetchCourseDetails(): void {
    const ids = Array.from(
      new Set(
        (this.drafts || [])
          .map((d) => d.courseId)
          .filter((id): id is number => typeof id === 'number')
          .filter((id) => !this.courseDetailsById.has(id))
      )
    );

    if (ids.length === 0) return;

    this.subscription.add(
      forkJoin(ids.map((id) => this.courseService.getCourseById(id).pipe(catchError(() => of(null))))).subscribe((results) => {
          for (const course of results) {
            if (!course) continue;
            this.courseDetailsById.set(course.id, course);
          }
        })
    );
  }

  private resetModalState(): void {
    this.modalBusy = false;
    this.modalError = null;
    this.modalSuccess = null;
  }

  private rebuildCards(): void {
    const moduleCards: Array<{ key: string; courseTitle: string; module: DraftModuleVm; updatedAt: string }> = [];
    const lessonCards: Array<{
      key: string;
      courseTitle: string;
      moduleTitle: string;
      lesson: DraftLessonVm;
      updatedAt: string;
    }> = [];

    for (const draft of this.drafts) {
      const courseTitle = (draft.title || '').trim() || 'Curso sin título';
      const updatedAt = draft.updatedAt || draft.createdAt || '';

      for (const mod of draft.modules || []) {
        const moduleKey = `${draft.draftId}::module::${mod.id ?? mod.title}`;
        moduleCards.push({ key: moduleKey, courseTitle, module: mod, updatedAt });

        for (const lesson of mod.lessons || []) {
          const lessonKey = `${draft.draftId}::lesson::${mod.id ?? mod.title}::${lesson.id ?? lesson.title}`;
          lessonCards.push({
            key: lessonKey,
            courseTitle,
            moduleTitle: (mod.title || '').trim() || 'Módulo sin título',
            lesson,
            updatedAt,
          });
        }
      }
    }

    // Sort by last update of the parent course draft.
    moduleCards.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    lessonCards.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    this.moduleCards = moduleCards;
    this.lessonCards = lessonCards;
  }
}
