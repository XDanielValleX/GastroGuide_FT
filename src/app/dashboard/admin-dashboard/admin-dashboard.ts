import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { AdminRequestsService, CreatorRequestDto } from '../../core/services/admin-requests';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminRequestsService = inject(AdminRequestsService);

  requests: CreatorRequestDto[] = [];
  rejectReasons: Record<number, string> = {};

  loading = false;
  busyRequestId: number | null = null;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadRequests();
  }

  reload(): void {
    this.loadRequests();
  }

  approve(requestId: number): void {
    if (!requestId || this.busyRequestId !== null) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.busyRequestId = requestId;

    this.adminRequestsService
      .approveCreatorRequest(requestId)
      .pipe(
        finalize(() => {
          this.busyRequestId = null;
        })
      )
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((r) => r.id !== requestId);
          delete this.rejectReasons[requestId];
          this.successMessage = `Solicitud #${requestId} aprobada.`;
        },
        error: (err: any) => {
          this.errorMessage = this.extractErrorMessage(err);
        },
      });
  }

  reject(requestId: number): void {
    if (!requestId || this.busyRequestId !== null) return;

    const reason = String(this.rejectReasons[requestId] || '').trim();
    if (!reason) {
      this.errorMessage = 'Debes escribir un motivo de rechazo.';
      this.successMessage = '';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.busyRequestId = requestId;

    this.adminRequestsService
      .rejectCreatorRequest(requestId, reason)
      .pipe(
        finalize(() => {
          this.busyRequestId = null;
        })
      )
      .subscribe({
        next: () => {
          this.requests = this.requests.filter((r) => r.id !== requestId);
          delete this.rejectReasons[requestId];
          this.successMessage = `Solicitud #${requestId} rechazada.`;
        },
        error: (err: any) => {
          this.errorMessage = this.extractErrorMessage(err);
        },
      });
  }

  private loadRequests(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminRequestsService
      .getPendingCreatorRequests()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (requests) => {
          this.requests = Array.isArray(requests) ? requests : [];
        },
        error: (err: any) => {
          this.requests = [];
          this.errorMessage = this.extractErrorMessage(err);
        },
      });
  }

  private extractErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'No se pudo conectar con el backend (¿está corriendo en :8080?).';
    }

    if (err?.status === 401) {
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    }

    if (err?.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }

    const backendBody = err?.error;
    const backendError = backendBody?.errors?.error;
    const detail =
      (typeof backendError === 'string' && backendError.trim()) ||
      (typeof backendBody === 'string' && backendBody.trim()) ||
      (typeof backendBody?.message === 'string' && backendBody.message.trim()) ||
      '';

    if (detail) {
      return detail;
    }

    return 'No se pudo completar la operación. Intenta de nuevo.';
  }
}
