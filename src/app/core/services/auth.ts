import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

export type RegisterRole = 'STUDENT' | 'CREATOR';

// Definición del Usuario según roles planteados
export interface User {
  id: string;
  firstName: string;
  email: string;
  role: 'STUDENT' | 'CREATOR' | 'ADMIN';
}

interface AuthResponseDto {
  token: string;
  refreshToken: string;
}

interface RefreshTokenResponseDto {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  private readonly apiBaseUrl = 'http://localhost:8080/api';

  constructor(private router: Router, private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();

    const user = this.loadUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponseDto>(`${this.apiBaseUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => this.setSession(res.token, res.refreshToken)),
        map(() => {
          const user = this.currentUserValue;
          if (!user) {
            throw new Error('Login completed but user session could not be established');
          }
          return user;
        }),
        tap((user) => this.redirectByRole(user.role))
      );
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http
      .post<RefreshTokenResponseDto>(`${this.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          localStorage.setItem('gastro_token', res.token);
          const user = this.buildUserFromToken(res.token);
          if (user) {
            localStorage.setItem('gastro_user', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }),
        map((res) => res.token)
      );
  }

  registerByRole(role: RegisterRole, payload: any): Observable<void> {
    if (role === 'CREATOR') {
      return this.http.post<void>(`${this.apiBaseUrl}/creator/create`, payload);
    }
    return this.http.post<void>(`${this.apiBaseUrl}/student/create`, payload);
  }

  logout() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // Clear local session immediately.
    this.clearSession();
    this.router.navigate(['/auth/login']);

    // Best-effort backend logout (doesn't block UI).
    if (accessToken && refreshToken) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
      this.http
        .post(`${this.apiBaseUrl}/auth/logout`, { refreshToken }, { headers })
        .subscribe({ error: () => undefined });
    }
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isJwtExpired(token);
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

  private clearSession(): void {
    localStorage.removeItem('gastro_user');
    localStorage.removeItem('gastro_token');
    localStorage.removeItem('gastro_refresh_token');
    this.currentUserSubject.next(null);
  }

  private loadUserFromStorage(): User | null {
    const token = this.getAccessToken();
    if (token && !this.isJwtExpired(token)) {
      const storedUser = localStorage.getItem('gastro_user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser) as User;
        } catch {
          // fall through and rebuild from token
        }
      }
      return this.buildUserFromToken(token);
    }

    // Clear any stale data.
    this.clearSession();
    return null;
  }

  private setSession(accessToken: string, refreshToken: string): void {
    localStorage.setItem('gastro_token', accessToken);
    localStorage.setItem('gastro_refresh_token', refreshToken);

    const user = this.buildUserFromToken(accessToken);
    if (user) {
      localStorage.setItem('gastro_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
    } else {
      this.clearSession();
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('gastro_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('gastro_refresh_token');
  }

  private isJwtExpired(token: string): boolean {
    const payload = this.parseJwtPayload(token);
    const expSeconds = typeof payload?.exp === 'number' ? payload.exp : null;
    if (!expSeconds) return false;
    return Date.now() >= expSeconds * 1000;
  }

  private buildUserFromToken(token: string): User | null {
    const payload = this.parseJwtPayload(token);
    if (!payload) return null;

    const email = typeof payload.sub === 'string' ? payload.sub : '';
    const authorities: string[] = Array.isArray(payload.authorities) ? payload.authorities : [];
    const role = this.deriveRole(authorities);
    const id = typeof payload.jti === 'string' ? payload.jti : '';
    const firstName = email ? email.split('@')[0] : 'User';

    return {
      id,
      firstName,
      email,
      role,
    };
  }

  private deriveRole(authorities: string[]): User['role'] {
    const normalized = authorities.map((a) => String(a).toUpperCase());
    if (normalized.includes('ROLE_ADMIN') || normalized.includes('ADMIN')) return 'ADMIN';
    if (normalized.includes('ROLE_CREATOR') || normalized.includes('CREATOR')) return 'CREATOR';
    return 'STUDENT';
  }

  private parseJwtPayload(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];

      // Base64Url -> Base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const json = atob(padded);

      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}