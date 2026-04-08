import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

export type AuthInputIcon = 'email' | 'password' | 'user' | 'name';

@Component({
  selector: 'app-auth-floating-input',
  standalone: false,
  templateUrl: './auth-floating-input.html',
  styleUrl: './auth-floating-input.css',
})
export class AuthFloatingInputComponent {
  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement>;

  @Input({ required: true }) control!: FormControl;

  @Input({ required: true }) id!: string;
  @Input({ required: true }) label!: string;

  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() placeholder: string = '';
  @Input() autocomplete?: string;
  @Input() inputmode?: string;
  @Input() pattern?: string;
  @Input() icon: AuthInputIcon = 'user';

  get showValidState(): boolean {
    return this.control?.valid && (this.control?.dirty || this.control?.touched);
  }

  focusInput(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'INPUT') {
      return;
    }
    this.inputEl?.nativeElement.focus();
  }
}
