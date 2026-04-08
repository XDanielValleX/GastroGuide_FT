import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CourseState } from '../../../core/services/course';

@Component({
  selector: 'app-creator-create-course-publish-view',
  standalone: false,
  templateUrl: './creator-create-course-publish-view.html',
  styleUrl: './creator-create-course-publish-view.css',
})
export class CreatorCreateCoursePublishViewComponent {
  @Input({ required: true }) course!: { title: string; description: string; state: CourseState };
  @Input() modulesCount = 0;
  @Input() lessonsCount = 0;
  @Input() createdCourseId: number | null = null;
  @Input() publishing = false;

  @Output() prev = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
}
