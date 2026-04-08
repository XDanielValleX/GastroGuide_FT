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
  selector: 'app-creator-create-course-modules-view',
  standalone: false,
  templateUrl: './creator-create-course-modules-view.html',
  styleUrl: './creator-create-course-modules-view.css',
})
export class CreatorCreateCourseModulesViewComponent {
  @Input() createdCourseId: number | null = null;
  @Input({ required: true }) modules!: ModuleVm[];
  @Input({ required: true }) newModule!: { title: string; description: string };
  @Input() savingModules = false;

  @Output() addModule = new EventEmitter<void>();
  @Output() removeModule = new EventEmitter<number>();
  @Output() saveModules = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
}
