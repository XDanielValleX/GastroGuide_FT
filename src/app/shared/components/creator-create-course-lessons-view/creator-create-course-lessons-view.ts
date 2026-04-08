import { Component, EventEmitter, Input, Output } from '@angular/core';

type LessonVm = {
  id?: number;
  title: string;
  content: string;
};

type ModuleVm = {
  id?: number;
  title: string;
  description: string;
  lessons: LessonVm[];
};

@Component({
  selector: 'app-creator-create-course-lessons-view',
  standalone: false,
  templateUrl: './creator-create-course-lessons-view.html',
  styleUrl: './creator-create-course-lessons-view.css',
})
export class CreatorCreateCourseLessonsViewComponent {
  @Input({ required: true }) modules!: ModuleVm[];
  @Input({ required: true }) newLesson!: { title: string; content: string };
  @Input() savingLessons = false;

  @Input() lessonModuleIndex = 0;
  @Output() lessonModuleIndexChange = new EventEmitter<number>();

  @Output() addLessonToModule = new EventEmitter<void>();
  @Output() removeLesson = new EventEmitter<{ moduleIndex: number; lessonIndex: number }>();
  @Output() saveLessons = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
