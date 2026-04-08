import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: boolean = false;
  loginErrorMessage: string = '';
  registerSuccess: boolean = false;
  registeredRole: 'STUDENT' | 'CREATOR' | null = null;
  loading: boolean = false;

  get emailCtrl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get passwordCtrl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Verificamos si venimos de un registro exitoso
    this.route.queryParams.subscribe(params => {
      if (params['registered']) {
        this.registerSuccess = true;
        const roleParam = String(params['registeredRole'] || '').toUpperCase();
        this.registeredRole = roleParam === 'CREATOR' ? 'CREATOR' : roleParam === 'STUDENT' ? 'STUDENT' : null;
      }
    });
  }

  onSubmit() {
    this.loginError = false;
    this.loginErrorMessage = '';
    this.registerSuccess = false;
    this.registeredRole = null;
    this.loading = false;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.loading = true;

      this.authService
        .login(email, password)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.requestViewUpdate();
          })
        )
        .subscribe({
          next: () => {
            // La redirección exitosa ya la maneja el servicio
            this.requestViewUpdate();
          },
          error: (err: any) => {
            this.loginError = true;
            this.loginErrorMessage = this.extractLoginErrorMessage(err);
            this.requestViewUpdate();
          },
        });
    }
  }

  private extractLoginErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'No se pudo conectar con el backend (¿está corriendo en :8080?).';
    }

    const backendError = err?.error?.errors?.error;
    const detail = typeof backendError === 'string' ? backendError.trim() : '';
    const detailLower = detail.toLowerCase();

    if (err?.status === 403) {
      if (detailLower.includes('not verified') || detailLower.includes('inactive')) {
        return 'Tu usuario aún no está verificado o está inactivo. Si te registraste como creador, un administrador debe aprobar tu cuenta antes de iniciar sesión.';
      }
      return 'No tienes permisos para iniciar sesión con este usuario.';
    }

    if (err?.status === 401) {
      return 'Credenciales incorrectas. Intenta de nuevo.';
    }

    if (detail) {
      return detail;
    }

    return 'No se pudo iniciar sesión. Intenta de nuevo.';
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

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}