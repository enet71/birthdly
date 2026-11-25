import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoadmapRequest, RoadmapResponse } from '@birthday/shared-models';
import { ApiService } from '@birthday/web-shared-data-access';

// The public roadmap from the API, with its texts in the requested language.
@Injectable({ providedIn: 'root' })
export class RoadmapApiService extends ApiService {
  public getItems(request: RoadmapRequest): Observable<RoadmapResponse> {
    return this.httpClient.get<RoadmapResponse>(`${this.baseUrl}/roadmap`, { params: { locale: request.locale } });
  }
}
