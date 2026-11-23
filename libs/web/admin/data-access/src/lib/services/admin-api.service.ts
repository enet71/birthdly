import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, throwError } from 'rxjs';
import { CelebrityImportsStatusResponse, FeedbackDto } from '@birthday/shared-models';
import { ApiService } from '@birthday/web-shared-data-access';

// Admin endpoints answer 404 to everyone else, so every method emits `null` when the user is not an admin.
@Injectable({ providedIn: 'root' })
export class AdminApiService extends ApiService {
  public getCelebrityImportsStatus(): Observable<CelebrityImportsStatusResponse | null> {
    return this.httpClient.get<CelebrityImportsStatusResponse>(`${this.baseUrl}/admin/celebrity-imports`).pipe(catchError(nullWhenNotFound));
  }

  // The newest feedback messages, newest first.
  public getFeedback(): Observable<FeedbackDto[] | null> {
    return this.httpClient.get<FeedbackDto[]>(`${this.baseUrl}/admin/feedback`).pipe(catchError(nullWhenNotFound));
  }
}

function nullWhenNotFound(error: unknown): Observable<null> {
  return error instanceof HttpErrorResponse && error.status === 404 ? of(null) : throwError(() => error);
}
