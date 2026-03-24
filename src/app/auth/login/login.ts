import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: boolean = false;
  registerSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
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
      }
    });
  }

  onSubmit() {
    this.loginError = false;
    this.registerSuccess = false;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      const success = this.authService.login(email, password);

      if (!success) {
        this.loginError = true;
      }
      // La redirección exitosa ya la maneja el servicio
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}