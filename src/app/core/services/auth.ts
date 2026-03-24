import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export type RegisterRole = 'STUDENT' | 'CREATOR';

// Definición del Usuario según roles planteados
export interface User {
  id: string;
  firstName: string;
  email: string;
  role: 'STUDENT' | 'CREATOR' | 'ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  // USUARIOS DE PRUEBA (MOCK)
  // Usaremos estas credenciales para probar las redirecciones
  private mockUsers: User[] = [
    { id: '1', firstName: 'Daniel Student', email: 'student@test.com', role: 'STUDENT' },
    { id: '2', firstName: 'Mauricio Chef', email: 'creator@test.com', role: 'CREATOR' },
    { id: '3', firstName: 'Heybertt Admin', email: 'admin@test.com', role: 'ADMIN' }
  ];

  private readonly apiBaseUrl = 'http://localhost:8080/api';

  constructor(private router: Router, private http: HttpClient) {
    const storedUser = localStorage.getItem('gastro_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Lógica de Login Simulada
  login(email: string, password: string): boolean {
    // Buscamos si el usuario existe en nuestros mocks
    const user = this.mockUsers.find(u => u.email === email);

    if (user) {
      // Guardamos sesión
      localStorage.setItem('gastro_user', JSON.stringify(user));
      this.currentUserSubject.next(user);

      // REDIRECCIÓN INTELIGENTE SEGÚN ROL
      this.redirectByRole(user.role);
      return true;
    }
    return false; // Login fallido
  }

  // Lógica de Registro Simulada
  // Simplemente simulamos éxito y mandamos al login
  register(userData: any): void {
    // Mantengo compatibilidad con el flujo anterior: si el backend está disponible,
    // intenta registrar; si no, hace fallback a navegación "exitosa".
    const role: RegisterRole = (userData?.role === 'CREATOR' ? 'CREATOR' : 'STUDENT');
    const payload = this.stripRegistrationPayload(role, userData);

    this.registerByRole(role, payload).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: true } }),
      error: () => this.router.navigate(['/auth/login'], { queryParams: { registered: true } }),
    });
  }

  registerByRole(role: RegisterRole, payload: any): Observable<void> {
    if (role === 'CREATOR') {
      return this.http.post<void>(`${this.apiBaseUrl}/creator/create`, payload);
    }
    return this.http.post<void>(`${this.apiBaseUrl}/student/create`, payload);
  }

  logout() {
    localStorage.removeItem('gastro_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  // Helper para centralizar la redirección por roles
  private redirectByRole(role: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/dashboard/admin']);
    } else if (role === 'CREATOR') {
      this.router.navigate(['/dashboard/creator']);
    } else {
      this.router.navigate(['/dashboard/student']);
    }
  }

  private stripRegistrationPayload(role: RegisterRole, userData: any): any {
    if (role === 'CREATOR') {
      return {
        email: userData?.email,
        password: userData?.password,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
      };
    }

    return {
      username: userData?.username,
      email: userData?.email,
      password: userData?.password,
    };
  }
}