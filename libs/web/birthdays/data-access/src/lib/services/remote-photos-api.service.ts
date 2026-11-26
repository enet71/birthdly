import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@birthday/web-shared-data-access';

// Images from other sites, such as a celebrity's Wikimedia Commons photo, which become a person's photo. The site must
// allow cross-origin requests.
@Injectable({ providedIn: 'root' })
export class RemotePhotosApiService extends ApiService {
  public download(url: string): Observable<Blob> {
    return this.httpClient.get(url, { responseType: 'blob' });
  }
}
