import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import type { RegisterRole } from '../../shared/components/role-selector/role-selector';
import { finalize, Subscription } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  private static readonly REGISTERED_EMAILS_KEY = 'gastro_registered_emails';
  private static readonly REGISTERED_IDENTIFICATION_NUMBERS_KEY = 'gastro_registered_identification_numbers';

  registerForm: FormGroup;
  selectedRole: RegisterRole = 'STUDENT';
  loading = false;
  errorMessage = '';

  private identificationNumberSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      role: ['STUDENT', Validators.required],
      // STUDENT
      username: [''],
      // CREATOR
      firstName: [''],
      lastName: [''],
      identificationNumber: [''],
      identificationType: ['CC'],
      nationality: ['Colombiana'],
      specialization: [''],
      // Shared
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(255)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: [this.passwordsMatchValidator()] });

    this.applyRoleValidators(this.selectedRole);

    this.identificationNumberSub = this.identificationNumberCtrl.valueChanges.subscribe((value) => {
      const sanitized = this.sanitizeDigits(value);
      if (sanitized !== String(value ?? '')) {
        this.identificationNumberCtrl.setValue(sanitized, { emitEvent: false });
      }
    });
  }

  ngOnDestroy(): void {
    this.identificationNumberSub?.unsubscribe();
  }

  onSubmit() {
    this.errorMessage = '';

    if (this.registerForm.invalid || this.loading) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const duplicateMessage = this.validateLocalUniqueness();
    if (duplicateMessage) {
      this.errorMessage = duplicateMessage;
      this.registerForm.markAllAsTouched();
      this.requestViewUpdate();
      return;
    }

    this.loading = true;
    const payload = this.buildPayload();

    this.authService
      .registerByRole(this.selectedRole, payload)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.requestViewUpdate();
        })
      )
      .subscribe({
        next: () => {
          this.persistLocalUniquenessHints();
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: true, registeredRole: this.selectedRole },
          });
          this.requestViewUpdate();
        },
        error: (err: any) => {
          this.errorMessage = this.extractErrorMessage(err);
          this.requestViewUpdate();
        }
      });
  }

  private requestViewUpdate(): void {
    queueMicrotask(() => {
      const maybeDestroyed = (this.cdr as any)?.destroyed;
      if (maybeDestroyed) return;
      try {
        this.cdr.detectChanges();
      } catch {
        // Ignore if the view is destroyed due to navigation.
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

  get identificationNumberCtrl(): FormControl {
    return this.registerForm.get('identificationNumber') as FormControl;
  }

  get identificationTypeCtrl(): FormControl {
    return this.registerForm.get('identificationType') as FormControl;
  }

  get nationalityCtrl(): FormControl {
    return this.registerForm.get('nationality') as FormControl;
  }

  get specializationCtrl(): FormControl {
    return this.registerForm.get('specialization') as FormControl;
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
    const identificationNumber = this.registerForm.get('identificationNumber');
    const identificationType = this.registerForm.get('identificationType');
    const nationality = this.registerForm.get('nationality');
    const specialization = this.registerForm.get('specialization');

    if (
      !username ||
      !firstName ||
      !lastName ||
      !identificationNumber ||
      !identificationType ||
      !nationality ||
      !specialization
    ) {
      return;
    }

    if (role === 'STUDENT') {
      username.setValidators([Validators.required, Validators.maxLength(20)]);
      firstName.clearValidators();
      lastName.clearValidators();

      identificationNumber.clearValidators();
      identificationType.clearValidators();
      nationality.clearValidators();
      specialization.clearValidators();

      firstName.reset('');
      lastName.reset('');

      identificationNumber.reset('');
      identificationType.reset('CC');
      nationality.reset('');
      specialization.reset('');
    } else {
      username.clearValidators();
      username.reset('');

      firstName.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
      lastName.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);

      identificationNumber.setValidators([Validators.required, Validators.pattern(/^\d+$/)]);
      identificationType.setValidators([
        Validators.required,
        Validators.pattern(/^(CC|CE|PASSPORT|TI|NIT|OTHER)$/i),
      ]);
      nationality.setValidators([Validators.required]);
      specialization.setValidators([Validators.required]);
    }

    username.updateValueAndValidity({ emitEvent: false });
    firstName.updateValueAndValidity({ emitEvent: false });
    lastName.updateValueAndValidity({ emitEvent: false });
    identificationNumber.updateValueAndValidity({ emitEvent: false });
    identificationType.updateValueAndValidity({ emitEvent: false });
    nationality.updateValueAndValidity({ emitEvent: false });
    specialization.updateValueAndValidity({ emitEvent: false });
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
      identificationNumber: this.identificationNumberCtrl.value,
      identificationType: String(this.identificationTypeCtrl.value || 'CC').toUpperCase(),
      nationality: this.nationalityCtrl.value,
      specialization: this.specializationCtrl.value,
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

  private sanitizeDigits(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\D+/g, '');
  }

  private validateLocalUniqueness(): string | null {
    const normalizedEmail = this.normalizeEmail(this.emailCtrl.value);
    if (normalizedEmail) {
      const emails = new Set(this.readStringArray(RegisterComponent.REGISTERED_EMAILS_KEY));
      if (emails.has(normalizedEmail)) {
        return 'Este correo ya está registrado. Usa otro correo o inicia sesión.';
      }
    }

    if (this.selectedRole === 'CREATOR') {
      const normalizedId = this.normalizeIdentificationNumber(this.identificationNumberCtrl.value);
      if (normalizedId) {
        const ids = new Set(
          this.readStringArray(RegisterComponent.REGISTERED_IDENTIFICATION_NUMBERS_KEY)
        );
        if (ids.has(normalizedId)) {
          return 'Este número de identificación ya está registrado. Usa otro número.';
        }
      }
    }

    return null;
  }

  private persistLocalUniquenessHints(): void {
    const normalizedEmail = this.normalizeEmail(this.emailCtrl.value);
    if (normalizedEmail) {
      this.addUniqueValue(RegisterComponent.REGISTERED_EMAILS_KEY, normalizedEmail);
    }

    if (this.selectedRole === 'CREATOR') {
      const normalizedId = this.normalizeIdentificationNumber(this.identificationNumberCtrl.value);
      if (normalizedId) {
        this.addUniqueValue(RegisterComponent.REGISTERED_IDENTIFICATION_NUMBERS_KEY, normalizedId);
      }
    }
  }

  private normalizeEmail(value: unknown): string {
    const email = String(value ?? '').trim().toLowerCase();
    return email;
  }

  private normalizeIdentificationNumber(value: unknown): string {
    return this.sanitizeDigits(value).trim();
  }

  private readStringArray(storageKey: string): string[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((v) => String(v ?? '').trim())
        .filter((v) => !!v);
    } catch {
      return [];
    }
  }

  private addUniqueValue(storageKey: string, value: string): void {
    const next = new Set(this.readStringArray(storageKey));
    next.add(value);
    // Keep it bounded (dev UX); prevents unbounded growth.
    const bounded = Array.from(next).slice(-500);
    try {
      localStorage.setItem(storageKey, JSON.stringify(bounded));
    } catch {
      // Ignore storage quota errors.
    }
  }

  private extractErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'No se pudo conectar con el backend (¿está corriendo en :8080?).';
    }

    if (err?.status === 409) {
      return 'El email ya está registrado. Prueba con otro o inicia sesión.';
    }

    if (err?.status === 400) {
      const errors = err?.error?.errors;
      if (errors && typeof errors === 'object') {
        const entries = Object.entries(errors)
          .filter(([_, v]) => typeof v === 'string' && v.trim())
          .slice(0, 3)
          .map(([k, v]) => `${k}: ${String(v)}`);

        if (entries.length > 0) {
          return entries.join(' · ');
        }
      }
    }

    const backendBody = err?.error;
    const backendErrorsError = backendBody?.errors?.error;
    const backendMessage = backendBody?.message;

    const detail =
      (typeof backendErrorsError === 'string' && backendErrorsError.trim()) ||
      (typeof backendBody === 'string' && backendBody.trim()) ||
      (typeof backendMessage === 'string' && backendMessage.trim()) ||
      '';

    const detailLower = detail.toLowerCase();
    if (
      err?.status === 500 &&
      (detailLower.includes('email already in use') ||
        detailLower.includes('email already registered') ||
        detailLower.includes('already in use') ||
        detailLower.includes('duplicate') ||
        detailLower.includes('unique') ||
        detailLower.includes('constraint'))
    ) {
      return 'El email ya está registrado. Prueba con otro o inicia sesión.';
    }

    if (detail) {
      // Avoid showing generic wrappers when we have a better detail.
      if (detailLower !== 'internal server error') {
        return detail;
      }
    }

    return 'No se pudo completar el registro. Revisa los datos e intenta de nuevo.';
  }
}