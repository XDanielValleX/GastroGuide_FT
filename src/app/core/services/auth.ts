import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, timeout } from 'rxjs';

export type RegisterRole = 'STUDENT' | 'CREATOR';

// Definición del Usuario según roles planteados
export interface User {
  id: string;
  firstName: string;
  email: string;
  role: 'STUDENT' | 'CREATOR' | 'ADMIN';
}

interface AuthResponseDto {
  userSessionEntity: {
    jwtToken: string;
    refreshToken: string;
  };
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
  private readonly requestTimeoutMs = 15000;

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
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(
        tap((res) => {
          const accessToken = res?.userSessionEntity?.jwtToken;
          const refreshToken = res?.userSessionEntity?.refreshToken;

          if (!accessToken || !refreshToken) {
            throw new Error('Login completed but the backend did not return a valid session');
          }

          this.setSession(accessToken, refreshToken);
        }),
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
      .pipe(timeout(this.requestTimeoutMs))
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

    const email =
      (typeof payload.sub === 'string' && payload.sub) ||
      (typeof payload.subject === 'string' && payload.subject) ||
      (typeof payload.email === 'string' && payload.email) ||
      (typeof payload.preferred_username === 'string' && payload.preferred_username) ||
      (typeof payload.username === 'string' && payload.username) ||
      (typeof payload.userName === 'string' && payload.userName) ||
      (typeof payload.sub === 'number' ? String(payload.sub) : '') ||
      '';
    const authorities: string[] = Array.isArray(payload.authorities) ? payload.authorities : [];
    const role = this.deriveRole(authorities);

    // IMPORTANT: Do not use JWT `jti` as user id.
    // Backend generates a random `jti` per token, so it changes on every login/refresh.
    // We need a stable per-user identifier for local features (drafts, saved panels, etc.).
    // Prefer common id claims if present; otherwise fall back to email.
    const stableIdCandidate =
      (typeof payload.userId === 'string' && payload.userId) ||
      (typeof payload.user_id === 'string' && payload.user_id) ||
      (typeof payload.uid === 'string' && payload.uid) ||
      (typeof payload.id === 'string' && payload.id) ||
      (typeof payload.userId === 'number' ? String(payload.userId) : '') ||
      (typeof payload.id === 'number' ? String(payload.id) : '') ||
      '';
    // Last-resort: if the token doesn't include any stable identifier, fall back to `jti`.
    // This is NOT stable across logins/refresh, but prevents local features from breaking entirely.
    const fallbackTokenId = typeof payload.jti === 'string' ? payload.jti : '';
    const id = stableIdCandidate || email || fallbackTokenId;

    const tokenDisplayName =
      (typeof payload.displayName === 'string' && payload.displayName.trim()) ||
      (typeof payload.userName === 'string' && payload.userName.trim()) ||
      (typeof payload.firstName === 'string' && payload.firstName.trim()) ||
      '';

    const firstName = tokenDisplayName || (email ? email.split('@')[0] : 'User');

    if (!id) return null;

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