import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BirthdayDto, CreateBirthdayRequest, UpdateBirthdayRequest } from '@birthday/shared-models';
import { ApiService } from '@birthday/web-shared-data-access';
import { BirthdaysStorage } from './birthdays.storage';

@Injectable({ providedIn: 'root' })
export class BirthdaysApiService extends ApiService implements BirthdaysStorage {
  private readonly birthdaysUrl = `${this.baseUrl}/birthdays`;

  public getAll(): Observable<BirthdayDto[]> {
    return this.httpClient.get<BirthdayDto[]>(this.birthdaysUrl);
  }

  public create(request: CreateBirthdayRequest): Observable<BirthdayDto> {
    return this.httpClient.post<BirthdayDto>(this.birthdaysUrl, request);
  }

  public update(id: string, request: UpdateBirthdayRequest): Observable<BirthdayDto> {
    return this.httpClient.patch<BirthdayDto>(`${this.birthdaysUrl}/${id}`, request);
  }

  public delete(id: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.birthdaysUrl}/${id}`);
  }

  // Only a signed-in user's birthdays have photos, so these are not part of `BirthdaysStorage`.
  public setPhoto(id: string, photo: Blob): Observable<BirthdayDto> {
    const body: FormData = new FormData();

    body.append('photo', photo, 'photo.webp');
    return this.httpClient.put<BirthdayDto>(`${this.birthdaysUrl}/${id}/photo`, body);
  }

  public removePhoto(id: string): Observable<BirthdayDto> {
    return this.httpClient.delete<BirthdayDto>(`${this.birthdaysUrl}/${id}/photo`);
  }
}
