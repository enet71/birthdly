import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateFeedbackRequest } from '@birthday/shared-models';
import { ApiService } from '@birthday/web-shared-data-access';

// The feedback form through the API.
@Injectable({ providedIn: 'root' })
export class FeedbackApiService extends ApiService {
  // Fails with 429 when this device sends too many.
  public send(request: CreateFeedbackRequest): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/feedback`, request);
  }
}
