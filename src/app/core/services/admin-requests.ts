import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';

export type RequestCreatorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreatorRequestDto {
  id: number;
  creatorId?: string | null;
  creatorEmail: string;
  creatorFirstName?: string | null;
  creatorLastName?: string | null;
  status: RequestCreatorStatus;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  notes?: string | null;
}

export interface ReviewCreatorResponseDto {
  requestId: number;
  status: RequestCreatorStatus;
}

@Injectable({
  providedIn: 'root',
})
export class AdminRequestsService {
  private readonly apiBaseUrl = 'http://localhost:8080/api';
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly http: HttpClient) {}

  getPendingCreatorRequests(): Observable<CreatorRequestDto[]> {
    return this.http
      .get<CreatorRequestDto[]>(`${this.apiBaseUrl}/admin/requests/creators`)
      .pipe(timeout(this.requestTimeoutMs));
  }

  approveCreatorRequest(requestId: number): Observable<ReviewCreatorResponseDto> {
    return this.http
      .patch<ReviewCreatorResponseDto>(`${this.apiBaseUrl}/admin/requests/creators/${requestId}/approve`, {})
      .pipe(timeout(this.requestTimeoutMs));
  }

  rejectCreatorRequest(requestId: number, reason: string): Observable<ReviewCreatorResponseDto> {
    return this.http
      .patch<ReviewCreatorResponseDto>(`${this.apiBaseUrl}/admin/requests/creators/${requestId}/reject`, { reason })
      .pipe(timeout(this.requestTimeoutMs));
  }
}
