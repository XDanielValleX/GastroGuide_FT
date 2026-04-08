import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  CourseCategory,
  CuisineType,
  DifficultyLevel,
} from '../../../core/services/course';
import { CreatorCourseDraft } from '../../../core/services/creator-course-drafts';

@Component({
  selector: 'app-creator-create-course-info-view',
  standalone: false,
  templateUrl: './creator-create-course-info-view.html',
  styleUrl: './creator-create-course-info-view.css',
})
export class CreatorCreateCourseInfoViewComponent {
  @Input({ required: true }) course!: {
    title: string;
    description: string;
    difficultyLevel: DifficultyLevel;
    category: CourseCategory;
    cuisineType: CuisineType;
    coverImageUrl?: string;
    tags?: string;
    language?: string;
  };
  @Input() createdCourseId: number | null = null;
  @Input() modulesCount = 0;
  @Input() lessonsCount = 0;
  @Input() savingCourse = false;

  @Input() currentUserId: string | null = null;

  @Output() saveCourseInfo = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  @Output() selectDraft = new EventEmitter<CreatorCourseDraft>();
}
