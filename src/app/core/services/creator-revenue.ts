import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';

export interface CreatorRevenueSummaryDto {
  totalRevenue: number;
  enrollments: number;
  uniqueStudents: number;
}

@Injectable({
  providedIn: 'root',
})
export class CreatorRevenueService {
  private readonly apiBaseUrl = 'http://localhost:8080/api';
  private readonly requestTimeoutMs = 15000;

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<CreatorRevenueSummaryDto> {
    return this.http
      .get<CreatorRevenueSummaryDto>(`${this.apiBaseUrl}/creator/revenue/summary`)
      .pipe(
        timeout(this.requestTimeoutMs),
        catchError(() =>
          of({
            totalRevenue: 0,
            enrollments: 0,
            uniqueStudents: 0,
          })
        )
      );
  }
}
