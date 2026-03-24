import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import type { RegisterRole } from '../../shared/components/role-selector/role-selector';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedRole: RegisterRole = 'STUDENT';
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      role: ['STUDENT', Validators.required],
      // STUDENT
      username: [''],
      // CREATOR
      firstName: [''],
      lastName: [''],
      // Shared
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: [this.passwordsMatchValidator()] });

    this.applyRoleValidators(this.selectedRole);
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.registerForm.invalid || this.loading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.buildPayload();

    this.authService.registerByRole(this.selectedRole, payload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/auth/login'], { queryParams: { registered: true } });
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = this.extractErrorMessage(err);
      }
    });
  }

  onRoleChange(role: RegisterRole): void {
    this.selectedRole = role;
    this.registerForm.get('role')?.setValue(role);
    this.applyRoleValidators(role);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  get usernameCtrl(): FormControl {
    return this.registerForm.get('username') as FormControl;
  }

  get firstNameCtrl(): FormControl {
    return this.registerForm.get('firstName') as FormControl;
  }

  get lastNameCtrl(): FormControl {
    return this.registerForm.get('lastName') as FormControl;
  }

  get emailCtrl(): FormControl {
    return this.registerForm.get('email') as FormControl;
  }

  get passwordCtrl(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  get confirmPasswordCtrl(): FormControl {
    return this.registerForm.get('confirmPassword') as FormControl;
  }

  private applyRoleValidators(role: RegisterRole): void {
    const username = this.registerForm.get('username');
    const firstName = this.registerForm.get('firstName');
    const lastName = this.registerForm.get('lastName');

    if (!username || !firstName || !lastName) {
      return;
    }

    if (role === 'STUDENT') {
      username.setValidators([Validators.required, Validators.maxLength(20)]);
      firstName.clearValidators();
      lastName.clearValidators();

      firstName.reset('');
      lastName.reset('');
    } else {
      username.clearValidators();
      username.reset('');

      firstName.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
      lastName.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
    }

    username.updateValueAndValidity({ emitEvent: false });
    firstName.updateValueAndValidity({ emitEvent: false });
    lastName.updateValueAndValidity({ emitEvent: false });
  }

  private buildPayload(): any {
    const email = this.emailCtrl.value;
    const password = this.passwordCtrl.value;

    if (this.selectedRole === 'STUDENT') {
      return {
        username: this.usernameCtrl.value,
        email,
        password,
      };
    }

    return {
      firstName: this.firstNameCtrl.value,
      lastName: this.lastNameCtrl.value,
      email,
      password,
    };
  }

  private passwordsMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;
      if (!password || !confirmPassword) {
        return null;
      }
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  private extractErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'No se pudo conectar con el backend (¿está corriendo en :8080?).';
    }

    const backendMessage = err?.error?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }

    return 'No se pudo completar el registro. Revisa los datos e intenta de nuevo.';
  }
}