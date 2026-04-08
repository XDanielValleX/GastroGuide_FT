import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService, User } from '../../../core/services/auth';
import { CreatorCourseIndexService } from '../../../core/services/creator-course-index';
import { CreatorRecentSaveService } from '../../../core/services/creator-recent-save';
import {
  CourseCategory,
  CourseService,
  CourseState,
  CuisineType,
  DifficultyLevel,
} from '../../../core/services/course';
import {
  CreatorCourseDraft,
  CreatorCourseDraftsService,
} from '../../../core/services/creator-course-drafts';

type ModuleVm = {
  id?: number;
  title: string;
  description: string;
  lessons: LessonVm[];
};

type LessonVm = {
  id?: number;
  title: string;
  content: string;
};

@Component({
  selector: 'app-creator-create-course-view',
  standalone: false,
  templateUrl: './creator-create-course-view.html',
  styleUrl: './creator-create-course-view.css',
})
export class CreatorCreateCourseViewComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly draftsService = inject(CreatorCourseDraftsService);
  private readonly courseIndex = inject(CreatorCourseIndexService);
  private readonly recentSave = inject(CreatorRecentSaveService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private subscription: Subscription | null = null;

  currentUser: User | null = null;

  private draftCreatedAt = new Date().toISOString();
  draftId = this.draftsService.generateDraftId();

  step = 1;

  course: {
    title: string;
    description: string;
    state: CourseState;
    difficultyLevel: DifficultyLevel;
    category: CourseCategory;
    cuisineType: CuisineType;
    coverImageUrl: string;
    tags: string;
    language: string;
  } = {
    title: '',
    description: '',
    state: 'DRAFT',
    difficultyLevel: 'BEGINNER',
    category: 'BASIC_TECHNIQUES',
    cuisineType: 'NONE',
    coverImageUrl: '',
    tags: '',
    language: '',
  };

  createdCourseId: number | null = null;

  modules: ModuleVm[] = [];
  newModule: { title: string; description: string } = { title: '', description: '' };

  newLesson: { title: string; content: string } = { title: '', content: '' };
  lessonModuleIndex = 0;

  savingCourse = false;
  savingModules = false;
  savingLessons = false;
  publishing = false;

  toast: string | null = null;

  ngOnInit(): void {
    this.subscription = new Subscription();
    this.subscription.add(this.authService.currentUser$.subscribe((u) => (this.currentUser = u)));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  goBack(): void {
    void this.router.navigate(['/studio/panel']);
  }

  cancel(): void {
    this.goBack();
  }

  prevStep(): void {
    this.step = Math.max(1, this.step - 1);
  }

  nextStep(): void {
    if (this.step === 1 && !this.createdCourseId) {
      this.setToast('Primero guarda la información del curso.');
      return;
    }

    if (this.step === 2 && this.modules.length > 0 && this.modules.some((m) => !m.id)) {
      this.setToast('Guarda los módulos antes de continuar.');
      return;
    }

    if (this.step === 3 && this.hasPendingLessons()) {
      this.setToast('Guarda las lecciones antes de continuar.');
      return;
    }

    this.step = Math.min(4, this.step + 1);
  }

  barFill(index: number): number {
    // index 0 -> between step1 and step2, etc.
    const progress = Math.max(0, Math.min(1, this.step - 1 - index));
    return progress * 100;
  }

  saveCourseInfo(): void {
    if (this.savingCourse) return;

    const title = this.course.title.trim();
    const description = this.course.description.trim();

    if (title.length < 2) {
      this.setToast('El título debe tener al menos 2 caracteres.');
      return;
    }

    if (description.length < 10) {
      this.setToast('La descripción debe tener al menos 10 caracteres.');
      return;
    }

    this.savingCourse = true;
    // Persist locally first so the "Guardado reciente" panel updates immediately
    // even if the backend request is slow or fails.
    this.persistDraftSnapshot();
    this.persistRecentSave('COURSE', this.course.title);
    this.requestViewUpdate();

    const payloadBase = {
      title,
      description,
      difficultyLevel: this.course.difficultyLevel,
      category: this.course.category,
      cuisineType: this.course.cuisineType,
    };

    if (this.createdCourseId) {
      this.courseService
        .updateCourse(this.createdCourseId, {
          ...payloadBase,
          coverImageUrl: this.course.coverImageUrl.trim() || undefined,
          tags: this.course.tags.trim() || undefined,
          language: this.course.language.trim() || undefined,
        })
        .pipe(
          finalize(() => {
            this.savingCourse = false;
            this.requestViewUpdate();
          })
        )
        .subscribe({
          next: () => {
            this.setToast(`Curso actualizado (ID: ${this.createdCourseId}).`);
            this.persistDraftSnapshot();
            this.persistRecentSave('COURSE', this.course.title, { courseId: this.createdCourseId });
            this.requestViewUpdate();
          },
          error: () => {
            this.setToast('No se pudo guardar el curso. Revisa los campos e inténtalo de nuevo.');
            this.requestViewUpdate();
          },
        });
      return;
    }

    this.courseService
      .createCourse(payloadBase)
      .pipe(
        finalize(() => {
          this.savingCourse = false;
          this.requestViewUpdate();
        })
      )
      .subscribe({
        next: (res) => {
          if (res && typeof res.id === 'number') {
            this.createdCourseId = res.id;
            const userId = this.currentUser?.id;
            if (userId) {
              this.courseIndex.addCourseId(userId, res.id);
            }
            this.setToast(`Curso creado (ID: ${res.id}). Ahora puedes agregar módulos.`);
            this.persistRecentSave('COURSE', this.course.title, { courseId: res.id });
          }

          this.persistDraftSnapshot();
          this.requestViewUpdate();
        },
        error: () => {
          this.setToast('No se pudo guardar el curso. Revisa los campos e inténtalo de nuevo.');
          this.requestViewUpdate();
        },
      });
  }

  addModule(): void {
    const title = this.newModule.title.trim();
    const description = this.newModule.description.trim();

    if (title.length < 2) {
      this.setToast('El título del módulo debe tener al menos 2 caracteres.');
      return;
    }

    if (description.length < 10) {
      this.setToast('La descripción del módulo debe tener al menos 10 caracteres.');
      return;
    }

    this.modules.push({ title, description, lessons: [] });
    this.newModule = { title: '', description: '' };
    this.persistDraftSnapshot();
  }

  removeModule(index: number): void {
    const module = this.modules[index];
    if (!module) return;
    if (module.id) {
      this.setToast('Este módulo ya fue guardado. El backend no soporta eliminar módulos desde aquí.');
      return;
    }

    this.modules.splice(index, 1);
    this.lessonModuleIndex = Math.max(0, Math.min(this.lessonModuleIndex, this.modules.length - 1));
    this.persistDraftSnapshot();
  }

  async saveModules(): Promise<void> {
    if (this.savingModules) return;
    if (!this.createdCourseId) {
      this.setToast('Primero guarda el curso (paso 1).');
      return;
    }

    const courseId = this.createdCourseId;
    const pending = this.modules.filter((m) => !m.id);
    if (pending.length === 0) {
      this.setToast('No hay módulos pendientes por guardar.');
      return;
    }

    this.savingModules = true;
    try {
      let lastSavedTitle: string | null = null;
      let lastSavedModuleId: number | null = null;
      for (const module of pending) {
        const response = await firstValueFrom(
          this.courseService.createModule({
            courseId,
            title: module.title,
            description: module.description,
          })
        );
        module.id = response.id;
        lastSavedTitle = module.title;
        lastSavedModuleId = response.id;
      }

      this.setToast('Módulos guardados.');
      this.persistDraftSnapshot();
      if (lastSavedTitle) {
        this.persistRecentSave('MODULE', lastSavedTitle, { courseId, moduleId: lastSavedModuleId });
      }
    } catch {
      this.setToast('No se pudieron guardar los módulos.');
    } finally {
      this.savingModules = false;
    }
  }

  addLessonToModule(): void {
    const module = this.modules[this.lessonModuleIndex];
    if (!module) {
      this.setToast('Selecciona un módulo válido.');
      return;
    }

    if (!module.id) {
      this.setToast('Primero guarda el módulo antes de agregar lecciones.');
      return;
    }

    const title = this.newLesson.title.trim();
    const content = this.newLesson.content.trim();

    if (title.length < 2) {
      this.setToast('El título de la lección debe tener al menos 2 caracteres.');
      return;
    }

    if (content.length < 10) {
      this.setToast('El contenido de la lección debe tener al menos 10 caracteres.');
      return;
    }

    module.lessons.push({ title, content });
    this.newLesson = { title: '', content: '' };
    this.persistDraftSnapshot();
  }

  removeLesson(moduleIndex: number, lessonIndex: number): void {
    const module = this.modules[moduleIndex];
    const lesson = module?.lessons?.[lessonIndex];
    if (!module || !lesson) return;

    if (lesson.id) {
      this.setToast('Esta lección ya fue guardada. El backend no soporta eliminar lecciones desde aquí.');
      return;
    }

    module.lessons.splice(lessonIndex, 1);
    this.persistDraftSnapshot();
  }

  async saveLessons(): Promise<void> {
    if (this.savingLessons) return;

    const pending = this.getPendingLessons();
    if (pending.length === 0) {
      this.setToast('No hay lecciones pendientes por guardar.');
      return;
    }

    this.savingLessons = true;
    try {
      let lastSavedTitle: string | null = null;
      let lastSavedLessonId: number | null = null;
      for (const item of pending) {
        const response = await firstValueFrom(
          this.courseService.createLesson({
            moduleId: item.moduleId,
            title: item.lesson.title,
            content: item.lesson.content,
          })
        );
        item.lesson.id = response.id;
        lastSavedTitle = item.lesson.title;
        lastSavedLessonId = response.id;
      }

      this.setToast('Lecciones guardadas.');
      this.persistDraftSnapshot();
      if (lastSavedTitle) {
        this.persistRecentSave('LESSON', lastSavedTitle, { lessonId: lastSavedLessonId });
      }
    } catch {
      this.setToast('No se pudieron guardar las lecciones.');
    } finally {
      this.savingLessons = false;
    }
  }

  private persistRecentSave(
    kind: 'COURSE' | 'MODULE' | 'LESSON',
    title: string,
    ids?: { courseId?: number | null; moduleId?: number | null; lessonId?: number | null }
  ): void {
    const userId = this.currentUser?.id;
    if (!userId) return;
    const trimmed = (title || '').trim();
    if (!trimmed) return;

    this.recentSave.setRecent(userId, {
      kind,
      title: trimmed,
      at: new Date().toISOString(),
      courseId: ids?.courseId ?? this.createdCourseId ?? null,
      moduleId: ids?.moduleId ?? null,
      lessonId: ids?.lessonId ?? null,
    });
  }

  async publishCourse(): Promise<void> {
    if (this.publishing) return;
    if (!this.createdCourseId) {
      this.setToast('Primero guarda el curso.');
      return;
    }

    if (this.hasPendingLessons()) {
      this.setToast('Guarda las lecciones pendientes antes de publicar.');
      return;
    }

    // NOTE: Backend controller in this workspace does not expose an endpoint to update course state.
    // Keep the UI step, but be explicit about the limitation.
    this.setToast('Este backend no soporta publicar (no hay endpoint para cambiar el estado).');
  }

  countLessons(): number {
    return this.modules.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0);
  }

  private getPendingLessons(): Array<{ moduleId: number; lesson: LessonVm }> {
    const pending: Array<{ moduleId: number; lesson: LessonVm }> = [];
    for (const module of this.modules) {
      if (!module.id) continue;
      for (const lesson of module.lessons) {
        if (!lesson.id) {
          pending.push({ moduleId: module.id, lesson });
        }
      }
    }
    return pending;
  }

  private hasPendingLessons(): boolean {
    return this.getPendingLessons().length > 0;
  }

  private setToast(message: string): void {
    this.toast = message;
    window.setTimeout(() => {
      if (this.toast === message) {
        this.toast = null;
      }
    }, 3200);
  }

  loadDraft(draft: CreatorCourseDraft): void {
    this.draftId = draft.draftId;
    this.draftCreatedAt = draft.createdAt || new Date().toISOString();

    this.createdCourseId = draft.courseId;

    this.course = {
      ...this.course,
      title: draft.title || '',
      description: draft.description || '',
      state: draft.state || 'DRAFT',
      difficultyLevel: draft.difficultyLevel || 'BEGINNER',
      category: draft.category || 'BASIC_TECHNIQUES',
      cuisineType: draft.cuisineType || 'NONE',
      coverImageUrl: draft.coverImageUrl || '',
      tags: draft.tags || '',
      language: draft.language || '',
    };

    this.modules = (draft.modules || []).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      lessons: (m.lessons || []).map((l) => ({
        id: l.id,
        title: l.title,
        content: l.content,
      })),
    }));

    this.newModule = { title: '', description: '' };
    this.newLesson = { title: '', content: '' };
    this.lessonModuleIndex = 0;

    this.setToast('Curso cargado desde guardados.');
    this.requestViewUpdate();
  }

  private persistDraftSnapshot(): void {
    const userId = this.currentUser?.id;
    if (!userId) return;

    const nowIso = new Date().toISOString();

    const draft: CreatorCourseDraft = {
      draftId: this.draftId,
      courseId: this.createdCourseId,

      title: this.course.title,
      description: this.course.description,
      state: this.course.state,

      difficultyLevel: this.course.difficultyLevel,
      category: this.course.category,
      cuisineType: this.course.cuisineType,

      coverImageUrl: this.course.coverImageUrl || '',
      tags: this.course.tags || '',
      language: this.course.language || '',

      modules: this.modules.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        lessons: (m.lessons || []).map((l) => ({
          id: l.id,
          title: l.title,
          content: l.content,
        })),
      })),

      createdAt: this.draftCreatedAt,
      updatedAt: nowIso,
    };

    this.draftsService.upsertDraft(userId, draft);
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
