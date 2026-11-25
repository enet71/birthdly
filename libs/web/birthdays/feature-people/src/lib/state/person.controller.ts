import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { BirthdaysController } from '@birthday/web-birthdays-data-access';
import { Birthday } from '@birthday/web-birthdays-util';
import { AppLayoutController } from '@birthday/web-layout-data-access';
import { StateController } from '@birthday/web-shared-data-access';
import { PersonState } from './person.state';

@Injectable()
export class PersonController extends StateController {
  private readonly personState: PersonState = inject(PersonState);
  private readonly birthdaysController: BirthdaysController = inject(BirthdaysController);
  private readonly appLayoutController: AppLayoutController = inject(AppLayoutController);

  // The route injector is created on every visit, so only the shared birthdays list needs a refresh, which also
  // retries a failed load.
  constructor() {
    super();
    this.birthdaysController.reloadBirthdays();
    this.appLayoutController.trackLoading(this.personState.isLoading, this.destroyRef);
  }

  public setPhoto(image: Blob): void {
    this.changePhoto((id: string) => this.birthdaysController.setPhoto(id, image));
  }

  public removePhoto(): void {
    this.changePhoto((id: string) => this.birthdaysController.removePhoto(id));
  }

  // One change at a time, so a slow upload cannot overwrite a later removal.
  private changePhoto(change: (id: string) => Observable<Birthday>): void {
    const id: string | null = this.personState.personId();

    if (!id || this.personState.isPhotoSaving()) {
      return;
    }
    this.personState.isPhotoSaving.set(true);
    change(id)
      .pipe(
        finalize(() => this.personState.isPhotoSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
