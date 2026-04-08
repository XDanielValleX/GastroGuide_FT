import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-student-home-view',
  standalone: false,
  templateUrl: './student-home-view.html',
  styleUrl: './student-home-view.css',
})
export class StudentHomeViewComponent {
  @Input() firstName: string | null | undefined = null;

  get initials(): string {
    const value = (this.firstName || 'U').trim();
    return value ? value[0].toUpperCase() : 'U';
  }
}
