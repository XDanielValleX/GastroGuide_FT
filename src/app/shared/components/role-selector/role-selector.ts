import { Component, EventEmitter, Input, Output } from '@angular/core';

export type RegisterRole = 'STUDENT' | 'CREATOR';

@Component({
  selector: 'app-role-selector',
  standalone: false,
  templateUrl: './role-selector.html',
  styleUrl: './role-selector.css',
})
export class RoleSelectorComponent {
  @Input() label: string = '';
  @Input() value: RegisterRole = 'STUDENT';

  @Output() valueChange = new EventEmitter<RegisterRole>();

  select(role: RegisterRole): void {
    if (this.value !== role) {
      this.value = role;
      this.valueChange.emit(role);
    }
  }
}
